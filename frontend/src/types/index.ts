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
}

export interface GenerateQuestsResponse {
  source: 'gemini' | 'mock-fallback';
  quests: Quest[];
}

export interface Item {
  id: string;
  name: string;
  type: 'furniture' | 'garden' | 'clothing';
  price: number;
  asset: string;
}

export interface CompleteQuestResponse {
  quest: Quest;
  player: Player;
  levelUp?: boolean;
  newlyUnlocked?: string[];
  source?: 'mock-fallback';
  warning?: string;
}
