import type { CompleteQuestResponse, Item, Player, Quest } from '../types';
import { worldAreas } from './worldAreas';
import { SHOP_SPRITES } from '../data/shopSprites';
import { calculateLevel } from './levelProgression';

export function createMockQuests(userId: string): Quest[] {
  const templates = [
    { title: 'Finish your algorithms assignment', category: 'Study', difficulty: 'Hard', estimatedMinutes: 90, xpReward: 60, coinReward: 20 },
    { title: 'Work out for one hour', category: 'Health', difficulty: 'Medium', estimatedMinutes: 60, xpReward: 40, coinReward: 15 },
    { title: 'Clean your room', category: 'Home', difficulty: 'Easy', estimatedMinutes: 25, xpReward: 20, coinReward: 10 },
  ];
  return templates.map((quest) => ({ ...quest, id: `demo-${crypto.randomUUID()}`, userId, completed: false }));
}

const mockCompletions = new Set<string>();

export function mockCompleteQuest(quest: Quest, player: Player): CompleteQuestResponse {
  const key = `${player.id}:${quest.id}`;
  if (quest.completed || mockCompletions.has(key)) return { quest: { ...quest, completed: true }, player, levelUp: false, newlyUnlocked: [], source: 'mock-fallback' };
  mockCompletions.add(key);
  const xp = player.xp + quest.xpReward;
  const level = calculateLevel(xp);
  const newlyUnlocked = worldAreas.filter((area) => area.requiredLevel <= level && !player.unlockedAreas.includes(area.id)).map((area) => area.id);
  return {
    quest: { ...quest, completed: true },
    player: { ...player, xp, coins: player.coins + quest.coinReward, level, unlockedAreas: [...player.unlockedAreas, ...newlyUnlocked] },
    levelUp: level > player.level, newlyUnlocked, source: 'mock-fallback',
    warning: 'Demo completion: the quest service is unavailable. Progress is saved in this session only.',
  };
}

// Offline preview of the shop catalog, built from the same art list as the real shop.
// Prices mirror server/src/services/shopService.ts; purchases still need the backend.
const FAMILY_PRICE: Record<string, number> = { plant: 20, tree: 50, lamp: 50, chair: 40, sofa: 100 };
export const mockItems: Item[] = [
  // Retired kinds (flowers, benches) are not sold; potted trees are home furniture now.
  ...Object.entries(SHOP_SPRITES).filter(([, sprite]) => sprite.family in FAMILY_PRICE)
    .map(([id, sprite]) => ({ id, name: sprite.name, type: 'furniture' as const, price: FAMILY_PRICE[sprite.family], asset: `${id}.png` })),
  { id: 'pet-bowl', name: 'Food Bowl', type: 'furniture', price: 20, asset: 'pet-bowl.png' },
  { id: 'pet-scratcher', name: 'Scratching Post', type: 'furniture', price: 40, asset: 'pet-scratcher.png' },
  { id: 'pet-bed', name: 'Cozy Cat Bed', type: 'furniture', price: 60, asset: 'pet-bed.png' },
  { id: 'pet-tree', name: 'Cat Tree', type: 'furniture', price: 120, asset: 'pet-tree.png' },
];


export function mockBuyItem(player: Player, item: Item) {
  if (player.ownedItems?.includes(item.id)) throw new Error('You already own this item.');
  if (player.coins < item.price) throw new Error('Not enough coins for this item.');
  return { success: true, player: { ...player, coins: player.coins - item.price, ownedItems: [...(player.ownedItems ?? []), item.id] }, item, demo: true };
}
export function mockEquipOutfit(player: Player, outfit: string) {
  if (!player.ownedItems?.includes(outfit)) throw new Error('You must own this outfit before equipping it.');
  return { player: { ...player, outfit }, demo: true };
}
