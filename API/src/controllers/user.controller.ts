import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import * as userService from "../services/user.service";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await userService.getMe(req.user.userId);
  return sendSuccess(res, user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await userService.updateMe(req.user.userId, req.body);
  return sendSuccess(res, user, "Profile updated");
});

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { items, total } = await userService.getMyNotifications(req.user.userId, page, limit);
  return sendPaginated(res, items, page, limit, total);
});
