import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

/** Restrict route to specific roles. Requires requireAuth to run first. */
export function requireRole(...roles: Array<"user" | "admin" | "super_admin">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required");
    if (!roles.includes(req.user.role as "user" | "admin" | "super_admin")) {
      throw ApiError.forbidden("You do not have permission to perform this action");
    }
    next();
  };
}

export const requireAdmin = requireRole("admin", "super_admin");
export const requireSuperAdmin = requireRole("super_admin");
