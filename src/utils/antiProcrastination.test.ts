import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getLowEnergyTask,
  handleMissedDayRecovery,
  computeConsistency,
} from './antiProcrastination';
import { DailyPlan } from '../types';

describe('antiProcrastination utilities', () => {
  it('returns appropriate low energy tasks for each energy state', () => {
    const task1 = getLowEnergyTask('tired', 'Prefix Sums');
    assert.strictEqual(task1.durationMinutes, 10);
    assert.ok(task1.title.length > 0);
    assert.strictEqual(task1.actionType, 'read_concept');

    const task2 = getLowEnergyTask('overwhelmed', 'Binary Search');
    assert.strictEqual(task2.durationMinutes, 8);
    assert.strictEqual(task2.actionType, 'explain_algorithm');

    const task3 = getLowEnergyTask('very_busy', 'Dynamic Programming');
    assert.strictEqual(task3.durationMinutes, 10);
  });

  it('handles missed day recovery gracefully without penalty', () => {
    // 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const recovery = handleMissedDayRecovery(threeDaysAgo, 10);
    assert.ok(recovery.daysMissed >= 2);
    assert.strictEqual(recovery.recommendedDayNumber, 10); // preserves current node
    assert.ok(recovery.recoveryNote.includes('Welcome back'));

    // today
    const today = new Date().toISOString().split('T')[0];
    const onTrack = handleMissedDayRecovery(today, 10);
    assert.strictEqual(onTrack.daysMissed, 0);
    assert.strictEqual(onTrack.recommendedDayNumber, 10);
  });

  it('computes consistency statistics and true consecutive streaks', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    const mockHistory: DailyPlan[] = [
      {
        id: 'plan_1',
        date: dayBefore,
        dayNumber: 1,
        mode: 'standard',
        targetMinutes: 45,
        actualMinutes: 45,
        status: 'completed',
        tasks: [],
      },
      {
        id: 'plan_2',
        date: yesterday,
        dayNumber: 2,
        mode: 'standard',
        targetMinutes: 45,
        actualMinutes: 50,
        status: 'completed',
        tasks: [],
      },
      {
        id: 'plan_3',
        date: today,
        dayNumber: 3,
        mode: 'standard',
        targetMinutes: 45,
        actualMinutes: 40,
        status: 'completed',
        tasks: [],
      },
    ];

    const stats = computeConsistency(mockHistory);
    assert.strictEqual(stats.totalActiveDays, 3);
    assert.strictEqual(stats.currentStreak, 3);
    assert.strictEqual(stats.longestStreak, 3);
    assert.strictEqual(stats.totalFocusedMinutes, 135);
  });

  it('returns 0 current streak when inactive for more than a day', () => {
    const mockHistory: DailyPlan[] = [
      {
        id: 'plan_old_1',
        date: '2025-01-01',
        dayNumber: 1,
        mode: 'standard',
        targetMinutes: 45,
        actualMinutes: 45,
        status: 'completed',
        tasks: [],
      },
      {
        id: 'plan_old_2',
        date: '2025-01-02',
        dayNumber: 2,
        mode: 'standard',
        targetMinutes: 45,
        actualMinutes: 45,
        status: 'completed',
        tasks: [],
      },
    ];

    const stats = computeConsistency(mockHistory);
    assert.strictEqual(stats.totalActiveDays, 2);
    assert.strictEqual(stats.currentStreak, 0);
    assert.strictEqual(stats.longestStreak, 2);
  });
});
