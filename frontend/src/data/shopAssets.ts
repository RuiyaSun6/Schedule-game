import type { Item } from '../types';
import { SHOP_SPRITES } from './shopSprites';
import { PET_ITEM_ART } from '../components/PetCorner';
import { FARM_SPRITES, type FarmSprite } from './farmSprites';
import { WALLPAPERS, wallpaperSrc, type WallpaperTile } from './wallpapers';
import { isAnimal } from './animals';

const wallpaperTile = (id: string): WallpaperTile | undefined => WALLPAPERS[id];
/** Wallpapers are not furniture: they are equipped on the bedroom wall, one at a time. */
export const isWallpaper = (id: string) => wallpaperTile(id) !== undefined;

// Record lookups can miss: type them as possibly undefined.
const farmSprite = (id: string): FarmSprite | undefined => FARM_SPRITES[id];

// One standalone PNG per shop item (cropped by scripts/split-shop-sprites.mjs, pet art by crop-pet-sprites.mjs).
// Prices and names come from the backend catalog; this file only knows art, categories, and scene slots.
const urls = import.meta.glob('../assets/{furniture,garden,clothing}/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export interface ItemArt { src: string; width: number; height: number; }

export function getItemArt(id: string): ItemArt | undefined {
  // Farm art is served from public/assets/farm/ (cropped by scripts/split-farm-sprites.mjs).
  const wallpaper = wallpaperTile(id);
  if (wallpaper) return { src: wallpaperSrc(wallpaper), width: wallpaper.width, height: wallpaper.height };
  const farm = farmSprite(id);
  if (farm) return { src: `/assets/farm/${id}.png`, width: farm.width, height: farm.height };
  const sprite = SHOP_SPRITES[id];
  if (sprite) {
    const src = urls[`../assets/${sprite.type}/${id}.png`];
    return src ? { src, width: sprite.width, height: sprite.height } : undefined;
  }
  return PET_ITEM_ART[id];
}

/** "lamp-gold" -> "lamp", "pet-bowl" -> "pet", "crop-carrot" -> "crop", "haystack" -> "farm-decor", "fountain" -> "fountain". */
export function itemFamily(id: string): string {
  if (isWallpaper(id)) return 'wallpaper';
  // Animals walk around the Farm on their own; they are never placed like furniture.
  if (isAnimal(id)) return 'animal';
  return farmSprite(id)?.category ?? SHOP_SPRITES[id]?.family ?? (id.startsWith('pet-') ? 'pet' : id);
}

/** How many of an item the player owns (stackable farm items can be more than 1). */
export function ownedCount(player: { ownedItems?: string[]; itemCounts?: Record<string, number> }, id: string) {
  return player.itemCounts?.[id] ?? (player.ownedItems?.includes(id) ? 1 : 0);
}

// Garden and Clothing were retired: potted trees moved to Plants; garden extras and clothing are no longer sold.
export const SHOP_CATEGORIES = ['Plants', 'Seating', 'Lighting', 'Wallpaper', 'Pets', 'Farm'] as const;
export type ShopCategory = typeof SHOP_CATEGORIES[number];
const FAMILY_CATEGORY: Record<string, ShopCategory> = {
  plant: 'Plants', chair: 'Seating', sofa: 'Seating', lamp: 'Lighting', pet: 'Pets',
  tree: 'Plants',
  wallpaper: 'Wallpaper',
  crop: 'Farm', 'farm-decor': 'Farm', animal: 'Farm',
};
/** Shop tab for an item, or null for items the shop no longer sells (e.g. retired garden or clothing items). */
export function shopCategory(item: Item): ShopCategory | null {
  return FAMILY_CATEGORY[itemFamily(item.id)] ?? null;
}

// Fixed scene slots: one per family, showing the most recently bought variant.
// Pet items are not slots; PetCorner shows them together. Where each owned item actually is
// (slot, placed in a building, or Backpack) is decided by services/furnitureLocation.ts.
export const HOME_SLOTS = ['plant', 'lamp', 'chair', 'sofa'] as const;
export const GARDEN_SLOTS = ['flowers', 'tree', 'bench', 'fountain'] as const;

/** ownedItems is in purchase order (oldest first), so the last match is the newest. */
export function latestOwned(ownedItems: readonly string[] | undefined, family: string) {
  return [...(ownedItems ?? [])].reverse().find((id) => itemFamily(id) === family);
}

