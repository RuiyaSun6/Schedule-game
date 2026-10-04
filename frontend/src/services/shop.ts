import type { Item, Player } from '../types';
import * as api from './api';
import { mockItems, mockBuyItem, mockEquipOutfit } from './mockApi';
export { mockItems } from './mockApi';

const catalogItems = new Map<string, Item>();
export function getCatalogItem(id: string) { return catalogItems.get(id); }
export function getOutfitAsset(id: string) {
  const item = catalogItems.get(id);
  return item?.type === 'clothing' && item.asset && !decodeURI(item.asset).includes('/interior full/') ? item.asset : undefined;
}
function rememberItems(items: Item[]) {
  items.forEach((item) => catalogItems.set(item.id, item));
}


export async function loadItems(): Promise<{ items: Item[]; demo: boolean }> {
  try {
    const items = await api.getItems(); rememberItems(items); return { items, demo: false };
  } catch (error) {
    if (!(error instanceof api.ApiError && error.unavailable)) throw error;
    rememberItems(mockItems); return { items: mockItems, demo: true };
  }
}
export async function buyItem(player: Player, item: Item) {
  if (player.ownedItems?.includes(item.id)) throw new Error('You already own this item.');
  if (player.coins < item.price) throw new Error('Not enough coins for this item.');
  try { return { ...await api.buyItem(player.id, item.id), demo: false }; }
  catch (error) {
    if (error instanceof api.ApiError && error.unavailable) return mockBuyItem(player, item);
    throw error;
  }
}
export async function equipOutfit(player: Player, outfit: string) {
  if (!player.ownedItems?.includes(outfit)) throw new Error('You must own this outfit before equipping it.');
  try { return { player: await api.equipOutfit(player.id, outfit), demo: false }; }
  catch (error) {
    if (error instanceof api.ApiError && error.unavailable) return mockEquipOutfit(player, outfit);
    throw error;
  }
}
