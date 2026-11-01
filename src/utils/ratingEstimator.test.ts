import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTheoreticalRating, simulateRatingProgression } from './ratingEstimator';
import { ProblemAttempt } from '../types';

test('calculateTheoreticalRating returns baseline for 0 solves', () => {
  const result = calculateTheoreticalRating([], 800);
  assert.equal(result.estimatedRating, 800);
  assert.equal(result.confidenceLevel, 'low');
  assert.equal(result.totalQualifiedSolves, 0);
  assert.equal(result.pointsTo1600, 800);
  assert.equal(result.percentTowardsTarget, 0); // At 800 base, 0% of the 800-1600 journey is completed
});

test('calculateTheoreticalRating percentTowardsTarget calculates properly along 800 to 1600 range', () => {
  const at800 = calculateTheoreticalRating([], 800, 800);
  assert.equal(at800.percentTowardsTarget, 0);

  const at1200 = calculateTheoreticalRating([], 800, 1200);
  assert.equal(at1200.percentTowardsTarget, 50); // (1200 - 800) / (1600 - 800) = 50%

  const at1600 = calculateTheoreticalRating([], 800, 1600);
  assert.equal(at1600.percentTowardsTarget, 100);
});

test('calculateTheoreticalRating increases with higher difficulty solves and volume', () => {
  const attempts: ProblemAttempt[] = [
    {
      id: 'a1',
      problemId: '100A',
      index: 'A',
      name: 'Prob 1',
      rating: 1200,
      tags: ['greedy'],
      url: '',
      startedAt: '2026-10-25T10:00:00Z',
      timeSpentSeconds: 1200,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      officialVerdict: 'OK',
      outcome: 'solved_independently',
      selfReported: false,
    },
    {
      id: 'a2',
      problemId: '100B',
      index: 'B',
      name: 'Prob 2',
      rating: 1200,
      tags: ['greedy'],
      url: '',
      startedAt: '2026-10-26T10:00:00Z',
      timeSpentSeconds: 1200,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      officialVerdict: 'OK',
      outcome: 'solved_independently',
      selfReported: false,
    },
    {
      id: 'a3',
      problemId: '100C',
      index: 'C',
      name: 'Prob 3',
      rating: 1300,
      tags: ['math'],
      url: '',
      startedAt: '2026-10-27T10:00:00Z',
      timeSpentSeconds: 1500,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      officialVerdict: 'OK',
      outcome: 'solved_independently',
      selfReported: false,
    },
    {
      id: 'a4',
      problemId: '100D',
      index: 'D',
      name: 'Prob 4',
      rating: 1300,
      tags: ['dp'],
      url: '',
      startedAt: '2026-10-28T10:00:00Z',
      timeSpentSeconds: 1800,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      officialVerdict: 'OK',
      outcome: 'solved_independently',
      selfReported: false,
    },
  ];

  const result = calculateTheoreticalRating(attempts, 800);
  assert.ok(result.estimatedRating > 800, `Expected > 800, got ${result.estimatedRating}`);
  assert.equal(result.totalQualifiedSolves, 4);
  assert.ok(result.topSolvesAverage >= 1200, `Expected topSolvesAverage >= 1200, got ${result.topSolvesAverage}`);
  assert.ok(result.pointsTo1600 < 800);
});

test('simulateRatingProgression correctly models future rating progression', () => {
  const initialAttempts: ProblemAttempt[] = [];
  const baseResult = calculateTheoreticalRating(initialAttempts, 800);

  const simulatedResult = simulateRatingProgression(
    initialAttempts,
    [
      { rating: 1200, count: 5, independent: true },
      { rating: 1300, count: 5, independent: true },
      { rating: 1400, count: 5, independent: true },
    ],
    800
  );

  assert.ok(simulatedResult.estimatedRating > baseResult.estimatedRating);
  assert.ok(simulatedResult.estimatedRating >= 1150);
  assert.equal(simulatedResult.totalQualifiedSolves, 15);
  assert.equal(simulatedResult.confidenceLevel, 'moderate');
});
