import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordReviewAttempt,
  recordDetailedReview,
  snoozeMistake,
  skipMistake,
  buildRevisionQueue,
  calculateRevisionStats,
  isMistakeDue,
  computeNextReviewDate,
  getDaysOverdue,
  computeSm2Interval,
  recordSm2Review,
  getMistakeCategoryLabel,
} from './spacedRepetition';
import { MistakeRecord, RevisionHistoryEntry } from '../types';

test('recordReviewAttempt advances interval on successful recall with high confidence', () => {
  const initialMistake: MistakeRecord = {
    id: 'm1',
    problemId: '4A',
    problemName: 'Watermelon',
    problemUrl: 'https://codeforces.com/problemset/problem/4/A',
    tags: ['math', 'brute force'],
    category: 'boundary_case',
    originalApproach: 'Check if n % 2 == 0',
    whyItFailed: 'Failed on n=2 which splits into 1 and 1 (both odd)',
    correctObservation: 'Must be even and > 2',
    correctApproach: 'n % 2 == 0 && n > 2',
    personalLesson: 'Always check smallest possible positive even integer',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-02',
    intervalDays: 1,
    reviewCount: 0,
    status: 'due',
  };

  const review1 = recordReviewAttempt(initialMistake, true, 5);
  assert.equal(review1.intervalDays, 3);
  assert.equal(review1.reviewCount, 1);
  assert.equal(review1.status, 'scheduled');

  const review2 = recordReviewAttempt(review1, true, 4);
  assert.equal(review2.intervalDays, 7);
  assert.equal(review2.reviewCount, 2);
});

test('recordReviewAttempt resets interval on failed recall', () => {
  const advancedMistake: MistakeRecord = {
    id: 'm2',
    problemId: '71A',
    problemName: 'Way Too Long Words',
    problemUrl: 'https://codeforces.com/problemset/problem/71/A',
    tags: ['strings'],
    category: 'indexing_error',
    originalApproach: 'len - 1',
    whyItFailed: 'Indexing error',
    correctObservation: 'Print first char, len-2, last char',
    correctApproach: 's[0] + (len - 2) + s[len - 1]',
    personalLesson: 'Check 0-based indexing limits',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-15',
    intervalDays: 14,
    reviewCount: 3,
    status: 'scheduled',
  };

  const failedReview = recordReviewAttempt(advancedMistake, false, 2);
  assert.equal(failedReview.intervalDays, 1);
  assert.equal(failedReview.reviewCount, 4);
  assert.equal(failedReview.status, 'scheduled');
});

test('isMistakeDue identifies due review records', () => {
  const pastMistake: MistakeRecord = {
    id: 'm3',
    problemId: '231A',
    problemName: 'Team',
    problemUrl: 'https://codeforces.com/problemset/problem/231/A',
    tags: ['implementation'],
    category: 'wrong_observation',
    originalApproach: 'sum count',
    whyItFailed: 'ignored constraint',
    correctObservation: 'sum >= 2',
    correctApproach: 'count if sum >= 2',
    personalLesson: 'count',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-25',
    intervalDays: 1,
    reviewCount: 1,
    status: 'scheduled',
  };

  assert.equal(isMistakeDue(pastMistake, '2026-10-29'), true);
  assert.equal(isMistakeDue(pastMistake, '2026-10-20'), false);
});

test('recordDetailedReview handles easy, difficult, and failed outcomes with history', () => {
  const mistake: MistakeRecord = {
    id: 'm_det',
    problemId: '1352C',
    problemName: 'K-th Not Divisible by n',
    problemUrl: 'https://codeforces.com/problemset/problem/1352/C',
    tags: ['binary search', 'math'],
    category: 'wrong_observation',
    originalApproach: 'Linear search',
    whyItFailed: 'TLE for 10^9',
    correctObservation: 'Binary search or math division',
    correctApproach: 'k + (k - 1) / (n - 1)',
    personalLesson: 'Math formula for skipping multiples',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-05',
    intervalDays: 3,
    reviewCount: 1,
    status: 'scheduled',
  };

  // 1. Easy review advances interval (3 -> 7)
  const { updatedMistake: easyUpdate, historyEntry: easyHist } = recordDetailedReview(
    mistake,
    'easy',
    5,
    'Solved cleanly in 2 minutes',
    '2026-10-05'
  );
  assert.equal(easyUpdate.intervalDays, 7);
  assert.equal(easyUpdate.reviewCount, 2);
  assert.equal(easyUpdate.nextReviewDate, '2026-10-12');
  assert.equal(easyHist.outcome, 'easy');
  assert.equal(easyHist.confidenceScore, 5);

  // 2. Difficult review keeps interval or advances minimally
  const { updatedMistake: diffUpdate, historyEntry: diffHist } = recordDetailedReview(
    mistake,
    'difficult',
    3,
    'Remembered concept after looking at category',
    '2026-10-05'
  );
  assert.equal(diffUpdate.intervalDays, 3);
  assert.equal(diffUpdate.reviewCount, 2);
  assert.equal(diffHist.outcome, 'difficult');

  // 3. Failed review resets to 1 day
  const { updatedMistake: failUpdate, historyEntry: failHist } = recordDetailedReview(
    mistake,
    'failed',
    1,
    'Completely forgot observation',
    '2026-10-05'
  );
  assert.equal(failUpdate.intervalDays, 1);
  assert.equal(failUpdate.reviewCount, 2);
  assert.equal(failUpdate.nextReviewDate, '2026-10-06');
  assert.equal(failHist.outcome, 'failed');
});

