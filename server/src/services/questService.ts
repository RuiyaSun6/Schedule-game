import { randomUUID } from "node:crypto";
import type { Player, Quest, QuestCategory, QuestDifficulty } from "../types/game.js";
import { calculateLevel, getUnlockedAreas } from "./levelService.js";
import { getRewards } from "./rewardService.js";
import { generateQuestsFromText } from "./geminiService.js";
import { getPlayer, getQuest, getQuests, savePlayer, saveQuest } from "./storageService.js";
import { isTiDBEnabled } from "../db/tidb.js";
import { getPlayer as getPlayerFromDb } from "../repositories/playerRepository.js";
import {
  completeQuest as completeQuestInDb,
  createQuests,
  getQuestsByUser,
} from "../repositories/questRepository.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";
import { findSimilarCompletedQuests, rememberCompletedQuest } from "./questMemoryService.js";

export async function listQuests(): Promise<Quest[]> {
  return isTiDBEnabled() ? getQuestsByUser(DEFAULT_PLAYER_ID) : getQuests();
}

function makeQuest(
  userId: string,
  title: string,
  difficulty: QuestDifficulty,
  category: QuestCategory = "life",
  estimatedMinutes = 30,
  schedule?: Pick<Quest, "scheduledDate" | "startTime" | "endTime">,
): Quest {
  return {
    id: randomUUID(),
    userId,
    title,
    category,
    difficulty,
    estimatedMinutes,
    ...getRewards(difficulty),
    completed: false,
    ...schedule,
  };
}

export async function createQuest(
  title: string,
  difficulty: QuestDifficulty,
  category: QuestCategory = "life",
  estimatedMinutes = 30,
): Promise<Quest> {
  const quest = makeQuest(DEFAULT_PLAYER_ID, title, difficulty, category, estimatedMinutes);
  if (isTiDBEnabled()) {
    await createQuests([quest]);
    return quest;
  }
  saveQuest(quest);
  return quest;
}

export async function generateQuests(text: string): Promise<{ source: "gemini" | "mock-fallback"; quests: Quest[] }> {
  const player = isTiDBEnabled() ? await getPlayerFromDb(DEFAULT_PLAYER_ID) : getPlayer();
  if (!player) throw new Error("Default player is missing");
  const similar = await findSimilarCompletedQuests(player.id, text);
  const { source, quests: drafts } = await generateQuestsFromText(player, text, similar);
  const quests = drafts.map((draft) =>
    makeQuest(player.id, draft.title, draft.difficulty, draft.category, draft.estimatedMinutes, {
      scheduledDate: draft.scheduledDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
    }),
  );
  if (isTiDBEnabled()) await createQuests(quests);
  else quests.forEach(saveQuest);
  return { source, quests };
}

type CompletionResult =
  | { status: "not_found" }
  | { status: "already_completed" }
  | { status: "completed"; quest: Quest; player: Player };

export async function completeQuest(id: string): Promise<CompletionResult> {
  if (isTiDBEnabled()) {
    const result = await completeQuestInDb(id, calculateLevel, DEFAULT_PLAYER_ID);
    if (!result) return { status: "not_found" };
    if (result.alreadyCompleted) return { status: "already_completed" };
    void rememberCompletedQuest(result.quest);
    return { status: "completed", quest: result.quest, player: result.player };
  }
  const quest = getQuest(id);
  if (!quest) return { status: "not_found" };
  if (quest.completed) return { status: "already_completed" };

  const currentPlayer = getPlayer();
  const xp = currentPlayer.xp + quest.xpReward;
  const level = calculateLevel(xp);
  const updatedPlayer: Player = {
    ...currentPlayer,
    xp,
    level,
    coins: currentPlayer.coins + quest.coinReward,
    unlockedAreas: getUnlockedAreas(level),
  };
  const completedQuest: Quest = { ...quest, completed: true };

  saveQuest(completedQuest);
  savePlayer(updatedPlayer);
  void rememberCompletedQuest(completedQuest);
  return { status: "completed", quest: completedQuest, player: updatedPlayer };
}
