import type { GenerateQuestsResponse } from '../types';
import { generateQuests as apiGenerateQuests } from './api';
import { createMockQuests } from './mockApi';
export { createMockQuests } from './mockApi';
export { isQuest } from './apiValidators';

// Demo adapter; switch consumers to api.ts to disable local fallback.
export async function generateQuests(userId: string, text: string): Promise<GenerateQuestsResponse & { warning?: string }> {
  if (!text.trim()) throw new Error('Please enter at least one task for today.');
  try { return await apiGenerateQuests(userId, text); }
  catch (error) {
    return { source: 'mock-fallback', quests: createMockQuests(userId), warning: `${error instanceof Error ? error.message : 'Quest generation failed.'} Showing editable demo quests instead.` };
  }
}
