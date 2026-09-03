import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);
router.get("/me/notifications", userController.getMyNotifications);

export default router;
