import { Router } from "express";
import * as supportController from "../controllers/support.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/tickets", supportController.createTicket);
router.get("/tickets", supportController.listMyTickets);
router.get("/tickets/:ticketId", supportController.getTicket);

export default router;
