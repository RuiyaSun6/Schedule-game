// TiDB repository check: npm run test:db
// 1. getPlayer("player-1") returns the seeded player.
// 2. completeQuest twice on the same quest (sequential and concurrent) grants XP/coins only once.
// Uses a throwaway player + quests so player-1's XP is untouched; cleans up afterwards.
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { getPool } from "../db/tidb.js";
import { createPlayer, getPlayer } from "../repositories/playerRepository.js";
import { completeQuest, createQuests } from "../repositories/questRepository.js";
import { calculateLevel } from "../services/levelService.js";
import type { Quest } from "../types/game.js";
import { getRewards } from "../services/rewardService.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";

const testUserId = `test-${randomUUID().slice(0, 8)}`;
const makeQuest = (title: string): Quest => ({
  id: randomUUID(),
  userId: testUserId,
  title,
  category: "study",
  difficulty: "medium",
  estimatedMinutes: 30,
  ...getRewards("medium"),
  completed: false,
});

try {
  const demo = await getPlayer(DEFAULT_PLAYER_ID);
  assert.ok(demo, `${DEFAULT_PLAYER_ID} not found; run npm run db:init`);
  console.log(`✓ getPlayer(${DEFAULT_PLAYER_ID}):`, demo);

  await createPlayer({ id: testUserId, level: 1, xp: 0, coins: 0, outfit: "default", unlockedAreas: [], ownedItems: [] });
  const sequential = makeQuest("Sequential double complete");
  const concurrent = makeQuest("Concurrent double complete");
  await createQuests([sequential, concurrent]);

  const first = await completeQuest(sequential.id, calculateLevel);
  const second = await completeQuest(sequential.id, calculateLevel);
  assert.equal(first?.alreadyCompleted, false);
  assert.equal(second?.alreadyCompleted, true);
  assert.equal(second?.player.xp, 50, "XP granted more than once (sequential)");
  console.log("✓ sequential: second call alreadyCompleted, xp =", second?.player.xp);

  const results = await Promise.all([
    completeQuest(concurrent.id, calculateLevel),
    completeQuest(concurrent.id, calculateLevel),
  ]);
  assert.equal(results.filter((r) => r?.alreadyCompleted === false).length, 1, "both concurrent calls granted rewards");
  const after = await getPlayer(testUserId);
  assert.equal(after?.xp, 100, "XP granted more than once (concurrent)");
  assert.equal(after?.coins, 50);
  console.log("✓ concurrent: exactly one call rewarded, xp =", after?.xp, "coins =", after?.coins);

  console.log("All repository checks passed.");
} catch (err) {
  console.error("✗", err);
  process.exitCode = 1;
} finally {
  await getPool().query("DELETE FROM quests WHERE user_id = ?", [testUserId]).catch(() => {});
  await getPool().query("DELETE FROM players WHERE id = ?", [testUserId]).catch(() => {});
  await getPool().end();
}
