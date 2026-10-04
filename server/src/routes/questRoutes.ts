import { Router } from "express";
import { getAllQuests, postQuest, postQuestCompletion } from "../controllers/questController.js";

const router = Router();
router.get("/", getAllQuests);
router.post("/", postQuest);
router.post("/:id/complete", postQuestCompletion);

export default router;
