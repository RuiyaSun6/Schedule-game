import { randomUUID } from "node:crypto";
import type { Player, Quest, QuestCategory, QuestDifficulty } from "../types/game.js";
import { calculateLevel, getUnlockedAreas } from "./levelService.js";
import { getRewards } from "./rewardService.js";
import { getPlayer, getQuest, getQuests, savePlayer, saveQuest } from "./storageService.js";

export function listQuests(): Quest[] {
  return getQuests();
}

export function createQuest(
  title: string,
  difficulty: QuestDifficulty,
  category: QuestCategory = "life",
  estimatedMinutes = 30,
): Quest {
  const quest: Quest = {
    id: randomUUID(),
    userId: getPlayer().id,
    title,
    category,
    difficulty,
    estimatedMinutes,
    ...getRewards(difficulty),
    completed: false,
  };
  saveQuest(quest);
  return quest;
}

type CompletionResult =
  | { status: "not_found" }
  | { status: "already_completed" }
  | { status: "completed"; quest: Quest; player: Player };

export function completeQuest(id: string): CompletionResult {
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
  return { status: "completed", quest: completedQuest, player: updatedPlayer };
}
