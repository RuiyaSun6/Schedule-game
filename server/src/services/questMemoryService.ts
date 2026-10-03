import type { RowDataPacket } from "mysql2/promise";
import type { Quest, SimilarQuest } from "../types/game.js";
import { getPool, isTiDBEnabled } from "../db/tidb.js";
import { embedText } from "./geminiService.js";

// Optional sponsor feature: Quest Memory with TiDB Vector Search.
// Every function here is best-effort: failures are logged and never block quest generation.

const toVectorLiteral = (v: number[]) => `[${v.join(",")}]`;

/** Call after a quest is completed so future similar tasks can use it as context. */
export async function rememberCompletedQuest(quest: Quest): Promise<void> {
  if (!isTiDBEnabled()) return;
  try {
    const embedding = await embedText(quest.title);
    if (!embedding) return;
    await getPool().query(
      `REPLACE INTO quest_memory (quest_id, user_id, title, category, difficulty, estimated_minutes, embedding)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quest.id, quest.userId, quest.title, quest.category, quest.difficulty, quest.estimatedMinutes, toVectorLiteral(embedding)],
    );
  } catch (err) {
    console.warn(`[quest-memory] store failed: ${(err as Error).message}`);
  }
}

/** Finds the user's most semantically similar completed quests. Returns [] on any failure. */
export async function findSimilarCompletedQuests(userId: string, taskText: string, limit = 3): Promise<SimilarQuest[]> {
  if (!isTiDBEnabled()) return [];
  try {
    const embedding = await embedText(taskText);
    if (!embedding) return [];
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT title, category, difficulty, estimated_minutes,
              VEC_COSINE_DISTANCE(embedding, ?) AS distance
       FROM quest_memory
       WHERE user_id = ?
       ORDER BY distance
       LIMIT ?`,
      [toVectorLiteral(embedding), userId, limit],
    );
    return rows
      .filter((r) => r.distance < 0.5) // ignore weak matches
      .map((r) => ({
        title: r.title,
        category: r.category,
        difficulty: r.difficulty,
        estimatedMinutes: r.estimated_minutes,
      }));
  } catch (err) {
    console.warn(`[quest-memory] search failed: ${(err as Error).message}`);
    return [];
  }
}
