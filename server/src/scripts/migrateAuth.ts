import { getPool } from "../db/tidb.js";

// Additive migration only: do not rerun catalog seeding or touch existing player data.
const db = getPool();
await db.query(`CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(24) NOT NULL,
  username_key VARCHAR(24) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL,
  email_key VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
await db.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_sessions_user (user_id)
)`);
await db.end();
console.log("Authentication tables are ready; existing data was not changed.");
