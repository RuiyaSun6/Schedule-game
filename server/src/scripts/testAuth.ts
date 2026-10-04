import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { login, passwordHashForTests, register, revokeSession, sessionUser } from "../services/authService.js";
import { getPlayer } from "../services/storageService.js";
import { createQuest, completeQuest, listQuests } from "../services/questService.js";
import { createHabit, getHabitBoard } from "../services/habitService.js";

async function rejected(input: { username: string; email: string; password: string; confirmPassword: string }) {
  const result = await register(input);
  assert.ok("error" in result);
  return result.error;
}

test("registration, uniqueness, password hashing, login, logout, and isolated new progress", async () => {
  const suffix = randomUUID().slice(0, 8);
  const password = "correct-horse-123";
  const first = await register({ username: `alice_${suffix}`, email: `alice_${suffix}@example.test`, password, confirmPassword: password });
  assert.ok("user" in first);
  assert.notEqual(first.user.userId, "player-1");
  assert.equal(getPlayer(first.user.userId).xp, 0);
  assert.equal(getPlayer(first.user.userId).level, 1);
  assert.equal(getPlayer(first.user.userId).coins, 0);
  assert.deepEqual(getPlayer(first.user.userId).ownedItems, []);
  assert.deepEqual(await listQuests(first.user.userId), []);
  assert.deepEqual((await getHabitBoard(new Date("2026-10-05"), first.user.userId)).habits, []);
  const stored = passwordHashForTests(first.user.userId);
  assert.ok(stored);
  assert.ok(stored.startsWith("scrypt:"));
  assert.ok(!stored.includes(password));
  assert.equal(await rejected({ username: `other_${suffix}`, email: first.user.email.toUpperCase(), password, confirmPassword: password }), "Email already exists.");
  assert.equal(await rejected({ username: first.user.username.toUpperCase(), email: `other_${suffix}@example.test`, password, confirmPassword: password }), "Username already exists.");
  assert.equal(await rejected({ username: "bad", email: "invalid", password, confirmPassword: password }), "Enter a valid email address.");
  assert.equal(await rejected({ username: "valid_name", email: "valid@example.test", password: "short", confirmPassword: "short" }), "Password must be 8–128 characters.");
  assert.equal(await rejected({ username: "valid_name", email: "valid@example.test", password, confirmPassword: "different" }), "Passwords do not match.");
  assert.equal((await login(first.user.email, "wrong-pass")), null);
  assert.equal((await login(first.user.email, password))?.user.userId, first.user.userId);
  assert.equal((await login(first.user.username, password))?.user.userId, first.user.userId);
  assert.equal((await sessionUser(first.token))?.userId, first.user.userId);

  const second = await register({ username: `bob_${suffix}`, email: `bob_${suffix}@example.test`, password, confirmPassword: password });
  assert.ok("user" in second);
  assert.notEqual(second.user.userId, first.user.userId);
  const quest = await createQuest("Private task", "easy", "life", 30, first.user.userId);
  assert.equal((await completeQuest(quest.id, second.user.userId)).status, "not_found");
  assert.deepEqual(await listQuests(second.user.userId), []);
  assert.equal((await completeQuest(quest.id, first.user.userId)).status, "completed");
  assert.equal(getPlayer(first.user.userId).xp, 20);
  assert.equal(getPlayer(second.user.userId).xp, 0);
  await createHabit("Read every day", new Date("2026-10-05"), first.user.userId);
  assert.equal((await getHabitBoard(new Date("2026-10-05"), first.user.userId)).habits.length, 1);
  assert.equal((await getHabitBoard(new Date("2026-10-05"), second.user.userId)).habits.length, 0);

  await revokeSession(first.token);
  assert.equal(await sessionUser(first.token), null);
  assert.equal((await sessionUser(second.token))?.userId, second.user.userId);
  assert.equal(getPlayer(first.user.userId).xp, 20); // Logout does not delete progress.
});
