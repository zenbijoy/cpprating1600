import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateCommunityBenchmarks,
  getCommunityAverageRating,
  getCommunityAverageSolves,
  getTopQuartileRating,
} from './communityBenchmarks';
import { ProblemAttempt, UserGoal } from '../types';

function createMockAttempt(id: string, rating: number): ProblemAttempt {
  return {
    id,
    problemId: id,
    index: 'A',
    name: `Problem ${id}`,
    rating,
    tags: ['math'],
    url: 'https://codeforces.com',
    startedAt: '2026-10-25T10:00:00Z',
    endedAt: '2026-10-25T10:20:00Z',
    timeSpentSeconds: 1200,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    outcome: 'solved_independently',
    officialVerdict: 'OK',
    selfReported: true,
  };
}

describe('Community Benchmarks Comparison Engine', () => {
  it('generates monotonic community average curves from 800 to 1600', () => {
    assert.strictEqual(getCommunityAverageRating(0), 800);
    assert.strictEqual(getCommunityAverageRating(180), 1600);

    const r30 = getCommunityAverageRating(30);
    const r60 = getCommunityAverageRating(60);
    const r90 = getCommunityAverageRating(90);
    const r120 = getCommunityAverageRating(120);

    assert.ok(r30 < r60, 'Rating at Day 60 should exceed Day 30');
    assert.ok(r60 < r90, 'Rating at Day 90 should exceed Day 60');
    assert.ok(r90 < r120, 'Rating at Day 120 should exceed Day 90');
    assert.ok(r120 < 1600, 'Rating at Day 120 should be under 1600');
  });

  it('generates cumulative solves benchmark curve ending around 240 solves', () => {
    assert.strictEqual(getCommunityAverageSolves(0), 0);
    const s180 = getCommunityAverageSolves(180);
    assert.ok(s180 >= 230 && s180 <= 250, 'Average solves at Day 180 should be ~240');
  });

  it('calculates baseline comparison on Day 1 with zero solves', () => {
    const goal: UserGoal = {
      targetRating: 1600,
      totalDays: 180,
      currentDay: 1,
      dailyMinutes: 45,
      availableDays: [1, 2, 3, 4, 5, 6],
      preferredHour: '20:00',
      baselineLevel: 'complete_beginner',
      currentPhase: 1,
      personalMotivation: 'Reach 1600 rating',
      examWeeksActive: false,
      startDate: '2026-10-25',
    };

    const result = calculateCommunityBenchmarks([], goal);

    assert.strictEqual(result.currentDay, 1);
    assert.strictEqual(result.userSolvedCount, 0);
    assert.strictEqual(result.points.length, 13);
    assert.strictEqual(result.points[0].day, 0);
    assert.strictEqual(result.points[12].day, 180);
  });

  it('identifies ahead-of-cohort pace when user velocity and solves exceed community average', () => {
    const goal: UserGoal = {
      targetRating: 1600,
      totalDays: 180,
      currentDay: 20,
      dailyMinutes: 45,
      availableDays: [1, 2, 3, 4, 5, 6],
      preferredHour: '20:00',
      baselineLevel: 'complete_beginner',
      currentPhase: 1,
      personalMotivation: 'Reach 1600 rating',
      examWeeksActive: false,
      startDate: '2026-10-09',
    };

    // User has 35 solves on Day 20 (community average is only ~20 solves)
    const attempts = Array.from({ length: 35 }, (_, i) =>
      createMockAttempt(`p_${i}`, 950)
    );

    const result = calculateCommunityBenchmarks(attempts, goal);

    assert.strictEqual(result.paceStatus, 'ahead');
    assert.ok(result.solvesDelta > 0, 'Solves delta must be positive');
    assert.ok(result.cohortPercentile > 60, 'Cohort percentile should be above 60th');
    assert.ok(result.insights.includes('outpacing'));
  });

  it('identifies lagging pace when solves are behind community average', () => {
    const goal: UserGoal = {
      targetRating: 1600,
      totalDays: 180,
      currentDay: 75,
      dailyMinutes: 45,
      availableDays: [1, 2, 3, 4, 5, 6],
      preferredHour: '20:00',
      baselineLevel: 'complete_beginner',
      currentPhase: 1,
      personalMotivation: 'Reach 1600 rating',
      examWeeksActive: false,
      startDate: '2026-08-15',
    };

    // Only 10 solves on Day 75 (community average is ~85)
    const attempts = Array.from({ length: 10 }, (_, i) =>
      createMockAttempt(`p_${i}`, 800)
    );

    const result = calculateCommunityBenchmarks(attempts, goal);

    assert.strictEqual(result.paceStatus, 'behind');
    assert.ok(result.solvesDelta < -30);
    assert.ok(result.cohortPercentile < 50);
  });
});
