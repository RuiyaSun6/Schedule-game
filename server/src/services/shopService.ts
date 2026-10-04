import type { Item, Player } from "../types/game.js";
import { getPlayer, savePlayer } from "./storageService.js";
import { isTiDBEnabled } from "../db/tidb.js";
import { getItems, purchaseItem as purchaseItemInDb } from "../repositories/itemRepository.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";

// Keep in sync with the items seeded in db/schema.sql (same IDs, values, and order) so in-memory and TiDB storage match.
// Array order is the shop order; TiDB stores it as items.sort_order.
export const CATALOG: readonly Item[] = [
  // Home: plants, lamps, chairs, sofas (one PNG per colour variant, see frontend/scripts/split-shop-sprites.mjs).
  { id: "plant-red-pot", name: "Plant (Red Pot)", type: "furniture", price: 20, asset: "plant-red-pot.png" },
  { id: "plant-brown-pot", name: "Plant (Brown Pot)", type: "furniture", price: 20, asset: "plant-brown-pot.png" },
  { id: "plant-blue-pot", name: "Plant (Blue Pot)", type: "furniture", price: 20, asset: "plant-blue-pot.png" },
  { id: "plant-grey-pot", name: "Plant (Grey Pot)", type: "furniture", price: 20, asset: "plant-grey-pot.png" },
  { id: "lamp-black", name: "Black Lamp", type: "furniture", price: 50, asset: "lamp-black.png" },
  { id: "lamp-gold", name: "Gold Lamp", type: "furniture", price: 50, asset: "lamp-gold.png" },
  { id: "lamp-copper", name: "Copper Lamp", type: "furniture", price: 50, asset: "lamp-copper.png" },
  { id: "lamp-grey", name: "Grey Lamp", type: "furniture", price: 50, asset: "lamp-grey.png" },
  { id: "lamp-tan-black", name: "Tan Shade Black Lamp", type: "furniture", price: 50, asset: "lamp-tan-black.png" },
  { id: "lamp-tan-gold", name: "Tan Shade Gold Lamp", type: "furniture", price: 50, asset: "lamp-tan-gold.png" },
  { id: "lamp-tan-copper", name: "Tan Shade Copper Lamp", type: "furniture", price: 50, asset: "lamp-tan-copper.png" },
  { id: "lamp-tan-grey", name: "Tan Shade Grey Lamp", type: "furniture", price: 50, asset: "lamp-tan-grey.png" },
  { id: "chair-cream", name: "Cream Chair", type: "furniture", price: 40, asset: "chair-cream.png" },
  { id: "chair-caramel", name: "Caramel Chair", type: "furniture", price: 40, asset: "chair-caramel.png" },
  { id: "chair-dark-brown", name: "Dark Brown Chair", type: "furniture", price: 40, asset: "chair-dark-brown.png" },
  { id: "chair-chestnut", name: "Chestnut Chair", type: "furniture", price: 40, asset: "chair-chestnut.png" },
  { id: "chair-grey", name: "Grey Chair", type: "furniture", price: 40, asset: "chair-grey.png" },
  { id: "chair-black", name: "Black Chair", type: "furniture", price: 40, asset: "chair-black.png" },
  { id: "chair-green", name: "Green Chair", type: "furniture", price: 40, asset: "chair-green.png" },
  { id: "chair-teal", name: "Teal Chair", type: "furniture", price: 40, asset: "chair-teal.png" },
  { id: "chair-pink", name: "Pink Chair", type: "furniture", price: 40, asset: "chair-pink.png" },
  { id: "sofa-beige", name: "Beige Sofa", type: "furniture", price: 100, asset: "sofa-beige.png" },
  { id: "sofa-slate", name: "Slate Sofa", type: "furniture", price: 100, asset: "sofa-slate.png" },
  { id: "sofa-charcoal", name: "Charcoal Sofa", type: "furniture", price: 100, asset: "sofa-charcoal.png" },
  { id: "sofa-brown", name: "Brown Sofa", type: "furniture", price: 100, asset: "sofa-brown.png" },
  { id: "sofa-red", name: "Red Sofa", type: "furniture", price: 100, asset: "sofa-red.png" },
  { id: "sofa-coral", name: "Coral Sofa", type: "furniture", price: 100, asset: "sofa-coral.png" },
  { id: "sofa-orange", name: "Orange Sofa", type: "furniture", price: 100, asset: "sofa-orange.png" },
  { id: "sofa-green", name: "Green Sofa", type: "furniture", price: 100, asset: "sofa-green.png" },
  { id: "sofa-teal", name: "Teal Sofa", type: "furniture", price: 100, asset: "sofa-teal.png" },
  { id: "sofa-navy", name: "Navy Sofa", type: "furniture", price: 100, asset: "sofa-navy.png" },
  { id: "sofa-purple", name: "Purple Sofa", type: "furniture", price: 100, asset: "sofa-purple.png" },
  { id: "sofa-rosewood", name: "Rosewood Sofa", type: "furniture", price: 100, asset: "sofa-rosewood.png" },
  // Pet corner upgrades (HomePage PetCorner). The cardboard box is the free default, not an item.
  { id: "pet-bowl", name: "Food Bowl", type: "furniture", price: 20, asset: "pet-bowl.png" },
  { id: "pet-scratcher", name: "Scratching Post", type: "furniture", price: 40, asset: "pet-scratcher.png" },
  { id: "pet-bed", name: "Cozy Cat Bed", type: "furniture", price: 60, asset: "pet-bed.png" },
  { id: "pet-tree", name: "Cat Tree", type: "furniture", price: 120, asset: "pet-tree.png" },
  // Garden. Fountain has no artwork yet.
  { id: "flowers-red-pot", name: "Flowers (Red Pot)", type: "garden", price: 30, asset: "flowers-red-pot.png" },
  { id: "flowers-brown-pot", name: "Flowers (Brown Pot)", type: "garden", price: 30, asset: "flowers-brown-pot.png" },
  { id: "flowers-blue-pot", name: "Flowers (Blue Pot)", type: "garden", price: 30, asset: "flowers-blue-pot.png" },
  { id: "tree-red-pot", name: "Tree (Red Pot)", type: "garden", price: 50, asset: "tree-red-pot.png" },
  { id: "tree-brown-pot", name: "Tree (Brown Pot)", type: "garden", price: 50, asset: "tree-brown-pot.png" },
  { id: "tree-blue-pot", name: "Tree (Blue Pot)", type: "garden", price: 50, asset: "tree-blue-pot.png" },
  { id: "tree-grey-pot", name: "Tree (Grey Pot)", type: "garden", price: 50, asset: "tree-grey-pot.png" },
  { id: "bench-cream", name: "Cream Bench", type: "garden", price: 80, asset: "bench-cream.png" },
  { id: "bench-caramel", name: "Caramel Bench", type: "garden", price: 80, asset: "bench-caramel.png" },
  { id: "bench-dark-brown", name: "Dark Brown Bench", type: "garden", price: 80, asset: "bench-dark-brown.png" },
  { id: "bench-chestnut", name: "Chestnut Bench", type: "garden", price: 80, asset: "bench-chestnut.png" },
  { id: "bench-grey", name: "Grey Bench", type: "garden", price: 80, asset: "bench-grey.png" },
  { id: "bench-black", name: "Black Bench", type: "garden", price: 80, asset: "bench-black.png" },
  { id: "bench-green", name: "Green Bench", type: "garden", price: 80, asset: "bench-green.png" },
  { id: "bench-teal", name: "Teal Bench", type: "garden", price: 80, asset: "bench-teal.png" },
  { id: "bench-pink", name: "Pink Bench", type: "garden", price: 80, asset: "bench-pink.png" },
  { id: "fountain", name: "Fountain", type: "garden", price: 150, asset: "fountain.png" },
  // Clothing (no artwork yet).
  { id: "hat", name: "Hat", type: "clothing", price: 40, asset: "player-hat.png" },
  { id: "hoodie", name: "Hoodie", type: "clothing", price: 60, asset: "player-hoodie.png" },
  { id: "sneakers", name: "Sneakers", type: "clothing", price: 80, asset: "player-sneakers.png" },
];

export async function getCatalog(): Promise<Item[]> {
  return isTiDBEnabled() ? getItems() : CATALOG.map((item) => ({ ...item }));
}

type PurchaseResult =
  | { status: "not_found" }
  | { status: "already_owned" }
  | { status: "insufficient_coins" }
  | { status: "player_not_found" }
  | { status: "purchased"; item: Item; player: Player };

export async function purchaseItem(itemId: string): Promise<PurchaseResult> {
  if (isTiDBEnabled()) {
    const result = await purchaseItemInDb(DEFAULT_PLAYER_ID, itemId);
    return result.ok
      ? { status: "purchased", item: result.item, player: result.player }
      : { status: result.reason };
  }
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
