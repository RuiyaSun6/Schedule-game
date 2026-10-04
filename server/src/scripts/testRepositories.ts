// TiDB repository check: npm run test:db
// 1. getPlayer("demo-user") returns the seeded player.
// 2. completeQuest twice on the same quest (sequential and concurrent) grants XP/coins only once.
// Uses a throwaway player + quests so demo-user's XP is untouched; cleans up afterwards.
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { getPool } from "../db/tidb.js";
import { createPlayer, getPlayer } from "../repositories/playerRepository.js";
import { completeQuest, createQuests } from "../repositories/questRepository.js";
import { calculateLevel } from "../services/levelService.js";
import type { Quest } from "../types/game.js";

const testUserId = `test-${randomUUID().slice(0, 8)}`;
const makeQuest = (title: string): Quest => ({
  id: randomUUID(),
  userId: testUserId,
  title,
  category: "study",
  difficulty: "medium",
  estimatedMinutes: 30,
  xpReward: 40,
  coinReward: 15,
  completed: false,
});

try {
  const demo = await getPlayer("demo-user");
  assert.ok(demo, "demo-user not found; run npm run db:init");
  console.log("✓ getPlayer(demo-user):", demo);

  await createPlayer({ id: testUserId, level: 1, xp: 0, coins: 0, outfit: "default", unlockedAreas: [], ownedItems: [] });
  const sequential = makeQuest("Sequential double complete");
  const concurrent = makeQuest("Concurrent double complete");
  await createQuests([sequential, concurrent]);

  const first = await completeQuest(sequential.id, calculateLevel);
  const second = await completeQuest(sequential.id, calculateLevel);
  assert.equal(first?.alreadyCompleted, false);
  assert.equal(second?.alreadyCompleted, true);
  assert.equal(second?.player.xp, 40, "XP granted more than once (sequential)");
  console.log("✓ sequential: second call alreadyCompleted, xp =", second?.player.xp);

  const results = await Promise.all([
    completeQuest(concurrent.id, calculateLevel),
    completeQuest(concurrent.id, calculateLevel),
  ]);
  assert.equal(results.filter((r) => r?.alreadyCompleted === false).length, 1, "both concurrent calls granted rewards");
  const after = await getPlayer(testUserId);
  assert.equal(after?.xp, 80, "XP granted more than once (concurrent)");
  assert.equal(after?.coins, 30);
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
