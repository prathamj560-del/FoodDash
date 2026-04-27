import { Request, Response } from "express";
import Order from "../models/order.model";
import Razorpay from "razorpay";
import dotenv from 'dotenv';
import Shop from "../models/shop.model";
import User from "../models/user.model";
import DeliveryAssignment from "../models/deliveryAssignment.model";
import mongoose from "mongoose";
import { rabbitMQ } from "../utils/rabbitmq";


export interface AuthenticatedRequest extends Request {
    userId?: string;
    // If you store the IO instance in app
    app: any;
}

export interface ICartItem {
    _id: string;
    shop: string;
    name: string;
    price: number;
    quantity: number;
}


dotenv.config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount }:
            { cartItems: ICartItem[], paymentMethod: string, deliveryAddress: any, totalAmount: number } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "cart is empty" });
        }
        if (!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: "send complete deliveryAddress" });
        }

        const groupItemsByShop: Record<string, ICartItem[]> = {};

        cartItems.forEach((item) => {
            const shopId = typeof item.shop === 'object'
                ? (item.shop as any)._id.toString()
                : item.shop.toString();

            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = [];
            }
            groupItemsByShop[shopId].push(item);
        });

        const shopOrders = await Promise.all(
            Object.keys(groupItemsByShop).map(async (shopId) => {
                const shop = await Shop.findById(shopId).populate("owner");
                if (!shop) throw new Error(`Shop ${shopId} not found`);

                const items = groupItemsByShop[shopId];
                const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
                const deliveryFee = 50; // Fixed delivery fee per shop order

                return {
                    shop: shop._id,
                    owner: (shop.owner as any)._id,
                    subtotal,
                    deliveryFee,
                    shopOrderItems: items.map((i) => ({
                        item: new mongoose.Types.ObjectId(i._id),
                        price: i.price,
                        quantity: i.quantity,
                        name: i.name,
                    })),
                };
            })
        );

        if (paymentMethod === "online") {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });

            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false,
            });

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id,
            });
        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders,
        });

        await newOrder.populate([
            { path: "shopOrders.shopOrderItems.item", select: "name image price" },
            { path: "shopOrders.shop", select: "name" },
            { path: "shopOrders.owner", select: "name socketId" },
            { path: "user", select: "name email mobile fullName" }
        ]);

        // Send order confirmation email asynchronously via RabbitMQ
        await rabbitMQ.publishEmailJob({
            type: 'order-confirmation',
            to: (newOrder.user as any).email,
            data: {
                userName: (newOrder.user as any).fullName,
                orderId: newOrder._id.toString(),
                totalAmount: totalAmount.toString(),
                paymentMethod
            }
        });

        const io = req.app.get("io");
        if (io) {
            newOrder.shopOrders.forEach((shopOrder: any) => {
                const ownerSocketId = shopOrder.owner.socketId;
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit("newOrder", {
                        _id: newOrder._id,
                        paymentMethod: newOrder.paymentMethod,
                        user: newOrder.user,
                        shopOrders: shopOrder,
                        createdAt: newOrder.createdAt,
                        deliveryAddress: newOrder.deliveryAddress,
                        payment: newOrder.payment,
                    });
                }
            });
        }

        return res.status(201).json(newOrder);
    } catch (error) {
        return res.status(500).json({ message: `place order error ${error}` });
    }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { razorpay_payment_id, orderId } = req.body;
        const payment = await instance.payments.fetch(razorpay_payment_id);

        if (!payment || payment.status !== "captured") {
            return res.status(400).json({ message: "payment not captured" });
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(400).json({ message: "order not found" });
        }

        order.payment = true;
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        await order.populate([
            { path: "shopOrders.shopOrderItems.item", select: "name image price" },
            { path: "shopOrders.shop", select: "name" },
            { path: "shopOrders.owner", select: "name socketId" },
            { path: "user", select: "name email mobile" }
        ]);

        const io = req.app.get("io");
        if (io) {
            order.shopOrders.forEach((shopOrder: any) => {
                const ownerSocketId = shopOrder.owner.socketId;
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit("newOrder", {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                        payment: order.payment,
                    });
                }
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: `verify payment error ${error}` });
    }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role === "user") {
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price");

            return res.status(200).json(orders);
        } else if (user.role === "owner") {
            const orders = await Order.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

            const filteredOrders = orders.map((order) => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: order.shopOrders.find(o => String(o.owner._id) === String(req.userId)),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress,
                payment: order.payment
            }));

            return res.status(200).json(filteredOrders);
        }
    } catch (error) {
        return res.status(500).json({ message: `get User order error ${error}` });
    }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId, shopId } = req.params;
        const { status } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const shopOrder = order.shopOrders.find(o => String(o.shop) === shopId);
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found" });
        }

        shopOrder.status = status;
        let deliveryBoysPayload: any[] = [];

        if (status === "out of delivery" && !shopOrder.assignment) {
            const { longitude, latitude } = order.deliveryAddress;

            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                        $maxDistance: 5000
                    }
                }
            });

            const nearByIds = nearByDeliveryBoys.map(b => b._id);
            const busyIds = await DeliveryAssignment.find({
                assignedTo: { $in: nearByIds },
                status: { $nin: ["brodcasted", "completed"] }
            }).distinct("assignedTo");

            const busyIdSet = new Set(busyIds.map(id => String(id)));
            const availableBoys = nearByDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)));
            const candidates = availableBoys.map(b => b._id);

            if (candidates.length === 0) {
                await order.save();
                return res.json({ message: "order status updated but no available delivery boys" });
            }

            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id,
                shop: shopOrder.shop,
                shopOrderId: (shopOrder as any)._id,
                brodcastedTo: candidates,
                status: "brodcasted"
            });

            shopOrder.assignment = deliveryAssignment._id as any;
            deliveryBoysPayload = availableBoys.map(b => ({
                id: b._id,
                fullName: (b as any).fullName,
                longitude: (b as any).location.coordinates?.[0],
                latitude: (b as any).location.coordinates?.[1],
                mobile: (b as any).mobile
            }));

            await deliveryAssignment.populate(['order', 'shop']);
            const io = req.app.get('io');
            if (io) {
                availableBoys.forEach(boy => {
                    const boySocketId = (boy as any).socketId;
                    if (boySocketId) {
                        io.to(boySocketId).emit('newAssignment', {
                            sentTo: boy._id,
                            assignmentId: deliveryAssignment._id,
                            orderId: (deliveryAssignment.order as any)._id,
                            shopName: (deliveryAssignment.shop as any).name,
                            deliveryAddress: (deliveryAssignment.order as any).deliveryAddress,
                            items: (deliveryAssignment.order as any).shopOrders.find((so: any) => String(so._id) === String(deliveryAssignment.shopOrderId)).shopOrderItems || [],
                            subtotal: (deliveryAssignment.order as any).shopOrders.find((so: any) => String(so._id) === String(deliveryAssignment.shopOrderId))?.subtotal
                        });
                    }
                });
            }
        }

        await order.save();
        await order.populate([
            { path: "shopOrders.shop", select: "name" },
            { path: "shopOrders.assignedDeliveryBoy", select: "fullName email mobile" },
            { path: "user", select: "socketId" }
        ]);

        const io = req.app.get('io');
        if (io) {
            const userSocketId = (order.user as any).socketId;
            if (userSocketId) {
                io.to(userSocketId).emit('update-status', {
                    orderId: order._id,
                    shopId: shopOrder.shop._id,
                    status: shopOrder.status,
                    userId: (order.user as any)._id
                });
            }
        }

        return res.status(200).json({
            shopOrder,
            assignedDeliveryBoy: shopOrder.assignedDeliveryBoy,
            availableBoys: deliveryBoysPayload,
            assignment: shopOrder.assignment
        });

    } catch (error) {
        return res.status(500).json({ message: `order status error ${error}` });
    }
};

