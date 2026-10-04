import { HOME_SLOTS, itemFamily, latestOwned } from '../data/shopAssets';
import { getBuilding } from '../data/buildingCatalog';
import type { LocationId, PlacedFurniture } from '../types/building';

// Where an owned furniture item currently is.
// - 'placed': the player put it in a location (home or a building) at a saved position.
// - 'home-slot': default for the newest item of a bedroom kind (lamp, plant, chair, sofa) that the
//   player has not moved or stored: it shows in that kind's fixed bedroom spot, as right after buying.
// - 'pet': pet corner items; they always live in the bedroom's pet corner.
// - 'backpack': everything else, ready to be placed anywhere it fits.
export type FurnitureState =
  | { kind: 'placed'; placement: PlacedFurniture }
  | { kind: 'home-slot'; family: string }
  | { kind: 'pet' }
  | { kind: 'backpack' };

interface Layout { placed: readonly PlacedFurniture[]; stored: readonly string[] }

export function furnitureState(itemId: string, ownedItems: readonly string[] | undefined, layout: Layout): FurnitureState {
  const family = itemFamily(itemId);
  if (family === 'pet') return { kind: 'pet' };
  const placement = layout.placed.find((p) => p.itemId === itemId);
  if (placement) return { kind: 'placed', placement };
  if (layout.stored.includes(itemId)) return { kind: 'backpack' };
  if (itemId.startsWith('reward-')) return { kind: 'backpack' };
  if ((HOME_SLOTS as readonly string[]).includes(family) && latestOwned(ownedItems, family) === itemId) return { kind: 'home-slot', family };
  return { kind: 'backpack' };
}

/** Whether an item's kind fits in a location (e.g. no sofas on the farm). */
export function fitsLocation(itemId: string, locationId: LocationId) {
  if (itemFamily(itemId) === 'world-decoration') return false;
  return getBuilding(locationId === 'home-upstairs' ? 'home' : locationId)?.interior.furnitureFamilies.includes(itemFamily(itemId)) ?? false;
}

/** A starting spot for newly placed furniture: middle of the floor, nudged so new items don't stack. */
export function defaultFurnitureSpot(scene: { width: number; height: number }, alreadyPlaced: number) {
  const step = alreadyPlaced % 5;
  return { x: scene.width * 0.3 + step * 36, y: scene.height * 0.52 + (step % 2) * 28 };
}

/** Stackable items: copies owned minus copies placed anywhere (Backpack shows "available x · owned y"). */
export function availableCopies(itemId: string, owned: number, layout: Layout) {
  return Math.max(0, owned - layout.placed.filter((p) => p.itemId === itemId).length);
}
