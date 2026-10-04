import type { HabitBoard, HabitBoardEntry, HabitReward } from '../types';
import type { BadgeIconName } from '../components/BadgeIcon';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export interface Badge {
  id: string;
  name: string;
  icon: BadgeIconName;
  rarity: BadgeRarity;
  description: string;
  progress: number;
  required: number;
  unit: string;
  reward: HabitReward;
  earned: boolean;
  ready: boolean;
  earnedFrom: string[];
}

interface BadgeDefinition {
  id: string;
  name: string;
  icon: BadgeIconName;
  rarity: BadgeRarity;
  // A new player has no per-habit milestone entries yet. These describe the
  // collectible without storing another copy of its ownership or progress.
  fallback?: Pick<HabitBoardEntry, 'description' | 'required' | 'unit' | 'reward'>;
}

const milestone = (description: string, required: number, unit: string, xp: number, coins: number, badge: string, itemName?: string) =>
  ({ description, required, unit, reward: { xp, coins, badge, ...(itemName ? { itemName } : {}) } });

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  { id: 'global:new-beginning', name: 'New Beginning', icon: 'seedling', rarity: 'common' },
  { id: 'global:dedicated', name: 'Dedicated', icon: 'target', rarity: 'common' },
  { id: 'global:on-fire', name: 'On Fire', icon: 'flame', rarity: 'rare' },
  { id: 'global:perfect-week', name: 'Perfect Week', icon: 'calendar-check', rarity: 'epic' },
  { id: 'global:balanced-life', name: 'Balanced Life', icon: 'scale', rarity: 'rare' },
  { id: 'global:never-give-up', name: 'Never Give Up', icon: 'mountain', rarity: 'epic' },
  { id: 'global:habit-master', name: 'Habit Master', icon: 'star-medal', rarity: 'legendary' },
  { id: 'global:lifequest-master', name: 'LifeQuest Master', icon: 'crown', rarity: 'legendary' },
  { id: 'milestone:first-week', name: 'First Week', icon: 'calendar-star', rarity: 'common', fallback: milestone("Meet a habit's weekly target once.", 1, 'successful weeks', 50, 25, 'First Week') },
  { id: 'milestone:consistent', name: 'Consistent', icon: 'loop', rarity: 'rare', fallback: milestone("Meet a habit's target in two weeks.", 2, 'successful weeks', 60, 30, 'Consistent', 'Consistency Plant') },
  { id: 'milestone:habit-builder', name: 'Habit Builder', icon: 'young-tree', rarity: 'epic', fallback: milestone("Meet a habit's target in four weeks.", 4, 'successful weeks', 150, 75, 'Habit Builder', 'Habit Builder Tree') },
  { id: 'milestone:long-term', name: 'Long-Term Habit', icon: 'mature-tree', rarity: 'legendary', fallback: milestone('Keep a habit for 30 days and meet four weekly goals.', 30, 'days active', 100, 40, 'Long-Term Habit', 'Monthly Glow Lamp') },
];

function bestMilestone(entries: HabitBoardEntry[]): HabitBoardEntry | undefined {
  return entries.reduce<HabitBoardEntry | undefined>((best, entry) => {
    if (!best) return entry;
    const progress = entry.progress / entry.required;
    return progress > best.progress / best.required ? entry : best;
  }, undefined);
}

/** A read-only view of the Reward Board; claimed IDs remain the sole ownership source. */
export function collectBadges(board: HabitBoard): Badge[] {
  const claims = new Set(board.claimedIds);
  return BADGE_DEFINITIONS.map((definition) => {
    const milestoneId = definition.id.startsWith('milestone:') ? definition.id.slice('milestone:'.length) : null;
    const matches = milestoneId
      ? board.milestones.flatMap((group) => group.entries.filter((entry) => entry.id.endsWith(`:${milestoneId}`))
        .map((entry) => ({ entry, title: group.title })))
      : [];
    const entry = milestoneId ? bestMilestone(matches.map(({ entry: item }) => item)) : board.achievements.find((item) => item.id === definition.id);
    const claimedMatches = milestoneId ? board.claimedIds.filter((id) => id.startsWith('habit:') && id.endsWith(`:${milestoneId}`)) : [];
    const earned = milestoneId ? claimedMatches.length > 0 : claims.has(definition.id);
    const earnedFrom = matches.filter(({ entry: item }) => claims.has(item.id)).map(({ title }) => title);
    const fallback = definition.fallback;
    return {
      id: definition.id, name: definition.name, icon: definition.icon, rarity: definition.rarity,
      description: entry?.description ?? fallback?.description ?? '',
      progress: entry?.progress ?? 0, required: entry?.required ?? fallback?.required ?? 1,
      unit: entry?.unit ?? fallback?.unit ?? '',
      reward: entry?.reward ?? fallback?.reward ?? { xp: 0, coins: 0, badge: definition.name },
      earned, ready: !earned && (milestoneId ? matches.some(({ entry: item }) => item.state === 'ready') : entry?.state === 'ready'),
      earnedFrom: [...new Set(earnedFrom)],
    };
  });
}
