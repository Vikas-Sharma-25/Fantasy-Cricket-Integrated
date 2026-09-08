import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as cricketApiService from "../services/cricketApi.service";

const router = Router();

router.get("/live", asyncHandler(async (_req: Request, res: Response) => {
  const matches = await cricketApiService.getWorldLiveMatches();
  return sendSuccess(res, matches);
}));

router.get("/news", asyncHandler(async (_req: Request, res: Response) => {
  const news = await cricketApiService.getCricketNews();
  return sendSuccess(res, news);
}));

router.get("/match/:matchId/scorecard", asyncHandler(async (req: Request, res: Response) => {
  const scorecard = await cricketApiService.getMatchScorecard(req.params.matchId);
  return sendSuccess(res, scorecard);
}));

export default router;
