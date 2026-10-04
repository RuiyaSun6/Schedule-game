import type { QuestDifficulty } from "../types/game.js";

const REWARDS: Record<QuestDifficulty, { xpReward: number; coinReward: number }> = {
  easy: { xpReward: 20, coinReward: 10 },
  medium: { xpReward: 50, coinReward: 25 },
  hard: { xpReward: 100, coinReward: 50 },
  boss: { xpReward: 200, coinReward: 100 },
};

export function getRewards(difficulty: QuestDifficulty) {
  return { ...REWARDS[difficulty] };
}
