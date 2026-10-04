import { Router } from "express";
import { postPurchase } from "../controllers/shopController.js";

const router = Router();
router.post("/purchase", postPurchase);
// Same handler; /buy is the name used by newer clients.
router.post("/buy", postPurchase);

export default router;
