import type { Item, Player, Quest } from '../types';

export function isQuest(value: unknown): value is Quest {
  if (!value || typeof value !== 'object') return false;
  const q = value as Record<string, unknown>;
  return ['id', 'userId', 'title', 'category', 'difficulty'].every((key) => typeof q[key] === 'string' && (q[key] as string).trim().length > 0)
    && ['estimatedMinutes', 'xpReward', 'coinReward'].every((key) => typeof q[key] === 'number' && Number.isFinite(q[key]) && (q[key] as number) >= 0)
    && typeof q.completed === 'boolean';
}

export function isItem(value: unknown): value is Item {
  if (!value || typeof value !== 'object') return false;
  const item = value as Item;
  return typeof item.id === 'string' && !!item.id && typeof item.name === 'string' && ['furniture', 'garden', 'clothing', 'farm'].includes(item.type)
    && typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 && typeof item.asset === 'string';
}
export function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== 'object') return false;
  const p = value as Player;
  return typeof p.id === 'string' && ['xp', 'coins', 'level'].every((key) => typeof p[key as keyof Player] === 'number' && Number.isFinite(p[key as keyof Player]) && Number(p[key as keyof Player]) >= 0)
    && Array.isArray(p.unlockedAreas) && p.unlockedAreas.every((id) => typeof id === 'string')
    && Array.isArray(p.ownedItems) && p.ownedItems.every((id) => typeof id === 'string');
}

