import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasCompletedTutorial, markTutorialComplete, tutorialSteps, tutorialStorageKey } from '../src/services/tutorial.ts';

test('completion is saved for each player and survives a new read', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(hasCompletedTutorial(storage, 'new-player'), false);
  markTutorialComplete(storage, 'new-player');
  assert.equal(hasCompletedTutorial(storage, 'new-player'), true);
  assert.equal(hasCompletedTutorial(storage, 'another-player'), false);
  assert.equal(values.get(tutorialStorageKey('new-player')), 'done');
});

test('the guide visits real bedroom and World controls in order', () => {
  assert.equal(tutorialSteps.length, 10);
  assert.deepEqual(tutorialSteps.map((step) => step.target), [
    undefined, 'ai-plan', 'quests', 'calendar', 'world',
    'world-viewport', 'move-buildings', 'home', 'shop', undefined,
  ]);
  assert.deepEqual(tutorialSteps.map((step) => step.route), [
    '/home', '/home', '/home', '/home', '/home',
    '/world', '/world', '/world', '/home', '/home',
  ]);
});
