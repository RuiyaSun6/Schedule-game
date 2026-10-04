import type { Item } from '../types';
export interface SpriteArtwork { width: number; height: number; crop: string; layers?: string[]; }
export type FurnitureCategory = 'Lighting' | 'Plants' | 'Seating' | 'Tables' | 'Beds' | 'Storage' | 'Rugs';
export interface FurnitureVariant extends Item { category: FurnitureCategory; variant: string; color?: string; artwork: SpriteArtwork; }
const pack = '/assets/interior%20full/';
function sprite(id: string, name: string, category: FurnitureCategory, variant: string, price: number, file: string, width: number, height: number, crop: string, layers?: string[]): FurnitureVariant {
  return { id: `demo-${id}`, name, color: variant, type: 'furniture', category, variant, price, asset: `${pack}${file}`, artwork: { width, height, crop, layers } };
}
// Curated source rectangles from inspected sheets. Never render a full atlas as an item.
export const furnitureVariants: FurnitureVariant[] = [
  sprite('plant-leafy', 'Leafy Plant · Brown Pot', 'Plants', 'brown pot', 25, 'furniture/decorations.png', 960, 624, '0 0 16 32'),
  sprite('plant-tan-pot', 'Leafy Plant · Tan Pot', 'Plants', 'tan pot', 30, 'furniture/decorations.png', 960, 624, '16 0 16 32'),
  sprite('plant-succulent', 'Small Succulent', 'Plants', 'compact green', 20, 'furniture/decorations.png', 960, 624, '96 32 16 32'),
  sprite('plant-flowers', 'Pink Flower Pot', 'Plants', 'pink flowers', 25, 'furniture/decorations.png', 960, 624, '0 64 16 32'),
  sprite('chair-cream', 'Cream Wooden Chair', 'Seating', 'cream', 30, 'furniture/chairs.png', 768, 208, '0 0 16 32'),
  sprite('chair-brown', 'Brown Wooden Chair', 'Seating', 'brown', 30, 'furniture/chairs.png', 768, 208, '128 0 16 32'),
  sprite('chair-green', 'Green Wooden Chair', 'Seating', 'green', 35, 'furniture/chairs.png', 768, 208, '448 0 16 32'),
  sprite('chair-rose', 'Rose Wooden Chair', 'Seating', 'rose', 35, 'furniture/chairs.png', 768, 208, '576 0 16 32'),
  sprite('bed-green', 'Green Quilt Bed', 'Beds', 'green quilt', 65, 'furniture/beds.png', 1920, 784, '0 112 32 32', ['384 240 32 32']),
  sprite('bed-blue', 'Blue Quilt Bed', 'Beds', 'blue quilt', 65, 'furniture/beds.png', 1920, 784, '0 112 32 32', ['384 304 32 32']),
  sprite('bed-rose', 'Rose Quilt Bed', 'Beds', 'rose quilt', 65, 'furniture/beds.png', 1920, 784, '0 112 32 32', ['384 368 32 32']),
  sprite('bed-gold', 'Golden Quilt Bed', 'Beds', 'gold quilt', 70, 'furniture/beds.png', 1920, 784, '0 112 32 32', ['384 208 32 32']),
  sprite('table-cream', 'Cream Table', 'Tables', 'cream wood', 40, 'furniture/tables.png', 448, 352, '0 48 32 32'),
  sprite('table-oak', 'Oak Table', 'Tables', 'oak', 40, 'furniture/tables.png', 448, 352, '64 48 32 32'),
  sprite('table-dark', 'Dark Wood Table', 'Tables', 'dark wood', 45, 'furniture/tables.png', 448, 352, '128 48 32 32'),
  sprite('table-walnut', 'Walnut Table', 'Tables', 'walnut', 45, 'furniture/tables.png', 448, 352, '192 48 32 32'),
  sprite('lamp-cream', 'Cream Floor Lamp', 'Lighting', 'cream shade', 30, 'furniture/decorations.png', 960, 624, '304 112 16 32'),
  sprite('lamp-brown', 'Brown Floor Lamp', 'Lighting', 'brown base', 30, 'furniture/decorations.png', 960, 624, '336 112 16 32'),
  sprite('lamp-grey', 'Grey-Base Floor Lamp', 'Lighting', 'grey base', 30, 'furniture/decorations.png', 960, 624, '368 112 16 32'),
  sprite('rug-blue', 'Blue Patterned Rug', 'Rugs', 'blue pattern', 20, 'basics/rugs.png', 512, 288, '0 64 48 32'),
  sprite('rug-gold', 'Gold Patterned Rug', 'Rugs', 'gold pattern', 20, 'basics/rugs.png', 512, 288, '48 64 48 32'),
  sprite('rug-green', 'Green Patterned Rug', 'Rugs', 'green pattern', 20, 'basics/rugs.png', 512, 288, '96 64 48 32'),
  sprite('shelf-cream', 'Cream Wall Shelf', 'Storage', 'cream shelf', 30, 'furniture/wallshelves.png', 80, 112, '0 0 48 16'),
  sprite('shelf-dark', 'Dark Wood Wall Shelf', 'Storage', 'dark shelf', 30, 'furniture/wallshelves.png', 80, 112, '0 32 48 16'),
  sprite('shelf-brown', 'Brown Wall Shelf', 'Storage', 'brown shelf', 30, 'furniture/wallshelves.png', 80, 112, '0 64 48 16'),
  sprite('storage-cream', 'Cream Cabinet', 'Storage', 'cream cabinet', 45, 'furniture/storage.png', 448, 576, '0 64 32 32'),
  sprite('storage-brown', 'Brown Cabinet', 'Storage', 'brown cabinet', 45, 'furniture/storage.png', 448, 576, '128 64 32 32'),
  sprite('storage-grey', 'Grey Cabinet', 'Storage', 'grey cabinet', 45, 'furniture/storage.png', 448, 576, '320 64 32 32'),
  sprite('sofa-cream', 'Cream Sofa', 'Seating', 'cream', 75, 'furniture/couches.png', 960, 496, '0 112 32 32'),
  sprite('sofa-teal', 'Teal Sofa', 'Seating', 'teal', 75, 'furniture/couches.png', 960, 496, '192 112 32 32'),
  sprite('lamp-paper-black', 'Paper Floor Lamp · Black Base', 'Lighting', 'black base', 30, 'furniture/decorations.png', 960, 624, '304 80 16 32'),
  sprite('lamp-paper-oak', 'Paper Floor Lamp · Oak Base', 'Lighting', 'oak base', 30, 'furniture/decorations.png', 960, 624, '320 80 16 32'),
  sprite('lamp-paper-grey', 'Paper Floor Lamp · Grey Base', 'Lighting', 'grey base', 30, 'furniture/decorations.png', 960, 624, '352 80 16 32'),
  { id: 'demo-table-lamp-farmhouse', name: 'Farmhouse Table Lamp', type: 'furniture', category: 'Lighting', variant: 'cream', price: 20, asset: '/assets/Tiny%20Wonder%20Farm%20Free/objects%26items/furniture%20free.png', artwork: { width: 80, height: 48, crop: '32 32 16 16' } },
  { id: 'demo-bed-farmhouse', name: 'Farmhouse Pink Bed', type: 'furniture', category: 'Beds', variant: 'pink quilt', price: 60, asset: '/assets/Tiny%20Wonder%20Farm%20Free/objects%26items/furniture%20free.png', artwork: { width: 80, height: 48, crop: '0 0 16 32' } },
  { id: 'demo-table-farmhouse', name: 'Farmhouse Wood Table', type: 'furniture', category: 'Tables', variant: 'warm wood', price: 35, asset: '/assets/Tiny%20Wonder%20Farm%20Free/objects%26items/furniture%20free.png', artwork: { width: 80, height: 48, crop: '32 0 32 16' } },
  { id: 'demo-chair-retro', name: 'Retro Wood Chair', type: 'furniture', category: 'Seating', variant: 'brown wood', price: 35, asset: '/assets/Top-Down_Retro_Interior/TopDownHouse_FurnitureState1.png', artwork: { width: 208, height: 288, crop: '128 0 16 32' } },
  { id: 'demo-table-retro', name: 'Retro Dining Table', type: 'furniture', category: 'Tables', variant: 'brown wood', price: 45, asset: '/assets/Top-Down_Retro_Interior/TopDownHouse_FurnitureState1.png', artwork: { width: 208, height: 288, crop: '0 32 48 32' } },
  { id: 'demo-armchair-orange', name: 'Orange Upholstered Armchair', type: 'furniture', category: 'Seating', variant: 'orange', price: 50, asset: '/assets/Top-Down_Retro_Interior/TopDownHouse_FurnitureState1.png', artwork: { width: 208, height: 288, crop: '176 112 32 48' } },
  { id: 'demo-armchair-olive', name: 'Olive Upholstered Armchair', type: 'furniture', category: 'Seating', variant: 'olive', price: 50, asset: '/assets/Top-Down_Retro_Interior/TopDownHouse_FurnitureState2.png', artwork: { width: 208, height: 288, crop: '176 112 32 48' } },
];
export const furnitureCategories = [...new Set(furnitureVariants.map((item) => item.category))];
export function getFurnitureVariant(id: string) { return furnitureVariants.find((item) => item.id === id); }
const legacy: Record<string, { category: FurnitureCategory; asset: string; artwork: SpriteArtwork }> = {
  flowers: { category: 'Plants', asset: `${pack}furniture/decorations.png`, artwork: { width: 960, height: 624, crop: '0 64 16 32' } },
  tree: { category: 'Plants', asset: `${pack}furniture/decorations.png`, artwork: { width: 960, height: 624, crop: '16 0 16 32' } },
  bench: { category: 'Seating', asset: `${pack}furniture/chairs.png`, artwork: { width: 768, height: 208, crop: '0 96 32 32' } },
  plant: { category: 'Plants', asset: `${pack}furniture/decorations.png`, artwork: { width: 960, height: 624, crop: '0 32 16 32' } },
  chair: { category: 'Seating', asset: `${pack}furniture/chairs.png`, artwork: { width: 768, height: 208, crop: '0 0 16 32' } },
  lamp: { category: 'Lighting', asset: `${pack}furniture/decorations.png`, artwork: { width: 960, height: 624, crop: '304 112 16 32' } },
  sofa: { category: 'Seating', asset: `${pack}furniture/couches.png`, artwork: { width: 960, height: 496, crop: '0 112 32 32' } },
};
export function getShopArtwork(item: Item) {
  const variant = getFurnitureVariant(item.id);
  if (variant && variant.asset === item.asset) return variant.artwork;
  const mapping = legacy[item.id];
  if (mapping && decodeURI(item.asset).endsWith(decodeURI(mapping.asset))) return mapping.artwork;
}
export function withShopAsset(item: Item): Item {
  const mapping = legacy[item.id];
  return mapping && (item.asset === `${item.id}.png` || !item.asset) ? { ...item, asset: mapping.asset } : item;
}
export function shopCategory(item: Item) { return getFurnitureVariant(item.id)?.category ?? legacy[item.id]?.category ?? (item.type === 'garden' ? 'Garden' : item.type === 'clothing' ? 'Clothing' : 'Other Furniture'); }


