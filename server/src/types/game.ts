export type QuestDifficulty = "easy" | "medium" | "hard" | "boss";
export type QuestStatus = "active" | "completed";
export type ItemType = "cosmetic" | "decoration";

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ItemType;
}

export interface Player {
  id: string;
  xp: number;
  level: number;
  coins: number;
  unlockedAreas: string[];
  ownedItems: string[];
}

export interface Quest {
  id: string;
  title: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  xpReward: number;
  coinReward: number;
}
