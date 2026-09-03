import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authLimiter, otpResendLimiter } from "../middleware/rateLimiter.middleware";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-account", validate(verifyOtpSchema), authController.verifyAccount);

// 2-step login: step 1 (credentials) -> OTP sent; step 2 (verify-otp) -> tokens issued.
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), authController.verifyLoginOtp);
router.post("/resend-otp", otpResendLimiter, validate(resendOtpSchema), authController.resendOtp);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authController.logout);

export default router;
