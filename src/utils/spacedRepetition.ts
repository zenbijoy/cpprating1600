import { MistakeRecord, ReviewOutcome, RevisionHistoryEntry, RevisionQueueItem, Sm2Quality } from '../types';

export const DEFAULT_REPETITION_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];
export const REPETITION_INTERVALS_DAYS = DEFAULT_REPETITION_INTERVALS_DAYS;

export const SM2_DEFAULT_EASE_FACTOR = 2.5;
export const SM2_MIN_EASE_FACTOR = 1.3;

export interface Sm2QualityInfo {
  quality: Sm2Quality;
  label: string;
  shortLabel: string;
  description: string;
  outcome: ReviewOutcome;
  badgeClass: string;
  intervalPreview: string;
}

export const SM2_QUALITIES: Record<Sm2Quality, Sm2QualityInfo> = {
  0: {
    quality: 0,
    label: 'Complete Blackout',
    shortLabel: '0 · Blackout',
    description: 'No memory of the problem, mistake, or observation.',
    outcome: 'failed',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
    intervalPreview: '1 day (Reset)',
  },
  1: {
    quality: 1,
    label: 'Wrong Observation',
    shortLabel: '1 · Wrong Obs',
    description: 'Initial idea was flawed; remembered only after peek.',
    outcome: 'failed',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
    intervalPreview: '1 day (Reset)',
  },
  2: {
    quality: 2,
    label: 'Vaguely Familiar',
    shortLabel: '2 · Familiar',
    description: 'Recognized category, but failed to reconstruct correct approach.',
    outcome: 'failed',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    intervalPreview: '1 day (Reset)',
  },
  3: {
    quality: 3,
    label: 'Recalled with Hesitation',
    shortLabel: '3 · Hesitant',
    description: 'Recalled the key invariant, but with serious effort or hesitation (>60s).',
    outcome: 'difficult',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    intervalPreview: 'Keep or 2-3 days',
  },
  4: {
    quality: 4,
    label: 'Solid Recall',
    shortLabel: '4 · Solid',
    description: 'Accurate and confident recall after brief reflection.',
    outcome: 'easy',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    intervalPreview: '~4-7 days',
  },
  5: {
    quality: 5,
    label: 'Perfect Instant Recall',
    shortLabel: '5 · Instant',
    description: 'Instant, crisp recall of invariant, edge cases, and personal rule.',
    outcome: 'easy',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    intervalPreview: '7+ days (Max jump)',
  },
};

export interface Sm2CalculationResult {
  intervalDays: number;
  easeFactor: number;
  consecutiveSuccesses: number;
  status: 'due' | 'scheduled' | 'mastered';
}

/**
 * Computes SM-2 spaced repetition interval, ease factor, and consecutive successes.
 * Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
export function computeSm2Interval(
  quality: number,
  currentInterval: number = 1,
  consecutiveSuccesses: number = 0,
  currentEaseFactor: number = 2.5
): Sm2CalculationResult {
  const q = Math.max(0, Math.min(5, Math.round(quality))) as Sm2Quality;
  const newEf = Math.max(SM2_MIN_EASE_FACTOR, currentEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const roundedEf = Number(newEf.toFixed(2));

  let newInterval = 1;
  let newSuccesses = 0;

  if (q < 3) {
    // Failed recall: reset repetitions to 0 and interval to 1 day
    newInterval = 1;
    newSuccesses = 0;
  } else {
    // Successful recall (q >= 3)
    if (consecutiveSuccesses <= 0) {
      newInterval = 1;
    } else if (consecutiveSuccesses === 1) {
      newInterval = 3;
    } else if (consecutiveSuccesses === 2) {
      newInterval = 7;
    } else {
      newInterval = Math.max(currentInterval + 1, Math.round(currentInterval * roundedEf));
    }
    newSuccesses = consecutiveSuccesses + 1;
  }

  const status: 'due' | 'scheduled' | 'mastered' =
    newInterval >= 30 || newSuccesses >= 5 ? 'mastered' : 'scheduled';

  return {
    intervalDays: newInterval,
    easeFactor: roundedEf,
    consecutiveSuccesses: newSuccesses,
    status,
  };
}

/**
 * Returns current date in YYYY-MM-DD format with optional timezone offset in minutes.
 */
