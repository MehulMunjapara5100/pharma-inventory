import mongoose, { Schema, models } from "mongoose";
import type { Role } from "@/lib/roles";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "vendor", "seller", "manager"], required: true },
    phone: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
    avatar: { type: String, default: "" },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  status: "active" | "inactive" | "pending";
  avatar?: string;
  lastLoginAt?: Date;
}

export const User = (models.User || mongoose.model("User", UserSchema)) as mongoose.Model<IUser>;
