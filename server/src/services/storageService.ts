import type { Player, Quest } from "../types/game.js";
import { DEFAULT_PLAYER_ID, makeDefaultPlayer } from "../types/defaultPlayer.js";

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

const players = new InMemoryStorage<Player>();
players.set(DEFAULT_PLAYER_ID, makeDefaultPlayer());

const quests = new InMemoryStorage<Quest>();

export function getPlayer(userId = DEFAULT_PLAYER_ID): Player {
  const player = players.get(userId);
  if (!player) throw new Error(`Player ${userId} not found`);
  return {
    ...player,
    unlockedAreas: [...player.unlockedAreas],
    ownedItems: [...player.ownedItems],
    itemCounts: { ...player.itemCounts },
  };
}

export function savePlayer(updatedPlayer: Player): void {
  players.set(updatedPlayer.id, {
    ...updatedPlayer,
    unlockedAreas: [...updatedPlayer.unlockedAreas],
    ownedItems: [...updatedPlayer.ownedItems],
    itemCounts: { ...updatedPlayer.itemCounts },
  });
}

export function getQuests(userId = DEFAULT_PLAYER_ID): Quest[] {
  return quests.values().filter((quest) => quest.userId === userId).map((quest) => ({ ...quest }));
}

export function getQuest(id: string, userId = DEFAULT_PLAYER_ID): Quest | undefined {
  const quest = quests.get(id);
  return quest?.userId === userId ? { ...quest } : undefined;
}

export function saveQuest(quest: Quest): void {
  quests.set(quest.id, { ...quest });
}