export function getTodayDateString(timezoneOffsetMinutes?: number): string {
  const d = new Date();
  if (typeof timezoneOffsetMinutes === 'number') {
    const localMs = d.getTime() + (d.getTimezoneOffset() - timezoneOffsetMinutes) * 60000;
    return new Date(localMs).toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

/**
 * Computes next review date by adding interval days to base date (defaults to today).
 */
export function computeNextReviewDate(intervalDays: number, baseDateStr?: string): string {
  const d = baseDateStr ? new Date(`${baseDateStr}T00:00:00Z`) : new Date();
  d.setUTCDate(d.getUTCDate() + intervalDays);
  return d.toISOString().split('T')[0];
}

/**
 * Checks whether a mistake record is due for review.
 */
export function isMistakeDue(mistake: MistakeRecord, currentDateStr?: string): boolean {
  const today = currentDateStr || getTodayDateString();
  return mistake.status !== 'mastered' && mistake.nextReviewDate <= today;
}

/**
 * Computes days overdue (positive integer if past due, 0 if due today, negative if scheduled in future).
 */
export function getDaysOverdue(nextReviewDateStr: string, currentDateStr?: string): number {
  const today = currentDateStr || getTodayDateString();
  const nextDate = new Date(`${nextReviewDateStr}T00:00:00Z`).getTime();
  const curDate = new Date(`${today}T00:00:00Z`).getTime();
  const diffDays = Math.round((curDate - nextDate) / (86400 * 1000));
  return Math.max(0, diffDays);
}

/**
 * SM-2 Review Logger with 0-5 quality score, ease factor tracking, and persistent history entry.
 */
export function recordSm2Review(
  mistake: MistakeRecord,
  quality: number,
  notes?: string,
  baseDateStr?: string
): { updatedMistake: MistakeRecord; historyEntry: RevisionHistoryEntry } {
  const today = baseDateStr || getTodayDateString();
  const q = Math.max(0, Math.min(5, Math.round(quality))) as Sm2Quality;
  const currentInterval = mistake.intervalDays || 1;
  const currentRep = mistake.consecutiveSuccesses ?? (mistake.reviewCount > 0 && currentInterval > 1 ? 1 : 0);
  const currentEf = mistake.easeFactor || SM2_DEFAULT_EASE_FACTOR;

  const result = computeSm2Interval(q, currentInterval, currentRep, currentEf);
  const currentReviewCount = (mistake.reviewCount || 0) + 1;
  const outcome: ReviewOutcome = q >= 4 ? 'easy' : q === 3 ? 'difficult' : 'failed';

  const updatedMistake: MistakeRecord = {
    ...mistake,
    intervalDays: result.intervalDays,
    easeFactor: result.easeFactor,
    consecutiveSuccesses: result.consecutiveSuccesses,
    reviewCount: currentReviewCount,
    nextReviewDate: computeNextReviewDate(result.intervalDays, today),
    status: result.status,
  };

  const historyEntry: RevisionHistoryEntry = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mistakeId: mistake.id,
    problemId: mistake.problemId,
    reviewDate: new Date().toISOString(),
    outcome,
    previousInterval: currentInterval,
    newInterval: result.intervalDays,
    confidenceScore: q,
    notes: notes || undefined,
  };

  return { updatedMistake, historyEntry };
}

/**
 * Enhanced review attempt logger with explicit outcome ('easy' | 'difficult' | 'failed')
 * and persistent history entry.
 */
export function recordDetailedReview(
  mistake: MistakeRecord,
  outcome: ReviewOutcome,
  confidenceScore: number,
  notes?: string,
  baseDateStr?: string
): { updatedMistake: MistakeRecord; historyEntry: RevisionHistoryEntry } {
  const today = baseDateStr || getTodayDateString();
  const currentReviewCount = mistake.reviewCount + 1;
  const previousInterval = mistake.intervalDays;
  let newInterval = 1;
  let newStatus: 'due' | 'scheduled' | 'mastered' = 'scheduled';

  if (outcome === 'failed' || confidenceScore < 2) {
    // Reset to interval 1 day
    newInterval = 1;
    newStatus = 'scheduled';
  } else if (outcome === 'difficult') {
    // Keep current interval or advance minimally (+1 day)
    newInterval = Math.max(2, mistake.intervalDays);
    newStatus = 'scheduled';
  } else {
    // 'easy' - advance through intervals
    const currentIndex = DEFAULT_REPETITION_INTERVALS_DAYS.indexOf(mistake.intervalDays);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

    if (nextIndex >= DEFAULT_REPETITION_INTERVALS_DAYS.length) {
      newInterval = DEFAULT_REPETITION_INTERVALS_DAYS[DEFAULT_REPETITION_INTERVALS_DAYS.length - 1];
      newStatus = 'mastered';
    } else {
      newInterval = DEFAULT_REPETITION_INTERVALS_DAYS[nextIndex];
      newStatus = 'scheduled';
    }
  }

  const updatedMistake: MistakeRecord = {
    ...mistake,
    intervalDays: newInterval,
    reviewCount: currentReviewCount,
    nextReviewDate: computeNextReviewDate(newInterval, today),
    status: newStatus,
  };

  const historyEntry: RevisionHistoryEntry = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mistakeId: mistake.id,
    problemId: mistake.problemId,
    reviewDate: new Date().toISOString(),
    outcome,
    previousInterval,
    newInterval,
    confidenceScore: Math.min(5, Math.max(1, confidenceScore)),
    notes: notes || undefined,
  };

  return { updatedMistake, historyEntry };
}

