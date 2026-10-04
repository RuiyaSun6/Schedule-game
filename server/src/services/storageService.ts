import type { Player, Quest } from "../types/game.js";
import { getUnlockedAreas } from "./levelService.js";

// Process-local storage for MVP game state. Data resets when the server restarts.
export class InMemoryStorage<T> {
  private readonly records = new Map<string, T>();

  get(id: string): T | undefined {
    return this.records.get(id);
  }

  set(id: string, value: T): void {
    this.records.set(id, value);
  }

  delete(id: string): boolean {
    return this.records.delete(id);
  }

  values(): T[] {
    return [...this.records.values()];
  }
}

let player: Player = {
  id: "player-1",
  xp: 0,
  level: 1,
  coins: 0,
  outfit: "default",
  unlockedAreas: getUnlockedAreas(1),
  ownedItems: [],
};

const quests = new InMemoryStorage<Quest>();

export function getPlayer(): Player {
  return {
    ...player,
    unlockedAreas: [...player.unlockedAreas],
    ownedItems: [...player.ownedItems],
  };
}

export function savePlayer(updatedPlayer: Player): void {
  player = {
    ...updatedPlayer,
    unlockedAreas: [...updatedPlayer.unlockedAreas],
    ownedItems: [...updatedPlayer.ownedItems],
  };
}

export function getQuests(): Quest[] {
  return quests.values().map((quest) => ({ ...quest }));
}

export function getQuest(id: string): Quest | undefined {
  const quest = quests.get(id);
  return quest ? { ...quest } : undefined;
}

export function saveQuest(quest: Quest): void {
  quests.set(quest.id, { ...quest });
}