export const getDeliveryBoyAssignment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const deliveryBoyId = req.userId;
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: deliveryBoyId,
            status: "brodcasted"
        })
            .populate("order")
            .populate("shop");

        const formatted = assignments.map((a: any) => ({
            assignmentId: a._id,
            orderId: a.order._id,
            shopName: a.shop.name,
            deliveryAddress: a.order.deliveryAddress,
            items: a.order.shopOrders.find((so: any) => so._id.equals(a.shopOrderId))?.shopOrderItems || [],
            subtotal: a.order.shopOrders.find((so: any) => so._id.equals(a.shopOrderId))?.subtotal
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: `get Assignment error ${error}` });
    }
};

export const acceptOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await DeliveryAssignment.findById(assignmentId).populate('brodcastedTo', 'socketId');

        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" });
        }
        if (assignment.status !== "brodcasted") {
            return res.status(400).json({ message: "assignment is expired" });
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["brodcasted", "completed"] }
        });

        if (alreadyAssigned) {
            return res.status(400).json({ message: "You are already assigned to another order" });
        }

        assignment.assignedTo = req.userId as any;
        assignment.status = 'assigned';
        assignment.acceptedAt = new Date();
        await assignment.save();

        const order = await Order.findById(assignment.order);
        if (!order) {
            return res.status(400).json({ message: "order not found" });
        }

        // Mongoose subdocument helper .id()
        const shopOrder = (order.shopOrders as any).id(assignment.shopOrderId);
        if (shopOrder) {
            shopOrder.assignedDeliveryBoy = req.userId;
            await order.save();
        }

        // Notify all other delivery boys that this assignment is no longer available
        const io = req.app.get('io');
        if (io) {
            const brodcastedToUsers = assignment.brodcastedTo as any[];
            brodcastedToUsers.forEach((user) => {
                // Skip the user who accepted
                if (String(user._id) !== String(req.userId) && user.socketId) {
                    io.to(user.socketId).emit('assignmentTaken', {
                        assignmentId: assignment._id
                    });
                }
            });
        }

        return res.status(200).json({ message: 'order accepted' });
    } catch (error) {
        return res.status(500).json({ message: `accept order error ${error}` });
    }
};

