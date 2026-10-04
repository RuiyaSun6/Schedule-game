import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { databaseName, getPool, serverConfig } from "../db/tidb.js";
import { CATALOG } from "../services/shopService.js";

// TiDB Serverless only ships with `test`, so create our database first.
const admin = await mysql.createConnection(serverConfig());
await admin.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName()}\``);
await admin.end();

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
await getPool().query(sql);
console.log("TiDB schema ready.");

// The seed in schema.sql and the in-memory CATALOG must match (IDs, values, order).
const [rows] = await getPool().query<RowDataPacket[]>("SELECT id, name, type, price, asset FROM items ORDER BY sort_order, id");
const catalogIds = new Set(CATALOG.map((item) => item.id));
const seeded = rows.filter((row) => catalogIds.has(row.id));
const mismatch = CATALOG.findIndex((item, i) => {
  const row = seeded[i];
  return !row || row.id !== item.id || row.name !== item.name || row.type !== item.type || row.price !== item.price || row.asset !== item.asset;
});
if (mismatch !== -1 || seeded.length !== CATALOG.length) {
  console.error(`✗ schema.sql seed and shopService CATALOG differ (first difference at ${CATALOG[mismatch]?.id ?? "end of list"}).`);
  process.exitCode = 1;
} else {
  console.log(`Shop catalog: ${CATALOG.length} items, same as the in-memory catalog.`);
}

// Retired item IDs are deleted unless someone owns them; those rows are kept and reported here.
const leftovers = rows.filter((row) => !catalogIds.has(row.id)).map((row) => row.id as string);
if (leftovers.length > 0) {
  const [owned] = await getPool().query<RowDataPacket[]>(
    "SELECT user_id, item_id FROM user_items WHERE item_id IN (?) ORDER BY user_id, item_id",
    [leftovers],
  );
  console.warn(`! ${leftovers.length} retired item(s) kept because players own them: ${leftovers.join(", ")}`);
  for (const row of owned) console.warn(`  ${row.user_id} owns ${row.item_id}`);
  console.warn("  Nothing was deleted. Map each one to a current variant (UPDATE user_items) or remove it, then rerun db:init.");
}
await getPool().end();
