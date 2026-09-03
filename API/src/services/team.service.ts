import { Types } from "mongoose";
import { FantasyTeam } from "../models/FantasyTeam";
import { Match } from "../models/Match";
import { MatchPlayer } from "../models/MatchPlayer";
import { ApiError } from "../utils/apiError";

/** Configurable fantasy team rules (SRS section 6). Move to SystemConfig/scoringRules-style admin config for production. */
export const TEAM_RULES = {
  SQUAD_SIZE: 11,
  MAX_CREDITS: 100,
  MAX_PLAYERS_PER_REAL_TEAM: 7,
  ROLE_LIMITS: {
    "Wicket-Keeper": { min: 1, max: 4 },
    Batsman: { min: 3, max: 6 },
    "All-Rounder": { min: 1, max: 4 },
    Bowler: { min: 3, max: 6 }
  } as Record<string, { min: number; max: number }>
};

interface TeamInput {
  matchId: string;
  name: string;
  playerIds: string[];
  captainId: string;
  viceCaptainId: string;
}

async function validateTeamComposition(input: TeamInput) {
  const { matchId, playerIds, captainId, viceCaptainId } = input;

  if (!Types.ObjectId.isValid(matchId)) throw ApiError.badRequest("Invalid match id");

  const match = await Match.findById(matchId);
  if (!match) throw ApiError.notFound("Match not found");
  if (match.fantasyDeadline.getTime() < Date.now()) {
    throw ApiError.badRequest("Fantasy deadline has passed for this match");
  }

  if (playerIds.length !== TEAM_RULES.SQUAD_SIZE) {
    throw ApiError.badRequest(`Team must have exactly ${TEAM_RULES.SQUAD_SIZE} players`);
  }

  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== playerIds.length) {
    throw ApiError.badRequest("Duplicate players are not allowed");
  }

  if (!playerIds.includes(captainId)) throw ApiError.badRequest("Captain must be part of the team");
  if (!playerIds.includes(viceCaptainId)) throw ApiError.badRequest("Vice-Captain must be part of the team");
  if (captainId === viceCaptainId) throw ApiError.badRequest("Captain and Vice-Captain must differ");

  const matchPlayers = await MatchPlayer.find({
    matchId,
    playerId: { $in: playerIds }
  }).populate("playerId");

  if (matchPlayers.length !== playerIds.length) {
    throw ApiError.badRequest("One or more selected players are not available for this match");
  }

  // Credits validation
  const totalCredits = matchPlayers.reduce((sum, mp) => sum + mp.credits, 0);
  if (totalCredits > TEAM_RULES.MAX_CREDITS) {
    throw ApiError.badRequest(
      `Total credits (${totalCredits}) exceed the maximum allowed (${TEAM_RULES.MAX_CREDITS})`
    );
  }

  // Real-team limit validation (e.g. max 7 players from Team A)
  const realTeamCounts: Record<string, number> = {};
  for (const mp of matchPlayers) {
    realTeamCounts[mp.realTeam] = (realTeamCounts[mp.realTeam] || 0) + 1;
  }
  for (const [team, count] of Object.entries(realTeamCounts)) {
    if (count > TEAM_RULES.MAX_PLAYERS_PER_REAL_TEAM) {
      throw ApiError.badRequest(
        `Too many players (${count}) selected from ${team}. Max allowed is ${TEAM_RULES.MAX_PLAYERS_PER_REAL_TEAM}`
      );
    }
  }

  // Role-wise min/max validation
  const roleCounts: Record<string, number> = {};
  for (const mp of matchPlayers) {
    roleCounts[mp.role] = (roleCounts[mp.role] || 0) + 1;
  }
  for (const [role, limits] of Object.entries(TEAM_RULES.ROLE_LIMITS)) {
    const count = roleCounts[role] || 0;
    if (count < limits.min || count > limits.max) {
      throw ApiError.badRequest(
        `Role "${role}" requires between ${limits.min} and ${limits.max} players (got ${count})`
      );
    }
  }

  return { match, totalCredits };
}

export async function createFantasyTeam(userId: string, input: TeamInput) {
  const { totalCredits } = await validateTeamComposition(input);

  const team = await FantasyTeam.create({
    userId,
    matchId: input.matchId,
    name: input.name,
    playerIds: input.playerIds,
    captainId: input.captainId,
    viceCaptainId: input.viceCaptainId,
    totalCredits,
    isLocked: false
  });

  return team;
}

export async function getMyTeams(userId: string, matchId?: string) {
  const query: Record<string, unknown> = { userId };
  if (matchId) query.matchId = matchId;
  return FantasyTeam.find(query).sort({ createdAt: -1 }).populate("playerIds captainId viceCaptainId");
}

export async function getTeamById(userId: string, teamId: string) {
  if (!Types.ObjectId.isValid(teamId)) throw ApiError.badRequest("Invalid team id");
  const team = await FantasyTeam.findOne({ _id: teamId, userId }).populate(
    "playerIds captainId viceCaptainId"
  );
  if (!team) throw ApiError.notFound("Fantasy team not found");
  return team;
}

export async function updateTeam(
  userId: string,
  teamId: string,
  updates: Partial<TeamInput>
) {
  if (!Types.ObjectId.isValid(teamId)) throw ApiError.badRequest("Invalid team id");
  const existing = await FantasyTeam.findOne({ _id: teamId, userId });
  if (!existing) throw ApiError.notFound("Fantasy team not found");
  if (existing.isLocked) throw ApiError.badRequest("Team is locked and cannot be edited");

  const merged: TeamInput = {
    matchId: existing.matchId.toString(),
    name: updates.name ?? existing.name,
    playerIds: updates.playerIds ?? existing.playerIds.map((p) => p.toString()),
    captainId: updates.captainId ?? existing.captainId.toString(),
    viceCaptainId: updates.viceCaptainId ?? existing.viceCaptainId.toString()
  };

  const { totalCredits } = await validateTeamComposition(merged);

  existing.name = merged.name;
  existing.playerIds = merged.playerIds.map((id) => new Types.ObjectId(id));
  existing.captainId = new Types.ObjectId(merged.captainId);
  existing.viceCaptainId = new Types.ObjectId(merged.viceCaptainId);
  existing.totalCredits = totalCredits;
  await existing.save();

  return existing;
}

export async function deleteTeam(userId: string, teamId: string) {
  if (!Types.ObjectId.isValid(teamId)) throw ApiError.badRequest("Invalid team id");
  const existing = await FantasyTeam.findOne({ _id: teamId, userId });
  if (!existing) throw ApiError.notFound("Fantasy team not found");
  if (existing.isLocked) throw ApiError.badRequest("Locked teams cannot be deleted");
  await existing.deleteOne();
  return { deleted: true };
}

/** Locks all unlocked fantasy teams for a match once its deadline passes. Call from a scheduler/worker. */
export async function lockTeamsPastDeadline(matchId: string) {
  const match = await Match.findById(matchId);
  if (!match) throw ApiError.notFound("Match not found");
  if (match.fantasyDeadline.getTime() > Date.now()) return { locked: 0 };

  const result = await FantasyTeam.updateMany(
    { matchId, isLocked: false },
    { $set: { isLocked: true, lockedAt: new Date() } }
  );
  return { locked: result.modifiedCount };
}
