import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import * as teamService from "../services/team.service";

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const team = await teamService.createFantasyTeam(req.user.userId, req.body);
  return sendSuccess(res, team, "Fantasy team created", 201);
});

export const getMyTeams = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const matchId = req.query.matchId as string | undefined;
  const teams = await teamService.getMyTeams(req.user.userId, matchId);
  return sendSuccess(res, teams);
});

export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const team = await teamService.getTeamById(req.user.userId, req.params.teamId);
  return sendSuccess(res, team);
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const team = await teamService.updateTeam(req.user.userId, req.params.teamId, req.body);
  return sendSuccess(res, team, "Fantasy team updated");
});

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await teamService.deleteTeam(req.user.userId, req.params.teamId);
  return sendSuccess(res, result, "Fantasy team deleted");
});
