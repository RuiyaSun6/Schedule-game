import { getPool } from "../db/tidb.js";
import { linkLegacyDemoPlayer } from "../services/authService.js";

const { LEGACY_DEMO_USERNAME, LEGACY_DEMO_EMAIL, LEGACY_DEMO_PASSWORD } = process.env;
if (!LEGACY_DEMO_USERNAME || !LEGACY_DEMO_EMAIL || !LEGACY_DEMO_PASSWORD)
  throw new Error("Set LEGACY_DEMO_USERNAME, LEGACY_DEMO_EMAIL, and LEGACY_DEMO_PASSWORD before running this one-time command.");
await linkLegacyDemoPlayer(LEGACY_DEMO_USERNAME, LEGACY_DEMO_EMAIL, LEGACY_DEMO_PASSWORD);
await getPool().end();
console.log("Existing player-1 is linked to its login account; game progress was not changed.");
