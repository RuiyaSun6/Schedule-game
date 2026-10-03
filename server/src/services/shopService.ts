import type { Item, Player } from "../types/game";
import { getPlayer, savePlayer } from "./storageService";

const CATALOG: readonly Item[] = [
  {
    id: "trail-badge",
    name: "Trail Badge",
    description: "A badge for your first adventure.",
    price: 10,
    type: "cosmetic",
  },
  {
    id: "camp-lantern",
    name: "Camp Lantern",
    description: "A warm light for your home base.",
    price: 25,
    type: "decoration",
  },
  {
    id: "star-banner",
    name: "Star Banner",
    description: "A banner to mark your achievements.",
    price: 50,
    type: "decoration",
  },
];

export function getCatalog(): Item[] {
  return CATALOG.map((item) => ({ ...item }));
}

type PurchaseResult =
  | { status: "not_found" }
  | { status: "already_owned" }
  | { status: "insufficient_coins" }
  | { status: "purchased"; item: Item; player: Player };

export function purchaseItem(itemId: string): PurchaseResult {
  const item = CATALOG.find((entry) => entry.id === itemId);
  if (!item) return { status: "not_found" };

  const player = getPlayer();
  if (player.ownedItems.includes(item.id)) return { status: "already_owned" };
  if (player.coins < item.price) return { status: "insufficient_coins" };

  const updatedPlayer: Player = {
    ...player,
    coins: player.coins - item.price,
    ownedItems: [...player.ownedItems, item.id],
  };
  savePlayer(updatedPlayer);
  return { status: "purchased", item: { ...item }, player: updatedPlayer };
}
