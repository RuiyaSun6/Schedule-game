import assert from 'node:assert/strict';
import { test } from 'node:test';
import { questsByDate } from '../src/services/calendarSchedule.ts';

test('accepted October 8 quest appears on October 8, while undated quests use today', () => {
  const scheduled = {
    id: 'math', title: 'Math Homework', scheduledDate: '2026-10-08',
    startTime: '17:00', endTime: '19:00',
  };
  const unscheduled = { id: 'laundry', title: 'Laundry' };
  const byDate = questsByDate([scheduled, unscheduled], '2026-10-04');
  assert.deepEqual(byDate.get('2026-10-08'), [scheduled]);
  assert.deepEqual(byDate.get('2026-10-04'), [unscheduled]);
  assert.equal(byDate.get('2026-10-04')?.includes(scheduled), false);
});

test('all twelve accepted quests appear on October 5 through October 16', () => {
  const quests = Array.from({ length: 12 }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `Task ${index + 1}`,
    scheduledDate: `2026-10-${String(index + 5).padStart(2, '0')}`,
  }));
  quests[10] = { ...quests[10], title: 'Do laundry', startTime: '18:00', endTime: '19:00' };
  quests[11] = { ...quests[11], title: 'Study for my statistics quiz', startTime: '14:00', endTime: '17:00' };
  const byDate = questsByDate(quests, '2026-10-04');
  assert.equal(byDate.size, 12);
  for (const quest of quests) assert.deepEqual(byDate.get(quest.scheduledDate), [quest]);
  assert.equal(byDate.get('2026-10-04'), undefined);
});

test('two accepted quests on October 8 share the same Calendar day', () => {
  const first = { id: 'first', scheduledDate: '2026-10-08', startTime: '10:00' };
  const second = { id: 'second', scheduledDate: '2026-10-08', startTime: '18:00' };
  assert.deepEqual(questsByDate([second, first], '2026-10-04').get('2026-10-08'), [first, second]);
});
