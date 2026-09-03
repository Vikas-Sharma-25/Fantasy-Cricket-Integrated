import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { User } from "../models/User";
import { Match } from "../models/Match";
import { Player } from "../models/Player";
import { MatchPlayer } from "../models/MatchPlayer";
import { ScoringRule } from "../models/ScoringRule";
import { Contest } from "../models/Contest";
import { AuditLog } from "../models/AuditLog";
import { SupportTicket } from "../models/SupportTicket";
import { PlayerEvent } from "../models/PlayerEvent";
import * as scoringService from "../services/scoring.service";
import * as leaderboardService from "../services/leaderboard.service";
import * as teamService from "../services/team.service";

async function writeAudit(req: Request, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown) {
  await AuditLog.create({
    userId: req.user?.userId,
    action,
    entityType,
    entityId,
    beforeData: before,
    afterData: after,
    ipAddress: req.ip
  });
}

// ---- Dashboard ----
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [userCount, liveMatches, openContests] = await Promise.all([
    User.countDocuments({}),
    Match.countDocuments({ status: "LIVE" }),
    Contest.countDocuments({ status: "OPEN" })
  ]);
  return sendSuccess(res, { userCount, liveMatches, openContests });
});

// ---- Users ----
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search as string | undefined;
  const filter = search
    ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
    : {};
  const [items, total] = await Promise.all([
    User.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);
  return sendPaginated(res, items, page, limit, total);
});

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw ApiError.notFound("User not found");
  const before = { status: user.status };
  user.status = "suspended";  
  await user.save();
  await writeAudit(req, "SUSPEND_USER", "User", user._id.toString(), before, { status: user.status });
  return sendSuccess(res, user, "User suspended");
});

export const restoreUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw ApiError.notFound("User not found");
  const before = { status: user.status };
  user.status = "active";
  await user.save();
  await writeAudit(req, "RESTORE_USER", "User", user._id.toString(), before, { status: user.status });
  return sendSuccess(res, user, "User restored");
});

// ---- Matches ----
export const createMatch = asyncHandler(async (req: Request, res: Response) => {
  const match = await Match.create(req.body);
  await writeAudit(req, "CREATE_MATCH", "Match", match._id.toString(), undefined, match.toObject());
  return sendSuccess(res, match, "Match created", 201);
});

export const updateMatch = asyncHandler(async (req: Request, res: Response) => {
  const match = await Match.findById(req.params.matchId);
  if (!match) throw ApiError.notFound("Match not found");
  const before = match.toObject();
  Object.assign(match, req.body);
  await match.save();
  await writeAudit(req, "UPDATE_MATCH", "Match", match._id.toString(), before, match.toObject());
  return sendSuccess(res, match, "Match updated");
});

export const lockTeamsForMatch = asyncHandler(async (req: Request, res: Response) => {
  const result = await teamService.lockTeamsPastDeadline(req.params.matchId);
  return sendSuccess(res, result, "Teams locked past deadline");
});

// ---- Players ----
export const createPlayer = asyncHandler(async (req: Request, res: Response) => {
  const player = await Player.create(req.body);
  await writeAudit(req, "CREATE_PLAYER", "Player", player._id.toString(), undefined, player.toObject());
  return sendSuccess(res, player, "Player created", 201);
});

export const upsertMatchPlayer = asyncHandler(async (req: Request, res: Response) => {
  const { matchId, playerId } = req.body;
  const matchPlayer = await MatchPlayer.findOneAndUpdate(
    { matchId, playerId },
    { $set: req.body },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return sendSuccess(res, matchPlayer, "Match player upserted");
});

// ---- Scoring ----
export const createScoringRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await ScoringRule.create(req.body);
  await writeAudit(req, "CREATE_SCORING_RULE", "ScoringRule", rule._id.toString(), undefined, rule.toObject());
  return sendSuccess(res, rule, "Scoring rule created", 201);
});

export const listScoringRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await ScoringRule.find({}).sort({ eventType: 1, version: -1 });
  return sendSuccess(res, rules);
});

export const ingestEvent = asyncHandler(async (req: Request, res: Response) => {
  const result = await scoringService.ingestPlayerEvent(req.body);
  // ingestPlayerEvent ab { event, alreadyProcessed } return karta hai -
  // sirf event object bhejna hai response mein, wrapper nahi.
  return sendSuccess(res, result.event, "Event ingested", 201);
});

export const reverseEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await scoringService.reversePlayerEvent(req.params.eventId);
  return sendSuccess(res, event, "Event reversed");
});

// Step 12-13: computes fantasy points for a stored (pending) event using the
// active scoring rule, stores it in FantasyPoint, and updates leaderboards.
export const processEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await scoringService.processPlayerEvent(req.params.eventId);
  return sendSuccess(res, event, "Event processed — fantasy points calculated & leaderboard updated");
});

// List ALL events (single/double/four/six/wicket/...) for a given match,
// optionally filtered to one player - proves multiple events per player are stored.
export const listPlayerEvents = asyncHandler(async (req: Request, res: Response) => {
  const { matchId, playerId, processingStatus } = req.query;
  if (!matchId) throw ApiError.badRequest("matchId query param is required");

  const filter: Record<string, unknown> = { matchId };
  if (playerId) filter.playerId = playerId;
  if (processingStatus) filter.processingStatus = processingStatus;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const [items, total] = await Promise.all([
    PlayerEvent.find(filter).sort({ eventTime: 1 }).skip((page - 1) * limit).limit(limit),
    PlayerEvent.countDocuments(filter)
  ]);
  return sendPaginated(res, items, page, limit, total);
});

export const getPlayerEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await PlayerEvent.findById(req.params.eventId);
  if (!event) throw ApiError.notFound("Player event not found");
  return sendSuccess(res, event);
});

export const freezeLeaderboards = asyncHandler(async (req: Request, res: Response) => {
  const result = await leaderboardService.freezeLeaderboardsForMatch(req.params.matchId);
  return sendSuccess(res, result, "Leaderboards frozen");
});

// ---- Contests ----
export const listAllContests = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const [items, total] = await Promise.all([
    Contest.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Contest.countDocuments({})
  ]);
  return sendPaginated(res, items, page, limit, total);
});

export const updateContestStatus = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) throw ApiError.notFound("Contest not found");
  contest.status = req.body.status;
  await contest.save();
  return sendSuccess(res, contest, "Contest status updated");
});

// ---- Support ----
export const listAllTickets = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SupportTicket.countDocuments(filter)
  ]);
  return sendPaginated(res, items, page, limit, total);
});

export const replyToTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) throw ApiError.notFound("Ticket not found");
  ticket.adminReply = req.body.adminReply;
  ticket.status = req.body.status || "in_progress";
  await ticket.save();
  return sendSuccess(res, ticket, "Reply sent");
});

// ---- Audit Logs ----
export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const [items, total] = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments({})
  ]);
  return sendPaginated(res, items, page, limit, total);
});