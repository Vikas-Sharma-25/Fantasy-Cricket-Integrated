import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTeamSchema, updateTeamSchema } from "../validators/team.validator";

const router = Router();

router.use(requireAuth);
router.post("/", validate(createTeamSchema), teamController.createTeam);
router.get("/my", teamController.getMyTeams);
router.get("/:teamId", teamController.getTeam);
router.patch("/:teamId", validate(updateTeamSchema), teamController.updateTeam);
router.delete("/:teamId", teamController.deleteTeam);

export default router;
