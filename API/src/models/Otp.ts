import { Schema, model, Document, Types } from "mongoose";

/**
 * Not in the original ERD but required to implement 2-step OTP verification
 * (login 2FA, email/mobile verification, password reset) cleanly and
 * auditable, with resend + attempt limiting.
 *
 * NOTE: OTP is stored in PLAIN TEXT here (not hashed) per requirement.
 * Security trade-off: if the database is ever compromised, all active
 * OTPs are readable as-is. This is generally NOT recommended for
 * production (OTPs should be hashed just like passwords), but is done
 * here intentionally for easier debugging/testing.
 */
export type OtpPurpose = "login" | "verify_account" | "reset_password";

export interface IOtp extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  otp: string; // plain text OTP (was otpHash before)
  purpose: OtpPurpose;
  destination: string; // email or mobile the OTP was sent to
  channel: "email" | "sms";
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  lastSentAt: Date;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    otp: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["login", "verify_account", "reset_password"],
      required: true
    },
    destination: { type: String, required: true },
    channel: { type: String, enum: ["email", "sms"], default: "email" },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpSchema.index({ userId: 1, purpose: 1, isUsed: 1 });

export const Otp = model<IOtp>("Otp", otpSchema);