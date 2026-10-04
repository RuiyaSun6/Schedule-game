import type { Request, Response } from "express";
import { QUEST_CATEGORIES, QUEST_DIFFICULTIES as DIFFICULTIES } from "../types/game.js";
import type { QuestCategory, QuestDifficulty } from "../types/game.js";
import { completeQuest, createQuest, generateQuests, listQuests } from "../services/questService.js";

export async function getAllQuests(request: Request, response: Response): Promise<void> {
  response.json(await listQuests(request.authUser!.userId));
}

export async function postQuest(request: Request, response: Response): Promise<void> {
  const body: unknown = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    response.status(400).json({ error: "Body must be an object." });
    return;
  }

  const { title, difficulty, category, estimatedMinutes } = body as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    response.status(400).json({ error: "Title must be 1–200 characters." });
    return;
  }
  if (typeof difficulty !== "string" || !DIFFICULTIES.includes(difficulty as QuestDifficulty)) {
    response.status(400).json({ error: "Difficulty must be easy, medium, hard, or boss." });
    return;
  }
  if (category !== undefined && !QUEST_CATEGORIES.includes(category as QuestCategory)) {
    response.status(400).json({ error: "Category must be study, health, life, social, or creative." });
    return;
  }
  if (
    estimatedMinutes !== undefined &&
    (!Number.isInteger(estimatedMinutes) || (estimatedMinutes as number) < 5 || (estimatedMinutes as number) > 480)
  ) {
    response.status(400).json({ error: "estimatedMinutes must be an integer from 5 to 480." });
    return;
  }

  response
    .status(201)
    .json(
      await createQuest(
        title.trim(),
        difficulty as QuestDifficulty,
        category as QuestCategory | undefined,
        estimatedMinutes as number | undefined,
        request.authUser!.userId,
      ),
    );
}

export async function postGenerateQuests(request: Request, response: Response): Promise<void> {
  const body: unknown = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    response.status(400).json({ error: "Body must be an object." });
    return;
  }

  const { text, userId } = body as Record<string, unknown>;
  if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) {
    response.status(400).json({ error: "text must be 1 to 2000 characters." });
    return;
  }
  if (userId !== undefined && (typeof userId !== "string" || !userId.trim())) {
    response.status(400).json({ error: "userId must be a nonempty string." });
    return;
  }
  if (userId !== undefined && userId !== request.authUser!.userId) {
    response.status(403).json({ error: "Cannot generate quests for another player." });
    return;
  }

  response.status(201).json(await generateQuests(text.trim(), request.authUser!.userId));
}

export async function postQuestCompletion(request: Request<{ id: string }>, response: Response): Promise<void> {
  const result = await completeQuest(request.params.id, request.authUser!.userId);
  if (result.status === "not_found") {
    response.status(404).json({ error: "Quest not found." });
    return;
  }
  if (result.status === "already_completed") {
    response.status(409).json({ error: "Quest already completed." });
    return;
  }

  response.json({ quest: result.quest, player: result.player });
}