export const getCurrentOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
            .populate("shop", "name")
            .populate("assignedTo", "fullName email mobile location")
            .populate({
                path: "order",
                populate: [{ path: "user", select: "fullName email location mobile" }]
            });

        if (!assignment || !assignment.order) {
            return res.status(400).json({ message: "assignment or order not found" });
        }

        const orderDoc = assignment.order as any;
        const shopOrder = orderDoc.shopOrders.find((so: any) => String(so._id) === String(assignment.shopOrderId));

        if (!shopOrder) {
            return res.status(400).json({ message: "shopOrder not found" });
        }

        const assignedTo = assignment.assignedTo as any;
        const deliveryBoyLocation = {
            lat: assignedTo.location?.coordinates?.[1] || null,
            lon: assignedTo.location?.coordinates?.[0] || null
        };

        const customerLocation = {
            lat: orderDoc.deliveryAddress?.latitude || null,
            lon: orderDoc.deliveryAddress?.longitude || null
        };

        return res.status(200).json({
            _id: orderDoc._id,
            user: orderDoc.user,
            shopOrder,
            deliveryAddress: orderDoc.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        });
    } catch (error) {
        return res.status(500).json({ message: `get current order error ${error}` });
    }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate("user")
            .populate("shopOrders.shop")
            .populate("shopOrders.assignedDeliveryBoy")
            .populate("shopOrders.shopOrderItems.item")
            .lean();

        if (!order) {
            return res.status(400).json({ message: "order not found" });
        }
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: `get by id order error ${error}` });
    }
};

export const sendDeliveryOtp = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId, shopOrderId } = req.body;
        const order = await Order.findById(orderId).populate("user");
        if (!order) return res.status(400).json({ message: "Order not found" });

        const shopOrder = (order.shopOrders as any).id(shopOrderId);
        if (!shopOrder) {
            return res.status(400).json({ message: "enter valid shopOrderid" });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        shopOrder.deliveryOtp = otp;
        shopOrder.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        await order.save();

        // Send delivery OTP email asynchronously via RabbitMQ
        await rabbitMQ.publishEmailJob({
            type: 'delivery-otp',
            to: (order.user as any).email,
            data: {
                otp,
                userName: (order.user as any).fullName
            }
        });

        return res.status(200).json({
            message: `Otp sent Successfully to ${(order.user as any).fullName}`
        });
    } catch (error) {
        return res.status(500).json({ message: `delivery otp error ${error}` });
    }
};

export const verifyDeliveryOtp = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId, shopOrderId, otp } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(400).json({ message: "Order not found" });

        const shopOrder = (order.shopOrders as any).id(shopOrderId);
        if (!shopOrder) return res.status(400).json({ message: "Invalid shopOrderid" });

        console.log(shopOrder.deliveryOtp)
        console.log(otp)
        console.log(shopOrder.otpExpires)


        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < new Date()) {
            return res.status(400).json({ message: "Invalid/Expired Otp" });
        }

        shopOrder.status = "delivered";
        shopOrder.deliveredAt = new Date();
        await order.save();

        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        });

        return res.status(200).json({ message: "Order Delivered Successfully!" });
    } catch (error) {
        return res.status(500).json({ message: `verify delivery otp error ${error}` });
    }
};

export const getTodayDeliveries = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const deliveryBoyId = req.userId;
        const startsOfDay = new Date();
        startsOfDay.setHours(0, 0, 0, 0);

        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "delivered",
            "shopOrders.deliveredAt": { $gte: startsOfDay }
        }).lean();

        const todaysDeliveries: any[] = [];

        orders.forEach((order: any) => {
            order.shopOrders.forEach((shopOrder: any) => {
                if (
                    String(shopOrder.assignedDeliveryBoy) === String(deliveryBoyId) &&
                    shopOrder.status === "delivered" &&
                    shopOrder.deliveredAt &&
                    new Date(shopOrder.deliveredAt) >= startsOfDay
                ) {
                    todaysDeliveries.push(shopOrder);
                }
            });
        });

        const stats: Record<number, number> = {};

        todaysDeliveries.forEach((shopOrder) => {
            const hour = new Date(shopOrder.deliveredAt).getHours();
            stats[hour] = (stats[hour] || 0) + 1;
        });

        const formattedStats = Object.keys(stats).map((hour) => ({
            hour: parseInt(hour),
            count: stats[parseInt(hour)]
        }));

        formattedStats.sort((a, b) => a.hour - b.hour);

        return res.status(200).json(formattedStats);
    } catch (error) {
        return res.status(500).json({ message: `today deliveries error ${error}` });
    }
};
