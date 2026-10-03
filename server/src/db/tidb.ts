import "dotenv/config";
import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

/** TiDB is used only when TIDB_HOST is set; otherwise the app stays on in-memory storage. */
export function isTiDBEnabled(): boolean {
  return Boolean(process.env.TIDB_HOST);
}

export function getPool(): mysql.Pool {
  if (!isTiDBEnabled()) throw new Error("TiDB is not configured (TIDB_HOST missing)");
  pool ??= mysql.createPool({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT || 4000),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || "lifequest",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectionLimit: 5,
    multipleStatements: true,
  });
  return pool;
}

/** Runs fn inside a transaction; rolls back on any error. */
export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Returns true if TiDB answers a ping. Used at startup to decide on fallback. */
export async function checkTiDBConnection(): Promise<boolean> {
  if (!isTiDBEnabled()) return false;
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch (err) {
    console.warn(`[tidb] unavailable, falling back to in-memory storage: ${(err as Error).message}`);
    return false;
  }
}
