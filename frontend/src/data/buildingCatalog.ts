import type { BuildingDefinition, BuildingId } from '../types/building';
import { FARM_BACKGROUND } from './farmSprites';

// Central building configuration: prices, unlock levels, art, and interiors. Change balance here only.
// Exterior art: home.png (existing), farm.png (cropped from Tiny Wonder Farm by
// scripts/crop-building-sprites.mjs). Café, Restaurant, and Library use transparent PNG exteriors.
const ROOM_FURNITURE = ['plant', 'lamp', 'chair', 'sofa', 'flowers', 'tree', 'bench', 'fountain'] as const;

export const BUILDINGS: readonly BuildingDefinition[] = [
  {
    id: 'home', name: 'Home', requiredLevel: 1, price: 0,
    exteriorAsset: '/assets/exterior/home.png', exteriorSize: { width: 96, height: 128 }, placeholder: false,
    description: 'Your first little space. Always here, always free.',
    upgrades: [{ level: 2, price: 500, name: 'Second Floor', description: 'Add an empty second-floor room for furniture and decoration.' }],
    interiorType: 'bedroom',
    interior: { wall: '#f0e6d1', floor: '#dcc29e', caption: 'HOME · YOUR FIRST LITTLE SPACE', furnitureFamilies: ROOM_FURNITURE },
  },
  {
    id: 'farm', name: 'Farm', requiredLevel: 2, price: 50,
    exteriorAsset: '/assets/buildings/farm.png', exteriorSize: { width: 81, height: 92 }, placeholder: false,
    description: 'A cozy farmhouse for plants, pots, and a slower pace.',
    upgrades: [{ level: 2, price: 400, name: 'Expanded Farm', description: 'Extend the grass field with more space for plants and decorations.', interiorWidthMultiplier: 1.5 }],
    interiorType: 'farm',
    // Outdoor field: grass with a tilled patch (public/assets/farm/farm-background.png). Farm items
    // (crop, farm-decor) only fit here; crops snap to the tilled tiles.
    interior: {
      wall: '#a5c543', floor: '#a5c543', caption: 'FARM · ROOM FOR GROWING THINGS',
      furnitureFamilies: ['crop', 'farm-decor', 'plant', 'flowers', 'tree', 'bench', 'fountain', 'chair'],
      field: FARM_BACKGROUND,
    },
  },
  {
    id: 'cafe', name: 'Café', requiredLevel: 3, price: 80,
    exteriorAsset: '/assets/buildings/cafe.png', exteriorSize: { width: 80, height: 92 }, placeholder: false,
    description: 'A little café to fill with chairs, lamps, and greenery.',
    upgrades: [{ level: 2, price: 600, name: 'Expanded Café', description: 'Add more usable floor space for seating and decorations.', interiorWidthMultiplier: 1.5 }],
    interiorType: 'cafe',
    interior: { wall: '#f3e3c8', floor: '#c8a27c', caption: 'CAFÉ · WARM DRINKS, WARM LIGHT', furnitureFamilies: ['chair', 'sofa', 'lamp', 'plant', 'flowers'] },
  },
  {
    id: 'restaurant', name: 'Restaurant', requiredLevel: 4, price: 120,
    exteriorAsset: '/assets/buildings/restaurant.png', exteriorSize: { width: 80, height: 92 }, placeholder: false,
    description: 'An empty dining room waiting for its first tables and lamps.',
    upgrades: [{ level: 2, price: 800, name: 'Expanded Restaurant', description: 'Expand the dining room for more furniture and decorations.', interiorWidthMultiplier: 1.5 }],
    interiorType: 'restaurant',
    interior: { wall: '#ecd6c2', floor: '#9e6f50', caption: 'RESTAURANT · A TABLE FOR EVERYONE', furnitureFamilies: ['chair', 'sofa', 'lamp', 'plant', 'flowers'] },
  },
  {
    id: 'library', name: 'Library', requiredLevel: 5, price: 150,
    exteriorAsset: '/assets/buildings/library.png', exteriorSize: { width: 80, height: 92 }, placeholder: false,
    description: 'Quiet shelves of possibility. Add chairs, lamps, and plants.',
    upgrades: [{ level: 2, price: 700, name: 'Expanded Library', description: 'Extend the reading room with more decoration space.', interiorWidthMultiplier: 1.5 }],
    interiorType: 'library',
    interior: { wall: '#d8dccb', floor: '#b79a74', caption: 'LIBRARY · A QUIET PLACE TO THINK', furnitureFamilies: ['chair', 'sofa', 'lamp', 'plant'] },
  },
];

/** Buildings sold in the Building Shop (everything except the free Home). */
export const SHOP_BUILDINGS = BUILDINGS.filter((building) => building.id !== 'home');

export function getBuilding(id: string | undefined): BuildingDefinition | undefined {
  return BUILDINGS.find((building) => building.id === id);
}

/** Route of a building's interior. Home keeps its existing bedroom route. */
export function buildingRoute(id: BuildingId) {
  return id === 'home' ? '/home' : `/building/${id}`;
}

/** Exterior images are drawn at this whole-number scale in the world. */
export const WORLD_BUILDING_SCALE = 2;

export function nextBuildingUpgrade(id: BuildingId, level: number) {
  return getBuilding(id)?.upgrades.find((upgrade) => upgrade.level === level + 1);
}

export function buildingExterior(id: BuildingId, level: number) {
  const building = getBuilding(id)!;
  return [...building.upgrades].reverse().find((upgrade) => upgrade.level <= level && upgrade.exteriorAsset)?.exteriorAsset ?? building.exteriorAsset;
}

export function buildingInteriorWidth(id: BuildingId, level: number) {
  return [...getBuilding(id)!.upgrades].reverse().find((upgrade) => upgrade.level <= level && upgrade.interiorWidthMultiplier)?.interiorWidthMultiplier ?? 1;
}
