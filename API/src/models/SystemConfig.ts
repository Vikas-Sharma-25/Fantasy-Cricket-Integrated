import { Schema, model, Document, Types } from "mongoose";

export interface ISystemConfig extends Document {
  _id: Types.ObjectId;
  configKey: string;
  configValue: unknown;
  description?: string;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    configKey: { type: String, required: true, unique: true, index: true },
    configValue: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const SystemConfig = model<ISystemConfig>("SystemConfig", systemConfigSchema);
