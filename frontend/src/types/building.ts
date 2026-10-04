// World buildings and where furniture lives. Frontend-only for now (see hooks/useWorldBuildings.ts);
// the backend has no building ownership or furniture location yet.

export type BuildingId = 'home' | 'farm' | 'cafe' | 'restaurant' | 'library';
/** Every building interior is a location furniture can be placed in. */
export type LocationId = BuildingId;

/** A tiled outdoor field drawn from one background image (the Farm). Sizes are in tiles. */
export interface FieldConfig {
  src: string;
  tileSize: number;
  cols: number;
  rows: number;
  /** Tilled soil patches; crops may only be placed on these tiles. */
  tilled: readonly { col: number; row: number; cols: number; rows: number }[];
}

export interface BuildingInterior {
  /** Wall and floor colours for the simple starting interior. */
  wall: string;
  floor: string;
  caption: string;
  /** Furniture kinds (see data/shopAssets.ts itemFamily) that fit this building. */
  furnitureFamilies: readonly string[];
  /** When set, the interior is this field instead of walls and floor. */
  field?: FieldConfig;
}

export interface BuildingDefinition {
  id: BuildingId;
  name: string;
  requiredLevel: number;
  price: number;
  /** Public path of the exterior image. */
  exteriorAsset: string;
  /** Native pixel size of exteriorAsset; shown at a whole-number scale in the world. */
  exteriorSize: { width: number; height: number };
  /** True while exteriorAsset is a stand-in to be replaced with real art. */
  placeholder: boolean;
  description: string;
  interiorType: 'bedroom' | 'farm' | 'cafe' | 'restaurant' | 'library';
  interior: BuildingInterior;
}

/** A purchased building sitting in the world. x/y are scene pixels (top-left). */
export interface PlacedBuilding {
  instanceId: string;
  buildingId: BuildingId;
  x: number;
  y: number;
}

export type BuildingStatus = 'locked' | 'available' | 'not-enough-coins' | 'stored' | 'placed';

/**
 * An owned item placed inside a building. x/y are scene pixels (top-left). Regular items have at
 * most one placement; stackable items (farm) can have one per owned copy. Crops also store the
 * field tile they sit on (cell), which is authoritative because pixel positions depend on screen size.
 */
export interface PlacedFurniture {
  instanceId: string;
  itemId: string;
  locationId: LocationId;
  x: number;
  y: number;
  cell?: { col: number; row: number };
}
