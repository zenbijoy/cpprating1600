import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateTodayMinutesProgress } from './timeTracking';
import { ProblemAttempt } from '../types';

function createAttempt(id: string, dateStr: string, timeSpentSeconds: number): ProblemAttempt {
  return {
    id,
    problemId: `prob_${id}`,
    index: 'A',
    name: `Problem ${id}`,
    rating: 800,
    tags: ['implementation'],
    url: 'https://codeforces.com',
    startedAt: `${dateStr}T10:00:00.000Z`,
    endedAt: `${dateStr}T10:20:00.000Z`,
    timeSpentSeconds,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    outcome: 'solved_independently',
    officialVerdict: 'OK',
    selfReported: true,
  };
}

describe('Time Tracking & Daily Minutes Calculation', () => {
  const referenceDate = new Date('2026-10-29T12:00:00Z');
  const todayStr = '2026-10-29';
  const yesterdayStr = '2026-10-28';

  it('returns zero minutes and 0% progress when no attempts exist for today', () => {
    const attempts = [
      createAttempt('old_1', yesterdayStr, 1800), // 30 minutes yesterday
    ];

    const result = calculateTodayMinutesProgress(attempts, 45, referenceDate);

    assert.strictEqual(result.totalSeconds, 0);
    assert.strictEqual(result.totalMinutes, 0);
    assert.strictEqual(result.percent, 0);
    assert.strictEqual(result.clampedPercent, 0);
    assert.strictEqual(result.isGoalMet, false);
    assert.strictEqual(result.remainingMinutes, 45);
    assert.strictEqual(result.excessMinutes, 0);
    assert.strictEqual(result.todayAttemptsCount, 0);
  });

  it('correctly aggregates multiple attempts logged on the current day', () => {
    const attempts = [
      createAttempt('att_1', todayStr, 900),  // 15 minutes
      createAttempt('att_2', todayStr, 1200), // 20 minutes
      createAttempt('att_old', yesterdayStr, 3600), // yesterday (should be ignored)
    ];

    const result = calculateTodayMinutesProgress(attempts, 45, referenceDate);

    // 900 + 1200 = 2100 seconds = 35 minutes
    assert.strictEqual(result.totalSeconds, 2100);
    assert.strictEqual(result.totalMinutes, 35);
    assert.strictEqual(result.todayAttemptsCount, 2);
    assert.strictEqual(result.remainingMinutes, 10);
    assert.strictEqual(result.isGoalMet, false);
    // 35 / 45 = 77.777% -> 78%
    assert.strictEqual(result.percent, 78);
    assert.strictEqual(result.clampedPercent, 78);
  });

  it('detects when the daily goal is exactly met', () => {
    const attempts = [
      createAttempt('att_1', todayStr, 2700), // 45 minutes = 2700s
    ];

    const result = calculateTodayMinutesProgress(attempts, 45, referenceDate);

    assert.strictEqual(result.totalMinutes, 45);
    assert.strictEqual(result.percent, 100);
    assert.strictEqual(result.clampedPercent, 100);
    assert.strictEqual(result.isGoalMet, true);
    assert.strictEqual(result.remainingMinutes, 0);
    assert.strictEqual(result.excessMinutes, 0);
  });

  it('handles exceeding the daily minutes goal correctly', () => {
    const attempts = [
      createAttempt('att_1', todayStr, 3600), // 60 minutes
    ];

    const result = calculateTodayMinutesProgress(attempts, 45, referenceDate);

    assert.strictEqual(result.totalMinutes, 60);
    assert.strictEqual(result.percent, 133);
    assert.strictEqual(result.clampedPercent, 100);
    assert.strictEqual(result.isGoalMet, true);
    assert.strictEqual(result.remainingMinutes, 0);
    assert.strictEqual(result.excessMinutes, 15);
  });

  it('safely handles non-standard goal minutes and malformed attempt data', () => {
    const malformedAttempt: ProblemAttempt = {
      id: 'att_bad',
      problemId: '1A',
      index: 'A',
      name: 'Bad Data',
      tags: [],
      url: '',
      startedAt: `${todayStr}T08:00:00Z`,
      timeSpentSeconds: NaN as unknown as number,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      outcome: 'attempted_gave_up',
      selfReported: true,
    };

    const goodAttempt = createAttempt('att_good', todayStr, 600); // 10 minutes

    const result = calculateTodayMinutesProgress([malformedAttempt, goodAttempt], 0, referenceDate);

    assert.strictEqual(result.totalMinutes, 10);
    // 0 goal minutes should fallback safely to minimum 1 min
    assert.ok(result.percent > 0);
    assert.strictEqual(result.todayAttemptsCount, 2);
  });
});
