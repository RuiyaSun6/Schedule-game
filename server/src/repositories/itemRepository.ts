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
    stackable: Boolean(r.stackable),
    ...(owned === undefined ? {} : { owned }),
  };
}

export async function getItems(userId?: string): Promise<Item[]> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT * FROM items ORDER BY sort_order, id");
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

/**
 * Deducts coins and grants the item in ONE transaction. The player row is locked (FOR UPDATE), so
 * concurrent purchases run one after another: coins are checked and charged exactly once each.
 * Stackable items add 1 to user_items.quantity per purchase; regular items can be owned once.
 */
export async function purchaseItem(userId: string, itemId: string): Promise<PurchaseResult> {
  try {
    return await purchaseInTransaction(userId, itemId);
  } catch (err) {
    // A regular item inserted by a concurrent request: the primary key rejects the second copy.
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") return { ok: false, reason: "already_owned" };
    throw err;
  }
}

async function purchaseInTransaction(userId: string, itemId: string): Promise<PurchaseResult> {
  return withTransaction(async (conn) => {
    const [pRows] = await conn.query<RowDataPacket[]>("SELECT coins FROM players WHERE id = ? FOR UPDATE", [userId]);
    if (pRows.length === 0) return { ok: false, reason: "player_not_found" };

    const [iRows] = await conn.query<RowDataPacket[]>("SELECT * FROM items WHERE id = ?", [itemId]);
    if (iRows.length === 0) return { ok: false, reason: "not_found" };
    const item = toItem(iRows[0]);

    // Locking read: TiDB plain SELECTs read the snapshot from when the transaction began, which would
    // miss a row a concurrent purchase committed while this one waited for the player lock.
    const [owned] = await conn.query<RowDataPacket[]>(
      "SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ? FOR UPDATE",
      [userId, itemId],
    );
    if (owned.length > 0 && !item.stackable) return { ok: false, reason: "already_owned" };
    if (pRows[0].coins < item.price) return { ok: false, reason: "insufficient_coins" };

    await conn.query("UPDATE players SET coins = coins - ? WHERE id = ?", [item.price, userId]);
    if (item.stackable) {
      await conn.query(
        "INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1",
        [userId, itemId],
      );
    } else {
      // Plain INSERT: a second copy of a regular item fails on the primary key and rolls back.
      await conn.query("INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, 1)", [userId, itemId]);
    }
    return { ok: true, player: (await getPlayer(userId, conn))!, item };
  });
}
