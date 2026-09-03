import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    mobile: z.string().min(7).max(15).optional(),
    password: z.string().min(6).max(72)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

/** Body now contains ONLY the OTP - userId/purpose come from the otpSession cookie. */
export const verifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().min(4).max(8)
  })
});

/** No required fields - userId/purpose come from the otpSession cookie. */
export const resendOtpSchema = z.object({
  body: z.object({}).optional()
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    otp: z.string().min(4).max(8),
    newPassword: z.string().min(6).max(72)
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10).optional()
  })
});