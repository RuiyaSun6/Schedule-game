// Unit tests for the mock quest fallback: npm run test:mock
import assert from "node:assert/strict";
import { test } from "node:test";
import { generateMockQuestDrafts } from "../services/mockQuestGenerator.js";

const VAGUE = /big project|boss battle|study quest|daily challenge/i;

test("shared verb is split: prepare for math exam and physics exam", () => {
  const quests = generateMockQuestDrafts("prepare for math exam and physics exam");
  assert.equal(quests.length, 2);
  assert.match(quests[0].title, /^Math Exam Prep/);
  assert.match(quests[1].title, /^Physics Exam Prep/);
  for (const q of quests) {
    assert.equal(q.category, "study");
    assert.doesNotMatch(q.title, VAGUE);
  }
});

test("comma and 'and' list: do laundry, go to the gym and call mom", () => {
  const quests = generateMockQuestDrafts("do laundry, go to the gym and call mom");
  assert.deepEqual(
    quests.map((q) => [q.category, q.title.split(":")[0]]),
    [
      ["life", "Laundry"],
      ["health", "Gym"],
      ["social", "Call Mom"],
    ],
  );
});

test("single task keeps its specific content", () => {
  const quests = generateMockQuestDrafts("Finish algorithms assignment tonight");
  assert.equal(quests.length, 1);
  assert.match(quests[0].title, /^Algorithms Assignment/);
  assert.equal(quests[0].category, "study");
  assert.equal(quests[0].difficulty, "hard");
});

test("'then' and 'also' split, duration is parsed", () => {
  const quests = generateMockQuestDrafts("I need to go to the gym for 1 hour then read chapter 3, also walk the dog");
  assert.equal(quests.length, 3);
  assert.equal(quests[0].estimatedMinutes, 60);
  assert.match(quests[1].title, /Chapter 3/);
  assert.match(quests[2].title, /^Walk the Dog/);
});

test("titles stay within ~40 characters and never use vague names", () => {
  const quests = generateMockQuestDrafts("prepare for introduction to computer systems final exam, clean the kitchen");
  for (const q of quests) {
    assert.ok(q.title.length <= 40, q.title);
    assert.doesNotMatch(q.title, VAGUE);
  }
});

test("dates and times stay out of titles", () => {
  const quests = generateMockQuestDrafts("go to the gym tomorrow at 7 a.m. and call mom on Friday, math homework on 2030-10-05 from 5 PM to 7 PM");
  assert.deepEqual(quests.map((q) => q.title.split(":")[0]), ["Gym", "Call Mom", "Math Homework"]);
});

test("verb is not inherited across unrelated tasks", () => {
  const quests = generateMockQuestDrafts("study for chem quiz at 3pm, then laundry this Saturday");
  assert.match(quests[0].title, /^Chem Quiz Prep/);
  assert.match(quests[1].title, /^Laundry/);
  assert.equal(quests[1].category, "life");
});
