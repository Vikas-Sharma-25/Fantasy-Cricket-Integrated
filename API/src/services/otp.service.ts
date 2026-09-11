import { Otp, OtpPurpose } from "../models/Otp";
import { IUser } from "../models/User";
import { env } from "../config/env";
import { generateOtp } from "../utils/otpGenerator";
import { sendOtpEmail, sendOtpSms } from "../utils/mailer";
import { ApiError } from "../utils/apiError";

// NOTE: OTP is stored and compared in PLAIN TEXT (no bcrypt hashing).
// hashValue/compareValue from utils/hash.ts are intentionally NOT used here
// anymore — only used for password hashing elsewhere in the app.

/**
 * Creates and sends a fresh OTP for a given purpose, invalidating any
 * previous unused OTPs of the same purpose for that user.
 */
export async function createAndSendOtp(
  user: IUser,
  purpose: OtpPurpose,
  channel: "email" | "sms" = "email"
): Promise<{ otpId: string; expiresAt: Date }> {
  // Invalidate previous unused OTPs for this purpose so only one is valid at a time.
  await Otp.updateMany(
    { userId: user._id, purpose, isUsed: false },
    { $set: { isUsed: true } }
  );
  try {
    await Otp.db.collection("otp").updateMany(
      { userId: user._id, purpose, isUsed: false },
      { $set: { isUsed: true } }
    );
  } catch (err) {
    console.error("[otp] Mirror invalidate to otp collection error:", err);
  }

  const otp = generateOtp(env.OTP_LENGTH);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);
  const destination = channel === "sms" ? user.mobile || user.email : user.email;

  const record = await Otp.create({
    userId: user._id,
    otp, // plain text, saved as-is
    purpose,
    destination,
    channel,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    lastSentAt: new Date(),
    expiresAt
  });

  // Mirror to 'otp' collection so the OTP is present in both 'otp' and 'otps' tables
  try {
    await Otp.db.collection("otp").insertOne({
      _id: record._id,
      userId: user._id,
      otp,
      purpose,
      destination,
      channel,
      attempts: 0,
      maxAttempts: env.OTP_MAX_ATTEMPTS,
      resendCount: 0,
      lastSentAt: record.lastSentAt,
      isUsed: false,
      expiresAt: record.expiresAt,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("[otp] Mirror to otp collection error:", err);
  }

  console.log(`[otp] Generated & Saved OTP: ${otp} for ${user.email} (purpose: ${purpose})`);

  // Dispatch email in background so login and register return instantly
  const emailPromise =
    channel === "sms" && user.mobile
      ? sendOtpSms(user.mobile, otp, purpose)
      : sendOtpEmail(user.email, otp, purpose);

  emailPromise.catch((err) => {
    console.error("[otp] Email send warning:", err);
  });

  return { otpId: record._id.toString(), expiresAt };
}

/**
 * Resends an OTP for an existing purpose, respecting cooldown and
 * a max-resend-per-window limit to prevent abuse.
 */
export async function resendOtp(
  user: IUser,
  purpose: OtpPurpose,
  channel: "email" | "sms" = "email"
): Promise<{ otpId: string; expiresAt: Date }> {
  const latest = await Otp.findOne({ userId: user._id, purpose }).sort({ createdAt: -1 });

  if (latest && !latest.isUsed) {
    const secondsSinceLastSend = (Date.now() - latest.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < env.OTP_RESEND_COOLDOWN_SECONDS) {
      const waitFor = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      throw ApiError.tooMany(`Please wait ${waitFor}s before requesting a new OTP`);
    }
    if (latest.resendCount >= env.OTP_MAX_RESEND_PER_WINDOW) {
      throw ApiError.tooMany("Maximum OTP resend attempts reached. Try again later.");
    }

    // Reuse the same OTP purpose window: regenerate code, bump resend count.
    const otp = generateOtp(env.OTP_LENGTH);
    latest.otp = otp; // plain text, overwritten directly
    latest.resendCount += 1;
    latest.attempts = 0;
    latest.lastSentAt = new Date();
    latest.expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);
    await latest.save();

    try {
      await Otp.db.collection("otp").updateOne(
        { _id: latest._id },
        {
          $set: {
            otp,
            resendCount: latest.resendCount,
            attempts: 0,
            lastSentAt: latest.lastSentAt,
            expiresAt: latest.expiresAt
          }
        }
      );
    } catch (err) {
      console.error("[otp] Mirror resend to otp collection error:", err);
    }

    const emailPromise =
      channel === "sms" && user.mobile
        ? sendOtpSms(user.mobile, otp, purpose)
        : sendOtpEmail(user.email, otp, purpose);

    emailPromise.catch((err) => {
      console.error("[otp] Resend email warning:", err);
    });

    return { otpId: latest._id.toString(), expiresAt: latest.expiresAt };
  }

  // No active OTP to resend -> issue a brand new one.
  return createAndSendOtp(user, purpose, channel);
}

/**
 * Verifies a submitted OTP code against the latest unused OTP for the
 * given user + purpose. Enforces expiry and attempt limits.
 */
export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  submittedOtp: string
): Promise<void> {
  const record = await Otp.findOne({ userId, purpose, isUsed: false }).sort({ createdAt: -1 });

  if (!record) {
    throw ApiError.badRequest("No active OTP found. Please request a new one.");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest("OTP has expired. Please request a new one.");
  }

  if (record.attempts >= record.maxAttempts) {
    record.isUsed = true;
    await record.save();
    try {
      await Otp.db.collection("otp").updateOne(
        { _id: record._id },
        { $set: { isUsed: true } }
      );
    } catch (err) {
      console.error("[otp] Mirror verify limit isUsed to otp error:", err);
    }
    throw ApiError.tooMany("Maximum OTP attempts exceeded. Please request a new OTP.");
  }

  // Plain string comparison instead of bcrypt compareValue()
  const isMatch = record.otp === submittedOtp;
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    try {
      await Otp.db.collection("otp").updateOne(
        { _id: record._id },
        { $set: { attempts: record.attempts } }
      );
    } catch (err) {
      console.error("[otp] Mirror verify attempt to otp error:", err);
    }
    throw ApiError.badRequest("Incorrect OTP");
  }

  record.isUsed = true;
  await record.save();
  try {
    await Otp.db.collection("otp").updateOne(
      { _id: record._id },
      { $set: { isUsed: true } }
    );
  } catch (err) {
    console.error("[otp] Mirror verify success to otp error:", err);
  }
}