import test from 'node:test';
import assert from 'node:assert/strict';
import { compute30DayStreak } from './streak';
import { ProblemAttempt, DailyPlan } from '../types';

test('compute30DayStreak returns 30 days of data and accurate streak counts', () => {
  const refDate = new Date('2026-10-29T12:00:00Z');

  // Attempt on 2026-10-29 (today)
  const attempts: ProblemAttempt[] = [
    {
      id: 'att-1',
      problemId: '1000A',
      index: 'A',
      name: 'BerSU Ball',
      rating: 1200,
      tags: ['two pointers'],
      url: 'https://codeforces.com/problemset/problem/1000/A',
      startedAt: '2026-10-29T10:00:00Z',
      endedAt: '2026-10-29T10:30:00Z',
      timeSpentSeconds: 1800,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      officialVerdict: 'OK',
      outcome: 'solved_independently',
      selfReported: false,
      approachNotes: 'Clean two pointer',
    },
    {
      id: 'att-2',
      problemId: '1000B',
      index: 'B',
      name: 'Registration System',
      rating: 1300,
      tags: ['hashing'],
      url: 'https://codeforces.com/problemset/problem/1000/B',
      startedAt: '2026-10-28T10:00:00Z',
      endedAt: '2026-10-28T10:25:00Z',
      timeSpentSeconds: 1500,
      hintsUsedCount: 1,
      highestHintLevel: 1,
      officialVerdict: 'OK',
      outcome: 'solved_with_hints',
      selfReported: false,
      approachNotes: 'Hash table lookups',
    },
  ];

  const plans: DailyPlan[] = [
    {
      id: 'plan-10',
      date: '2026-10-27',
      dayNumber: 10,
      mode: 'minimum',
      targetMinutes: 15,
      actualMinutes: 15,
      tasks: [
        {
          id: 't-rev',
          title: 'Review 3 mistake cards',
          description: 'Review cards to retain patterns',
          category: 'recovery',
          estimatedMinutes: 10,
          completed: true,
        },
      ],
      status: 'completed',
    },
  ];

  const analysis = compute30DayStreak(attempts, plans, refDate);

  assert.equal(analysis.days.length, 30);
  assert.equal(analysis.totalSolvedLast30, 2);
  assert.equal(analysis.activeDaysLast30, 3); // 2 full practice days + 1 recovery day

  // Today (Oct 29) should be full practice
  const todayItem = analysis.days[analysis.days.length - 1];
  assert.equal(todayItem.isToday, true);
  assert.equal(todayItem.status, 'full_practice');
  assert.equal(todayItem.solvedCount, 1);

  // Yesterday (Oct 28) should be full practice
  const yesterdayItem = analysis.days[analysis.days.length - 2];
  assert.equal(yesterdayItem.status, 'full_practice');

  // Day before yesterday (Oct 27) should be recovery
  const twoDaysAgo = analysis.days[analysis.days.length - 3];
  assert.equal(twoDaysAgo.status, 'recovery');

  // Streak should be 3 days unbroken
  assert.ok(analysis.currentStreak >= 3, `currentStreak should be at least 3, got ${analysis.currentStreak}`);
  assert.ok(analysis.longestStreak >= 3, `longestStreak should be at least 3, got ${analysis.longestStreak}`);
});
