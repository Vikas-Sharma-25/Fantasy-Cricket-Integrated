import { Router } from "express";

import * as matchController from "../controllers/match.controller";

const router = Router();

/*
 * ADMIN / MANAGEMENT
 */

router.post(
  "/",
  matchController.createMatch
);

router.patch(
  "/:matchId",
  matchController.updateMatch
);

router.delete(
  "/:matchId",
  matchController.deleteMatch
);

/*
 * PUBLIC / USER
 */

router.get(
  "/",
  matchController.listMatches
);

router.get(
  "/:matchId/players",
  matchController.getMatchPlayers
);

router.get(
  "/:matchId/live",
  matchController.getMatchLive
);

router.get(
  "/:matchId",
  matchController.getMatch
);

export default router;