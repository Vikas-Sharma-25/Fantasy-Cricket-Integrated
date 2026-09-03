import { Types } from "mongoose";
import { Match, IMatch } from "../models/Match";
import { MatchPlayer } from "../models/MatchPlayer";
import { Player } from "../models/Player";
import { ApiError } from "../utils/apiError";

interface ListMatchesParams {
  status?: string;
  page: number;
  limit: number;
}

/**
 * DB role strings aren't always spelled/hyphenated consistently
 * ("All Rounder" vs "All-Rounder", "wicket keeper" vs "Wicket-Keeper", etc.).
 * The UI filters players into exactly 4 role tabs, so normalize every role
 * to one of those 4 canonical labels here — otherwise a valid, available
 * player can silently vanish from its tab because the string didn't match.
 */
const normalizeRole = (role: string): string => {
  const r = (role || "").toLowerCase().replace(/[\s-]+/g, "");
  if (r.includes("wicket")) return "Wicket-Keeper";
  if (r.includes("allround")) return "All-Rounder";
  if (r.includes("bowl")) return "Bowler";
  if (r.includes("bat")) return "Batsman";
  return role;
};

export const createMatch = async (payload: Partial<IMatch>) => {
  return Match.create(payload);
};

export const listMatches = async ({ status, page, limit }: ListMatchesParams) => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status.toUpperCase();

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Match.find(filter).sort({ startTime: 1 }).skip(skip).limit(limit),
    Match.countDocuments(filter),
  ]);

  return { items, total };
};

export const getMatchById = async (matchId: string) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");
  return match;
};

export const updateMatch = async (matchId: string, payload: Partial<IMatch>) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const allowedFields = ["teamA", "teamB", "venue", "startTime", "fantasyDeadline", "status", "providerData"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if ((payload as any)[key] !== undefined) updates[key] = (payload as any)[key];
  }

  const match = await Match.findByIdAndUpdate(matchId, updates, { new: true, runValidators: true });
  if (!match) throw new ApiError(404, "Match not found");
  return match;
};

export const deleteMatch = async (matchId: string) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const match = await Match.findByIdAndDelete(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Prevent orphan bridge rows once the match is gone
  await MatchPlayer.deleteMany({ matchId });

  return { deleted: true };
};

export const getMatchPlayers = async (matchId: string) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Full player pool (e.g. all 13 players in the Players table), and the
  // bridge rows that mark which of them are actually part of THIS match
  // (e.g. 11 rows in MatchPlayer for this matchId).
  const [allPlayers, matchPlayers] = await Promise.all([
    Player.find({}).sort({ name: 1 }),
    MatchPlayer.find({ matchId }),
  ]);

  const matchPlayerByPlayerId = new Map(
    matchPlayers.map((mp) => [mp.playerId.toString(), mp])
  );

  const merged = allPlayers.map((player) => {
    const mp = matchPlayerByPlayerId.get(player._id.toString());
    const isAvailable = Boolean(mp) && mp!.isAvailable !== false;

    return {
      matchPlayerId: mp ? mp._id : null,
      playerId: player._id,
      name: player.name,
      realTeam: mp ? mp.realTeam : null,
      role: normalizeRole(mp ? mp.role : player.role),
      credits: mp ? mp.credits : null,
      isPlayingXI: mp ? mp.isPlayingXI : false,
      isAvailable,
    };
  });

  // Squad players first (grouped by role, highest credits first), then the
  // players who aren't part of this match at all.
  merged.sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return (b.credits ?? 0) - (a.credits ?? 0);
  });

  return merged;
};

export const getMatchLive = async (matchId: string) => {
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Hook this up to your live-scoring provider later
  return {
    matchId: match._id,
    status: match.status,
    providerData: match.providerData ?? {},
  };
};