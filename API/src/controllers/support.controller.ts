import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { SupportTicket } from "../models/SupportTicket";

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { subject, description, category } = req.body;
  const ticket = await SupportTicket.create({
    userId: req.user.userId,
    subject,
    description,
    category
  });
  return sendSuccess(res, ticket, "Support ticket created", 201);
});

export const listMyTickets = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = { userId: req.user.userId };
  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SupportTicket.countDocuments(filter)
  ]);
  return sendPaginated(res, items, page, limit, total);
});

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, userId: req.user.userId });
  if (!ticket) throw ApiError.notFound("Support ticket not found");
  return sendSuccess(res, ticket);
});
