import type { Player } from "./game.js";
import { getUnlockedAreas } from "../services/levelService.js";

export const DEFAULT_PLAYER_ID = "player-1";

export function makeDefaultPlayer(): Player {
  return {
    id: DEFAULT_PLAYER_ID,
    xp: 0,
    level: 1,
    coins: 0,
    outfit: "default",
    unlockedAreas: getUnlockedAreas(1),
    ownedItems: [],
  };
}
