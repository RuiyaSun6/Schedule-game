import { Router } from "express";
import { postPurchase } from "../controllers/shopController.js";

const router = Router();
router.post("/purchase", postPurchase);

export default router;
