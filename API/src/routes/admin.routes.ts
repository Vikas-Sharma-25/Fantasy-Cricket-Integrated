import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/dashboard", adminController.getDashboard);

router.get("/users", adminController.listUsers);
router.patch("/users/:userId/suspend", adminController.suspendUser);
router.patch("/users/:userId/restore", adminController.restoreUser);

router.post("/matches", adminController.createMatch);
router.patch("/matches/:matchId", adminController.updateMatch);
router.post("/matches/:matchId/lock-teams", adminController.lockTeamsForMatch);
router.post("/matches/:matchId/freeze-leaderboards", adminController.freezeLeaderboards);

router.post("/players", adminController.createPlayer);
router.post("/match-players", adminController.upsertMatchPlayer);

router.get("/scoring-rules", adminController.listScoringRules);
router.post("/scoring-rules", adminController.createScoringRule);

router.post("/events/ingest", adminController.ingestEvent);
router.get("/events", adminController.listPlayerEvents);
router.get("/events/:eventId", adminController.getPlayerEvent);
router.post("/events/:eventId/process", adminController.processEvent);
router.post("/events/:eventId/reverse", adminController.reverseEvent);

router.get("/contests", adminController.listAllContests);
router.patch("/contests/:contestId/status", adminController.updateContestStatus);

router.get("/support/tickets", adminController.listAllTickets);
router.patch("/support/tickets/:ticketId/reply", adminController.replyToTicket);

router.get("/audit-logs", adminController.listAuditLogs);

export default router;