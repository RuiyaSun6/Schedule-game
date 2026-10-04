import type { CompleteQuestResponse, GenerateQuestsResponse, Item, Player, Quest } from '../types';
import { isItem, isPlayer, isQuest } from './apiValidators';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').replace(/\/+$/, '');
export const MVP_PLAYER_ID = 'player-1';

/** What went wrong, so screens can explain it: no connection, too slow, rate limited, server error, or bad data. */
export type ApiErrorKind = 'network' | 'timeout' | 'rate-limit' | 'server' | 'format';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly unavailable = false,
    /** Kind of failure and the raw response body (for console diagnostics). */
    public readonly details: { kind?: ApiErrorKind; body?: string } = {}) {
    super(message);
    this.name = 'ApiError';
  }
  get kind(): ApiErrorKind {
    if (this.details.kind) return this.details.kind;
    if (this.status === 429) return 'rate-limit';
    return this.status === undefined ? 'network' : 'server';
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;
const GENERATE_TIMEOUT_MS = 30_000;

// Real transport only. Demo adapters and data live outside this file.
async function request(path: string, method = 'GET', body?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;
    if (text.trim()) {
      try { data = JSON.parse(text); } catch { /* Validate below without leaking HTML errors. */ }
    }
    const serverError = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : undefined;
    if (!response.ok) throw new ApiError(serverError ?? `Request failed (${response.status}). Please try again.`, response.status, [404, 502, 503, 504].includes(response.status), { body: text });
    if (serverError) throw new ApiError(serverError, response.status, false, { body: text });
    if (data === null) throw new ApiError(text.trim() ? 'The backend returned an unreadable response.' : 'The backend returned an empty response.', response.status, response.headers.get('content-type')?.includes('text/html') ?? false, { kind: 'format', body: text });
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const timedOut = controller.signal.aborted;
    throw new ApiError(timedOut ? 'The backend took too long to respond. Please try again.' : 'Couldn’t reach the backend. Please check your connection.', undefined, true,
      { kind: timedOut ? 'timeout' : 'network', body: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
  } finally { clearTimeout(timeout); }
}

function invalid(message: string): never { throw new ApiError(message); }
function unwrap(data: unknown, key: string): unknown {
  return data && typeof data === 'object' && key in data ? (data as Record<string, unknown>)[key] : data;
}
function playerResponse(data: unknown, userId?: string): Player {
  const player = unwrap(data, 'player');
  if (!isPlayer(player) || (userId !== undefined && player.id !== userId)) return invalid('The backend returned invalid player data.');
  return player;
}

export async function getPlayer(): Promise<Player> {
  return playerResponse(await request('/api/player'), MVP_PLAYER_ID);
}
export async function generateQuests(userId: string, text: string): Promise<GenerateQuestsResponse> {
  if (!text.trim()) return invalid('Please enter at least one task for today.');
  // Generation waits for the AI (the backend allows ~11s before falling back), so give it more time
  // than ordinary requests; otherwise the browser gives up while the backend is still answering.
  const data = await request('/api/quests/generate', 'POST', { userId, text }, GENERATE_TIMEOUT_MS);
  const result = data as GenerateQuestsResponse;
  if (!result || !['gemini', 'mock-fallback'].includes(result.source) || !Array.isArray(result.quests) || !result.quests.every(isQuest)
    || result.quests.some((quest) => quest.userId !== userId) || new Set(result.quests.map((quest) => quest.id)).size !== result.quests.length) {
    throw new ApiError('The backend returned invalid quest previews.', 200, false, { kind: 'format', body: JSON.stringify(data) });
  }
  return result;
}
export async function getQuests(): Promise<Quest[]> {
  const quests = await request('/api/quests');
  if (!Array.isArray(quests) || !quests.every(isQuest) || quests.some((quest) => quest.userId !== MVP_PLAYER_ID)) return invalid('The backend returned invalid quests.');
  return quests;
}
export async function completeQuest(questId: string): Promise<CompleteQuestResponse> {
  const result = await request(`/api/quests/${encodeURIComponent(questId)}/complete`, 'POST') as CompleteQuestResponse;
  if (!result || !isQuest(result.quest) || result.quest.id !== questId || !result.quest.completed || !isPlayer(result.player)
    || result.quest.userId !== MVP_PLAYER_ID || result.player.id !== MVP_PLAYER_ID) return invalid('The backend returned invalid completion data. Please retry to confirm your progress.');
  return result;
}
export async function getItems(): Promise<Item[]> {
  const items = unwrap(await request('/api/items'), 'items');
  if (!Array.isArray(items) || !items.every(isItem) || new Set(items.map((item) => item.id)).size !== items.length) return invalid('The backend returned invalid shop items.');
  return items;
}
export async function buyItem(userId: string, itemId: string): Promise<{ item: Item; player: Player }> {
  const result = await request('/api/shop/purchase', 'POST', { itemId }) as { player: unknown; item: unknown };
  const player = playerResponse(result.player, userId);
  if (!player.ownedItems?.includes(itemId) || !isItem(result.item) || result.item.id !== itemId) return invalid('The purchase response is missing updated ownership.');
  return { item: result.item, player };
}
export async function equipOutfit(userId: string, outfit: string): Promise<Player> {
  const player = playerResponse(await request(`/api/player/${encodeURIComponent(userId)}/outfit`, 'PUT', { outfit }), userId);
  if (player.outfit !== outfit) return invalid('The backend did not confirm the equipped outfit.');
  return player;
}
