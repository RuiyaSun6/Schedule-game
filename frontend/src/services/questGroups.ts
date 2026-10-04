import type { Quest } from '../types';

// Display groups for the quest board (Study / Fitness / Chores / Other). Derived on the fly from
// each quest's existing category (study, health, life, social, creative) plus title keywords, so
// saved quests are never rewritten and older quests without a known category still get a group.
export const QUEST_GROUPS = ['Study', 'Fitness', 'Chores', 'Other'] as const;
export type QuestGroup = typeof QUEST_GROUPS[number];

const KEYWORDS: [QuestGroup, RegExp][] = [
  ['Chores', /\b(clean|cleaning|laundry|dish(es)?|tidy|vacuum|mop|sweep|trash|garbage|chores?|groceries|cook(ing)?|room|bathroom|kitchen|errands?)\b/i],
  ['Fitness', /\b(work ?out|workout|run(ning)?|jog(ging)?|gym|exercise|yoga|swim(ming)?|hike|bike|cycling|walk|stretch(ing)?|lift(ing)?|sports?|fitness|power up)\b/i],
  ['Study', /\b(assignment|study|studying|homework|exam|midterm|final|quiz|lecture|essay|reading|read|class|course|notes|math|physics|chemistry|biology|history|algorithms?|project|thesis|paper)\b/i],
];

export function questGroup(quest: Pick<Quest, 'title' | 'category'>): QuestGroup {
  const category = quest.category?.toLowerCase();
  if (category === 'study') return 'Study';
  if (category === 'health' || category === 'fitness') return 'Fitness';
  // life / social / creative / missing: decide from the title, else Other.
  return KEYWORDS.find(([, pattern]) => pattern.test(quest.title))?.[0] ?? 'Other';
}
