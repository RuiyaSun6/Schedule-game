import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBoard, countInWeek, parseHabit, weekStart, type Habit } from "../services/habitRules.js";
import { checkInHabit, claimHabitReward, clearHabitsForTests, createHabit, getHabitBoard } from "../services/habitService.js";
import { getPlayer, savePlayer } from "../services/storageService.js";
import { makeDefaultPlayer } from "../types/defaultPlayer.js";
import { getCatalog, purchaseItem } from "../services/shopService.js";

const at = (day: string) => new Date(`${day}T12:00:00Z`);
const habit = (id: string, period: "daily" | "weekly", targetCount: number, createdAt: string, completionDates: string[]): Habit =>
  ({ id, userId: "player-1", title: id, description: id, period, targetCount, createdAt, completionDates });
const entry = (board: ReturnType<typeof buildBoard>, id: string) =>
  [...board.achievements, ...board.milestones.flatMap((group) => group.entries)].find((item) => item.id === id)!;

test("daily and weekly habits parse separately from quests", () => {
  assert.deepEqual(parseHabit("Read for 30 minutes every day"), { title: "Read for 30 minutes", description: "Read for 30 minutes every day", period: "daily", targetCount: 1 });
  assert.deepEqual(parseHabit("Go to the gym 3 times a week"), { title: "Go to the gym", description: "Go to the gym 3 times a week", period: "weekly", targetCount: 3 });
  assert.throws(() => parseHabit("Go to the gym"), RangeError);
  assert.throws(() => parseHabit("Study 8 days a week"), RangeError);
});

test("check-ins persist in memory, reject duplicate days, reset weekly progress without erasing history", async () => {
  clearHabitsForTests(); savePlayer(makeDefaultPlayer());
  const created = await createHabit("Go to the gym 3 times a week", at("2026-10-05"));
  const id = created.habits[0].id;
  assert.equal(created.habits[0].period, "weekly");
  assert.equal((await checkInHabit(id, at("2026-10-05"))).status, "completed");
  assert.equal((await checkInHabit(id, at("2026-10-05"))).status, "duplicate");
  await checkInHabit(id, at("2026-10-07"));
  const last = await checkInHabit(id, at("2026-10-09"));
  assert.equal(last.board.habits[0].currentProgress, 3);
  assert.equal(last.board.habits[0].successfulWeeks, 1);
  assert.equal(entry(last.board, `habit:${id}:first-week`).state, "ready");
  const monday = await getHabitBoard(at("2026-10-12"));
  assert.equal(monday.habits[0].currentProgress, 0);
  assert.equal(monday.habits[0].successfulWeeks, 1);
  assert.equal(monday.habits[0].totalCompletions, 3);
  assert.equal(countInWeek(monday.habits[0].completionDates, weekStart("2026-10-12")), 0);
});

test("daily habit uses seven distinct days and a missed day does not erase successful weeks", async () => {
  clearHabitsForTests();
  const id = (await createHabit("Read every day", at("2026-10-05"))).habits[0].id;
  for (let day = 5; day <= 11; day++) await checkInHabit(id, at(`2026-10-${String(day).padStart(2, "0")}`));
  await checkInHabit(id, at("2026-10-13"));
  const board = await getHabitBoard(at("2026-10-13"));
  assert.equal(board.habits[0].periodTarget, 7);
  assert.equal(board.habits[0].currentProgress, 1);
  assert.equal(board.habits[0].successfulWeeks, 1);
  assert.equal(board.habits[0].totalCompletions, 8);
  assert.equal(board.habits[0].currentStreak, 1);
});

test("milestones move from locked to ready to claimed, including month-long progress", () => {
  const h = habit("gym", "weekly", 1, "2026-10-01", ["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22"]);
  const board = buildBoard([h], [], "2026-10-30");
  for (const key of ["first-week", "consistent", "habit-builder", "long-term"]) assert.equal(entry(board, `habit:gym:${key}`).state, "ready");
  assert.equal(entry(buildBoard([h], [], "2026-10-15"), "habit:gym:habit-builder").state, "locked");
  assert.equal(entry(buildBoard([h], [], "2026-10-22"), "habit:gym:long-term").state, "locked");
  assert.equal(entry(buildBoard([h], ["habit:gym:first-week"], "2026-10-30"), "habit:gym:first-week").state, "claimed");
});

