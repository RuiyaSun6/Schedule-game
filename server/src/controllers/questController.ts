import type { Request, Response } from "express";
import type { QuestDifficulty } from "../types/game";
import { completeQuest, createQuest, listQuests } from "../services/questService";

const DIFFICULTIES: QuestDifficulty[] = ["easy", "medium", "hard", "boss"];

export function getAllQuests(_request: Request, response: Response): void {
  response.json(listQuests());
}

export function postQuest(request: Request, response: Response): void {
  const body: unknown = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    response.status(400).json({ error: "Body must be an object." });
    return;
  }

  const { title, difficulty } = body as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    response.status(400).json({ error: "Title must be 1–200 characters." });
    return;
  }
  if (typeof difficulty !== "string" || !DIFFICULTIES.includes(difficulty as QuestDifficulty)) {
    response.status(400).json({ error: "Difficulty must be easy, medium, hard, or boss." });
    return;
  }

  response.status(201).json(createQuest(title.trim(), difficulty as QuestDifficulty));
}

export function postQuestCompletion(request: Request<{ id: string }>, response: Response): void {
  const result = completeQuest(request.params.id);
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
