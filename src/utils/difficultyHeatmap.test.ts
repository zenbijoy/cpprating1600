import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateDifficultyHeatmap,
  getBandForRating,
  DIFFICULTY_BANDS,
} from './difficultyHeatmap';
import { ProblemAttempt } from '../types';

function createMockAttempt(
  id: string,
  rating: number,
  daysAgo: number,
  verdict: 'OK' | 'WRONG_ANSWER' = 'OK'
): ProblemAttempt {
  const date = new Date('2026-10-29T12:00:00Z');
  date.setDate(date.getDate() - daysAgo);

  return {
    id,
    problemId: id,
    index: 'A',
    name: `Test Problem ${id}`,
    rating,
    tags: ['implementation'],
    url: 'https://codeforces.com',
    startedAt: date.toISOString(),
    endedAt: date.toISOString(),
    timeSpentSeconds: 1200,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    outcome: verdict === 'OK' ? 'solved_independently' : 'attempted_gave_up',
    officialVerdict: verdict,
    selfReported: true,
  };
}

describe('Difficulty Heatmap & Plateau Diagnostic Engine', () => {
  it('correctly maps ratings into difficulty bands', () => {
    assert.strictEqual(getBandForRating(800).id, 'band_800_999');
    assert.strictEqual(getBandForRating(900).id, 'band_800_999');
    assert.strictEqual(getBandForRating(1000).id, 'band_1000_1199');
    assert.strictEqual(getBandForRating(1100).id, 'band_1000_1199');
    assert.strictEqual(getBandForRating(1200).id, 'band_1200_1399');
    assert.strictEqual(getBandForRating(1300).id, 'band_1200_1399');
    assert.strictEqual(getBandForRating(1400).id, 'band_1400_1599');
    assert.strictEqual(getBandForRating(1500).id, 'band_1400_1599');
    assert.strictEqual(getBandForRating(1600).id, 'band_1600_plus');
    assert.strictEqual(getBandForRating(1800).id, 'band_1600_plus');
  });

  it('initializes empty heatmap with default bands and buckets', () => {
    const refDate = new Date('2026-10-29T12:00:00Z');
    const data = generateDifficultyHeatmap([], 8, refDate);

    assert.strictEqual(data.bands.length, 5);
    assert.strictEqual(data.buckets.length, 8);
    assert.strictEqual(data.totalAnalyzedSolves, 0);
    assert.strictEqual(data.highestRatingSolved, 0);
    assert.strictEqual(data.diagnostic.status, 'early_stage');

    // Current week should be the last bucket
    assert.strictEqual(data.buckets[7].isCurrent, true);
  });

  it('aggregates problem solves into the appropriate weekly bucket and rating band', () => {
    const refDate = new Date('2026-10-29T12:00:00Z');
    const attempts = [
      createMockAttempt('1', 800, 1), // current week, 800-999
      createMockAttempt('2', 800, 2), // current week, 800-999
      createMockAttempt('3', 1200, 1), // current week, 1200-1399
      createMockAttempt('4', 1000, 10), // previous week (W7), 1000-1199
    ];

    const data = generateDifficultyHeatmap(attempts, 8, refDate);
    assert.strictEqual(data.totalAnalyzedSolves, 4);
    assert.strictEqual(data.highestRatingSolved, 1200);

    const currentBucket = data.buckets[7];
    const prevBucket = data.buckets[6];

    const cellCurrentLow = data.cells[`${currentBucket.id}_band_800_999`];
    assert.strictEqual(cellCurrentLow.solvedCount, 2);
    assert.strictEqual(cellCurrentLow.intensity, 2); // 2-3 solves = intensity 2

    const cellCurrentMid = data.cells[`${currentBucket.id}_band_1200_1399`];
    assert.strictEqual(cellCurrentMid.solvedCount, 1);
    assert.strictEqual(cellCurrentMid.intensity, 1);

    const cellPrev = data.cells[`${prevBucket.id}_band_1000_1199`];
    assert.strictEqual(cellPrev.solvedCount, 1);
  });

  it('identifies skill plateau when user is trapped grinding 800-900 rating only', () => {
    const refDate = new Date('2026-10-29T12:00:00Z');
    // 6 problems solved in the last 10 days, ALL rated 800 with zero mid/high solves
    const plateauAttempts = [
      createMockAttempt('1', 800, 1),
      createMockAttempt('2', 800, 2),
      createMockAttempt('3', 800, 3),
      createMockAttempt('4', 800, 5),
      createMockAttempt('5', 800, 8),
      createMockAttempt('6', 800, 10),
    ];

    const data = generateDifficultyHeatmap(plateauAttempts, 8, refDate);

    assert.strictEqual(data.diagnostic.status, 'plateau_detected');
    assert.ok(data.diagnostic.riskScore >= 70, 'Risk score should be high for comfort trap');
    assert.ok(data.diagnostic.title.includes('Plateau'));
    assert.strictEqual(data.diagnostic.recommendedNextBand, '1000 - 1199');
  });

  it('identifies healthy upward progression when difficulty expands into 1200-1400', () => {
    const refDate = new Date('2026-10-29T12:00:00Z');
    const progressiveAttempts = [
      createMockAttempt('1', 800, 20),
      createMockAttempt('2', 900, 18),
      createMockAttempt('3', 1000, 12),
      createMockAttempt('4', 1100, 8),
      createMockAttempt('5', 1200, 3),
      createMockAttempt('6', 1300, 1),
    ];

    const data = generateDifficultyHeatmap(progressiveAttempts, 8, refDate);

    assert.strictEqual(data.diagnostic.status, 'healthy_progression');
    assert.ok(data.diagnostic.riskScore <= 20, 'Risk score should be low for healthy upward migration');
    assert.ok(data.diagnostic.title.includes('Healthy'));
    assert.strictEqual(data.highestRatingSolved, 1300);
  });
});