export interface ShopStyle { id: string; name: string; variants: FurnitureVariant[]; }
export interface ShopProduct { id: string; name: string; category: FurnitureCategory; styles: ShopStyle[]; }
function style(id: string, name: string, variantIds: string[]): ShopStyle {
  return { id, name, variants: variantIds.map((variantId) => {
    const variant = getFurnitureVariant(`demo-${variantId}`);
    if (!variant) throw new Error(`Unknown catalog variant: ${variantId}`);
    return variant;
  }) };
}
export const shopProducts: ShopProduct[] = [
  { id: 'table-lamp', name: 'Table Lamp', category: 'Lighting', styles: [style('farmhouse', 'Farmhouse', ['table-lamp-farmhouse'])] },
  { id: 'floor-lamp', name: 'Floor Lamp', category: 'Lighting', styles: [style('classic', 'Classic Shade', ['lamp-cream', 'lamp-brown', 'lamp-grey']), style('paper', 'Paper Shade', ['lamp-paper-black', 'lamp-paper-oak', 'lamp-paper-grey'])] },
  { id: 'potted-plant', name: 'Potted Plant', category: 'Plants', styles: [style('leafy', 'Leafy', ['plant-leafy', 'plant-tan-pot']), style('succulent', 'Succulent', ['plant-succulent']), style('flowers', 'Flowering', ['plant-flowers'])] },
  { id: 'chair', name: 'Chair', category: 'Seating', styles: [style('wooden', 'Wooden', ['chair-cream', 'chair-brown', 'chair-green', 'chair-rose']), style('retro', 'Retro Wood', ['chair-retro'])] },
  { id: 'armchair', name: 'Armchair', category: 'Seating', styles: [style('upholstered', 'Upholstered', ['armchair-orange', 'armchair-olive'])] },
  { id: 'sofa', name: 'Sofa', category: 'Seating', styles: [style('cozy', 'Cozy', ['sofa-cream', 'sofa-teal'])] },
  { id: 'single-bed', name: 'Single Bed', category: 'Beds', styles: [style('quilt', 'Wooden Quilt', ['bed-green', 'bed-blue', 'bed-rose', 'bed-gold']), style('farmhouse', 'Farmhouse', ['bed-farmhouse'])] },
  { id: 'table', name: 'Table', category: 'Tables', styles: [style('rectangular', 'Rectangular', ['table-cream', 'table-oak', 'table-dark', 'table-walnut']), style('farmhouse', 'Farmhouse', ['table-farmhouse']), style('retro', 'Retro Dining', ['table-retro'])] },
  { id: 'rug', name: 'Rug', category: 'Rugs', styles: [style('patterned', 'Patterned', ['rug-blue', 'rug-gold', 'rug-green'])] },
  { id: 'wall-shelf', name: 'Wall Shelf', category: 'Storage', styles: [style('wooden', 'Wooden', ['shelf-cream', 'shelf-dark', 'shelf-brown'])] },
  { id: 'cabinet', name: 'Cabinet', category: 'Storage', styles: [style('double-door', 'Double Door', ['storage-cream', 'storage-brown', 'storage-grey'])] },
];
