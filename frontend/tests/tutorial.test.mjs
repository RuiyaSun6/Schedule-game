import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { hasCompletedTutorial, markTutorialComplete, tutorialSteps, tutorialStorageKey } from '../src/services/tutorial.ts';

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

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

test('the guide follows the planner, World, and Home journey', () => {
  assert.equal(tutorialSteps.length, 18);
  assert.deepEqual(tutorialSteps.map((step) => step.target), [
    undefined, 'weekly-plan', 'generate-quests', 'long-term-habits', 'quests', 'calendar', 'world',
    'world-viewport', 'furniture-shop', 'building-shop', 'move-buildings', 'return-home', 'home',
    'computer', 'reward-board', 'backpack', 'move-objects', undefined,
  ]);
  assert.deepEqual(tutorialSteps.map((step) => step.route), [
    '/home', '/home', '/home', '/home', '/home', '/home', '/home',
    '/world', '/world', '/world', '/world', '/world', '/world',
    '/home', '/home', '/home', '/home', '/home',
  ]);
  assert.deepEqual(tutorialSteps.filter((step) => step.target === 'furniture-shop').map((step) => step.route), ['/world']);
  assert.equal(new Set(tutorialSteps.map((step) => step.target).filter(Boolean)).size, tutorialSteps.filter((step) => step.target).length);
  assert.deepEqual(tutorialSteps.slice(1, 6).map((step) => step.computerTab), ['plan', 'plan', 'plan', 'quests', 'calendar']);
  assert.match(tutorialSteps.find((step) => step.target === 'return-home').text, /camera/);
  assert.match(tutorialSteps.find((step) => step.target === 'return-home').text, /does not enter/);
});

test('every scene and planner spotlight is attached to a real control or section', () => {
  const sources = {
    'pages/WorldPage.tsx': ['world-viewport', 'move-buildings', 'home'],
    'components/GameHudActions.tsx': ['furniture-shop', 'backpack', 'return-home'],
    'components/BuildingShopButton.tsx': ['building-shop'],
    'scenes/HomeScene.tsx': ['computer', 'reward-board', 'move-objects', 'world'],
    'components/DailyPlanner.tsx': ['weekly-plan', 'generate-quests'],
    'components/HabitPlanner.tsx': ['long-term-habits'],
  };
  for (const [file, targets] of Object.entries(sources)) {
    const content = source(file);
    for (const target of targets) assert.ok(content.includes(`"${target}"`), `${file} is missing ${target}`);
  }
  assert.match(source('components/GameHudActions.tsx'), /data-tutorial="return-home"/);
  assert.match(source('components/GameHudActions.tsx'), /aria-label="Open Furniture Shop"[^>]*data-tutorial="furniture-shop"/);
  assert.match(source('pages/WorldPage.tsx'), /<GameHudActions onOpenBuildings=/);
  assert.match(source('components/DailyPlanner.tsx'), /<textarea[^>]*data-tutorial="weekly-plan"/);
  assert.match(source('components/HabitPlanner.tsx'), /<section[^>]*data-tutorial="long-term-habits"/);
  assert.match(source('scenes/HomeScene.tsx'), /className="reward-board-wall" data-tutorial="reward-board"/);
  assert.match(source('pages/HomePage.tsx'), /data-tutorial=\{tab === 'quests' \|\| tab === 'calendar' \? tab : undefined\}/);
});

test('navigation, skipping, and HELP replay remain wired to the existing guide', () => {
  const app = source('App.tsx');
  const overlay = source('components/TutorialOverlay.tsx');
  assert.match(app, /if \(location\.pathname !== route\) navigate\(route\)/);
  assert.match(app, /onSkip=\{finishTutorial\}/);
  assert.match(app, /markTutorialComplete\(localStorage, player\.id\)/);
  assert.match(app, /setTutorialIndex\(null\);\s*navigate\('\/home'\)/);
  assert.match(app, /className="tutorial-replay" onClick=\{replayTutorial\}/);
  assert.match(app, /setTutorialIndex\(0\);\s*navigate\('\/home'\)/);
  assert.match(app, /Math\.max\(0, current - 1\)/);
  assert.match(app, /tutorialIndex === tutorialSteps\.length - 1 \? finishTutorial\(\) : setTutorialIndex\(tutorialIndex \+ 1\)/);
  assert.match(overlay, /onClick=\{onBack\}/);
  assert.match(overlay, /onClick=\{onNext\}/);
  assert.match(overlay, /onClick=\{onSkip\}/);
});
