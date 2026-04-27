import mongoose, { Document, Schema, Model } from "mongoose";

// 1. Define Interfaces for Subschemas
interface IShopOrderItem {
    item: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
}

interface IShopOrder {
    shop: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    subtotal: number;
    deliveryFee: number;
    shopOrderItems: IShopOrderItem[];
    status: "pending" | "preparing" | "out of delivery" | "delivered";
    assignment?: mongoose.Types.ObjectId | null;
    assignedDeliveryBoy?: mongoose.Types.ObjectId | null;
    deliveryOtp?: string | null;
    otpExpires?: Date | null;
    deliveredAt?: Date | null;
}

// 2. Define the main Order Interface
export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    paymentMethod: 'cod' | 'online';
    deliveryAddress: {
        text: string;
        latitude: number;
        longitude: number;
    };
    totalAmount: number;
    shopOrders: IShopOrder[];
    payment: boolean;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 3. Define Schemas with the types
const shopOrderItemSchema = new Schema<IShopOrderItem>({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    name: String,
    price: Number,
    quantity: Number
}, { timestamps: true });

const shopOrderSchema = new Schema<IShopOrder>({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subtotal: Number,
    deliveryFee: { type: Number, default: 50 },
    shopOrderItems: [shopOrderItemSchema],
    status: {
        type: String,
        enum: ["pending", "preparing", "out of delivery", "delivered"],
        default: "pending"
    },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAssignment", default: null },
    assignedDeliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deliveryOtp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    deliveredAt: { type: Date, default: null }
}, { timestamps: true });

const orderSchema = new Schema<IOrder>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentMethod: {
        type: String,
        enum: ['cod', "online"],
        required: true
    },
    deliveryAddress: {
        text: String,
        latitude: Number,
        longitude: Number
    },
    totalAmount: { type: Number },
    shopOrders: [shopOrderSchema],
    payment: { type: Boolean, default: false },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" }
}, { timestamps: true });

// 4. Pass the Interface to the Model
const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
