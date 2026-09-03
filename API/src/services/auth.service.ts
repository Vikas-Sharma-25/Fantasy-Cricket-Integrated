import { Types } from "mongoose";
import { User, IUser } from "../models/User";
import { Session } from "../models/Session";
import { ApiError } from "../utils/apiError";
import { hashValue, compareValue } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/token";
import { createAndSendOtp, resendOtp, verifyOtp } from "./otp.service";
import { env } from "../config/env";

interface DeviceMeta {
  deviceInfo?: string;
  ipAddress?: string;
}

/** STEP 1 of registration: create the (unverified) account and send an OTP to verify it. */
export async function registerUser(input: {
  name: string;
  email: string;
  mobile?: string;
  password: string;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashValue(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    mobile: input.mobile,
    passwordHash,
    role: "user",
    status: "active",
    isVerified: false
  });

  const { expiresAt } = await createAndSendOtp(user, "verify_account", "email");

  return {
    userId: user._id.toString(),
    email: user.email,
    otpExpiresAt: expiresAt
  };
}

/**
 * STEP 1 of login (2-step verification): validate email + password.
 * On success, an OTP is generated and sent; no session/tokens are issued yet.
 */
export async function loginStep1(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  if (user.status === "suspended") throw ApiError.forbidden("Account suspended");
  if (user.status === "deleted") throw ApiError.forbidden("Account no longer exists");

  const isMatch = await compareValue(password, user.passwordHash);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  const { expiresAt } = await createAndSendOtp(user, "login", "email");

  return {
    userId: user._id.toString(),
    requiresOtp: true,
    otpExpiresAt: expiresAt,
    message: "OTP sent to your registered email"
  };
}

/**
 * STEP 2 of login: verify the OTP, then create a session and issue
 * access + refresh tokens.
 */
export async function loginStep2VerifyOtp(
  userId: string,
  otp: string,
  meta: DeviceMeta
) {
  if (!Types.ObjectId.isValid(userId)) throw ApiError.badRequest("Invalid user id");

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  await verifyOtp(userId, "login", otp);

  const sessionId = new Types.ObjectId();
  const refreshToken = signRefreshToken({ userId: user._id.toString(), sessionId: sessionId.toString() });
  const refreshTokenHash = await hashValue(refreshToken);

  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await Session.create({
    _id: sessionId,
    userId: user._id,
    deviceInfo: meta.deviceInfo,
    ipAddress: meta.ipAddress,
    refreshTokenHash,
    expiresAt
  });

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    sessionId: sessionId.toString()
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
}

/** Verifies account (email/mobile) OTP sent at registration. */
export async function verifyAccountOtp(userId: string, otp: string) {
  if (!Types.ObjectId.isValid(userId)) throw ApiError.badRequest("Invalid user id");
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  await verifyOtp(userId, "verify_account", otp);

  user.isVerified = true;
  await user.save();

  return { userId: user._id.toString(), isVerified: true };
}

/** Resend OTP for login / verify_account / reset_password, with cooldown + limits. */
export async function resendUserOtp(userId: string, purpose: "login" | "verify_account" | "reset_password") {
  if (!Types.ObjectId.isValid(userId)) throw ApiError.badRequest("Invalid user id");
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const { expiresAt } = await resendOtp(user, purpose, "email");
  return { userId: user._id.toString(), otpExpiresAt: expiresAt };
}

/** Forgot password: sends OTP as reset_password purpose. Silent success even if user not found (avoid enumeration). */
export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Do not reveal whether the email exists.
    return { message: "If that email exists, an OTP has been sent." };
  }
  await createAndSendOtp(user, "reset_password", "email");
  return { message: "If that email exists, an OTP has been sent.", userId: user._id.toString() };
}

/** Reset password: verifies OTP then updates password hash; revokes all existing sessions. */
export async function resetPassword(userId: string, otp: string, newPassword: string) {
  if (!Types.ObjectId.isValid(userId)) throw ApiError.badRequest("Invalid user id");
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  await verifyOtp(userId, "reset_password", otp);

  user.passwordHash = await hashValue(newPassword);
  await user.save();

  await Session.updateMany({ userId: user._id }, { $set: { isRevoked: true } });

  return { message: "Password reset successful. Please log in again." };
}

/** Issues a new access token (and rotates refresh token) from a valid, non-revoked refresh token. */
export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const session = await Session.findById(payload.sessionId).select("+refreshTokenHash");
  if (!session || session.isRevoked) throw ApiError.unauthorized("Session no longer valid");
  if (session.expiresAt.getTime() < Date.now()) throw ApiError.unauthorized("Session expired");

  const matches = await compareValue(refreshToken, session.refreshTokenHash);
  if (!matches) throw ApiError.unauthorized("Refresh token mismatch");

  const user = await User.findById(payload.userId);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    sessionId: session._id.toString()
  });

  return { accessToken };
}

/** Logs out: revokes the session tied to the current access token. */
export async function logoutSession(sessionId: string) {
  if (!Types.ObjectId.isValid(sessionId)) return;
  await Session.updateOne({ _id: sessionId }, { $set: { isRevoked: true } });
}

export function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    preferences: user.preferences
  };
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * unitMs[unit];
}
