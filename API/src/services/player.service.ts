import { Types } from "mongoose";

import { Player } from "../models/Player";
import { ApiError } from "../utils/apiError";
import type {
  ICareerStats,
  IIccRankings
} from "../models/Player";

interface CreatePlayerInput {
  providerPlayerId: string;
  name: string;
  role: string;
  nationality?: string;
  dateOfBirth?: Date | string;
  birthPlace?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  teams?: string[];
  iccRankings?: IIccRankings;
  battingCareer?: ICareerStats;
  bowlingCareer?: ICareerStats;
}

interface UpdatePlayerInput {
  name?: string;
  role?: string;
  nationality?: string;
  dateOfBirth?: Date | string;
  birthPlace?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  teams?: string[];
  iccRankings?: IIccRankings;
  battingCareer?: ICareerStats;
  bowlingCareer?: ICareerStats;
}

/**
 * CREATE PLAYER
 */
export async function createPlayer(input: CreatePlayerInput) {
  const existing = await Player.findOne({
    providerPlayerId: input.providerPlayerId
  });

  if (existing) {
    throw ApiError.conflict(
      "A player with this providerPlayerId already exists"
    );
  }

  let dateOfBirth: Date | undefined;

  if (input.dateOfBirth !== undefined) {
    dateOfBirth = new Date(input.dateOfBirth);

    if (Number.isNaN(dateOfBirth.getTime())) {
      throw ApiError.badRequest("Invalid dateOfBirth");
    }
  }

  const player = await Player.create({
    providerPlayerId: input.providerPlayerId,
    name: input.name,
    role: input.role,
    nationality: input.nationality,
    dateOfBirth,
    birthPlace: input.birthPlace,
    battingStyle: input.battingStyle,
    bowlingStyle: input.bowlingStyle,
    teams: input.teams || [],
    iccRankings: input.iccRankings || {},
    battingCareer: input.battingCareer || {},
    bowlingCareer: input.bowlingCareer || {}
  });

  return player;
}

/**
 * LIST PLAYERS
 */
export async function listPlayers(filters: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  const query: Record<string, unknown> = {};

  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.search) {
    query.name = { $regex: filters.search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    Player.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Player.countDocuments(query)
  ]);

  return {
    items,
    total,
    page,
    limit
  };
}

/**
 * GET SINGLE PLAYER
 */
export async function getPlayerById(playerId: string) {
  if (!Types.ObjectId.isValid(playerId)) {
    throw ApiError.badRequest("Invalid player id");
  }

  const player = await Player.findById(playerId);

  if (!player) {
    throw ApiError.notFound("Player not found");
  }

  return player;
}

/**
 * UPDATE PLAYER
 */
export async function updatePlayer(
  playerId: string,
  input: UpdatePlayerInput
) {
  if (!Types.ObjectId.isValid(playerId)) {
    throw ApiError.badRequest("Invalid player id");
  }

  const player = await Player.findById(playerId);

  if (!player) {
    throw ApiError.notFound("Player not found");
  }

  if (input.name !== undefined) player.name = input.name;
  if (input.role !== undefined) player.role = input.role;
  if (input.nationality !== undefined) player.nationality = input.nationality;
  if (input.birthPlace !== undefined) player.birthPlace = input.birthPlace;
  if (input.battingStyle !== undefined) player.battingStyle = input.battingStyle;
  if (input.bowlingStyle !== undefined) player.bowlingStyle = input.bowlingStyle;
  if (input.teams !== undefined) player.teams = input.teams;
  if (input.iccRankings !== undefined) player.iccRankings = input.iccRankings;
  if (input.battingCareer !== undefined) player.battingCareer = input.battingCareer;
  if (input.bowlingCareer !== undefined) player.bowlingCareer = input.bowlingCareer;

  if (input.dateOfBirth !== undefined) {
    const dob = new Date(input.dateOfBirth);

    if (Number.isNaN(dob.getTime())) {
      throw ApiError.badRequest("Invalid dateOfBirth");
    }

    player.dateOfBirth = dob;
  }

  await player.save();

  return player;
}

/**
 * DELETE PLAYER
 */
export async function deletePlayer(playerId: string) {
  if (!Types.ObjectId.isValid(playerId)) {
    throw ApiError.badRequest("Invalid player id");
  }

  const player = await Player.findById(playerId);

  if (!player) {
    throw ApiError.notFound("Player not found");
  }

  await Player.deleteOne({ _id: player._id });

  return {
    playerId: player._id.toString(),
    deleted: true
  };
}