import { Router } from "express";
import { getItems } from "../controllers/shopController";

const router = Router();
router.get("/", getItems);

export default router;
