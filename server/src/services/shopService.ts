import type { Item, Player } from "../types/game.js";
import { getPlayer, savePlayer } from "./storageService.js";
import { isTiDBEnabled } from "../db/tidb.js";
import { getItems, purchaseItem as purchaseItemInDb } from "../repositories/itemRepository.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";

// Keep in sync with the items seeded in db/schema.sql (same IDs, values, and order) so in-memory and TiDB storage match.
// Array order is the shop order; TiDB stores it as items.sort_order.
// stackable: false keeps the original "own one copy" rule; farm items are stackable.
export const CATALOG: readonly Item[] = [
  // Home: plants, trees, lamps, chairs, sofas (one PNG per colour variant, see frontend/scripts/split-shop-sprites.mjs).
  // Garden (flowers, benches, fountain) and clothing items were retired; db:init removes them unless owned.
  { id: "plant-red-pot", name: "Plant (Red Pot)", type: "furniture", price: 20, asset: "plant-red-pot.png", stackable: false },
  { id: "plant-brown-pot", name: "Plant (Brown Pot)", type: "furniture", price: 20, asset: "plant-brown-pot.png", stackable: false },
  { id: "plant-blue-pot", name: "Plant (Blue Pot)", type: "furniture", price: 20, asset: "plant-blue-pot.png", stackable: false },
  { id: "plant-grey-pot", name: "Plant (Grey Pot)", type: "furniture", price: 20, asset: "plant-grey-pot.png", stackable: false },
  // Trees (potted, colour variants): sold with the plants.
  { id: "tree-red-pot", name: "Tree (Red Pot)", type: "furniture", price: 50, asset: "tree-red-pot.png", stackable: false },
  { id: "tree-brown-pot", name: "Tree (Brown Pot)", type: "furniture", price: 50, asset: "tree-brown-pot.png", stackable: false },
  { id: "tree-blue-pot", name: "Tree (Blue Pot)", type: "furniture", price: 50, asset: "tree-blue-pot.png", stackable: false },
  { id: "tree-grey-pot", name: "Tree (Grey Pot)", type: "furniture", price: 50, asset: "tree-grey-pot.png", stackable: false },
  { id: "lamp-black", name: "Black Lamp", type: "furniture", price: 50, asset: "lamp-black.png", stackable: false },
  { id: "lamp-gold", name: "Gold Lamp", type: "furniture", price: 50, asset: "lamp-gold.png", stackable: false },
  { id: "lamp-copper", name: "Copper Lamp", type: "furniture", price: 50, asset: "lamp-copper.png", stackable: false },
  { id: "lamp-grey", name: "Grey Lamp", type: "furniture", price: 50, asset: "lamp-grey.png", stackable: false },
  { id: "lamp-tan-black", name: "Tan Shade Black Lamp", type: "furniture", price: 50, asset: "lamp-tan-black.png", stackable: false },
  { id: "lamp-tan-gold", name: "Tan Shade Gold Lamp", type: "furniture", price: 50, asset: "lamp-tan-gold.png", stackable: false },
  { id: "lamp-tan-copper", name: "Tan Shade Copper Lamp", type: "furniture", price: 50, asset: "lamp-tan-copper.png", stackable: false },
  { id: "lamp-tan-grey", name: "Tan Shade Grey Lamp", type: "furniture", price: 50, asset: "lamp-tan-grey.png", stackable: false },
  { id: "chair-cream", name: "Cream Chair", type: "furniture", price: 40, asset: "chair-cream.png", stackable: false },
  { id: "chair-caramel", name: "Caramel Chair", type: "furniture", price: 40, asset: "chair-caramel.png", stackable: false },
  { id: "chair-dark-brown", name: "Dark Brown Chair", type: "furniture", price: 40, asset: "chair-dark-brown.png", stackable: false },
  { id: "chair-chestnut", name: "Chestnut Chair", type: "furniture", price: 40, asset: "chair-chestnut.png", stackable: false },
  { id: "chair-grey", name: "Grey Chair", type: "furniture", price: 40, asset: "chair-grey.png", stackable: false },
  { id: "chair-black", name: "Black Chair", type: "furniture", price: 40, asset: "chair-black.png", stackable: false },
  { id: "chair-green", name: "Green Chair", type: "furniture", price: 40, asset: "chair-green.png", stackable: false },
  { id: "chair-teal", name: "Teal Chair", type: "furniture", price: 40, asset: "chair-teal.png", stackable: false },
  { id: "chair-pink", name: "Pink Chair", type: "furniture", price: 40, asset: "chair-pink.png", stackable: false },
  { id: "sofa-beige", name: "Beige Sofa", type: "furniture", price: 100, asset: "sofa-beige.png", stackable: false },
  { id: "sofa-slate", name: "Slate Sofa", type: "furniture", price: 100, asset: "sofa-slate.png", stackable: false },
  { id: "sofa-charcoal", name: "Charcoal Sofa", type: "furniture", price: 100, asset: "sofa-charcoal.png", stackable: false },
  { id: "sofa-brown", name: "Brown Sofa", type: "furniture", price: 100, asset: "sofa-brown.png", stackable: false },
  { id: "sofa-red", name: "Red Sofa", type: "furniture", price: 100, asset: "sofa-red.png", stackable: false },
  { id: "sofa-coral", name: "Coral Sofa", type: "furniture", price: 100, asset: "sofa-coral.png", stackable: false },
  { id: "sofa-orange", name: "Orange Sofa", type: "furniture", price: 100, asset: "sofa-orange.png", stackable: false },
  { id: "sofa-green", name: "Green Sofa", type: "furniture", price: 100, asset: "sofa-green.png", stackable: false },
  { id: "sofa-teal", name: "Teal Sofa", type: "furniture", price: 100, asset: "sofa-teal.png", stackable: false },
  { id: "sofa-navy", name: "Navy Sofa", type: "furniture", price: 100, asset: "sofa-navy.png", stackable: false },
  { id: "sofa-purple", name: "Purple Sofa", type: "furniture", price: 100, asset: "sofa-purple.png", stackable: false },
  { id: "sofa-rosewood", name: "Rosewood Sofa", type: "furniture", price: 100, asset: "sofa-rosewood.png", stackable: false },
  // Pet corner upgrades (HomePage PetCorner). The cardboard box is the free default, not an item.
  { id: "pet-bowl", name: "Food Bowl", type: "furniture", price: 20, asset: "pet-bowl.png", stackable: false },
  { id: "pet-scratcher", name: "Scratching Post", type: "furniture", price: 40, asset: "pet-scratcher.png", stackable: false },
  { id: "pet-bed", name: "Cozy Cat Bed", type: "furniture", price: 60, asset: "pet-bed.png", stackable: false },
  { id: "pet-tree", name: "Cat Tree", type: "furniture", price: 120, asset: "pet-tree.png", stackable: false },
  // Wallpapers (one equipped at a time on the bedroom wall; equip state is kept by the frontend).
  // Art: frontend/public/assets/wallpapers/wallpaper_NN.png (scripts/crop-wallpapers.mjs). Default price 30.
  { id: "wallpaper-sage-pinstripe", name: "Sage Pinstripe", type: "wallpaper", price: 30, asset: "wallpaper_01.png", stackable: false },
  { id: "wallpaper-navy-stripes", name: "Navy Stripes", type: "wallpaper", price: 30, asset: "wallpaper_02.png", stackable: false },
  { id: "wallpaper-butter-stripes", name: "Butter Stripes", type: "wallpaper", price: 30, asset: "wallpaper_03.png", stackable: false },
  { id: "wallpaper-walnut-panels", name: "Walnut Panels", type: "wallpaper", price: 30, asset: "wallpaper_04.png", stackable: false },
  { id: "wallpaper-blush-roses", name: "Blush Roses", type: "wallpaper", price: 30, asset: "wallpaper_05.png", stackable: false },
  { id: "wallpaper-crimson-roses", name: "Crimson Roses", type: "wallpaper", price: 30, asset: "wallpaper_06.png", stackable: false },
  { id: "wallpaper-orange-grove", name: "Orange Grove", type: "wallpaper", price: 30, asset: "wallpaper_07.png", stackable: false },
  { id: "wallpaper-bunny-moon", name: "Bunny Moon", type: "wallpaper", price: 30, asset: "wallpaper_08.png", stackable: false },
  { id: "wallpaper-snowflake-frost", name: "Snowflake Frost", type: "wallpaper", price: 30, asset: "wallpaper_09.png", stackable: false },
  { id: "wallpaper-starry-night", name: "Starry Night", type: "wallpaper", price: 30, asset: "wallpaper_10.png", stackable: false },
  // Farm (stackable: buy as many as you like). Crops go on tilled soil, decor anywhere on the farm.
  // Art: frontend/public/assets/farm/<id>.png, cropped by frontend/scripts/split-farm-sprites.mjs.
  { id: "crop-pumpkin", name: "Pumpkin", type: "farm", price: 12, asset: "crop-pumpkin.png", stackable: true },
  { id: "crop-carrot", name: "Carrot", type: "farm", price: 5, asset: "crop-carrot.png", stackable: true },
  { id: "crop-potato", name: "Potato", type: "farm", price: 5, asset: "crop-potato.png", stackable: true },
  { id: "crop-tomato", name: "Tomato", type: "farm", price: 8, asset: "crop-tomato.png", stackable: true },
  { id: "crop-pea", name: "Peas", type: "farm", price: 8, asset: "crop-pea.png", stackable: true },
  { id: "fence-wood", name: "Wooden Fence", type: "farm", price: 10, asset: "fence-wood.png", stackable: true },
  { id: "fence-post", name: "Fence Post", type: "farm", price: 5, asset: "fence-post.png", stackable: true },
  { id: "tree-birch", name: "Birch Tree", type: "farm", price: 20, asset: "tree-birch.png", stackable: true },
  { id: "tree-stump", name: "Tree Stump", type: "farm", price: 8, asset: "tree-stump.png", stackable: true },
  { id: "chest", name: "Chest", type: "farm", price: 15, asset: "chest.png", stackable: true },
  { id: "chest-open", name: "Open Chest", type: "farm", price: 15, asset: "chest-open.png", stackable: true },
  { id: "flowers-white", name: "White Flowers", type: "farm", price: 6, asset: "flowers-white.png", stackable: true },
  { id: "flowers-red", name: "Red Tulips", type: "farm", price: 6, asset: "flowers-red.png", stackable: true },
  { id: "rock", name: "Rock", type: "farm", price: 5, asset: "rock.png", stackable: true },
  { id: "bush-clover", name: "Clover Bush", type: "farm", price: 6, asset: "bush-clover.png", stackable: true },
  { id: "haystack", name: "Haystack", type: "farm", price: 15, asset: "haystack.png", stackable: true },
  // Farm animals: each one bought walks around the farm, up to maxQuantity per player.
  // Art: frontend/public/assets/chicken/Chicken_Sprite_Sheet*.png (4x4 frames of 32px, animated by the frontend).
  { id: "chicken", name: "Chicken", type: "farm", price: 40, asset: "Chicken_Sprite_Sheet.png", stackable: true, maxQuantity: 5 },
  // Pet bird (sold under Pets, owned once): an animated budgie on a cage stand in the bedroom.
  // Art: frontend/public/assets/interior full/pets/budgie/budgie_blue.gif. Listed last to keep the seed order stable.
  { id: "pet-bird", name: "Bird", type: "furniture", price: 80, asset: "budgie_blue.gif", stackable: false },
  // Electronics (owned once): a TV playing a cooking show, shown in the bedroom.
  // Art: frontend/public/assets/interior full/TV gifs/TV_cooking_dessert.gif.
  { id: "tv-cooking", name: "TV (cooking)", type: "furniture", price: 120, asset: "TV_cooking_dessert.gif", stackable: false },
];

