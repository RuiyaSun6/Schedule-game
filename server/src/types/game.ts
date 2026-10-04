// Shared LifeQuest data contract. Keep field names identical across frontend/backend.

export type QuestCategory = "study" | "health" | "life" | "social" | "creative";
export type QuestDifficulty = "easy" | "medium" | "hard" | "boss";
export type ItemType = "furniture" | "garden" | "clothing";

export const QUEST_CATEGORIES: QuestCategory[] = ["study", "health", "life", "social", "creative"];
export const QUEST_DIFFICULTIES: QuestDifficulty[] = ["easy", "medium", "hard", "boss"];

export interface Player {
  id: string;
  level: number;
  xp: number;
  coins: number;
  outfit: string;
  unlockedAreas: string[];
  ownedItems: string[];
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  price: number;
  asset: string;
  // Only set on per-player catalog responses.
  owned?: boolean;
}

// What Gemini is allowed to decide. Rewards are NOT part of this.
export interface QuestDraft {
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface SimilarQuest {
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
}
