import { Router } from "express";
import { isAuth } from "../middlewares/isAuth";
import { 
    getMyOrders, 
    placeOrder, 
    verifyPayment, 
    updateOrderStatus, 
    getDeliveryBoyAssignment,
    getCurrentOrder,
    sendDeliveryOtp,
    verifyDeliveryOtp,
    acceptOrder,
    getOrderById,
    getTodayDeliveries
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post('/place-order', isAuth, placeOrder);
orderRouter.post("/verify-payment", isAuth, verifyPayment);
orderRouter.get("/my-orders", isAuth, getMyOrders);
orderRouter.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus);

orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment)
orderRouter.get("/get-current-order", isAuth, getCurrentOrder)
orderRouter.post("/send-delivery-otp", isAuth, sendDeliveryOtp)
orderRouter.post("/verify-delivery-otp", isAuth, verifyDeliveryOtp)
orderRouter.get('/accept-order/:assignmentId', isAuth, acceptOrder)
orderRouter.get('/get-order-by-id/:orderId', isAuth, getOrderById)
orderRouter.get('/get-today-deliveries', isAuth, getTodayDeliveries)

export default orderRouter;
