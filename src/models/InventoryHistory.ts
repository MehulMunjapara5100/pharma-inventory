import mongoose, { Schema, models } from "mongoose";

const InventoryHistorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    action: {
      type: String,
      enum: ["sale", "purchase", "adjustment", "create", "update", "delete"],
      required: true
    },
    previousQty: { type: Number, default: 0 },
    changeQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    note: { type: String, default: "" },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
    performedByRole: { type: String, required: true }
  },
  { timestamps: true }
);

export const InventoryHistory =
  (models.InventoryHistory ||
    mongoose.model("InventoryHistory", InventoryHistorySchema)) as mongoose.Model<any>;
