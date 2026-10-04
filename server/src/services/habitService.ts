import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getPool, isTiDBEnabled, withTransaction } from "../db/tidb.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";
import { getPlayer as getDbPlayer } from "../repositories/playerRepository.js";
import { calculateLevel, getUnlockedAreas } from "./levelService.js";
import { getPlayer, savePlayer } from "./storageService.js";
import { buildBoard, dateKey, dayNumber, findReward, parseHabit, type Habit, type HabitBoard } from "./habitRules.js";
import { HABIT_REWARD_ITEMS } from "./habitRewards.js";

const memoryHabits = new Map<string, Habit>();
const memoryClaims = new Set<string>();
type Queryable = PoolConnection | ReturnType<typeof getPool>;

async function dbHabits(db: Queryable): Promise<Habit[]> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT id, user_id, title, description, period, target_count, created_date FROM habits WHERE user_id = ? ORDER BY created_date, id", [DEFAULT_PLAYER_ID]);
  const [checkins] = await db.query<RowDataPacket[]>("SELECT habit_id, completed_date FROM habit_checkins WHERE user_id = ? ORDER BY completed_date", [DEFAULT_PLAYER_ID]);
  return rows.map((row) => ({ id: row.id, userId: row.user_id, title: row.title, description: row.description,
    period: row.period, targetCount: Number(row.target_count), createdAt: row.created_date,
    completionDates: checkins.filter((checkin) => checkin.habit_id === row.id).map((checkin) => checkin.completed_date) }));
}
async function dbClaims(db: Queryable): Promise<string[]> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT reward_id FROM habit_claims WHERE user_id = ?", [DEFAULT_PLAYER_ID]);
  return rows.map((row) => row.reward_id);
}
export async function getHabitBoard(now = new Date()): Promise<HabitBoard> {
  const today = dateKey(now);
  return isTiDBEnabled()
    ? buildBoard(await dbHabits(getPool()), await dbClaims(getPool()), today)
    : buildBoard([...memoryHabits.values()], [...memoryClaims], today);
}
export async function createHabit(text: string, now = new Date()): Promise<HabitBoard> {
  const parsed = parseHabit(text);
  const habit: Habit = { id: randomUUID(), userId: DEFAULT_PLAYER_ID, ...parsed, createdAt: dateKey(now), completionDates: [] };
  if (isTiDBEnabled()) {
    await getPool().query("INSERT INTO habits (id, user_id, title, description, period, target_count, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [habit.id, habit.userId, habit.title, habit.description, habit.period, habit.targetCount, habit.createdAt]);
  } else memoryHabits.set(habit.id, habit);
  return getHabitBoard(now);
}
export async function checkInHabit(id: string, now = new Date()): Promise<{ status: "completed" | "duplicate" | "not_found"; board: HabitBoard }> {
  const today = dateKey(now);
  if (isTiDBEnabled()) {
    const status = await withTransaction(async (conn) => {
      const [players] = await conn.query<RowDataPacket[]>("SELECT id FROM players WHERE id = ? FOR UPDATE", [DEFAULT_PLAYER_ID]);
      if (!players.length) return "not_found" as const;
      const [rows] = await conn.query<RowDataPacket[]>("SELECT id, created_date FROM habits WHERE id = ? AND user_id = ?", [id, DEFAULT_PLAYER_ID]);
      if (!rows.length || today < rows[0].created_date) return "not_found" as const;
      const [result] = await conn.query<import("mysql2/promise").ResultSetHeader>("INSERT IGNORE INTO habit_checkins (user_id, habit_id, completed_date) VALUES (?, ?, ?)", [DEFAULT_PLAYER_ID, id, today]);
      return result.affectedRows ? "completed" as const : "duplicate" as const;
    });
    return { status, board: await getHabitBoard(now) };
  }
  const habit = memoryHabits.get(id);
  if (!habit || today < habit.createdAt) return { status: "not_found", board: await getHabitBoard(now) };
  if (habit.completionDates.includes(today)) return { status: "duplicate", board: await getHabitBoard(now) };
  memoryHabits.set(id, { ...habit, completionDates: [...habit.completionDates, today].sort() });
  return { status: "completed", board: await getHabitBoard(now) };
}
export async function claimHabitReward(id: string, now = new Date()): Promise<{
  status: "claimed" | "already_claimed" | "locked" | "not_found";
  board: HabitBoard;
  player?: Awaited<ReturnType<typeof getDbPlayer>>;
}> {
  const today = dateKey(now);
  dayNumber(today);
  if (isTiDBEnabled()) {
    const status = await withTransaction(async (conn) => {
      const [players] = await conn.query<RowDataPacket[]>("SELECT xp, coins FROM players WHERE id = ? FOR UPDATE", [DEFAULT_PLAYER_ID]);
      if (!players.length) return "not_found" as const;
      const board = buildBoard(await dbHabits(conn), await dbClaims(conn), today);
      const reward = findReward(board, id);
      if (!reward) return "not_found" as const;
      if (reward.state === "claimed") return "already_claimed" as const;
      if (reward.state !== "ready") return "locked" as const;
      const xp = Number(players[0].xp) + reward.reward.xp;
      await conn.query("INSERT INTO habit_claims (user_id, reward_id, claimed_date) VALUES (?, ?, ?)", [DEFAULT_PLAYER_ID, id, today]);
      await conn.query("UPDATE players SET xp = ?, level = ?, coins = coins + ? WHERE id = ?", [xp, calculateLevel(xp), reward.reward.coins, DEFAULT_PLAYER_ID]);
      if (reward.reward.itemId) {
        // Reward items are inventory-only definitions; the shop cannot sell them.
        const item = HABIT_REWARD_ITEMS.find((entry) => entry.id === reward.reward.itemId);
        if (!item) throw new Error("Unknown reward item");
        if (item.stackable) await conn.query("INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1", [DEFAULT_PLAYER_ID, item.id]);
        else await conn.query("INSERT IGNORE INTO user_items (user_id, item_id, quantity) VALUES (?, ?, 1)", [DEFAULT_PLAYER_ID, item.id]);
      }
      return "claimed" as const;
    });
    return { status, board: await getHabitBoard(now), player: status === "claimed" || status === "already_claimed" ? await getDbPlayer(DEFAULT_PLAYER_ID) : undefined };
  }
  // Build without awaiting so concurrent calls cannot both pass the unclaimed check.
  const board = buildBoard([...memoryHabits.values()], [...memoryClaims], today);
  const reward = findReward(board, id);
  if (!reward) return { status: "not_found", board };
  if (reward.state === "claimed") return { status: "already_claimed", board, player: getPlayer() };
  if (reward.state !== "ready") return { status: "locked", board };
  const player = getPlayer();
  const xp = player.xp + reward.reward.xp;
  const itemId = reward.reward.itemId;
  const item = HABIT_REWARD_ITEMS.find((entry) => entry.id === itemId);
  if (itemId && !item) throw new Error("Unknown reward item");
  const updated = { ...player, xp, level: calculateLevel(xp), coins: player.coins + reward.reward.coins,
    unlockedAreas: getUnlockedAreas(calculateLevel(xp)),
    ownedItems: itemId && !player.ownedItems.includes(itemId) ? [...player.ownedItems, itemId] : player.ownedItems,
    itemCounts: itemId ? { ...player.itemCounts, [itemId]: item?.stackable ? (player.itemCounts[itemId] ?? 0) + 1 : 1 } : player.itemCounts };
  memoryClaims.add(id);
  savePlayer(updated);
  return { status: "claimed", board: await getHabitBoard(now), player: updated };
}

// Test-only fixture reset. Production routes never expose this.
export function clearHabitsForTests(): void { memoryHabits.clear(); memoryClaims.clear(); }
