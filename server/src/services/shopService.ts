import type { Item, Player } from "../types/game.js";
import { getPlayer, savePlayer } from "./storageService.js";

// Keep in sync with the items seeded in db/schema.sql so in-memory and TiDB storage match.
const CATALOG: readonly Item[] = [
  { id: "plant", name: "Plant", type: "furniture", price: 20, asset: "plant.png" },
  { id: "chair", name: "Chair", type: "furniture", price: 40, asset: "chair.png" },
  { id: "lamp", name: "Lamp", type: "furniture", price: 50, asset: "lamp.png" },
  { id: "sofa", name: "Sofa", type: "furniture", price: 100, asset: "sofa.png" },
  { id: "flowers", name: "Flowers", type: "garden", price: 30, asset: "flowers.png" },
  { id: "tree", name: "Tree", type: "garden", price: 50, asset: "tree.png" },
  { id: "bench", name: "Bench", type: "garden", price: 80, asset: "bench.png" },
  { id: "fountain", name: "Fountain", type: "garden", price: 150, asset: "fountain.png" },
  { id: "hat", name: "Hat", type: "clothing", price: 40, asset: "player-hat.png" },
  { id: "hoodie", name: "Hoodie", type: "clothing", price: 60, asset: "player-hoodie.png" },
  { id: "sneakers", name: "Sneakers", type: "clothing", price: 80, asset: "player-sneakers.png" },
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