// Retired items someone still owns stay in TiDB (see db:init) but are no longer sold.
const CATALOG_IDS = new Set(CATALOG.map((item) => item.id));

export async function getCatalog(): Promise<Item[]> {
  return isTiDBEnabled()
    ? (await getItems()).filter((item) => CATALOG_IDS.has(item.id))
    : CATALOG.map((item) => ({ ...item }));
}

type PurchaseResult =
  | { status: "not_found" }
  | { status: "already_owned" }
  | { status: "insufficient_coins" }
  | { status: "limit_reached" }
  | { status: "player_not_found" }
  | { status: "purchased"; item: Item; player: Player };

export async function purchaseItem(itemId: string): Promise<PurchaseResult> {
  if (!CATALOG_IDS.has(itemId)) return { status: "not_found" };
  if (isTiDBEnabled()) {
    const result = await purchaseItemInDb(DEFAULT_PLAYER_ID, itemId);
    return result.ok
      ? { status: "purchased", item: result.item, player: result.player }
      : { status: result.reason };
  }
  const item = CATALOG.find((entry) => entry.id === itemId);
  if (!item) return { status: "not_found" };

  // In-memory storage is synchronous, so check-then-update cannot interleave between requests.
  const player = getPlayer();
  const owned = player.ownedItems.includes(item.id);
  if (owned && !item.stackable) return { status: "already_owned" };
  if (item.maxQuantity !== undefined && (player.itemCounts[item.id] ?? 0) >= item.maxQuantity) return { status: "limit_reached" };
  if (player.coins < item.price) return { status: "insufficient_coins" };

  const updatedPlayer: Player = {
    ...player,
    coins: player.coins - item.price,
    ownedItems: owned ? player.ownedItems : [...player.ownedItems, item.id],
    itemCounts: { ...player.itemCounts, [item.id]: (player.itemCounts[item.id] ?? 0) + 1 },
  };
  savePlayer(updatedPlayer);
  return { status: "purchased", item: { ...item }, player: updatedPlayer };
}
