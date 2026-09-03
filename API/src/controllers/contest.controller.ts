import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";

import {
  sendSuccess,
  sendPaginated
} from "../utils/apiResponse";

import { ApiError } from "../utils/apiError";

import * as contestService from "../services/contest.service";

/*
|--------------------------------------------------------------------------
| CREATE CONTEST
|--------------------------------------------------------------------------
*/

export const createContest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const contest =
      await contestService.createContest(
        req.user.userId,
        req.body
      );

    return sendSuccess(
      res,
      contest,
      "Contest created successfully",
      201
    );
  }
);

/*
|--------------------------------------------------------------------------
| GET ALL CONTESTS
|--------------------------------------------------------------------------
*/

export const listContests = asyncHandler(
  async (req: Request, res: Response) => {
    const matchId =
      req.query.matchId as string | undefined;

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 20;

    const {
      items,
      total
    } = await contestService.listContests(
      matchId,
      page,
      limit
    );

    return sendPaginated(
      res,
      items,
      page,
      limit,
      total
    );
  }
);

/*
|--------------------------------------------------------------------------
| GET MY (JOINED) CONTESTS
|--------------------------------------------------------------------------
*/

export const getMyContests = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const matchId =
      req.query.matchId as string | undefined;

    const contests =
      await contestService.getMyContests(
        req.user.userId,
        matchId
      );

    return sendSuccess(
      res,
      contests
    );
  }
);

/*
|--------------------------------------------------------------------------
| GET SINGLE CONTEST
|--------------------------------------------------------------------------
*/

export const getContest = asyncHandler(
  async (req: Request, res: Response) => {
    const contest =
      await contestService.getContestById(
        req.params.contestId
      );

    return sendSuccess(
      res,
      contest
    );
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE CONTEST
|--------------------------------------------------------------------------
*/

export const updateContest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const contest =
      await contestService.updateContest(
        req.user.userId,
        req.params.contestId,
        req.body
      );

    return sendSuccess(
      res,
      contest,
      "Contest updated successfully"
    );
  }
);

/*
|--------------------------------------------------------------------------
| DELETE CONTEST
|--------------------------------------------------------------------------
*/

export const deleteContest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const result =
      await contestService.deleteContest(
        req.user.userId,
        req.params.contestId
      );

    return sendSuccess(
      res,
      result,
      "Contest deleted successfully"
    );
  }
);

/*
|--------------------------------------------------------------------------
| JOIN CONTEST
|--------------------------------------------------------------------------
*/

export const joinContest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const entry =
      await contestService.joinContest(
        req.user.userId,
        req.params.contestId,
        req.body.fantasyTeamId
      );

    return sendSuccess(
      res,
      entry,
      "Joined contest successfully",
      201
    );
  }
);

/*
|--------------------------------------------------------------------------
| CREATE PRIVATE CONTEST
|--------------------------------------------------------------------------
*/

export const createPrivateContest =
  asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const contest =
        await contestService.createPrivateContest(
          req.user.userId,
          req.body
        );

      return sendSuccess(
        res,
        contest,
        "Private contest created",
        201
      );
    }
  );

/*
|--------------------------------------------------------------------------
| GENERATE INVITE
|--------------------------------------------------------------------------
*/

export const generateInvite =
  asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result =
        await contestService.generateInviteLink(
          req.user.userId,
          req.params.contestId
        );

      return sendSuccess(
        res,
        result
      );
    }
  );

/*
|--------------------------------------------------------------------------
| JOIN BY INVITE CODE
|--------------------------------------------------------------------------
*/

export const joinByInviteCode =
  asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const {
        inviteCode,
        fantasyTeamId
      } = req.body;

      const entry =
        await contestService.joinContestByInviteCode(
          req.user.userId,
          inviteCode,
          fantasyTeamId
        );

      return sendSuccess(
        res,
        entry,
        "Joined private contest successfully",
        201
      );
    }
  );