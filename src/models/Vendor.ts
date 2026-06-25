import mongoose, { Schema, models } from "mongoose";

const VendorSchema = new Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Vendor = (models.Vendor || mongoose.model("Vendor", VendorSchema)) as mongoose.Model<any>;
