import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import {
  sendSuccess,
  sendPaginated
} from "../utils/apiResponse";

import * as matchService from "../services/match.service";

export const createMatch = asyncHandler(
  async (req: Request, res: Response) => {
    const match = await matchService.createMatch(req.body);

    return sendSuccess(
      res,
      match,
      "Match created successfully",
      201
    );
  }
);

export const listMatches = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const status = req.query.status as string | undefined;

    const { items, total } =
      await matchService.listMatches({
        status,
        page,
        limit
      });

    return sendPaginated(
      res,
      items,
      page,
      limit,
      total
    );
  }
);

export const getMatch = asyncHandler(
  async (req: Request, res: Response) => {
    const match = await matchService.getMatchById(
      req.params.matchId
    );

    return sendSuccess(res, match);
  }
);

export const updateMatch = asyncHandler(
  async (req: Request, res: Response) => {
    const match = await matchService.updateMatch(
      req.params.matchId,
      req.body
    );

    return sendSuccess(
      res,
      match,
      "Match updated successfully"
    );
  }
);

export const deleteMatch = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await matchService.deleteMatch(
      req.params.matchId
    );

    return sendSuccess(
      res,
      result,
      "Match deleted successfully"
    );
  }
);

export const getMatchPlayers = asyncHandler(
  async (req: Request, res: Response) => {
    const players =
      await matchService.getMatchPlayers(
        req.params.matchId
      );

    return sendSuccess(res, players);
  }
);

export const getMatchLive = asyncHandler(
  async (req: Request, res: Response) => {
    const live =
      await matchService.getMatchLive(
        req.params.matchId
      );

    return sendSuccess(res, live);
  }
);