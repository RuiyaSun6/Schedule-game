import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateLevel, xpAtLevel, xpRequiredForLevel } from '../src/services/levelProgression.ts';

test('XP progress uses the same cumulative thresholds through level eight', () => {
  const requirements = [300, 500, 800, 1200, 1600, 2000, 2400];
  let cumulative = 0;
  for (const [index, needed] of requirements.entries()) {
    const level = index + 1;
    assert.equal(xpRequiredForLevel(level), needed);
    assert.equal(xpAtLevel(level), cumulative);
    assert.equal(calculateLevel(cumulative + needed - 1), level);
    cumulative += needed;
    assert.equal(calculateLevel(cumulative), level + 1);
  }
});
