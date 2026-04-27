import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDeliveryAssignment extends Document {
    order: mongoose.Types.ObjectId;
    shop: mongoose.Types.ObjectId;
    shopOrderId: mongoose.Types.ObjectId;
    brodcastedTo: mongoose.Types.ObjectId[];
    assignedTo: mongoose.Types.ObjectId | null;
    status: "brodcasted" | "assigned" | "completed";
    acceptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const deliveryAssignmentSchema = new Schema<IDeliveryAssignment>(
    {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
        shopOrderId: { type: mongoose.Schema.Types.ObjectId, required: true },
        brodcastedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        status: {
            type: String,
            enum: ["brodcasted", "assigned", "completed"],
            default: "brodcasted",
        },
        acceptedAt: Date,
    },
    { timestamps: true }
);

const DeliveryAssignment: Model<IDeliveryAssignment> = mongoose.model<IDeliveryAssignment>(
    "DeliveryAssignment",
    deliveryAssignmentSchema
);

export default DeliveryAssignment;