// Must stay the first import: these tests create quests/habits and must never touch the real TiDB.
import "./memoryOnly.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateLevel, getUnlockedAreas, xpRequiredForLevel } from "../services/levelService.js";
import { createQuest, completeQuest } from "../services/questService.js";
import { getPlayer } from "../services/storageService.js";
import { getRewards } from "../services/rewardService.js";

test("level thresholds use cumulative XP, including levels above five", () => {
  const requirements = [300, 500, 800, 1200, 1600, 2000, 2400];
  let totalXp = 0;
  assert.equal(calculateLevel(0), 1);
  for (const [index, required] of requirements.entries()) {
    assert.equal(xpRequiredForLevel(index + 1), required);
    assert.equal(calculateLevel(totalXp + required - 1), index + 1);
    totalXp += required;
    assert.equal(calculateLevel(totalXp), index + 2);
  }
});

test("quest rewards remain unchanged", () => {
  assert.deepEqual(getRewards("easy"), { xpReward: 20, coinReward: 10 });
  assert.deepEqual(getRewards("medium"), { xpReward: 50, coinReward: 25 });
  assert.deepEqual(getRewards("hard"), { xpReward: 100, coinReward: 50 });
  assert.deepEqual(getRewards("boss"), { xpReward: 200, coinReward: 100 });
});

test("many quest completions grant each reward once and preserve every crossed level", async () => {
  const quests = await Promise.all(Array.from({ length: 22 }, (_, index) => createQuest(`Boss ${index}`, "boss")));
  const results = await Promise.all(quests.map((quest) => completeQuest(quest.id)));
  assert.equal(results.filter((result) => result.status === "completed").length, quests.length);
  const player = getPlayer();
  assert.equal(player.xp, 4400);
  assert.equal(player.coins, 2200);
  assert.equal(player.level, 6);
  assert.deepEqual(player.unlockedAreas, getUnlockedAreas(6));
  assert.equal(new Set(player.unlockedAreas).size, player.unlockedAreas.length);
  assert.equal(results.filter((result) => result.status === "completed" && result.player.level === 6).length, 1);

  const retries = await Promise.all(quests.map((quest) => completeQuest(quest.id)));
  assert.ok(retries.every((result) => result.status === "already_completed"));
  assert.equal(getPlayer().xp, 4400);
  assert.equal(getPlayer().coins, 2200);
});
