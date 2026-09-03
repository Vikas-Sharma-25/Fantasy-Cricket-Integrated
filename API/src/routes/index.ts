import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import matchRoutes from "./match.routes";
import matchPlayerRoutes from "./matchPlayer.routes";
import teamRoutes from "./team.routes";
import contestRoutes from "./contest.routes";
import leaderboardRoutes from "./leaderboard.routes";
import supportRoutes from "./support.routes";
import adminRoutes from "./admin.routes";
import playerRoutes from "./player.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/matches", matchRoutes);
router.use("/match-players", matchPlayerRoutes);
router.use("/teams", teamRoutes);
router.use("/contests", contestRoutes);
router.use("/leaderboards", leaderboardRoutes);
router.use("/support", supportRoutes);
router.use("/admin", adminRoutes);
router.use("/players", playerRoutes);

export default router;