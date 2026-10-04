// Shared LifeQuest data contract. Keep field names identical across frontend/backend.

export type QuestCategory = "study" | "health" | "life" | "social" | "creative";
export type QuestDifficulty = "easy" | "medium" | "hard" | "boss";
export type ItemType = "furniture" | "garden" | "clothing" | "farm";

export const QUEST_CATEGORIES: QuestCategory[] = ["study", "health", "life", "social", "creative"];
export const QUEST_DIFFICULTIES: QuestDifficulty[] = ["easy", "medium", "hard", "boss"];

export interface Player {
  id: string;
  level: number;
  xp: number;
  coins: number;
  outfit: string;
  unlockedAreas: string[];
  // Distinct owned item IDs, oldest purchase first (unchanged contract).
  ownedItems: string[];
  // How many of each owned item: 1 for regular items, 1+ for stackable ones.
  itemCounts: Record<string, number>;
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
  // Companion line shown when the quest is completed. Generated with the quest; may be missing on old quests.
  completionLine?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  price: number;
  asset: string;
  // Stackable items (farm crops and decor) can be bought many times; each purchase adds one.
  // Regular items can be owned once.
  stackable: boolean;
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
  // Always set after validation (template fallback when Gemini omits it).
  completionLine: string;
}

export interface SimilarQuest {
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
}
