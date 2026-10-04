import type { CompleteQuestResponse, Player, Quest } from '../types';
import { ApiError, completeQuest as apiCompleteQuest } from './api';
import { mockCompleteQuest } from './mockApi';
export { mockCompleteQuest } from './mockApi';

export async function completeQuest(quest: Quest, player: Player): Promise<CompleteQuestResponse> {
  if (quest.completed) return { quest, player, levelUp: false, newlyUnlocked: [] };
  if (quest.id.startsWith('demo-')) return mockCompleteQuest(quest, player);
  try {
    const result = await apiCompleteQuest(quest.id);
    if (result.player.id !== player.id) throw new Error('The completion response belongs to a different player.');
    return result;
  } catch (error) {
    if (error instanceof ApiError && error.unavailable) {
      const result = mockCompleteQuest(quest, player);
      return { ...result, warning: `${error.message} ${result.warning ?? 'Demo completion used.'}` };
    }
    throw error;
  }
}
