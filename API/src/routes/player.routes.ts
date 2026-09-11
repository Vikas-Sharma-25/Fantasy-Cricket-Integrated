import { Router } from "express";

import * as playerController from "../controllers/player.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";

const router = Router();

router.post("/", playerController.createPlayer);
router.post("/", requireAuth, requireAdmin, playerController.createPlayer);

router.get("/", playerController.listPlayers);

router.get("/:playerId", playerController.getPlayer);

router.patch("/:playerId", playerController.updatePlayer);
router.patch("/:playerId", requireAuth, requireAdmin, playerController.updatePlayer);

router.delete("/:playerId", playerController.deletePlayer);
router.delete("/:playerId", requireAuth, requireAdmin, playerController.deletePlayer);

export default router;