// Shared frontend contracts; coordinate final API fields with the backend team.
export interface Player {
  id: string;
  name?: string;
  level: number;
  xp: number;
  coins: number;
  unlockedAreas: string[];
  builtAreas?: import('./world').AreaId[];
  outfit?: string;
  ownedItems?: string[];
  /** How many of each owned item (stackable farm items can be more than 1). */
  itemCounts?: Record<string, number>;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  /** Companion line shown on completion; missing on quests created before the field existed. */
  completionLine?: string;
}

export interface GenerateQuestsResponse {
  source: 'gemini' | 'mock-fallback';
  quests: Quest[];
}

export interface Item {
  id: string;
  name: string;
  type: 'furniture' | 'garden' | 'clothing' | 'farm';
  price: number;
  asset: string;
  /** Stackable items (farm) can be bought repeatedly; others can be owned once. */
  stackable?: boolean;
}

export interface CompleteQuestResponse {
  quest: Quest;
  player: Player;
  levelUp?: boolean;
  newlyUnlocked?: string[];
  source?: 'mock-fallback';
  warning?: string;
}
