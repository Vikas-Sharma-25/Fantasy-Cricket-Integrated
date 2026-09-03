import { Types } from "mongoose";
import { ContestEntry } from "../models/ContestEntry";
import { FantasyTeam } from "../models/FantasyTeam";
import { Leaderboard } from "../models/Leaderboard";
import { Match } from "../models/Match";
import { ApiError } from "../utils/apiError";
import { computeTeamScore } from "./scoring.service";
import { emitToContest } from "../sockets";

/**
 * Recomputes and updates leaderboard rows + ranks for every contest entry
 * whose fantasy team contains the given player. Called after a player's
 * fantasy points change (new event processed/reversed).
 */
export async function updateLeaderboardsForPlayer(matchId: string, playerId: string) {
  const affectedTeams = await FantasyTeam.find({
    matchId,
    playerIds: new Types.ObjectId(playerId)
  }).select("_id userId");

  if (affectedTeams.length === 0) return;

  const teamIds = affectedTeams.map((t) => t._id);
  const entries = await ContestEntry.find({ fantasyTeamId: { $in: teamIds }, status: "joined" });

  const contestIds = new Set<string>();

  for (const entry of entries) {
    const totalPoints = await computeTeamScore(entry.fantasyTeamId.toString());
    await Leaderboard.findOneAndUpdate(
      { contestId: entry.contestId, userId: entry.userId, fantasyTeamId: entry.fantasyTeamId },
      { $set: { totalPoints } },
      { upsert: true }
    );
    contestIds.add(entry.contestId.toString());
  }

  for (const contestId of contestIds) {
    await recalculateRanks(contestId);
  }
}

/** Re-ranks all leaderboard rows for a contest, with tie-break by totalPoints desc, then updatedAt asc. */
export async function recalculateRanks(contestId: string) {
  const rows = await Leaderboard.find({ contestId }).sort({ totalPoints: -1, updatedAt: 1 });

  const bulkOps = rows.map((row, idx) => {
    const newRank = idx + 1;
    return {
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { previousRank: row.rank, rank: newRank } }
      }
    };
  });

  if (bulkOps.length) {
    await Leaderboard.bulkWrite(bulkOps);
  }

  const updated = await Leaderboard.find({ contestId })
    .sort({ rank: 1 })
    .populate("userId", "name profileImage")
    .populate("fantasyTeamId", "name");

  emitToContest(contestId, "contest:leaderboard", {
    contestId,
    leaderboard: updated.map((r) => ({
      userId: r.userId,
      fantasyTeamId: r.fantasyTeamId,
      totalPoints: r.totalPoints,
      rank: r.rank,
      previousRank: r.previousRank
    }))
  });

  return updated;
}

export async function getContestLeaderboard(contestId: string) {
  if (!Types.ObjectId.isValid(contestId)) throw ApiError.badRequest("Invalid contest id");
  const rows = await Leaderboard.find({ contestId })
    .sort({ rank: 1 })
    .populate("userId", "name profileImage")
    .populate("fantasyTeamId", "name");
  return rows;
}

/** Freezes final ranking once the match is completed (FR-LEADER-004, FR-LIVE-007). */
export async function freezeLeaderboardsForMatch(matchId: string) {
  if (!Types.ObjectId.isValid(matchId)) throw ApiError.badRequest("Invalid match id");
  const match = await Match.findById(matchId);
  if (!match) throw ApiError.notFound("Match not found");
  if (match.status !== "COMPLETED") {
    throw ApiError.badRequest("Match must be COMPLETED before freezing leaderboards");
  }

  const teams = await FantasyTeam.find({ matchId }).select("_id");
  const teamIds = teams.map((t) => t._id);
  const entries = await ContestEntry.find({ fantasyTeamId: { $in: teamIds } }).distinct("contestId");

  for (const contestId of entries) {
    await recalculateRanks(contestId.toString());
    await Leaderboard.updateMany({ contestId }, { $set: { status: "final" } });
  }

  return { frozenContests: entries.length };
}