test('snoozeMistake and skipMistake preserve interval and history without penalty', () => {
  const mistake: MistakeRecord = {
    id: 'm_snooze',
    problemId: '282A',
    problemName: 'Bit++',
    problemUrl: 'https://codeforces.com/problemset/problem/282/A',
    tags: ['implementation'],
    category: 'indexing_error',
    originalApproach: 'x',
    whyItFailed: 'y',
    correctObservation: 'z',
    correctApproach: 'w',
    personalLesson: 'p',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-10',
    intervalDays: 7,
    reviewCount: 2,
    status: 'due',
  };

  const snoozed = snoozeMistake(mistake, 3, '2026-10-10');
  assert.equal(snoozed.intervalDays, 7, 'Interval must be preserved on snooze');
  assert.equal(snoozed.reviewCount, 2, 'Review count must not increment on snooze');
  assert.equal(snoozed.nextReviewDate, '2026-10-13');

  const skipped = skipMistake(mistake, '2026-10-10');
  assert.equal(skipped.intervalDays, 7);
  assert.equal(skipped.nextReviewDate, '2026-10-11');
});

test('buildRevisionQueue prioritizes overdue mistakes and repeated failures', () => {
  const m1: MistakeRecord = {
    id: 'm_recent',
    problemId: '4A',
    problemName: 'Watermelon',
    problemUrl: 'https://codeforces.com',
    tags: ['math'],
    category: 'boundary_case',
    originalApproach: '',
    whyItFailed: '',
    correctObservation: '',
    correctApproach: '',
    personalLesson: '',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-20', // Due today
    intervalDays: 1,
    reviewCount: 0,
    rating: 800,
    status: 'due',
  };

  const m2Overdue: MistakeRecord = {
    id: 'm_overdue',
    problemId: '1352C',
    problemName: 'K-th Not Divisible by n',
    problemUrl: 'https://codeforces.com',
    tags: ['binary search'],
    category: 'wrong_observation',
    originalApproach: '',
    whyItFailed: '',
    correctObservation: '',
    correctApproach: '',
    personalLesson: '',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-10', // 10 days overdue
    intervalDays: 3,
    reviewCount: 1,
    rating: 1200,
    status: 'due',
  };

  const history: RevisionHistoryEntry[] = [
    {
      id: 'h1',
      mistakeId: 'm_overdue',
      problemId: '1352C',
      reviewDate: '2026-10-08T10:00:00Z',
      outcome: 'failed',
      previousInterval: 3,
      newInterval: 1,
      confidenceScore: 1,
    },
  ];

  const queue = buildRevisionQueue([m1, m2Overdue], history, '2026-10-20');
  assert.equal(queue.length, 2);
  // m2Overdue has higher overdue days and a failed history attempt -> higher priority
  assert.equal(queue[0].mistake.id, 'm_overdue');
  assert.equal(queue[0].isOverdue, true);
  assert.equal(queue[0].daysOverdue, 10);
});

test('calculateRevisionStats accurately computes review health', () => {
  const mistakes: MistakeRecord[] = [
    { id: '1', problemId: '1', problemName: '', problemUrl: '', tags: [], category: 'boundary_case', originalApproach: '', whyItFailed: '', correctObservation: '', correctApproach: '', personalLesson: '', createdAt: '', nextReviewDate: '2026-10-20', intervalDays: 60, reviewCount: 5, status: 'mastered' },
    { id: '2', problemId: '2', problemName: '', problemUrl: '', tags: [], category: 'boundary_case', originalApproach: '', whyItFailed: '', correctObservation: '', correctApproach: '', personalLesson: '', createdAt: '', nextReviewDate: '2026-10-01', intervalDays: 1, reviewCount: 1, status: 'scheduled' },
  ];

  const history: RevisionHistoryEntry[] = [
    { id: 'h1', mistakeId: '1', problemId: '1', reviewDate: '', outcome: 'easy', previousInterval: 30, newInterval: 60, confidenceScore: 5 },
    { id: 'h2', mistakeId: '2', problemId: '2', reviewDate: '', outcome: 'failed', previousInterval: 3, newInterval: 1, confidenceScore: 1 },
  ];

  const stats = calculateRevisionStats(history, mistakes);
  assert.equal(stats.totalReviews, 2);
  assert.equal(stats.successfulReviews, 1);
  assert.equal(stats.accuracyRate, 50);
  assert.equal(stats.masteredCount, 1);
});

