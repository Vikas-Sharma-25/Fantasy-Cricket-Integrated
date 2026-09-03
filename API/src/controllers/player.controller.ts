import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";

import * as playerService from "../services/player.service";

export const createPlayer = asyncHandler(
  async (req: Request, res: Response) => {
    const player = await playerService.createPlayer(req.body);

    return sendSuccess(
      res,
      player,
      "Player created successfully",
      201
    );
  }
);

export const listPlayers = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    const { items, total } = await playerService.listPlayers({
      role,
      search,
      page,
      limit
    });

    return sendPaginated(res, items, page, limit, total);
  }
);

export const getPlayer = asyncHandler(
  async (req: Request, res: Response) => {
    const player = await playerService.getPlayerById(
      req.params.playerId
    );

    return sendSuccess(res, player);
  }
);

export const updatePlayer = asyncHandler(
  async (req: Request, res: Response) => {
    const player = await playerService.updatePlayer(
      req.params.playerId,
      req.body
    );

    return sendSuccess(res, player, "Player updated successfully");
  }
);

export const deletePlayer = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await playerService.deletePlayer(
      req.params.playerId
    );

    return sendSuccess(res, result, "Player deleted successfully");
  }
);