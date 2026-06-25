import mongoose, { Schema, models } from "mongoose";

const SaleSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    customerName: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "other"], default: "cash" },
    note: { type: String, default: "" },
    soldBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    soldByName: { type: String, required: true }
  },
  { timestamps: true }
);

export const Sale = (models.Sale || mongoose.model("Sale", SaleSchema)) as mongoose.Model<any>;
