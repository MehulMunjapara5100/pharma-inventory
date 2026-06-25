import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["inventory", "low_stock", "expired", "new_product", "sale", "user", "system"],
      default: "system"
    },
    level: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
    targetRoles: { type: [String], default: ["admin"] },
    targetUsers: { type: [Schema.Types.ObjectId], default: [] },
    readBy: { type: [Schema.Types.ObjectId], default: [] },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Notification =
  (models.Notification || mongoose.model("Notification", NotificationSchema)) as mongoose.Model<any>;
