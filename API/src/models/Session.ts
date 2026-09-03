import { Schema, model, Document, Types } from "mongoose";

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  deviceInfo?: string;
  ipAddress?: string;
  refreshTokenHash: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    refreshTokenHash: { type: String, required: true, select: false },
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Session = model<ISession>("Session", sessionSchema);
