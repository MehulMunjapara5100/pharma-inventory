import mongoose, { Schema, models } from "mongoose";

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    manufacturer: { type: String, default: "" },
    batchNumber: { type: String, default: "" },
    expiryDate: { type: Date, required: true, index: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, default: 10 },
    supplier: { type: String, default: "" },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    storageLocation: { type: String, default: "" },
    images: { type: [ProductImageSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "expired", "low_stock", "out_of_stock"],
      default: "active"
    },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

ProductSchema.pre("save", function (next) {
  const now = new Date();
  if (this.expiryDate && this.expiryDate < now) this.status = "expired";
  else if (this.quantity <= 0) this.status = "out_of_stock";
  else if (this.quantity <= this.minStockLevel) this.status = "low_stock";
  else this.status = "active";
  next();
});

export interface IProduct {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate: Date;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  supplier?: string;
  vendorId?: string | null;
  storageLocation?: string;
  images: { url: string; publicId?: string; isPrimary?: boolean }[];
  status: "active" | "expired" | "low_stock" | "out_of_stock";
  description?: string;
  createdBy?: string;
  updatedBy?: string;
}

export const Product = (models.Product || mongoose.model("Product", ProductSchema)) as mongoose.Model<IProduct>;
