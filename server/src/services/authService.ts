import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { RowDataPacket } from "mysql2/promise";
import { getPool, isTiDBEnabled, withTransaction } from "../db/tidb.js";
import { DEFAULT_PLAYER_ID, makeDefaultPlayer } from "../types/defaultPlayer.js";
import { savePlayer } from "./storageService.js";

const scrypt = promisify(scryptCallback);
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "lifequest_session";
export interface AuthUser { userId: string; username: string; email: string }
interface StoredUser extends AuthUser { passwordHash: string }
interface MemorySession { userId: string; expiresAt: number }
const users = new Map<string, StoredUser>();
const sessions = new Map<string, MemorySession>();

const key = (value: string) => value.trim().toLowerCase();
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const publicUser = ({ userId, username, email }: StoredUser): AuthUser => ({ userId, username, email });

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, Buffer.from(salt, "hex"), 64) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !/^[0-9a-f]{32}$/.test(salt ?? "") || !/^[0-9a-f]{128}$/.test(hash ?? "")) return false;
  const candidate = await scrypt(password, Buffer.from(salt, "hex"), 64) as Buffer;
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}

async function findByIdentity(identity: string): Promise<StoredUser | null> {
  if (!isTiDBEnabled()) return [...users.values()].find((user) => key(user.username) === key(identity) || key(user.email) === key(identity)) ?? null;
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT user_id, username, email, password_hash FROM users WHERE username_key = ? OR email_key = ? LIMIT 1",
    [key(identity), key(identity)],
  );
  const row = rows[0];
  return row ? { userId: row.user_id, username: row.username, email: row.email, passwordHash: row.password_hash } : null;
}

export type RegisterResult = { user: AuthUser; token: string } | { error: string; status: number };
export async function register(input: { username?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown }): Promise<RegisterResult> {
  const { username, email, password, confirmPassword } = input;
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,24}$/.test(username.trim()))
    return { error: "Username must be 3–24 letters, numbers, or underscores.", status: 400 };
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { error: "Enter a valid email address.", status: 400 };
  if (typeof password !== "string" || password.length < 8 || password.length > 128)
    return { error: "Password must be 8–128 characters.", status: 400 };
  if (password !== confirmPassword) return { error: "Passwords do not match.", status: 400 };
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (await findByIdentity(normalizedUsername)) return { error: "Username already exists.", status: 409 };
  if (await findByIdentity(normalizedEmail)) return { error: "Email already exists.", status: 409 };
  const userId = randomUUID();
  const passwordHash = await hashPassword(password);
  if (isTiDBEnabled()) {
    try {
      await withTransaction(async (db) => {
        await db.query("INSERT INTO users (user_id, username, username_key, email, email_key, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, normalizedUsername, key(normalizedUsername), normalizedEmail, key(normalizedEmail), passwordHash]);
        const player = makeDefaultPlayer(userId);
        await db.query("INSERT INTO players (id, level, xp, coins, outfit) VALUES (?, ?, ?, ?, ?)",
          [player.id, player.level, player.xp, player.coins, player.outfit]);
      });
    } catch (error) {
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
      if (await findByIdentity(normalizedUsername)) return { error: "Username already exists.", status: 409 };
      return { error: "Email already exists.", status: 409 };
    }
  } else {
    // Recheck after the asynchronous hash so concurrent sign-ups cannot claim the same name.
    if (await findByIdentity(normalizedUsername)) return { error: "Username already exists.", status: 409 };
    if (await findByIdentity(normalizedEmail)) return { error: "Email already exists.", status: 409 };
    users.set(userId, { userId, username: normalizedUsername, email: normalizedEmail, passwordHash });
    savePlayer(makeDefaultPlayer(userId));
  }
  return { user: { userId, username: normalizedUsername, email: normalizedEmail }, token: await createSession(userId) };
}

export async function login(identity: unknown, password: unknown): Promise<{ user: AuthUser; token: string } | null> {
  if (typeof identity !== "string" || typeof password !== "string" || !identity.trim() || password.length > 128) return null;
  const user = await findByIdentity(identity);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return { user: publicUser(user), token: await createSession(user.userId) };
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const hash = tokenHash(token);
  const expiresAt = Date.now() + SESSION_MS;
  if (isTiDBEnabled()) await getPool().query("INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [hash, userId, new Date(expiresAt)]);
  else sessions.set(hash, { userId, expiresAt });
  return token;
}

export async function sessionUser(token: string | undefined): Promise<AuthUser | null> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = tokenHash(token);
  if (!isTiDBEnabled()) {
    const session = sessions.get(hash);
    if (!session || session.expiresAt <= Date.now()) { sessions.delete(hash); return null; }
    const user = users.get(session.userId);
    return user ? publicUser(user) : null;
  }
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT u.user_id, u.username, u.email FROM auth_sessions s JOIN users u ON u.user_id = s.user_id WHERE s.token_hash = ? AND s.expires_at > NOW()",
    [hash],
  );
  const row = rows[0];
  return row ? { userId: row.user_id, username: row.username, email: row.email } : null;
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return;
  const hash = tokenHash(token);
  if (isTiDBEnabled()) await getPool().query("DELETE FROM auth_sessions WHERE token_hash = ?", [hash]);
  else sessions.delete(hash);
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${SESSION_MS / 1000}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

// Test-only inspection; no HTTP route exposes credential storage.
export function passwordHashForTests(userId: string): string | undefined { return users.get(userId)?.passwordHash; }

/** Optional one-time enrollment of the old demo player. No gameplay rows are changed. */
export async function linkLegacyDemoPlayer(username: string, email: string, password: string): Promise<void> {
  if (!isTiDBEnabled()) throw new Error("Legacy linking requires TiDB.");
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128)
    throw new Error("Provide a valid username, email, and 8–128 character password.");
  const [players] = await getPool().query<RowDataPacket[]>("SELECT id FROM players WHERE id = ?", [DEFAULT_PLAYER_ID]);
  if (!players.length) throw new Error("Legacy demo player does not exist.");
  const [linked] = await getPool().query<RowDataPacket[]>("SELECT user_id FROM users WHERE user_id = ?", [DEFAULT_PLAYER_ID]);
  if (linked.length) throw new Error("Legacy demo player already has an account.");
  if (await findByIdentity(username) || await findByIdentity(email)) throw new Error("Username or email already exists.");
  const passwordHash = await hashPassword(password);
  await getPool().query("INSERT INTO users (user_id, username, username_key, email, email_key, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
    [DEFAULT_PLAYER_ID, username, key(username), email.toLowerCase(), key(email), passwordHash]);
}
