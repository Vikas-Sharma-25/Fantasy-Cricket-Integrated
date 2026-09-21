import { Router } from "express";
import * as walletController from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", walletController.getWallet);
router.post("/add-cash", walletController.addCash);
router.post("/withdraw", walletController.withdraw);

export default router;

