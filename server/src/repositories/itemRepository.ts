import type { RowDataPacket } from "mysql2/promise";
import type { Item, Player } from "../types/game.js";
import { getPool, withTransaction } from "../db/tidb.js";
import { getPlayer } from "./playerRepository.js";

function toItem(r: RowDataPacket, owned?: boolean): Item {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    price: r.price,
    asset: r.asset,
    ...(owned === undefined ? {} : { owned }),
  };
}

export async function getItems(userId?: string): Promise<Item[]> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT * FROM items ORDER BY type, price");
  const owned = new Set(userId ? await getOwnedItems(userId) : []);
  return rows.map((r) => toItem(r, userId === undefined ? undefined : owned.has(r.id)));
}

export async function getItemById(itemId: string): Promise<Item | null> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT * FROM items WHERE id = ?", [itemId]);
  return rows.length ? toItem(rows[0]) : null;
}

export async function getOwnedItems(userId: string): Promise<string[]> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT item_id FROM user_items WHERE user_id = ?", [userId]);
  return rows.map((r) => r.item_id);
}

export async function addOwnedItem(userId: string, itemId: string): Promise<void> {
  await getPool().query("INSERT IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)", [userId, itemId]);
}

export type PurchaseResult =
  | { ok: true; player: Player; item: Item }
  | { ok: false; reason: "player_not_found" | "not_found" | "already_owned" | "insufficient_coins" };

/** Deducts coins and grants the item in ONE transaction; never charges twice. */
export async function purchaseItem(userId: string, itemId: string): Promise<PurchaseResult> {
  return withTransaction(async (conn) => {
    const [pRows] = await conn.query<RowDataPacket[]>("SELECT coins FROM players WHERE id = ? FOR UPDATE", [userId]);
    if (pRows.length === 0) return { ok: false, reason: "player_not_found" };

    const [iRows] = await conn.query<RowDataPacket[]>("SELECT * FROM items WHERE id = ?", [itemId]);
    if (iRows.length === 0) return { ok: false, reason: "not_found" };
    const item = toItem(iRows[0]);

    const [owned] = await conn.query<RowDataPacket[]>(
      "SELECT 1 FROM user_items WHERE user_id = ? AND item_id = ?",
      [userId, itemId],
    );
    if (owned.length > 0) return { ok: false, reason: "already_owned" };
    if (pRows[0].coins < item.price) return { ok: false, reason: "insufficient_coins" };

    await conn.query("UPDATE players SET coins = coins - ? WHERE id = ?", [item.price, userId]);
    await conn.query("INSERT INTO user_items (user_id, item_id) VALUES (?, ?)", [userId, itemId]);
    return { ok: true, player: (await getPlayer(userId, conn))!, item };
  });
}
