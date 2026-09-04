import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { env } from "../config/env";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken, signOneTimeToken, verifyOneTimeToken } from "../utils/token";

const REFRESH_COOKIE = "refreshToken";
const OTP_SESSION_COOKIE = "otpSession";

interface OtpSessionPayload extends Record<string, unknown> {
  userId: string;
  purpose: "verify_account" | "login" | "reset_password";
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

/** Stores which user + purpose an OTP belongs to, so the client never sends userId. */
function setOtpSessionCookie(res: Response, userId: string, purpose: OtpSessionPayload["purpose"]): string {
  const expiresIn = `${env.OTP_EXPIRES_IN_MINUTES}m`;
  const token = signOneTimeToken({ userId, purpose } as OtpSessionPayload, expiresIn);
  res.cookie(OTP_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: env.OTP_EXPIRES_IN_MINUTES * 60 * 1000
  });
  return token;
}

/** Reads back {userId, purpose} from body.otpToken, headers, or cookies. Throws if missing/invalid/expired. */
function readOtpSession(req: Request, expectedPurpose: OtpSessionPayload["purpose"]): OtpSessionPayload {
  const token =
    req.body?.otpToken ||
    (req.headers["x-otp-session"] as string) ||
    req.cookies?.[OTP_SESSION_COOKIE];

  if (!token) {
    throw ApiError.badRequest("OTP session expired or missing. Please register/login again to receive a new OTP.");
  }
  let payload: OtpSessionPayload;
  try {
    payload = verifyOneTimeToken<OtpSessionPayload>(token);
  } catch {
    throw ApiError.badRequest("OTP session expired. Please request a new OTP.");
  }
  if (payload.purpose !== expectedPurpose) {
    throw ApiError.badRequest("Invalid OTP session for this action.");
  }
  return payload;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  const otpToken = setOtpSessionCookie(res, result.userId, "verify_account");
  return sendSuccess(
    res,
    { email: result.email, otpToken },
    "Registration successful. Please enter the OTP sent to your email.",
    201
  );
});

export const verifyAccount = asyncHandler(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const { userId } = readOtpSession(req, "verify_account");
  const result = await authService.verifyAccountOtp(userId, otp);
  res.clearCookie(OTP_SESSION_COOKIE);
  return sendSuccess(res, result, "Account verified successfully");
});

/** STEP 1: email + password -> triggers OTP send, stores userId in otpSession cookie. */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginStep1(email, password);
  const otpToken = setOtpSessionCookie(res, result.userId, "login");
  return sendSuccess(
    res,
    { message: result.message, otpToken, email },
    "OTP sent. Please verify to complete login."
  );
});

/** STEP 2: OTP-only payload -> userId comes from otpSession cookie -> issues access + refresh tokens. */
export const verifyLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const { userId } = readOtpSession(req, "login");
  const meta = {
    deviceInfo: req.headers["user-agent"],
    ipAddress: req.ip
  };
  const result = await authService.loginStep2VerifyOtp(userId, otp, meta);
  res.clearCookie(OTP_SESSION_COOKIE);
  setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, { accessToken: result.accessToken, user: result.user }, "Login successful");
});

/** Resend: no payload needed - userId + purpose both come from otpToken / cookie. */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const token =
    req.body?.otpToken ||
    (req.headers["x-otp-session"] as string) ||
    req.cookies?.[OTP_SESSION_COOKIE];

  if (!token) {
    throw ApiError.badRequest("OTP session expired or missing. Please register/login again.");
  }
  let payload: OtpSessionPayload;
  try {
    payload = verifyOneTimeToken<OtpSessionPayload>(token);
  } catch {
    throw ApiError.badRequest("OTP session expired. Please register/login again.");
  }
  const result = await authService.resendUserOtp(payload.userId, payload.purpose);
  const newOtpToken = setOtpSessionCookie(res, payload.userId, payload.purpose); // refresh cookie with new expiry
  return sendSuccess(res, { otpExpiresAt: result.otpExpiresAt, otpToken: newOtpToken }, "OTP resent successfully");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  let otpToken: string | undefined;
  if (result.userId) {
    otpToken = setOtpSessionCookie(res, result.userId, "reset_password");
  }
  return sendSuccess(res, { message: result.message, otpToken }, result.message);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { otp, newPassword } = req.body;
  const { userId } = readOtpSession(req, "reset_password");
  const result = await authService.resetPassword(userId, otp, newPassword);
  res.clearCookie(OTP_SESSION_COOKIE);
  return sendSuccess(res, result, result.message);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized("Refresh token missing");
  const result = await authService.refreshAccessToken(token);
  return sendSuccess(res, result, "Token refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      await authService.logoutSession(payload.sessionId);
    } catch {
      /* token already invalid/expired - nothing to revoke */
    }
  }
  res.clearCookie(REFRESH_COOKIE);
  return sendSuccess(res, {}, "Logged out successfully");
});