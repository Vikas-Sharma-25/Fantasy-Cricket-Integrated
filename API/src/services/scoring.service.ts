import { Types } from "mongoose";
import { PlayerEvent } from "../models/PlayerEvent";
import { ScoringRule } from "../models/ScoringRule";
import { FantasyPoint } from "../models/FantasyPoint";
import { FantasyTeam } from "../models/FantasyTeam";
import { ApiError } from "../utils/apiError";
import { updateLeaderboardsForPlayer } from "./leaderboard.service";

/**
 * Ingests a single normalized cricket event from the provider (webhook/poll)
 * and stores it. Idempotent on (matchId, providerEventId) via unique index.
 *
 * Step 11 only: event is stored as "pending". Scoring (Step 12) is triggered
 * separately via processPlayerEvent().
 */
export async function ingestPlayerEvent(input: {
  matchId: string;
  playerId: string;
  providerEventId: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  eventTime: Date;
}) {
  const existing = await PlayerEvent.findOne({
    matchId: input.matchId,
    providerEventId: input.providerEventId
  });
  if (existing) {
    return { event: existing, alreadyProcessed: existing.processingStatus === "processed" };
  }

  const event = await PlayerEvent.create({
    ...input,
    processingStatus: "pending"
  });

  return { event, alreadyProcessed: false };
}

/** Computes fantasy points for a stored event using the active scoring rule and applies captain/VC multipliers per affected team. */
export async function processPlayerEvent(playerEventId: string) {
  if (!Types.ObjectId.isValid(playerEventId)) throw ApiError.badRequest("Invalid event id");

  const event = await PlayerEvent.findById(playerEventId);
  if (!event) throw ApiError.notFound("Player event not found");
  if (event.processingStatus === "processed") return event;

  const asOf = event.eventTime;
  const rule = await ScoringRule.findOne({
    eventType: event.eventType,
    isActive: true,
    effectiveFrom: { $lte: asOf },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gte: asOf } }
    ]
  }).sort({ version: -1 });

  if (!rule) {
    event.processingStatus = "failed";
    await event.save();
    throw ApiError.badRequest(`No active scoring rule for event type "${event.eventType}"`);
  }

  const basePoints = rule.points;
  const multiplier = rule.multiplier ?? 1;
  const finalPoints = basePoints * multiplier;

  await FantasyPoint.findOneAndUpdate(
    { playerEventId: event._id },
    {
      matchId: event.matchId,
      playerId: event.playerId,
      playerEventId: event._id,
      scoringRuleId: rule._id,
      basePoints,
      multiplier,
      finalPoints
    },
    { upsert: true, new: true }
  );

  event.processingStatus = "processed";
  await event.save();

  await updateLeaderboardsForPlayer(event.matchId.toString(), event.playerId.toString());

  return event;
}

/** Reverses a previously processed event (e.g. umpire review overturns a wicket). */
export async function reversePlayerEvent(playerEventId: string) {
  if (!Types.ObjectId.isValid(playerEventId)) throw ApiError.badRequest("Invalid event id");
  const event = await PlayerEvent.findById(playerEventId);
  if (!event) throw ApiError.notFound("Player event not found");

  await FantasyPoint.deleteOne({ playerEventId: event._id });
  event.processingStatus = "reversed";
  await event.save();

  await updateLeaderboardsForPlayer(event.matchId.toString(), event.playerId.toString());
  return event;
}

/** Fetches stored fantasy points for a match, optionally filtered by player. */
export async function getFantasyPoints(matchId: string, playerId?: string) {
  if (!Types.ObjectId.isValid(matchId)) throw ApiError.badRequest("Invalid matchId");
  if (playerId && !Types.ObjectId.isValid(playerId)) throw ApiError.badRequest("Invalid playerId");

  const filter: Record<string, unknown> = { matchId: new Types.ObjectId(matchId) };
  if (playerId) filter.playerId = new Types.ObjectId(playerId);
  return FantasyPoint.find(filter).sort({ createdAt: -1 });
}

/** Sum of finalPoints for a player in a match. */
export async function getPlayerBasePointsForMatch(matchId: string, playerId: string): Promise<number> {
  const agg = await FantasyPoint.aggregate([
    { $match: { matchId: new Types.ObjectId(matchId), playerId: new Types.ObjectId(playerId) } },
    { $group: { _id: null, total: { $sum: "$finalPoints" } } }
  ]);
  return agg[0]?.total || 0;
}

/** Computes a fantasy team's total score for a match: sum of each player's points, x2 for captain, x1.5 for VC. */
export async function computeTeamScore(teamId: string): Promise<number> {
  const team = await FantasyTeam.findById(teamId);
  if (!team) throw ApiError.notFound("Fantasy team not found");

  let total = 0;
  for (const playerId of team.playerIds) {
    const base = await getPlayerBasePointsForMatch(team.matchId.toString(), playerId.toString());
    let playerScore = base;
    if (playerId.equals(team.captainId)) playerScore = base * 2;
    else if (playerId.equals(team.viceCaptainId)) playerScore = base * 1.5;
    total += playerScore;
  }
  return total;
}

export interface TeamScoreBreakdownEntry {
  playerId: string;
  role: "CAPTAIN" | "VICE_CAPTAIN" | "PLAYER";
  basePoints: number;
  multiplier: number;
  finalPoints: number;
}

/** Same math as computeTeamScore(), but returns the per-player breakdown so the captain/VC multiplier can be inspected and tested. */
export async function getTeamScoreBreakdown(teamId: string) {
  if (!Types.ObjectId.isValid(teamId)) throw ApiError.badRequest("Invalid teamId");

  const team = await FantasyTeam.findById(teamId);
  if (!team) throw ApiError.notFound("Fantasy team not found");

  const players: TeamScoreBreakdownEntry[] = [];
  let totalPoints = 0;

  for (const playerId of team.playerIds) {
    const basePoints = await getPlayerBasePointsForMatch(team.matchId.toString(), playerId.toString());

    let role: TeamScoreBreakdownEntry["role"] = "PLAYER";
    let multiplier = 1;
    if (playerId.equals(team.captainId)) {
      role = "CAPTAIN";
      multiplier = 2;
    } else if (playerId.equals(team.viceCaptainId)) {
      role = "VICE_CAPTAIN";
      multiplier = 1.5;
    }

    const finalPoints = basePoints * multiplier;
    totalPoints += finalPoints;

    players.push({ playerId: playerId.toString(), role, basePoints, multiplier, finalPoints });
  }

  return {
    teamId: team._id.toString(),
    matchId: team.matchId.toString(),
    players,
    totalPoints
  };
}