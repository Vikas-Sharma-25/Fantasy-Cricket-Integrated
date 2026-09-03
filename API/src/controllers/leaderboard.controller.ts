import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as leaderboardService from "../services/leaderboard.service";

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const rows = await leaderboardService.getContestLeaderboard(req.params.contestId);
  return sendSuccess(res, rows);
});
