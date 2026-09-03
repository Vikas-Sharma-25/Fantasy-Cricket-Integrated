import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "user" | "admin" | "super_admin";
export type UserStatus = "active" | "suspended" | "deleted";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  mobile?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  profileImage?: string;
  preferences?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    mobile: { type: String, trim: true, index: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user"
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active"
    },
    isVerified: { type: Boolean, default: false },
    profileImage: { type: String },
    preferences: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
