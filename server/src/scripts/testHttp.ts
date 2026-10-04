import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { getRewards } from "../services/rewardService.js";
import { randomUUID } from "node:crypto";

async function freePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  server.close();
  await once(server, "close");
  return address.port;
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["dist/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), TIDB_HOST: "", GEMINI_API_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
let cookie = "";
let userId = "";
child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });

async function request(path: string, method = "GET", body?: unknown): Promise<{ status: number; data: any }> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0];
  return { status: response.status, data: await response.json() };
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await request("/api/health")).status === 200) { ready = true; break; }
    } catch { /* server still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `HTTP server did not start: ${output}`);

  assert.equal((await request("/api/player")).status, 401);
  const account = await request("/api/auth/register", "POST", { username: `http_${randomUUID().slice(0, 8)}`, email: `http_${randomUUID()}@example.test`, password: "testpass123", confirmPassword: "testpass123" });
  assert.equal(account.status, 201);
  userId = account.data.user.userId;
  assert.equal(Object.hasOwn(account.data.user, "passwordHash"), false);
  assert.ok(cookie.startsWith("lifequest_session="));
  const player = await request("/api/player");
  assert.equal(player.status, 200);
  assert.equal(player.data.id, userId);
  assert.equal(player.data.coins, 0);
  assert.deepEqual((await request("/api/quests")).data, []);
  const items = await request("/api/items");
  assert.equal(items.status, 200);
  assert.equal(items.data.length, 75);
  assert.equal(Object.hasOwn(items.data[0], "owned"), false);
  assert.equal(await request("/api/quests", "POST", { title: "Invalid", difficulty: "unknown" }).then((r) => r.status), 400);
  assert.equal(await request("/api/shop/purchase", "POST", {}).then((r) => r.status), 400);
  assert.equal(await request("/api/quests/generate", "POST", { text: "" }).then((r) => r.status), 400);
  assert.equal(await request("/api/quests/generate", "POST", { text: "gym", userId: "" }).then((r) => r.status), 400);
  const malformed = await fetch(`${base}/api/quests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);

  for (const difficulty of ["easy", "medium", "hard", "boss"] as const) {
    const created = await request("/api/quests", "POST", { title: difficulty, difficulty });
    assert.equal(created.status, 201);
    assert.equal(created.data.userId, userId);
    assert.equal(created.data.xpReward, getRewards(difficulty).xpReward);
    assert.equal(created.data.coinReward, getRewards(difficulty).coinReward);
    if (difficulty === "easy") {
      const completed = await request(`/api/quests/${created.data.id}/complete`, "POST");
      assert.equal(completed.status, 200);
      assert.equal(completed.data.player.xp, 20);
      assert.equal(completed.data.player.coins, 10);
      assert.equal(await request(`/api/quests/${created.data.id}/complete`, "POST").then((r) => r.status), 409);
    }
  }

  assert.equal(await request("/api/quests/generate", "POST", { text: "go to the gym", userId: "other" }).then((r) => r.status), 403);
  const generated = await request("/api/quests/generate", "POST", { text: "go to the gym" });
  assert.equal(generated.status, 201);
  assert.equal(generated.data.source, "mock-fallback");
  assert.equal(generated.data.quests[0].difficulty, "medium");
  assert.equal(generated.data.quests[0].xpReward, 50);
  assert.equal(generated.data.quests[0].coinReward, 25);
  assert.equal((await request("/api/quests")).data.length, 5);
  const generatedCompletion = await request(`/api/quests/${generated.data.quests[0].id}/complete`, "POST");
  assert.equal(generatedCompletion.status, 200);
  assert.equal(generatedCompletion.data.player.xp, 70);
  assert.equal(generatedCompletion.data.player.coins, 35);

  assert.equal(await request("/api/shop/purchase", "POST", { itemId: "unknown" }).then((r) => r.status), 404);
  assert.equal(await request("/api/shop/purchase", "POST", { itemId: "sofa-beige" }).then((r) => r.status), 409);
  // Retired catalog items (garden extras, clothing) are no longer sold.
  assert.equal(await request("/api/shop/purchase", "POST", { itemId: "fountain" }).then((r) => r.status), 404);
  assert.equal(await request("/api/shop/purchase", "POST", { itemId: "hat" }).then((r) => r.status), 404);
  const purchased = await request("/api/shop/purchase", "POST", { itemId: "plant-red-pot" });
  assert.equal(purchased.status, 200);
  assert.equal(purchased.data.player.coins, 15);
  assert.deepEqual(purchased.data.player.ownedItems, ["plant-red-pot"]);
  assert.equal(await request("/api/shop/purchase", "POST", { itemId: "plant-red-pot" }).then((r) => r.status), 409);
  assert.equal((await request("/api/player")).data.coins, 15);
  assert.equal(await request("/api/quests/missing/complete", "POST").then((r) => r.status), 404);
  assert.equal(await request("/api/missing").then((r) => r.status), 404);
  const firstCookie = cookie;
  const firstHabit = await request("/api/habits", "POST", { text: "Read every day" });
  assert.equal(firstHabit.status, 201);
  const other = await request("/api/auth/register", "POST", { username: `other_${randomUUID().slice(0, 8)}`, email: `other_${randomUUID()}@example.test`, password: "testpass123", confirmPassword: "testpass123" });
  assert.equal(other.status, 201);
  assert.notEqual(other.data.user.userId, userId);
  assert.equal((await request("/api/player")).data.xp, 0);
  assert.deepEqual((await request("/api/player")).data.ownedItems, []);
  assert.deepEqual((await request("/api/quests")).data, []);
  assert.deepEqual((await request("/api/habits")).data.habits, []);
  assert.equal(await request(`/api/quests/${generated.data.quests[0].id}/complete`, "POST").then((r) => r.status), 404);
  assert.equal(await request(`/api/habits/${firstHabit.data.habits[0].id}/check-in`, "POST").then((r) => r.status), 404);
  assert.equal(await request("/api/quests/generate", "POST", { text: "gym", userId }).then((r) => r.status), 403);
  const otherCookie = cookie;
  cookie = firstCookie;
  assert.equal((await request("/api/player")).data.id, userId);
  assert.equal((await request("/api/quests")).data.length, 5);
  assert.equal((await request("/api/habits")).data.habits.length, 1);
  assert.equal((await request("/api/auth/session")).data.user.userId, userId);
  assert.equal(await request("/api/auth/login", "POST", { identity: account.data.user.username, password: "wrong-pass" }).then((r) => r.status), 401);
  assert.equal(await request("/api/auth/login", "POST", { identity: account.data.user.username, password: "testpass123" }).then((r) => r.status), 200);
  assert.equal(await request("/api/auth/login", "POST", { identity: account.data.user.email, password: "testpass123" }).then((r) => r.status), 200);
  const logoutCookie = cookie;
  assert.equal(await request("/api/auth/logout", "POST").then((r) => r.status), 200);
  assert.equal(await request("/api/player").then((r) => r.status), 401);
  cookie = logoutCookie;
  assert.equal(await request("/api/auth/session").then((r) => r.status), 401);
  cookie = otherCookie;
  assert.equal((await request("/api/player")).data.id, other.data.user.userId);
  console.log("HTTP authentication, account isolation, logout, Gemini fallback, rewards, and status codes passed.");
} finally {
  child.kill();
}