test("all global achievements use historical activity, weekly variety, and rolling windows", () => {
  const dates = Array.from({ length: 34 }, (_, i) => new Date(Date.UTC(2026, 9, i + 1)).toISOString().slice(0, 10));
  const habits = [habit("a", "weekly", 1, "2026-10-01", dates), habit("b", "weekly", 1, "2026-10-01", dates), habit("c", "weekly", 1, "2026-10-01", dates)];
  const board = buildBoard(habits, [], "2026-11-03");
  for (const key of ["new-beginning", "dedicated", "on-fire", "perfect-week", "balanced-life", "never-give-up", "habit-master", "lifequest-master"])
    assert.equal(entry(board, `global:${key}`).state, "ready", key);
  const sparse = buildBoard([habit("a", "weekly", 3, "2026-10-01", ["2026-10-01", "2026-10-07"])], [], "2026-10-07");
  assert.equal(entry(sparse, "global:perfect-week").state, "locked");
  assert.equal(entry(sparse, "global:never-give-up").state, "locked");
});

test("each global achievement stays locked just below its own threshold", () => {
  const dates = Array.from({ length: 100 }, (_, i) => new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10));
  const one = (history: string[]) => [habit("a", "weekly", 7, "2026-01-01", history)];
  assert.equal(entry(buildBoard([], [], "2026-01-01"), "global:new-beginning").state, "locked");
  assert.equal(entry(buildBoard(one(dates.slice(0, 9)), [], dates[8]), "global:dedicated").state, "locked");
  assert.equal(entry(buildBoard(one(dates.slice(0, 6)), [], dates[5]), "global:on-fire").state, "locked");
  assert.equal(entry(buildBoard(one(dates.filter((_, i) => i % 2 === 0).slice(0, 19)), [], dates[37]), "global:never-give-up").state, "locked");
  assert.equal(entry(buildBoard(one(dates.slice(0, 49)), [], dates[48]), "global:habit-master").state, "locked");
  assert.equal(entry(buildBoard(one(dates.slice(0, 99)), [], dates[98]), "global:lifequest-master").state, "locked");
  const two = [habit("a", "weekly", 1, "2026-01-01", [dates[0]]), habit("b", "weekly", 1, "2026-01-01", [dates[1]])];
  assert.equal(entry(buildBoard(two, [], dates[2]), "global:balanced-life").state, "locked");
  const incomplete = [...two, habit("c", "weekly", 2, "2026-01-01", [dates[0]])];
  assert.equal(entry(buildBoard(incomplete, [], dates[2]), "global:perfect-week").state, "locked");
});

test("claims update XP, coins, badges and real inventory exactly once, including concurrent retries", async () => {
  clearHabitsForTests(); savePlayer(makeDefaultPlayer());
  const first = await createHabit("Go to the gym 1 time a week", at("2026-10-05"));
  const id = first.habits[0].id;
  const beginning = await claimHabitReward("global:new-beginning", at("2026-10-05"));
  assert.equal(beginning.status, "claimed");
  assert.equal(beginning.player?.coins, 20);
  assert.equal(entry(beginning.board, "global:new-beginning").state, "claimed");
  await checkInHabit(id, at("2026-10-05"));
  await checkInHabit(id, at("2026-10-12"));
  const rewardId = `habit:${id}:consistent`;
  const results = await Promise.all([claimHabitReward(rewardId, at("2026-10-12")), claimHabitReward(rewardId, at("2026-10-12"))]);
  assert.deepEqual(results.map((result) => result.status).sort(), ["already_claimed", "claimed"]);
  assert.equal(getPlayer().xp, 60);
  assert.equal(getPlayer().coins, 50);
  assert.deepEqual(getPlayer().ownedItems.filter((item) => item === "reward-seedling"), ["reward-seedling"]);
  assert.equal((await getCatalog()).find((item) => item.id === "reward-seedling")?.name, "Consistency Plant");
  assert.equal((await getCatalog()).find((item) => item.id === "reward-seedling")?.stackable, true);
  assert.equal((await purchaseItem("reward-seedling")).status, "not_found");
  assert.equal(entry(await getHabitBoard(at("2026-10-13")), rewardId).state, "claimed");
  assert.equal((await claimHabitReward(rewardId, at("2026-10-13"))).status, "already_claimed");
  assert.equal(getPlayer().xp, 60);

  // A second habit has its own claim ID and grants a second physical copy.
  const secondId = (await createHabit("Study math 1 day a week", at("2026-10-05"))).habits.at(-1)!.id;
  await checkInHabit(secondId, at("2026-10-05"));
  await checkInHabit(secondId, at("2026-10-12"));
  assert.equal((await claimHabitReward(`habit:${secondId}:consistent`, at("2026-10-12"))).status, "claimed");
  assert.equal(getPlayer().itemCounts["reward-seedling"], 2);
  assert.equal(getPlayer().xp, 120);
  assert.equal(getPlayer().coins, 80);
});
