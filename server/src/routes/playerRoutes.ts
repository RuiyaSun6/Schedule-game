import { Router } from "express";
import { getCurrentPlayer } from "../controllers/playerController";

const router = Router();
router.get("/", getCurrentPlayer);

export default router;
