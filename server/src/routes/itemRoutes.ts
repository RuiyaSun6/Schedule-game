import { Router } from "express";
import { getItems } from "../controllers/shopController.js";

const router = Router();
router.get("/", getItems);

export default router;
