import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computePracticeHeatmap } from './practiceHeatmap';
import { ProblemAttempt } from '../types';

describe('18-Week Practice Activity Heatmap Engine', () => {
  const refDate = new Date('2026-10-30T12:00:00Z');

  it('generates an exact 18-week grid with 7 days per week (126 days)', () => {
    const analysis = computePracticeHeatmap([], [], 300, refDate);
    assert.strictEqual(analysis.weeks.length, 18);
    for (const week of analysis.weeks) {
      assert.strictEqual(week.length, 7);
    }
  });

  it('calculates intensity levels correctly based on minutes', () => {
    const attempts: ProblemAttempt[] = [
      {
        id: 'a1',
        problemId: '4A',
        index: 'A',
        name: 'Watermelon',
        url: '',
        startedAt: '2026-10-30T10:00:00Z',
        endedAt: '2026-10-30T10:20:00Z',
        timeSpentSeconds: 1200, // 20 min -> intensity 1
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
      },
      {
        id: 'a2',
        problemId: '71A',
        index: 'A',
        name: 'Way Too Long Words',
        url: '',
        startedAt: '2026-10-29T10:00:00Z',
        endedAt: '2026-10-29T11:00:00Z',
        timeSpentSeconds: 3600, // 60 min -> intensity 3
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['strings'],
      },
    ];

    const analysis = computePracticeHeatmap(attempts, [], 300, refDate);
    const flatDays = analysis.weeks.flat();

    const todayCell = flatDays.find((d) => d.dateStr === '2026-10-30');
    assert.ok(todayCell);
    assert.strictEqual(todayCell.intensity, 1);
    assert.strictEqual(todayCell.minutes, 20);
    assert.strictEqual(todayCell.solvedCount, 1);

    const yesterdayCell = flatDays.find((d) => d.dateStr === '2026-10-29');
    assert.ok(yesterdayCell);
    assert.strictEqual(yesterdayCell.intensity, 3);
    assert.strictEqual(yesterdayCell.minutes, 60);
  });

  it('calculates current streak accurately across consecutive days', () => {
    const attempts: ProblemAttempt[] = [
      {
        id: 'a1',
        problemId: '4A',
        index: 'A',
        name: 'Watermelon',
        url: '',
        startedAt: '2026-10-30T10:00:00Z',
        timeSpentSeconds: 1800,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
      },
      {
        id: 'a2',
        problemId: '71A',
        index: 'A',
        name: 'Words',
        url: '',
        startedAt: '2026-10-29T10:00:00Z',
        timeSpentSeconds: 1800,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
      },
      {
        id: 'a3',
        problemId: '231A',
        index: 'A',
        name: 'Team',
        url: '',
        startedAt: '2026-10-28T10:00:00Z',
        timeSpentSeconds: 1800,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
      },
    ];

    const analysis = computePracticeHeatmap(attempts, [], 300, refDate);
    assert.strictEqual(analysis.currentStreakDays, 3);
  });

  it('calculates weekly goal progress accurately', () => {
    const attempts: ProblemAttempt[] = [
      {
        id: 'a1',
        problemId: '4A',
        index: 'A',
        name: 'Watermelon',
        url: '',
        startedAt: '2026-10-30T10:00:00Z',
        timeSpentSeconds: 9000, // 150 min
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
      },
    ];

    // Weekly goal 200 min, actual 150 min -> 75%
    const analysis = computePracticeHeatmap(attempts, [], 200, refDate);
    assert.strictEqual(analysis.weeklyGoalPercent, 75);
    assert.strictEqual(analysis.weeklyMinutesActual, 150);
  });

  it('generates recent sessions with formatted relative dates and duration', () => {
    const attempts: ProblemAttempt[] = [
      {
        id: 'a1',
        problemId: '4A',
        index: 'A',
        name: 'Watermelon',
        url: '',
        startedAt: '2026-10-30T10:00:00Z',
        timeSpentSeconds: 2700, // 45 min
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
        approachNotes: 'Checked parity and boundary conditions.',
      },
    ];

    const analysis = computePracticeHeatmap(attempts, [], 300, refDate);
    assert.strictEqual(analysis.recentSessions.length, 1);
    assert.strictEqual(analysis.recentSessions[0].topic, 'Math');
    assert.strictEqual(analysis.recentSessions[0].durationMinutes, 45);
    assert.strictEqual(analysis.recentSessions[0].relativeDate, 'Today');
    assert.ok(analysis.recentSessions[0].notes.includes('parity'));
    assert.strictEqual(analysis.lastSessionText, 'Today — 45 min');
  });
});
