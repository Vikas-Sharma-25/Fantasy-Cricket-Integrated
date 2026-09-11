import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Public announcements for any visitor or client
router.get("/announcements", userController.getPublicAnnouncements);

// Protected routes requiring authentication
router.use(requireAuth);
router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);
router.get("/me/notifications", userController.getMyNotifications);
router.patch("/me/notifications/read-all", userController.markAllNotificationsRead);
router.patch("/me/notifications/:id/read", userController.markNotificationRead);

export default router;
