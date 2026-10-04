import type { RowDataPacket } from "mysql2/promise";
import type { Player, Quest } from "../types/game.js";
import { getPool, withTransaction } from "../db/tidb.js";
import { getPlayer, updatePlayer } from "./playerRepository.js";

function toQuest(r: RowDataPacket): Quest {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    category: r.category,
    difficulty: r.difficulty,
    estimatedMinutes: r.estimated_minutes,
    xpReward: r.xp_reward,
    coinReward: r.coin_reward,
    completed: Boolean(r.completed),
    ...(r.scheduled_date != null && { scheduledDate: r.scheduled_date }),
    ...(r.start_time != null && { startTime: r.start_time }),
    ...(r.end_time != null && { endTime: r.end_time }),
    ...(r.completion_line != null && { completionLine: r.completion_line }),
  };
}

export async function createQuests(quests: Quest[]): Promise<Quest[]> {
  if (quests.length === 0) return [];
  await getPool().query(
    `INSERT INTO quests (id, user_id, title, category, difficulty, estimated_minutes, xp_reward, coin_reward, completed, scheduled_date, start_time, end_time, completion_line)
     VALUES ?`,
    [quests.map((q) => [q.id, q.userId, q.title, q.category, q.difficulty, q.estimatedMinutes, q.xpReward, q.coinReward, q.completed, q.scheduledDate ?? null, q.startTime ?? null, q.endTime ?? null, q.completionLine ?? null])],
  );
  return quests;
}

export async function getQuestsByUser(userId: string): Promise<Quest[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM quests WHERE user_id = ? ORDER BY created_at",
    [userId],
  );
  return rows.map(toQuest);
}

export async function getQuestById(questId: string): Promise<Quest | null> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT * FROM quests WHERE id = ?", [questId]);
  return rows.length ? toQuest(rows[0]) : null;
}

export interface CompleteQuestResult {
  quest: Quest;
  player: Player;
  alreadyCompleted: boolean;
}

/**
 * Marks a quest complete and rewards the player in ONE transaction.
 * Row locks (FOR UPDATE) make double-clicks / retries safe: rewards are granted at most once.
 * calculateLevel comes from levelService so game rules stay in one place.
 */
export async function completeQuest(
  questId: string,
  calculateLevel: (totalXp: number) => number,
  userId?: string,
): Promise<CompleteQuestResult | null> {
  return withTransaction(async (conn) => {
    const [qRows] = await conn.query<RowDataPacket[]>(
      userId ? "SELECT * FROM quests WHERE id = ? AND user_id = ? FOR UPDATE" : "SELECT * FROM quests WHERE id = ? FOR UPDATE",
      userId ? [questId, userId] : [questId],
    );
    if (qRows.length === 0) return null;
    const quest = toQuest(qRows[0]);

    if (quest.completed) {
      const player = await getPlayer(quest.userId, conn);
      return player ? { quest, player, alreadyCompleted: true } : null;
    }

    const [pRows] = await conn.query<RowDataPacket[]>("SELECT xp, coins FROM players WHERE id = ? FOR UPDATE", [quest.userId]);
    if (pRows.length === 0) return null;

    await conn.query("UPDATE quests SET completed = TRUE, completed_at = NOW() WHERE id = ?", [questId]);
    const xp = pRows[0].xp + quest.xpReward;
    const player = await updatePlayer(
      quest.userId,
      { xp, coins: pRows[0].coins + quest.coinReward, level: calculateLevel(xp) },
      conn,
    );
    return { quest: { ...quest, completed: true }, player: player!, alreadyCompleted: false };
  });
}
