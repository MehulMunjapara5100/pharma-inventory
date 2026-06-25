import mongoose, { Schema, models } from "mongoose";

const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: Schema.Types.Mixed
  },
  { timestamps: true }
);

export const Setting = (models.Setting || mongoose.model("Setting", SettingSchema)) as mongoose.Model<any>;
