import crypto from "crypto";
import { env } from "../config/env";

/** Generates a numeric OTP of configured length, e.g. "483920". */
export function generateOtp(length: number = env.OTP_LENGTH): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, digits.length);
    otp += digits[idx];
  }
  return otp;
}
