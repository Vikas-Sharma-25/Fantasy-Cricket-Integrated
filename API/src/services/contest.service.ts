import { Types } from "mongoose";
import crypto from "crypto";

import { Contest } from "../models/Contest";
import { ContestEntry } from "../models/ContestEntry";
import { FantasyTeam } from "../models/FantasyTeam";
import { Match } from "../models/Match";
import { Leaderboard } from "../models/Leaderboard";

import { ApiError } from "../utils/apiError";

/*
|--------------------------------------------------------------------------
| CREATE CONTEST
|--------------------------------------------------------------------------
*/

export async function createContest(
  userId: string,
  input: {
    matchId: string;
    name: string;
    type: "PUBLIC" | "PRIVATE";
    maxSlots: number;
    rules?: Record<string, unknown>;
  }
) {
  if (!Types.ObjectId.isValid(input.matchId)) {
    throw ApiError.badRequest("Invalid match id");
  }

  const match = await Match.findById(input.matchId);

  if (!match) {
    throw ApiError.notFound("Match not found");
  }

  if (match.status !== "UPCOMING") {
    throw ApiError.badRequest(
      "Contests can only be created for upcoming matches"
    );
  }

  let inviteCode: string | undefined;

  if (input.type === "PRIVATE") {
    inviteCode = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();
  }

  const contest = await Contest.create({
    matchId: input.matchId,
    createdBy: userId,
    name: input.name,
    type: input.type,
    maxSlots: input.maxSlots,
    joinedSlots: 0,
    rules: input.rules || {},
    inviteCode,
    status: "OPEN"
  });

  return contest;
}

/*
|--------------------------------------------------------------------------
| GET ALL CONTESTS
|--------------------------------------------------------------------------
*/

export async function listContests(
  matchId?: string,
  page = 1,
  limit = 20
) {
  const query: Record<string, unknown> = {};

  if (matchId) {
    if (!Types.ObjectId.isValid(matchId)) {
      throw ApiError.badRequest("Invalid match id");
    }

    query.matchId = matchId;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Contest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Contest.countDocuments(query)
  ]);

  return {
    items,
    total,
    page,
    limit
  };
}

/*
|--------------------------------------------------------------------------
| GET MY (JOINED) CONTESTS
|--------------------------------------------------------------------------
*/

export async function getMyContests(
  userId: string,
  matchId?: string
) {
  if (matchId && !Types.ObjectId.isValid(matchId)) {
    throw ApiError.badRequest("Invalid match id");
  }

  const entries = await ContestEntry.find({
    userId,
    status: "joined"
  })
    .sort({ joinedAt: -1 })
    .populate("contestId")
    .populate("fantasyTeamId");

  const items = entries
    .filter((entry) => entry.contestId)
    .map((entry) => {
      const contest: any = (entry.contestId as any).toObject
        ? (entry.contestId as any).toObject()
        : entry.contestId;

      return {
        ...contest,
        fantasyTeamId: entry.fantasyTeamId,
        entryId: entry._id,
        joinedAt: entry.joinedAt
      };
    })
    .filter((contest) =>
      matchId ? contest.matchId?.toString() === matchId : true
    );

  return items;
}

/*
|--------------------------------------------------------------------------
| GET SINGLE CONTEST
|--------------------------------------------------------------------------
*/

export async function getContestById(
  contestId: string
) {
  if (!Types.ObjectId.isValid(contestId)) {
    throw ApiError.badRequest("Invalid contest id");
  }

  const contest = await Contest.findById(contestId);

  if (!contest) {
    throw ApiError.notFound("Contest not found");
  }

  return contest;
}

/*
|--------------------------------------------------------------------------
| UPDATE CONTEST
|--------------------------------------------------------------------------
*/

export async function updateContest(
  userId: string,
  contestId: string,
  updates: {
    name?: string;
    maxSlots?: number;
    rules?: Record<string, unknown>;
    status?:
      | "OPEN"
      | "FULL"
      | "LOCKED"
      | "COMPLETED"
      | "CANCELLED";
  }
) {
  if (!Types.ObjectId.isValid(contestId)) {
    throw ApiError.badRequest("Invalid contest id");
  }

  const contest = await Contest.findById(contestId);

  if (!contest) {
    throw ApiError.notFound("Contest not found");
  }

  /*
   * Only creator can update the contest.
   *
   * If you have admin middleware, you can later
   * allow admins here as well.
   */
  if (
    contest.createdBy &&
    contest.createdBy.toString() !== userId
  ) {
    throw ApiError.forbidden(
      "Only contest creator can update this contest"
    );
  }

  /*
   * Don't allow editing completed/cancelled contests.
   */
  if (
    contest.status === "COMPLETED" ||
    contest.status === "CANCELLED"
  ) {
    throw ApiError.badRequest(
      "Completed or cancelled contest cannot be updated"
    );
  }

  /*
   * maxSlots cannot become smaller than already
   * joined users.
   */
  if (
    updates.maxSlots !== undefined &&
    updates.maxSlots < contest.joinedSlots
  ) {
    throw ApiError.badRequest(
      `maxSlots cannot be less than joinedSlots (${contest.joinedSlots})`
    );
  }

  if (updates.name !== undefined) {
    contest.name = updates.name;
  }

  if (updates.maxSlots !== undefined) {
    contest.maxSlots = updates.maxSlots;
  }

  if (updates.rules !== undefined) {
    contest.rules = updates.rules;
  }

  if (updates.status !== undefined) {
    contest.status = updates.status;
  }

  /*
   * Automatically mark FULL if slots reached.
   */
  if (contest.joinedSlots >= contest.maxSlots) {
    contest.status = "FULL";
  }

  await contest.save();

  return contest;
}