/**
 * Backwards-compatible review updater for existing UI and tests.
 */
export function recordReviewAttempt(
  mistake: MistakeRecord,
  recalledSuccessfully: boolean,
  confidence: number
): MistakeRecord {
  const outcome: ReviewOutcome = !recalledSuccessfully || confidence < 3 ? 'failed' : confidence >= 4 ? 'easy' : 'difficult';
  const { updatedMistake } = recordDetailedReview(mistake, outcome, confidence);
  return updatedMistake;
}

/**
 * Snoozes a mistake review without corrupting spaced repetition interval or review count.
 */
export function snoozeMistake(mistake: MistakeRecord, snoozeDays: number = 1, baseDateStr?: string): MistakeRecord {
  const today = baseDateStr || getTodayDateString();
  const safeDays = Math.max(1, Math.min(7, snoozeDays));
  return {
    ...mistake,
    nextReviewDate: computeNextReviewDate(safeDays, today),
    status: 'scheduled',
  };
}

/**
 * Skips a due mistake review for 1 day without logging failure or interval reset.
 */
export function skipMistake(mistake: MistakeRecord, baseDateStr?: string): MistakeRecord {
  return snoozeMistake(mistake, 1, baseDateStr);
}

/**
 * Builds a prioritized revision queue combining overdue revisions, repeated mistakes,
 * and high-rating problems.
 */
