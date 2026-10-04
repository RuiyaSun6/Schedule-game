import type { Quest } from '../types';

export function questsByDate(quests: Quest[], today: string): Map<string, Quest[]> {
  const byDate = new Map<string, Quest[]>();
  for (const quest of quests) {
    const date = quest.scheduledDate ?? today;
    byDate.set(date, [...(byDate.get(date) ?? []), quest]);
  }
  for (const items of byDate.values()) {
    items.sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));
  }
  return byDate;
}
