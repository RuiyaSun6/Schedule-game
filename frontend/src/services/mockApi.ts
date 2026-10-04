import type { CompleteQuestResponse, Item, Player, Quest } from '../types';
import { worldAreas } from './worldAreas';

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
  const level = Math.max(player.level, [0, 100, 250, 500, 800].filter((threshold) => xp >= threshold).length);
  const newlyUnlocked = worldAreas.filter((area) => area.requiredLevel <= level && !player.unlockedAreas.includes(area.id)).map((area) => area.id);
  return {
    quest: { ...quest, completed: true },
    player: { ...player, xp, coins: player.coins + quest.coinReward, level, unlockedAreas: [...player.unlockedAreas, ...newlyUnlocked] },
    levelUp: level > player.level, newlyUnlocked, source: 'mock-fallback',
    warning: 'Demo completion: the quest service is unavailable. Progress is saved in this session only.',
  };
}

const base = '/assets/interior%20full/furniture/';
export const mockItems: Item[] = [
  { id: 'plant', name: 'Little plant', type: 'furniture', price: 15, asset: `${base}decorations.png` },
  { id: 'chair', name: 'Wooden chair', type: 'furniture', price: 20, asset: `${base}chairs.png` },
  { id: 'sofa', name: 'Cozy sofa', type: 'furniture', price: 50, asset: `${base}couches.png` },
  { id: 'lamp', name: 'Small lamp', type: 'furniture', price: 25, asset: `${base}decorations.png` },
  { id: 'flowers', name: 'Flowers', type: 'garden', price: 10, asset: '' },
  { id: 'tree', name: 'Tree', type: 'garden', price: 35, asset: '' },
  { id: 'bench', name: 'Bench', type: 'garden', price: 30, asset: '' },
  { id: 'fountain', name: 'Fountain', type: 'garden', price: 75, asset: '' },
  { id: 'hat', name: 'Hat outfit', type: 'clothing', price: 10, asset: '' },
  { id: 'hoodie', name: 'Hoodie outfit', type: 'clothing', price: 25, asset: '' },
  { id: 'sneakers', name: 'Sneakers outfit', type: 'clothing', price: 15, asset: '' },
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