export function buildRevisionQueue(
  mistakes: MistakeRecord[],
  history: RevisionHistoryEntry[] = [],
  currentDateStr?: string
): RevisionQueueItem[] {
  const today = currentDateStr || getTodayDateString();
  const historyByMistake = new Map<string, RevisionHistoryEntry[]>();

  for (const h of history) {
    const list = historyByMistake.get(h.mistakeId) || [];
    list.push(h);
    historyByMistake.set(h.mistakeId, list);
  }

  const queue: RevisionQueueItem[] = [];

  for (const m of mistakes) {
    if (m.status === 'mastered') continue;

    const isDue = m.nextReviewDate <= today;
    if (!isDue) continue;

    const daysOverdue = getDaysOverdue(m.nextReviewDate, today);
    const mHistory = historyByMistake.get(m.id) || [];
    const failedHistoryCount = mHistory.filter((h) => h.outcome === 'failed').length;

    // Priority score: days overdue * 10 + failed attempts * 15 + rating weight
    const ratingWeight = Math.floor((m.rating || 800) / 200);
    const priorityScore = daysOverdue * 10 + failedHistoryCount * 15 + ratingWeight;

    queue.push({
      mistake: m,
      isOverdue: daysOverdue > 0,
      daysOverdue,
      history: mHistory,
      priorityScore,
    });
  }

  // Sort by priority descending
  return queue.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Computes revision health metrics across review history.
 */
export function calculateRevisionStats(
  history: RevisionHistoryEntry[],
  mistakes: MistakeRecord[]
) {
  const totalReviews = history.length;
  const successfulReviews = history.filter((h) => h.outcome === 'easy' || h.outcome === 'difficult').length;
  const accuracyRate = totalReviews > 0 ? Math.round((successfulReviews / totalReviews) * 100) : 100;
  const masteredCount = mistakes.filter((m) => m.status === 'mastered' || (m.intervalDays || 1) >= 30).length;
  const dueCount = mistakes.filter((m) => isMistakeDue(m)).length;
  const overdueCount = mistakes.filter((m) => m.status !== 'mastered' && getDaysOverdue(m.nextReviewDate) > 0).length;

  return {
    totalReviews,
    successfulReviews,
    accuracyRate,
    masteredCount,
    dueCount,
    overdueCount,
    totalTracked: mistakes.length,
  };
}

export function getMistakeCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    boundary_case: 'Corner / Boundary Case (N=0, 1, Max, Empty Array)',
    integer_overflow: 'Integer Overflow (32-bit vs 64-bit long long)',
    indexing_error: 'Off-by-one / Indexing Error (0-based vs 1-based, fencepost)',
    wrong_complexity: 'Wrong Complexity / TLE (e.g. O(N^2) instead of O(N log N))',
    monotonicity_violation: 'Monotonicity Violation (Binary search or two-pointer condition broken)',
    wrong_observation: 'Incorrect Observation / Flawed Logic Invariant',
    misread_statement: 'Misread Statement or Constraints',
    incorrect_algorithm: 'Wrong Algorithmic Choice (e.g. Greedy instead of DP)',
    implementation_bug: 'Implementation Bug / Typo',
    wrong_data_structure: 'Suboptimal Data Structure',
    poor_time_management: 'Contest Rush / Time Management',
    needed_too_many_hints: 'Needed Excessive Hints / Peeked Editorial',
    could_not_prove_correctness: 'Could Not Prove Correctness / Speculative Guess',
  };
  return labels[category] || category;
}

export function getMistakeCategoryShortLabel(category: string): string {
  const shortLabels: Record<string, string> = {
    boundary_case: 'Boundary Case',
    integer_overflow: 'Integer Overflow',
    indexing_error: 'Off-by-one Error',
    wrong_complexity: 'TLE / Complexity',
    monotonicity_violation: 'Monotonicity',
    wrong_observation: 'Wrong Observation',
    misread_statement: 'Misread Statement',
    incorrect_algorithm: 'Wrong Algorithm',
    implementation_bug: 'Implementation Bug',
    wrong_data_structure: 'Suboptimal DS',
    poor_time_management: 'Time Management',
    needed_too_many_hints: 'Excessive Hints',
    could_not_prove_correctness: 'Unproven Guess',
  };
  return shortLabels[category] || category;
}

export function getMistakeCategoryBadgeStyle(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'integer_overflow':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60',
      };
    case 'boundary_case':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
      };
    case 'wrong_complexity':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
      };
    case 'monotonicity_violation':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/50',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800/60',
      };
    case 'indexing_error':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/50',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800/60',
      };
    case 'wrong_observation':
    case 'incorrect_algorithm':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/60',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
      };
  }
}
