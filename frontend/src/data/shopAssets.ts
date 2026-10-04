import type { Item } from '../types';
import { SHOP_SPRITES } from './shopSprites';
import { PET_ITEM_ART } from '../components/PetCorner';

// One standalone PNG per shop item (cropped by scripts/split-shop-sprites.mjs, pet art by crop-pet-sprites.mjs).
// Prices and names come from the backend catalog; this file only knows art, categories, and scene slots.
const urls = import.meta.glob('../assets/{furniture,garden,clothing}/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export interface ItemArt { src: string; width: number; height: number; }

export function getItemArt(id: string): ItemArt | undefined {
  const sprite = SHOP_SPRITES[id];
  if (sprite) {
    const src = urls[`../assets/${sprite.type}/${id}.png`];
    return src ? { src, width: sprite.width, height: sprite.height } : undefined;
  }
  return PET_ITEM_ART[id];
}

/** "lamp-gold" -> "lamp", "pet-bowl" -> "pet", "fountain" -> "fountain". */
export function itemFamily(id: string) {
  return SHOP_SPRITES[id]?.family ?? (id.startsWith('pet-') ? 'pet' : id);
}

export const SHOP_CATEGORIES = ['Plants', 'Seating', 'Lighting', 'Pets', 'Garden', 'Clothing'] as const;
export type ShopCategory = typeof SHOP_CATEGORIES[number];
const FAMILY_CATEGORY: Record<string, ShopCategory> = {
  plant: 'Plants', chair: 'Seating', sofa: 'Seating', lamp: 'Lighting', pet: 'Pets',
  flowers: 'Garden', tree: 'Garden', bench: 'Garden', fountain: 'Garden',
};
export function shopCategory(item: Item): ShopCategory {
  return FAMILY_CATEGORY[itemFamily(item.id)] ?? (item.type === 'garden' ? 'Garden' : item.type === 'clothing' ? 'Clothing' : 'Seating');
}

// Fixed scene slots: one per family, showing the most recently bought variant.
// Pet items are not slots; PetCorner shows them together.
export const HOME_SLOTS = ['plant', 'lamp', 'chair', 'sofa'] as const;
export const GARDEN_SLOTS = ['flowers', 'tree', 'bench', 'fountain'] as const;

/** ownedItems is in purchase order (oldest first), so the last match is the newest. */
export function latestOwned(ownedItems: readonly string[] | undefined, family: string) {
  return [...(ownedItems ?? [])].reverse().find((id) => itemFamily(id) === family);
}

/** True when the item is currently shown in a scene (its slot's newest variant, or any pet item). */
export function isDisplayed(ownedItems: readonly string[] | undefined, id: string) {
  const family = itemFamily(id);
  if (family === 'pet') return true;
  const slotted = (HOME_SLOTS as readonly string[]).includes(family) || (GARDEN_SLOTS as readonly string[]).includes(family);
  return slotted && latestOwned(ownedItems, family) === id;
}
