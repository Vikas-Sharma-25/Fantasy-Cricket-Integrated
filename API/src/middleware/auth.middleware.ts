import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken } from "../utils/token";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models";

/** Verifies JWT access token and attaches decoded payload to req.user. */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token =
      header && header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;

    if (!token) {
      throw ApiError.unauthorized("Authentication token missing");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await User.findById(payload.userId).select("status role isVerified");
    if (!user) throw ApiError.unauthorized("User no longer exists");
    if (user.status === "suspended") throw ApiError.forbidden("Account suspended");
    if (user.status === "deleted") throw ApiError.forbidden("Account deleted");

    req.user = payload;
    next();
  }
);

/** Optional auth: attaches user if token present & valid, otherwise continues as guest. */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token =
      header && header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;
    if (token) {
      try {
        req.user = verifyAccessToken(token);
      } catch {
        /* ignore invalid token for optional auth */
      }
    }
    next();
  }
);