test('computeSm2Interval calculates correct intervals and ease factors per SM-2 standard', () => {
  // Quality 5 (Perfect instant recall)
  const resQ5 = computeSm2Interval(5, 1, 0, 2.5);
  assert.equal(resQ5.intervalDays, 1);
  assert.equal(resQ5.consecutiveSuccesses, 1);
  assert.equal(resQ5.easeFactor, 2.6); // 2.5 + (0.1 - 0) = 2.6

  // Next review with Quality 5
  const resQ5_step2 = computeSm2Interval(5, resQ5.intervalDays, resQ5.consecutiveSuccesses, resQ5.easeFactor);
  assert.equal(resQ5_step2.intervalDays, 3);
  assert.equal(resQ5_step2.consecutiveSuccesses, 2);
  assert.equal(resQ5_step2.easeFactor, 2.7);

  // Third review with Quality 5
  const resQ5_step3 = computeSm2Interval(5, resQ5_step2.intervalDays, resQ5_step2.consecutiveSuccesses, resQ5_step2.easeFactor);
  assert.equal(resQ5_step3.intervalDays, 7);
  assert.equal(resQ5_step3.consecutiveSuccesses, 3);

  // Fourth review with Quality 5: 7 * 2.8 = 19.6 -> 20 days
  const resQ5_step4 = computeSm2Interval(5, resQ5_step3.intervalDays, resQ5_step3.consecutiveSuccesses, resQ5_step3.easeFactor);
  assert.equal(resQ5_step4.intervalDays, 20);
  assert.equal(resQ5_step4.consecutiveSuccesses, 4);

  // Fifth review with Quality 5: 20 * 2.9 = 58 days -> mastered!
  const resQ5_step5 = computeSm2Interval(5, resQ5_step4.intervalDays, resQ5_step4.consecutiveSuccesses, resQ5_step4.easeFactor);
  assert.ok(resQ5_step5.intervalDays >= 30);
  assert.equal(resQ5_step5.status, 'mastered');

  // Quality 0 (Complete Blackout) resets interval and repetitions
  const resQ0 = computeSm2Interval(0, 20, 4, 2.5);
  assert.equal(resQ0.intervalDays, 1);
  assert.equal(resQ0.consecutiveSuccesses, 0);

  // Quality 3 (Hesitant) decreases ease factor
  const resQ3 = computeSm2Interval(3, 1, 1, 2.5);
  assert.equal(resQ3.easeFactor, 2.36); // 2.5 + (0.1 - 2 * (0.08 + 0.04)) = 2.5 + (0.1 - 0.24) = 2.36

  // Ease factor never drops below 1.3
  const resMinEf = computeSm2Interval(0, 1, 0, 1.3);
  assert.equal(resMinEf.easeFactor, 1.3);
});

test('recordSm2Review updates mistake telemetry and produces valid history entry', () => {
  const initialMistake: MistakeRecord = {
    id: 'sm2_m1',
    problemId: '1352C',
    problemName: 'K-th Not Divisible by n',
    problemUrl: 'https://codeforces.com/problemset/problem/1352/C',
    tags: ['binary search', 'math'],
    category: 'monotonicity_violation',
    originalApproach: 'Binary search with broken condition',
    whyItFailed: 'Predicate was not monotonic on negative range',
    correctObservation: 'k + (k - 1) / (n - 1)',
    correctApproach: 'Math formula skipping multiples',
    personalLesson: 'Verify monotonicity before binary search',
    createdAt: '2026-10-01',
    nextReviewDate: '2026-10-05',
    intervalDays: 1,
    reviewCount: 0,
    status: 'due',
  };

  const { updatedMistake, historyEntry } = recordSm2Review(initialMistake, 5, 'Solved in 30 seconds', '2026-10-05');
  assert.equal(updatedMistake.intervalDays, 1);
  assert.equal(updatedMistake.consecutiveSuccesses, 1);
  assert.equal(updatedMistake.easeFactor, 2.6);
  assert.equal(updatedMistake.reviewCount, 1);
  assert.equal(updatedMistake.nextReviewDate, '2026-10-06');
  assert.equal(historyEntry.outcome, 'easy');
  assert.equal(historyEntry.confidenceScore, 5);
  assert.equal(historyEntry.notes, 'Solved in 30 seconds');
});

test('getMistakeCategoryLabel correctly translates competitive programming categories', () => {
  assert.ok(getMistakeCategoryLabel('monotonicity_violation').includes('Monotonicity'));
  assert.ok(getMistakeCategoryLabel('integer_overflow').includes('Integer Overflow'));
  assert.ok(getMistakeCategoryLabel('indexing_error').includes('Off-by-one'));
  assert.ok(getMistakeCategoryLabel('wrong_complexity').includes('Wrong Complexity'));
});
