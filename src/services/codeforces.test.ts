import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveStats, getRankColor, getRankBg, getSyncCooldownSeconds, calculateRatingDelta } from './codeforces';
import { CFRatingChange, CFSubmissionRecord } from '../types';

test('deriveStats accurately calculates solved counts, accuracy, and bucket distributions', () => {
  const mockSubmissions: CFSubmissionRecord[] = [
    {
      id: 101,
      contestId: 158,
      creationTimeSeconds: 1730000000,
      problem: {
        contestId: 158,
        index: 'A',
        name: 'Next Round',
        rating: 800,
        tags: ['implementation'],
      },
      programmingLanguage: 'GNU C++20',
      verdict: 'OK',
      passedTestCount: 15,
      timeConsumedMillis: 30,
      memoryConsumedBytes: 102400,
    },
    {
      id: 102,
      contestId: 158,
      creationTimeSeconds: 1729990000,
      problem: {
        contestId: 158,
        index: 'A',
        name: 'Next Round',
        rating: 800,
        tags: ['implementation'],
      },
      programmingLanguage: 'GNU C++20',
      verdict: 'WRONG_ANSWER',
      passedTestCount: 2,
    },
    {
      id: 103,
      contestId: 71,
      creationTimeSeconds: 1729980000,
      problem: {
        contestId: 71,
        index: 'A',
        name: 'Way Too Long Words',
        rating: 800,
        tags: ['strings'],
      },
      programmingLanguage: 'Python 3',
      verdict: 'OK',
    },
    {
      id: 104,
      contestId: 279,
      creationTimeSeconds: 1729970000,
      problem: {
        contestId: 279,
        index: 'B',
        name: 'Books',
        rating: 1100,
        tags: ['two pointers', 'binary search'],
      },
      programmingLanguage: 'GNU C++20',
      verdict: 'TIME_LIMIT_EXCEEDED',
      passedTestCount: 12,
    },
  ];

  const stats = deriveStats(mockSubmissions);

  // 1. Total unique problems solved (158A and 71A -> 2)
  assert.equal(stats.totalSolved, 2);

  // 2. Total unique problems attempted (158A, 71A, 279B -> 3)
  assert.equal(stats.totalAttempted, 3);

  // 3. Accuracy percentage (2/3 -> 67%)
  assert.equal(stats.accuracy, 67);

  // 4. Rating buckets
  assert.equal(stats.byRating['800'], 2);

  // 5. Tag distribution
  assert.equal(stats.byTag['implementation'], 1);
  assert.equal(stats.byTag['strings'], 1);

  // 6. Verdict counts
  assert.equal(stats.verdictCounts['OK'], 2);
  assert.equal(stats.verdictCounts['WRONG_ANSWER'], 1);
  assert.equal(stats.verdictCounts['TIME_LIMIT_EXCEEDED'], 1);

  // 7. Language distribution
  assert.equal(stats.byLanguage['GNU C++20'], 3);
  assert.equal(stats.byLanguage['Python 3'], 1);
});

test('getRankColor returns distinct semantic styling for all official CF ranks', () => {
  assert.equal(getRankColor('newbie'), 'text-slate-400');
  assert.equal(getRankColor('pupil'), 'text-green-500');
  assert.equal(getRankColor('specialist'), 'text-cyan-400');
  assert.equal(getRankColor('expert'), 'text-blue-400');
  assert.equal(getRankColor('candidate master'), 'text-violet-400');
  assert.equal(getRankColor('master'), 'text-orange-500');
  assert.equal(getRankColor('grandmaster'), 'text-red-500');
});

test('getRankBg returns proper background classes', () => {
  assert.match(getRankBg('specialist'), /cyan/);
  assert.match(getRankBg('expert'), /blue/);
  assert.match(getRankBg('grandmaster'), /red/);
});

test('Submission matching logic correctly identifies contestId and index ignoring case', () => {
  const mockSub = {
    id: 999,
    contestId: 1335,
    problem: { contestId: 1335, index: 'A', name: 'Candies' },
  };

  const isMatch = (contestId: number, index: string) => {
    return mockSub.contestId === contestId && mockSub.problem.index.toUpperCase() === index.toUpperCase();
  };

  assert.equal(isMatch(1335, 'a'), true);
  assert.equal(isMatch(1335, 'A'), true);
  assert.equal(isMatch(1335, 'B'), false);
  assert.equal(isMatch(1336, 'A'), false);
});

test('getSyncCooldownSeconds accurately calculates remaining cooldown and throttling', () => {
  assert.equal(getSyncCooldownSeconds(null), 0);
  assert.equal(getSyncCooldownSeconds(undefined), 0);
  assert.equal(getSyncCooldownSeconds('invalid-date'), 0);

  // Synced 10 seconds ago -> 20 seconds remaining on a 30s cooldown
  const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
  const remaining = getSyncCooldownSeconds(tenSecondsAgo, 30);
  assert.ok(remaining >= 19 && remaining <= 21);

  // Synced 45 seconds ago -> 0 seconds remaining
  const fortyFiveSecondsAgo = new Date(Date.now() - 45000).toISOString();
  assert.equal(getSyncCooldownSeconds(fortyFiveSecondsAgo, 30), 0);
});

test('calculateRatingDelta evaluates total and peak changes accurately', () => {
  const history: CFRatingChange[] = [
    {
      contestId: 1001,
      contestName: 'Codeforces Round 600',
      handle: 'tourist',
      rank: 50,
      ratingUpdateTimeSeconds: 1600000000,
      oldRating: 1400,
      newRating: 1480,
    },
    {
      contestId: 1002,
      contestName: 'Codeforces Round 601',
      handle: 'tourist',
      rank: 20,
      ratingUpdateTimeSeconds: 1600100000,
      oldRating: 1480,
      newRating: 1565,
    },
    {
      contestId: 1003,
      contestName: 'Codeforces Round 602',
      handle: 'tourist',
      rank: 200,
      ratingUpdateTimeSeconds: 1600200000,
      oldRating: 1565,
      newRating: 1530,
    },
  ];

  const delta = calculateRatingDelta(history);
  assert.equal(delta.totalChange, 130); // 1530 - 1400 = 130
  assert.equal(delta.lastContestDelta, -35); // 1530 - 1565 = -35
  assert.equal(delta.bestDelta, 85); // 1565 - 1480 = +85
  assert.equal(delta.worstDelta, -35); // -35
});
