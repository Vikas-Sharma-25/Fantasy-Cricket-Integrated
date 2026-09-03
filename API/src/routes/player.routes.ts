import { Router } from "express";

import * as playerController from "../controllers/player.controller";

const router = Router();

router.post("/", playerController.createPlayer);

router.get("/", playerController.listPlayers);

router.get("/:playerId", playerController.getPlayer);

router.patch("/:playerId", playerController.updatePlayer);

router.delete("/:playerId", playerController.deletePlayer);

export default router;