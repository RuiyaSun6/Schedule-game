// End-to-end API check against a real server process: npm run test:api [-- memory|tidb]
// memory (default): blanks TIDB_HOST so the server uses in-memory storage.
// tidb: uses TiDB from .env, then restores player-1 and deletes the quests and purchases this run created.
// Both modes blank GEMINI_API_KEY, so quest generation uses the mock and costs no Gemini quota.
import "dotenv/config";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { getPool } from "../db/tidb.js";
import { createQuests } from "../repositories/questRepository.js";
import { MAX_COMPLETION_LINE } from "../services/completionLine.js";
import { getRewards } from "../services/rewardService.js";
import { CATALOG } from "../services/shopService.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";
import type { Item, Player, Quest } from "../types/game.js";
import { twelveTaskDates, twelveTaskPlan } from "./twelveTaskPlan.js";

const mode = process.argv[2] === "tidb" ? "tidb" : "memory";
if (mode === "tidb" && !process.env.TIDB_HOST) throw new Error("tidb mode needs TIDB_HOST in .env");

async function freePort(): Promise<number> {
  const server = createServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  server.close();
  await once(server, "close");
  return address.port;
}

const port = await freePort();
const base = `http://127.0.0.1:${port}/api`;
const child = spawn(process.execPath, ["dist/server.js"], {
  env: { ...process.env, PORT: String(port), GEMINI_API_KEY: "", ...(mode === "memory" ? { TIDB_HOST: "" } : {}) },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
child.stdout.on("data", (chunk: Buffer) => { serverLog += chunk.toString(); });
child.stderr.on("data", (chunk: Buffer) => { serverLog += chunk.toString(); });

async function call<T = any>(method: string, path: string, body?: unknown): Promise<{ status: number; body: T }> {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as T };
}

const ok = (message: string) => console.log(`✓ ${message}`);
const subjectOf = (title: string) => title.split(":")[0].trim();
function assertLine(quest: Quest) {
  const line = quest.completionLine;
  assert.ok(typeof line === "string" && line.trim().length > 0, `missing completionLine on ${quest.title}`);
  assert.ok(line.length <= MAX_COMPLETION_LINE, line);
  assert.ok(line.includes(subjectOf(quest.title)), `line should mention "${subjectOf(quest.title)}": ${line}`);
}

const PET_ITEMS: [string, string, number][] = [
  ["pet-bowl", "Food Bowl", 20],
  ["pet-scratcher", "Scratching Post", 40],
  ["pet-bed", "Cozy Cat Bed", 60],
  ["pet-tree", "Cat Tree", 120],
  ["pet-bird", "Bird", 80],
];

const createdIds: string[] = [];
const purchasedItemIds: string[] = [];
let startPlayer: Player | undefined;

try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/health`)).ok) break; } catch { /* still starting */ }
    assert.ok(attempt < 50, `server did not start:\n${serverLog}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  ok(`server up (storage: ${mode})`);

  const player = await call<Player>("GET", "/player");
  assert.equal(player.status, 200);
  assert.equal(player.body.id, DEFAULT_PLAYER_ID);
  startPlayer = player.body;
  ok(`GET /player -> level ${startPlayer.level}, xp ${startPlayer.xp}, coins ${startPlayer.coins}`);

  // Generated quests carry a completionLine that mentions the task.
  const generated = await call<{ source: string; quests: Quest[] }>("POST", "/quests/generate", {
    text: "finish my algorithms assignment and go to the gym",
  });
  assert.equal(generated.status, 201);
  assert.equal(generated.body.source, "mock-fallback");
  assert.equal(generated.body.quests.length, 2);
  generated.body.quests.forEach((quest) => { createdIds.push(quest.id); assertLine(quest); });
  ok(`POST /quests/generate -> ${generated.body.quests.map((q) => `"${q.completionLine}"`).join(" | ")}`);

  const listed = await call<Quest[]>("GET", "/quests");
  for (const quest of generated.body.quests) {
    assert.equal(listed.body.find((q) => q.id === quest.id)?.completionLine, quest.completionLine);
  }
  ok("GET /quests -> completionLine persisted");

  const scheduled = await call<{ quests: Quest[] }>("POST", "/quests/generate", {
    text: "Do math homework on October 8 from 5 PM to 7 PM",
  });
  assert.equal(scheduled.status, 201);
  assert.deepEqual(scheduled.body.quests.map((quest) => [quest.scheduledDate, quest.startTime, quest.endTime]), [
    ["2026-10-08", "17:00", "19:00"],
  ]);
  scheduled.body.quests.forEach((quest) => createdIds.push(quest.id));
  const scheduledList = await call<Quest[]>("GET", "/quests");
  for (const quest of scheduled.body.quests) {
    const stored = scheduledList.body.find((entry) => entry.id === quest.id);
    assert.deepEqual([stored?.scheduledDate, stored?.startTime, stored?.endTime],
      [quest.scheduledDate, quest.startTime, quest.endTime]);
  }
  ok("scheduled dates and times persist for Calendar");

  const twelve = await call<{ source: string; quests: Quest[] }>("POST", "/quests/generate", { text: twelveTaskPlan });
  assert.equal(twelve.status, 201);
  assert.equal(twelve.body.quests.length, 12);
  assert.deepEqual(twelve.body.quests.map((quest) => quest.scheduledDate), twelveTaskDates);
  assert.deepEqual([twelve.body.quests[10].startTime, twelve.body.quests[10].endTime], ["18:00", "19:00"]);
  assert.deepEqual([twelve.body.quests[11].startTime, twelve.body.quests[11].endTime], ["14:00", "17:00"]);
  twelve.body.quests.forEach((quest) => createdIds.push(quest.id));
  const twelveStored = await call<Quest[]>("GET", "/quests");
  for (const quest of twelve.body.quests) {
    const stored = twelveStored.body.find((entry) => entry.id === quest.id);
    assert.deepEqual([stored?.scheduledDate, stored?.startTime, stored?.endTime],
      [quest.scheduledDate, quest.startTime, quest.endTime]);
  }
  ok("all twelve scheduled quests returned and persisted");

  // Manual quests skip Gemini and get the template line.
  const manual = await call<Quest>("POST", "/quests", { title: "Water the plants", difficulty: "easy" });
  assert.equal(manual.status, 201);
  createdIds.push(manual.body.id);
  assert.equal(manual.body.completionLine, "You finished Water the plants! The world feels a little brighter.");
  ok(`POST /quests -> template line "${manual.body.completionLine}"`);

  // Completion returns the same line; a repeat completion is 409 with no quest/line.
  const target = generated.body.quests[0];
  const completed = await call<{ quest: Quest; player: Player }>("POST", `/quests/${target.id}/complete`);
  assert.equal(completed.status, 200);
  assert.equal(completed.body.quest.completed, true);
  assert.equal(completed.body.quest.completionLine, target.completionLine);
  assert.equal(completed.body.player.xp, startPlayer.xp + getRewards(target.difficulty).xpReward);
  ok(`POST /quests/:id/complete -> "${completed.body.quest.completionLine}"`);

  const again = await call("POST", `/quests/${target.id}/complete`);
  assert.equal(again.status, 409);
  assert.equal(again.body.quest, undefined);
  ok("repeat completion -> 409, no line");

  // Earn coins for the purchase checks: a boss quest pays 100.
  const bonus = await call<Quest>("POST", "/quests", { title: "Shop test bonus", difficulty: "boss" });
  createdIds.push(bonus.body.id);
  assert.equal((await call("POST", `/quests/${bonus.body.id}/complete`)).status, 200);

  // Shop catalog: exactly the shared CATALOG (same IDs, names, prices, order), incl. pet items and colour variants.
  const items = await call<Item[]>("GET", "/items");
  assert.equal(items.status, 200);
  assert.deepEqual(items.body.map((i) => [i.id, i.name, i.type, i.price]), CATALOG.map((i) => [i.id, i.name, i.type, i.price]));
  for (const [id, name, price] of PET_ITEMS) {
    const item = items.body.find((entry) => entry.id === id);
    assert.deepEqual(item && [item.name, item.type, item.price], [name, "furniture", price], `bad catalog entry for ${id}`);
  }
  ok(`GET /items -> ${items.body.length} items, same as CATALOG (incl. ${PET_ITEMS.length} pet items)`);

  // Buy one pet item and one colour variant: each charged once, a repeat is rejected.
  async function buyOnce(candidates: Item[], label: string) {
    const before = (await call<Player>("GET", "/player")).body;
    const item = candidates.find((entry) => !before.ownedItems.includes(entry.id) && entry.price <= before.coins);
    assert.ok(item, `no unowned ${label} affordable with ${before.coins} coins`);
    const bought = await call<{ item: Item; player: Player }>("POST", "/shop/purchase", { itemId: item.id });
    assert.equal(bought.status, 200);
    purchasedItemIds.push(item.id);
    assert.equal(bought.body.player.coins, before.coins - item.price);
    assert.ok(bought.body.player.ownedItems.includes(item.id));
    const rebuy = await call("POST", "/shop/purchase", { itemId: item.id });
    assert.equal(rebuy.status, 409);
    const after = (await call<Player>("GET", "/player")).body;
    assert.equal(after.coins, before.coins - item.price, "coins charged more than once");
    assert.equal(after.ownedItems.filter((id) => id === item.id).length, 1);
    ok(`POST /shop/purchase ${item.id} -> coins ${before.coins} -> ${after.coins}; repeat -> 409, charged once`);
  }
  await buyOnce(items.body.filter((i) => i.id.startsWith("pet-")), "pet item");
  await buyOnce(items.body.filter((i) => i.id.includes("-") && !i.id.startsWith("pet-") && !i.stackable).sort((a, b) => a.price - b.price), "colour variant");

  // Stackable (farm) items: every purchase adds one and charges once, via the /buy alias.
  const stackable = items.body.filter((i) => i.stackable).sort((a, b) => a.price - b.price)[0];
  assert.equal(stackable.type, "farm");
  assert.ok(items.body.filter((i) => !i.stackable).every((i) => i.type !== "farm"), "non-farm items must not be stackable");
  purchasedItemIds.push(stackable.id);
  const s0 = (await call<Player>("GET", "/player")).body;
  const have = s0.itemCounts[stackable.id] ?? 0;
  for (let n = 1; n <= 3; n++) {
    const res = await call<{ player: Player }>("POST", "/shop/buy", { itemId: stackable.id });
    assert.equal(res.status, 200, `stackable purchase ${n}`);
    assert.equal(res.body.player.itemCounts[stackable.id], have + n);
  }
  const s1 = (await call<Player>("GET", "/player")).body;
  assert.equal(s1.itemCounts[stackable.id], have + 3);
  assert.equal(s1.coins, s0.coins - 3 * stackable.price, "stackable charged once per purchase");
  assert.equal(s1.ownedItems.filter((id) => id === stackable.id).length, 1, "ownedItems stays distinct");
  ok(`3x POST /shop/buy ${stackable.id} -> count ${have} -> ${s1.itemCounts[stackable.id]}, coins ${s0.coins} -> ${s1.coins}`);

  // Two purchases at the same time: both stackable buys land; a regular item is sold only once.
  const both = await Promise.all([1, 2].map(() => call("POST", "/shop/buy", { itemId: stackable.id })));
  assert.deepEqual(both.map((r) => r.status), [200, 200]);
  const s2 = (await call<Player>("GET", "/player")).body;
  assert.equal(s2.itemCounts[stackable.id], have + 5);
  assert.equal(s2.coins, s1.coins - 2 * stackable.price);
  ok(`concurrent stackable x2 -> count ${s2.itemCounts[stackable.id]}, coins ${s1.coins} -> ${s2.coins}`);

  const single = items.body.filter((i) => !i.stackable && !s2.ownedItems.includes(i.id) && i.price <= s2.coins).sort((a, b) => a.price - b.price)[0];
  assert.ok(single, `no unowned regular item affordable with ${s2.coins} coins`);
  purchasedItemIds.push(single.id);
  const race = await Promise.all([1, 2].map(() => call("POST", "/shop/buy", { itemId: single.id })));
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
  const s3 = (await call<Player>("GET", "/player")).body;
  assert.equal(s3.coins, s2.coins - single.price, "regular item charged once under concurrency");
  assert.equal(s3.itemCounts[single.id], 1);
  ok(`concurrent regular x2 ${single.id} -> 200 + 409, coins ${s2.coins} -> ${s3.coins}, count 1`);

  // Limited stackable items (chickens, max 5): buys stop at the limit, and the last free slot is
  // sold once even when two purchases race for it. A refused buy charges nothing.
  const limited = items.body.find((i) => i.maxQuantity !== undefined);
  assert.ok(limited && limited.stackable, "a limited stackable item is in the catalog");
  const max = limited.maxQuantity!;
  purchasedItemIds.push(limited.id);
  for (let earned = (await call<Player>("GET", "/player")).body.coins; earned < max * limited.price; earned += 100) {
    const extra = await call<Quest>("POST", "/quests", { title: "Shop limit bonus", difficulty: "boss" });
    createdIds.push(extra.body.id);
    assert.equal((await call("POST", `/quests/${extra.body.id}/complete`)).status, 200);
  }
  let count = (await call<Player>("GET", "/player")).body.itemCounts[limited.id] ?? 0;
  while (count < max - 1) {
    assert.equal((await call("POST", "/shop/buy", { itemId: limited.id })).status, 200);
    count++;
  }
  const l0 = (await call<Player>("GET", "/player")).body;
  const lastSlot = await Promise.all([1, 2].map(() => call("POST", "/shop/buy", { itemId: limited.id })));
  assert.deepEqual(lastSlot.map((r) => r.status).sort(), [200, 409]);
  const full = await call<{ error: string }>("POST", "/shop/buy", { itemId: limited.id });
  assert.equal(full.status, 409);
  const l1 = (await call<Player>("GET", "/player")).body;
  assert.equal(l1.itemCounts[limited.id], max);
  assert.equal(l1.coins, l0.coins - limited.price, "only the purchase that fit was charged");
  ok(`${limited.id} limit ${max}: racing for the last slot -> 200 + 409, then 409 "${full.body.error}"; count ${max}, charged once`);


  if (mode === "tidb") {
    // A quest stored before the column existed (NULL) completes fine and simply has no line.
    const legacy: Quest = {
      id: randomUUID(), userId: DEFAULT_PLAYER_ID, title: "Legacy quest", category: "life",
      difficulty: "easy", estimatedMinutes: 10, ...getRewards("easy"), completed: false,
    };
    await createQuests([legacy]);
    createdIds.push(legacy.id);
    const legacyDone = await call<{ quest: Quest }>("POST", `/quests/${legacy.id}/complete`);
    assert.equal(legacyDone.status, 200);
    assert.equal(Object.hasOwn(legacyDone.body.quest, "completionLine"), false);
    ok("legacy quest (NULL completion_line) completes without a line");
  }

  console.log(`All API checks passed (${mode}).`);
} catch (error) {
  console.error("✗", error, `\n--- server log ---\n${serverLog}`);
  process.exitCode = 1;
} finally {
  child.kill();
  if (mode === "tidb") {
    if (createdIds.length) await getPool().query("DELETE FROM quests WHERE id IN (?)", [createdIds]);
    // Put item ownership back as it was: restore earlier quantities, remove items that were new.
    for (const id of new Set(purchasedItemIds)) {
      const before = startPlayer?.itemCounts?.[id];
      if (before) await getPool().query("UPDATE user_items SET quantity = ? WHERE user_id = ? AND item_id = ?", [before, DEFAULT_PLAYER_ID, id]);
      else await getPool().query("DELETE FROM user_items WHERE user_id = ? AND item_id = ?", [DEFAULT_PLAYER_ID, id]);
    }
    if (startPlayer) {
      await getPool().query("UPDATE players SET xp = ?, coins = ?, level = ? WHERE id = ?",
        [startPlayer.xp, startPlayer.coins, startPlayer.level, startPlayer.id]);
    }
    await getPool().end();
    ok("TiDB cleanup: test quests and purchases deleted, player-1 restored");
  }
}
