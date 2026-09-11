import { Router } from "express";

import * as matchController from "../controllers/match.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";

const router = Router();

/*
 * ADMIN / MANAGEMENT
 */

router.post(
  "/",
  requireAuth,
  requireAdmin,
  matchController.createMatch
);

router.patch(
  "/:matchId",
  requireAuth,
  requireAdmin,
  matchController.updateMatch
);

router.delete(
  "/:matchId",
  requireAuth,
  requireAdmin,
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