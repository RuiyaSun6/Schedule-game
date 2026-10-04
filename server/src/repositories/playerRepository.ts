import type { RowDataPacket } from "mysql2/promise";
import type mysql from "mysql2/promise";
import type { Player } from "../types/game.js";
import { getPool } from "../db/tidb.js";
import { calculateLevel, getUnlockedAreas } from "../services/levelService.js";

type Queryable = mysql.Pool | mysql.PoolConnection;

export async function getPlayer(userId: string, db: Queryable = getPool()): Promise<Player | null> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM players WHERE id = ?", [userId]);
  if (rows.length === 0) return null;
  const [items] = await db.query<RowDataPacket[]>(
    "SELECT item_id, quantity FROM user_items WHERE user_id = ? ORDER BY purchased_at",
    [userId],
  );
  const p = rows[0];
  const level = calculateLevel(p.xp);
  return {
    id: p.id,
    level,
    xp: p.xp,
    coins: p.coins,
    outfit: p.outfit,
    unlockedAreas: getUnlockedAreas(level),
    ownedItems: items.map((r) => r.item_id),
    itemCounts: Object.fromEntries(items.map((r) => [r.item_id, Number(r.quantity) || 1])),
  };
}

export async function createPlayer(player: Player): Promise<Player> {
  await getPool().query(
    "INSERT IGNORE INTO players (id, level, xp, coins, outfit) VALUES (?, ?, ?, ?, ?)",
    [player.id, player.level, player.xp, player.coins, player.outfit],
  );
  return (await getPlayer(player.id))!;
}

export async function updatePlayer(
  userId: string,
  updates: Partial<Pick<Player, "level" | "xp" | "coins" | "outfit">>,
  db: Queryable = getPool(),
): Promise<Player | null> {
  const fields = (["level", "xp", "coins", "outfit"] as const).filter((k) => updates[k] !== undefined);
  if (fields.length > 0) {
    await db.query(
      `UPDATE players SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
      [...fields.map((f) => updates[f]), userId],
    );
  }
  return getPlayer(userId, db);
}
