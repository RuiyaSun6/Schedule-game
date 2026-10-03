import { randomUUID } from "node:crypto";
import type { Player, Quest, QuestDifficulty } from "../types/game";
import { calculateLevel, getUnlockedAreas } from "./levelService";
import { getRewards } from "./rewardService";
import { getPlayer, getQuest, getQuests, savePlayer, saveQuest } from "./storageService";

export function listQuests(): Quest[] {
  return getQuests();
}

export function createQuest(title: string, difficulty: QuestDifficulty): Quest {
  const quest: Quest = {
    id: randomUUID(),
    title,
    difficulty,
    status: "active",
    ...getRewards(difficulty),
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
  if (quest.status === "completed") return { status: "already_completed" };

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
  const completedQuest: Quest = { ...quest, status: "completed" };

  saveQuest(completedQuest);
  savePlayer(updatedPlayer);
  return { status: "completed", quest: completedQuest, player: updatedPlayer };
}
