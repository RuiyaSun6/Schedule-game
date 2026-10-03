import { Router } from "express";
import { postPurchase } from "../controllers/shopController";

const router = Router();
router.post("/purchase", postPurchase);

export default router;
