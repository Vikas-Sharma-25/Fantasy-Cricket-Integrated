import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as matchPlayerService from "../services/matchPlayer.service";

export const createMatchPlayer = asyncHandler(async (req: Request, res: Response) => {
  const matchPlayer = await matchPlayerService.createMatchPlayer(req.body);
  return sendSuccess(res, matchPlayer, "Match player created successfully", 201);
});

export const bulkCreateMatchPlayers = asyncHandler(async (req: Request, res: Response) => {
  const { matchId, players } = req.body;
  const result = await matchPlayerService.bulkCreateMatchPlayers(matchId, players);
  return sendSuccess(res, result, "Bulk insert attempted (duplicates, if any, were skipped)", 201);
});

export const getAllMatchPlayers = asyncHandler(async (req: Request, res: Response) => {
  const matchPlayers = await matchPlayerService.getAllMatchPlayers(req.query as Record<string, unknown>);
  return sendSuccess(res, matchPlayers);
});

export const getMatchPlayerById = asyncHandler(async (req: Request, res: Response) => {
  const matchPlayer = await matchPlayerService.getMatchPlayerById(req.params.id);
  return sendSuccess(res, matchPlayer);
});

export const updateMatchPlayer = asyncHandler(async (req: Request, res: Response) => {
  const matchPlayer = await matchPlayerService.updateMatchPlayer(req.params.id, req.body);
  return sendSuccess(res, matchPlayer, "Match player updated successfully");
});

export const deleteMatchPlayer = asyncHandler(async (req: Request, res: Response) => {
  const result = await matchPlayerService.deleteMatchPlayer(req.params.id);
  return sendSuccess(res, result, "Deleted successfully");
});