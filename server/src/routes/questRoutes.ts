import { Router } from "express";
import { getAllQuests, postGenerateQuests, postQuest, postQuestCompletion } from "../controllers/questController.js";

const router = Router();
router.get("/", getAllQuests);
router.post("/", postQuest);
router.post("/generate", postGenerateQuests);
router.post("/:id/complete", postQuestCompletion);

export default router;