/*
|--------------------------------------------------------------------------
| DELETE CONTEST
|--------------------------------------------------------------------------
*/

export async function deleteContest(
  userId: string,
  contestId: string
) {
  if (!Types.ObjectId.isValid(contestId)) {
    throw ApiError.badRequest("Invalid contest id");
  }

  const contest = await Contest.findById(contestId);

  if (!contest) {
    throw ApiError.notFound("Contest not found");
  }

  if (
    contest.createdBy &&
    contest.createdBy.toString() !== userId
  ) {
    throw ApiError.forbidden(
      "Only contest creator can delete this contest"
    );
  }

  /*
   * Don't delete a contest that already has users.
   *
   * This prevents orphaned ContestEntry records.
   */
  if (contest.joinedSlots > 0) {
    throw ApiError.badRequest(
      "Contest with joined users cannot be deleted"
    );
  }

  await contest.deleteOne();

  return {
    deleted: true,
    contestId
  };
}

/*
|--------------------------------------------------------------------------
| CREATE PRIVATE CONTEST
|--------------------------------------------------------------------------
*/

export async function createPrivateContest(
  userId: string,
  input: {
    matchId: string;
    name: string;
    maxSlots: number;
    rules?: Record<string, unknown>;
  }
) {
  return createContest(userId, {
    ...input,
    type: "PRIVATE"
  });
}

/*
|--------------------------------------------------------------------------
| GENERATE INVITE
|--------------------------------------------------------------------------
*/

export async function generateInviteLink(
  userId: string,
  contestId: string
) {
  const contest = await getContestById(contestId);

  if (contest.type !== "PRIVATE") {
    throw ApiError.badRequest(
      "Only private contests have invite links"
    );
  }

  if (
    contest.createdBy?.toString() !== userId
  ) {
    throw ApiError.forbidden(
      "Only the contest creator can generate invites"
    );
  }

  /*
   * If somehow inviteCode doesn't exist,
   * generate one.
   */
  if (!contest.inviteCode) {
    contest.inviteCode = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

    await contest.save();
  }

  return {
    inviteCode: contest.inviteCode
  };
}

/*
|--------------------------------------------------------------------------
| JOIN CONTEST
|--------------------------------------------------------------------------
*/

export async function joinContest(
  userId: string,
  contestId: string,
  fantasyTeamId: string
) {
  if (!Types.ObjectId.isValid(contestId)) {
    throw ApiError.badRequest("Invalid contest id");
  }

  if (!Types.ObjectId.isValid(fantasyTeamId)) {
    throw ApiError.badRequest("Invalid team id");
  }

  const contest = await Contest.findById(contestId);

  if (!contest) {
    throw ApiError.notFound("Contest not found");
  }

  const match = await Match.findById(
    contest.matchId
  );

  if (!match) {
    throw ApiError.notFound(
      "Associated match not found"
    );
  }

  /*
   * Match must not have started.
   */
  if (
    match.startTime.getTime() <= Date.now() ||
    match.status !== "UPCOMING"
  ) {
    throw ApiError.badRequest(
      "Contest joining is closed - match has started"
    );
  }

  /*
   * Contest must be OPEN.
   */
  if (contest.status !== "OPEN") {
    throw ApiError.badRequest(
      "Contest is not open for joining"
    );
  }

  /*
   * Check slots.
   */
  if (
    contest.joinedSlots >= contest.maxSlots
  ) {
    contest.status = "FULL";

    await contest.save();

    throw ApiError.badRequest(
      "Contest is full"
    );
  }

  /*
   * Team must belong to logged-in user
   * AND same match.
   */
  const team = await FantasyTeam.findOne({
    _id: fantasyTeamId,
    userId,
    matchId: contest.matchId
  });

  if (!team) {
    throw ApiError.notFound(
      "Fantasy team not found for this match"
    );
  }

  /*
   * Locked teams should not be joined.
   */
  if (team.isLocked) {
    throw ApiError.badRequest(
      "Fantasy team is locked"
    );
  }

  /*
   * Prevent duplicate entry.
   */
  const existingEntry =
    await ContestEntry.findOne({
      contestId,
      userId,
      fantasyTeamId
    });

  if (existingEntry) {
    throw ApiError.conflict(
      "This team has already joined the contest"
    );
  }

  /*
   * Create ContestEntry.
   */
  const entry = await ContestEntry.create({
    contestId,
    userId,
    fantasyTeamId,
    status: "joined"
  });

  /*
   * Increase slots.
   */
  contest.joinedSlots += 1;

  if (
    contest.joinedSlots >= contest.maxSlots
  ) {
    contest.status = "FULL";
  }

  await contest.save();

  /*
   * Create leaderboard row.
   */
  await Leaderboard.findOneAndUpdate(
    {
      contestId,
      userId,
      fantasyTeamId
    },
    {
      $setOnInsert: {
        totalPoints: 0,
        rank: 0,
        status: "live"
      }
    },
    {
      upsert: true
    }
  );

  return entry;
}

/*
|--------------------------------------------------------------------------
| JOIN PRIVATE CONTEST BY INVITE CODE
|--------------------------------------------------------------------------
*/

export async function joinContestByInviteCode(
  userId: string,
  inviteCode: string,
  fantasyTeamId: string
) {
  const contest = await Contest.findOne({
    inviteCode: inviteCode.toUpperCase()
  });

  if (!contest) {
    throw ApiError.notFound(
      "Invalid invite code"
    );
  }

  if (contest.type !== "PRIVATE") {
    throw ApiError.badRequest(
      "This is not a private contest"
    );
  }

  return joinContest(
    userId,
    contest._id.toString(),
    fantasyTeamId
  );
}