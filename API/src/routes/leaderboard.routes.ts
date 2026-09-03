import { Router } from "express";
import * as leaderboardController from "../controllers/leaderboard.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Logged-in users only can view leaderboards. Remove requireAuth below
// if you want leaderboards to be publicly viewable without login.
router.use(requireAuth);

router.get("/:contestId", leaderboardController.getLeaderboard);

export default router;