import { readFile } from "node:fs/promises";
import { getPool } from "../db/tidb.js";

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
await getPool().query(sql);
console.log("TiDB schema ready.");
await getPool().end();
