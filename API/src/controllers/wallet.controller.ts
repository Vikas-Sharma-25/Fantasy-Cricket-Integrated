import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import * as walletService from "../services/wallet.service";

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const wallet = await walletService.getWallet(req.user.userId);
  return sendSuccess(res, wallet);
});

export const addCash = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { amount, paymentMethod } = req.body;
  const updatedWallet = await walletService.addCash(req.user.userId, amount, paymentMethod);
  return sendSuccess(res, updatedWallet, "Cash added successfully");
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { amount, withdrawTo } = req.body;
  const updatedWallet = await walletService.withdraw(req.user.userId, amount, withdrawTo);
  return sendSuccess(res, updatedWallet, "Withdrawal processed successfully");
});
