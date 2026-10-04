import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BADGE_DEFINITIONS, collectBadges } from '../src/services/badgeCollection.ts';
import { buildBoard } from '../../server/src/services/habitRules.ts';

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
  assert.ok(badges.every((item) => item.state === 'locked' && item.claimId === null));
  assert.equal(badge(badges, 'milestone:first-week').description.length > 0, true);
});

test('every collectible has its own pixel-art symbol', () => {
  assert.equal(new Set(BADGE_DEFINITIONS.map(({ icon }) => icon)).size, 12);
  assert.ok(BADGE_DEFINITIONS.every(({ icon }) => /^[a-z-]+$/.test(icon)));
});

const habit = (id, completionDates = []) => ({ id, userId: 'player-1', title: id,
  description: id, period: 'weekly', targetCount: 7, createdAt: '2026-10-05', completionDates });

test('New Beginning follows the backend locked, ready, and claimed states', () => {
  const locked = badge(collectBadges(buildBoard([], [], '2026-10-05')), 'global:new-beginning');
  assert.equal(locked.state, 'locked');
  assert.equal(locked.claimId, null);
  const readyBoard = buildBoard([habit('a')], [], '2026-10-05');
  assert.equal(readyBoard.achievements.find((item) => item.id === 'global:new-beginning').state, 'ready');
  const ready = badge(collectBadges(readyBoard), 'global:new-beginning');
  assert.equal(ready.state, 'ready');
  assert.equal(ready.claimId, 'global:new-beginning');
  const earned = badge(collectBadges(buildBoard([habit('a')], ['global:new-beginning'], '2026-10-05')), 'global:new-beginning');
  assert.equal(earned.state, 'claimed');
  assert.equal(earned.claimId, null);
});

test('Balanced Life needs check-ins from three habits in the same calendar week', () => {
  const two = [habit('a', ['2026-10-05']), habit('b', ['2026-10-06'])];
  const locked = badge(collectBadges(buildBoard([...two, habit('c', ['2026-10-12'])], [], '2026-10-12')), 'global:balanced-life');
  assert.equal(locked.state, 'locked');
  assert.equal(locked.claimId, null);
  const three = [...two, habit('c', ['2026-10-07'])];
  const ready = badge(collectBadges(buildBoard(three, [], '2026-10-07')), 'global:balanced-life');
  assert.equal(ready.state, 'ready');
  assert.equal(ready.claimId, 'global:balanced-life');
  const earned = badge(collectBadges(buildBoard(three, ['global:balanced-life'], '2026-10-07')), 'global:balanced-life');
  assert.equal(earned.state, 'claimed');
  assert.equal(earned.claimId, null);
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
  assert.equal(badge(badges, 'milestone:first-week').state, 'claimed');
  assert.deepEqual(badge(badges, 'milestone:first-week').earnedFrom, ['Gym']);
  const both = collectBadges({ ...data, milestones: data.milestones.map((group) => ({ ...group,
    entries: group.entries.map((item) => ({ ...item, state: 'claimed' })) })), claimedIds: ['habit:h1:first-week', 'habit:h2:first-week'] });
  assert.equal(both.length, 12);
  assert.deepEqual(badge(both, 'milestone:first-week').earnedFrom, ['Gym', 'Read']);
});

test('milestone badges use a ready reward ID for claiming and claimed state survives reload', () => {
  const readyData = board({ milestones: [
    { habitId: 'h1', title: 'Study', entries: [entry('habit:h1:consistent', 'locked', 2, 2)] },
    { habitId: 'h2', title: 'Gym', entries: [entry('habit:h2:consistent', 'ready', 2, 2)] },
  ] });
  const ready = badge(collectBadges(readyData), 'milestone:consistent');
  assert.equal(ready.state, 'ready');
  assert.equal(ready.claimId, 'habit:h2:consistent');
  const data = board({ achievements: globalIds.map((id) => entry(`global:${id}`, id === 'dedicated' ? 'claimed' : 'locked')),
    claimedIds: ['global:dedicated', 'habit:h1:consistent'],
    milestones: [{ habitId: 'h1', title: 'Study', entries: [entry('habit:h1:consistent', 'claimed', 2, 2)] }] });
  const reloaded = JSON.parse(JSON.stringify(data));
  const badges = collectBadges(reloaded);
  assert.equal(badge(badges, 'global:dedicated').state, 'claimed');
  assert.equal(badge(badges, 'milestone:consistent').state, 'claimed');
  assert.equal(badges.filter((item) => item.state === 'claimed').length, 2);
  assert.ok(badges.every((item) => !('onClaim' in item)));
  assert.deepEqual(reloaded.claimedIds, data.claimedIds);
});
