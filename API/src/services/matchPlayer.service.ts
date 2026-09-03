import { Types } from "mongoose";
import { MatchPlayer, IMatchPlayer } from "../models/MatchPlayer";
import { Match } from "../models/Match";
import { Player } from "../models/Player";
import { ApiError } from "../utils/apiError";

interface CreateMatchPlayerInput {
  matchId: string;
  playerId: string;
  realTeam: string;
  role: string;
  credits?: number;
  isAvailable?: boolean;
  isPlayingXI?: boolean;
}

/**
 * Shapes a populated MatchPlayer doc into a flat, frontend-friendly object.
 * Replaces the raw playerId with the player's name, keeping playerId as a plain string.
 */
const toFlatMatchPlayer = (mp: any) => ({
  matchPlayerId: mp._id,
  matchId: mp.matchId?._id ?? mp.matchId,
  playerId: mp.playerId?._id ?? mp.playerId,
  playerName: mp.playerId?.name ?? undefined,
  playerRole: mp.playerId?.role ?? undefined,
  nationality: mp.playerId?.nationality ?? undefined,
  realTeam: mp.realTeam,
  role: mp.role,
  credits: mp.credits,
  isAvailable: mp.isAvailable,
  isPlayingXI: mp.isPlayingXI,
  stats: mp.stats,
  createdAt: mp.createdAt,
});

export const createMatchPlayer = async (payload: CreateMatchPlayerInput) => {
  const { matchId, playerId, realTeam, role } = payload;

  if (!matchId || !playerId || !realTeam || !role) {
    throw new ApiError(400, "matchId, playerId, realTeam, role are required");
  }
  if (!Types.ObjectId.isValid(matchId) || !Types.ObjectId.isValid(playerId)) {
    throw new ApiError(400, "Invalid matchId or playerId");
  }

  const [matchExists, playerExists] = await Promise.all([
    Match.exists({ _id: matchId }),
    Player.exists({ _id: playerId }),
  ]);
  if (!matchExists) throw new ApiError(404, "Match not found");
  if (!playerExists) throw new ApiError(404, "Player not found");

  try {
    const matchPlayer = await MatchPlayer.create(payload);
    await matchPlayer.populate("playerId", "name role nationality");
    return toFlatMatchPlayer(matchPlayer);
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(409, "This player is already added to this match");
    }
    throw err;
  }
};

export const bulkCreateMatchPlayers = async (matchId: string, players: any[]) => {
  if (!matchId || !Array.isArray(players) || players.length === 0) {
    throw new ApiError(400, "matchId and players[] are required");
  }
  if (!Types.ObjectId.isValid(matchId)) throw new ApiError(400, "Invalid matchId");

  const matchExists = await Match.exists({ _id: matchId });
  if (!matchExists) throw new ApiError(404, "Match not found");

  const docs = players.map((p) => ({
    matchId,
    playerId: p.playerId,
    realTeam: p.realTeam,
    role: p.role,
    credits: p.credits ?? 8,
    isAvailable: p.isAvailable ?? true,
    isPlayingXI: p.isPlayingXI ?? false,
  }));

  // ordered:false -> duplicates (unique index) fail individually, rest still insert
  const result = await MatchPlayer.insertMany(docs, { ordered: false }).catch((e: unknown) => e);

  // If insertMany fully succeeded, result is an array of created docs — populate + flatten them.
  if (Array.isArray(result)) {
    const populated = await MatchPlayer.find({ _id: { $in: result.map((r: any) => r._id) } }).populate(
      "playerId",
      "name role nationality"
    );
    return populated.map(toFlatMatchPlayer);
  }

  // Partial failure (some duplicates) — return the raw error/result as-is so the caller can inspect it.
  return result;
};

export const getAllMatchPlayers = async (filters: Record<string, unknown>) => {
  const query: Record<string, unknown> = {};
  if (filters.matchId) query.matchId = filters.matchId;
  if (filters.role) query.role = filters.role;
  if (filters.isPlayingXI !== undefined) query.isPlayingXI = filters.isPlayingXI === "true";
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable === "true";

  const matchPlayers = await MatchPlayer.find(query)
    .populate("playerId", "name role nationality")
    .sort({ role: 1, credits: -1 });

  return matchPlayers.map(toFlatMatchPlayer);
};

export const getMatchPlayerById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");

  const matchPlayer = await MatchPlayer.findById(id)
    .populate("matchId", "teamA teamB startTime")
    .populate("playerId", "name role nationality");

  if (!matchPlayer) throw new ApiError(404, "MatchPlayer not found");
  return toFlatMatchPlayer(matchPlayer);
};

export const updateMatchPlayer = async (id: string, payload: Partial<IMatchPlayer>) => {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");

  const allowedFields = ["realTeam", "role", "credits", "isAvailable", "isPlayingXI", "stats"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if ((payload as any)[key] !== undefined) updates[key] = (payload as any)[key];
  }

  const matchPlayer = await MatchPlayer.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("playerId", "name role nationality");

  if (!matchPlayer) throw new ApiError(404, "MatchPlayer not found");
  return toFlatMatchPlayer(matchPlayer);
};

export const deleteMatchPlayer = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");

  const matchPlayer = await MatchPlayer.findByIdAndDelete(id);
  if (!matchPlayer) throw new ApiError(404, "MatchPlayer not found");
  return { deleted: true };
};