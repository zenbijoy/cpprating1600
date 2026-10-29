import test from 'node:test';
import assert from 'node:assert/strict';
import { recordReviewAttempt, isMistakeDue, computeNextReviewDate } from './spacedRepetition';
import { MistakeRecord } from '../types';

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
