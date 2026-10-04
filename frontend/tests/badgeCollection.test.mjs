import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BADGE_DEFINITIONS, collectBadges } from '../src/services/badgeCollection.ts';

const globalIds = [
  'new-beginning', 'dedicated', 'on-fire', 'perfect-week', 'balanced-life',
  'never-give-up', 'habit-master', 'lifequest-master',
];
const reward = { xp: 20, coins: 10, badge: 'Test Badge' };
function entry(id, state = 'locked', progress = 0, required = 1) {
  return { id, name: id, description: `${id} requirement`, progress, required,
    unit: 'steps', reward, state };
}
function board(overrides = {}) {
  return {
    habits: [], milestones: [],
    achievements: globalIds.map((id) => entry(`global:${id}`)),
    claimedIds: [], ...overrides,
  };
}
const badge = (collection, id) => collection.find((item) => item.id === id);

test('a new player sees all eight global and four milestone badges as locked', () => {
  const badges = collectBadges(board());
  assert.equal(BADGE_DEFINITIONS.length, 12);
  assert.equal(badges.length, 12);
  assert.deepEqual(badges.slice(0, 8).map((item) => item.name), [
    'New Beginning', 'Dedicated', 'On Fire', 'Perfect Week', 'Balanced Life',
    'Never Give Up', 'Habit Master', 'LifeQuest Master',
  ]);
  assert.deepEqual(badges.slice(8).map((item) => item.name), ['First Week', 'Consistent', 'Habit Builder', 'Long-Term Habit']);
  assert.ok(badges.every((item) => !item.earned));
  assert.equal(badge(badges, 'milestone:first-week').description.length > 0, true);
});

test('every collectible has its own pixel-art symbol', () => {
  assert.equal(new Set(BADGE_DEFINITIONS.map(({ icon }) => icon)).size, 12);
  assert.ok(BADGE_DEFINITIONS.every(({ icon }) => /^[a-z-]+$/.test(icon)));
});

test('ready rewards stay locked in the collection until their claim ID exists', () => {
  const data = board({ achievements: globalIds.map((id) => entry(`global:${id}`, id === 'on-fire' ? 'ready' : 'locked', 7, 7)) });
  const before = badge(collectBadges(data), 'global:on-fire');
  assert.equal(before.ready, true);
  assert.equal(before.earned, false);
  assert.equal(before.progress, 7);
  const after = badge(collectBadges({ ...data, claimedIds: ['global:on-fire'] }), 'global:on-fire');
  assert.equal(after.earned, true);
});

test('claimed milestone types appear once even when several habits have earned them', () => {
  const data = board({
    milestones: [
      { habitId: 'h1', title: 'Gym', entries: [entry('habit:h1:first-week', 'claimed', 1)] },
      { habitId: 'h2', title: 'Read', entries: [entry('habit:h2:first-week', 'ready', 1)] },
    ],
    claimedIds: ['habit:h1:first-week'],
  });
  const badges = collectBadges(data);
  assert.equal(badges.filter((item) => item.id === 'milestone:first-week').length, 1);
  assert.equal(badge(badges, 'milestone:first-week').earned, true);
  assert.deepEqual(badge(badges, 'milestone:first-week').earnedFrom, ['Gym']);
  const both = collectBadges({ ...data, claimedIds: ['habit:h1:first-week', 'habit:h2:first-week'] });
  assert.equal(both.length, 12);
  assert.deepEqual(badge(both, 'milestone:first-week').earnedFrom, ['Gym', 'Read']);
});

test('badge ownership survives a normal board reload and collection exposes no claim action', () => {
  const data = board({ claimedIds: ['global:dedicated', 'habit:h1:consistent'],
    milestones: [{ habitId: 'h1', title: 'Study', entries: [entry('habit:h1:consistent', 'claimed', 2, 2)] }] });
  const reloaded = JSON.parse(JSON.stringify(data));
  const badges = collectBadges(reloaded);
  assert.equal(badge(badges, 'global:dedicated').earned, true);
  assert.equal(badge(badges, 'milestone:consistent').earned, true);
  assert.ok(badges.every((item) => !('claim' in item) && !('onClaim' in item)));
  assert.deepEqual(reloaded.claimedIds, data.claimedIds);
});
