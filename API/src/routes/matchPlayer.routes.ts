import { Router } from "express";
import {
  createMatchPlayer,
  bulkCreateMatchPlayers,
  getAllMatchPlayers,
  getMatchPlayerById,
  updateMatchPlayer,
  deleteMatchPlayer,
} from "../controllers/matchPlayer.controller";
// import { requireAdmin, requireAuth } from "../middlewares/auth"; // agar admin-only CRUD chahiye

const router = Router();

router.post("/", createMatchPlayer);
router.post("/bulk", bulkCreateMatchPlayers);
router.get("/", getAllMatchPlayers);
router.get("/:id", getMatchPlayerById);
router.patch("/:id", updateMatchPlayer);
router.delete("/:id", deleteMatchPlayer);

export default router;