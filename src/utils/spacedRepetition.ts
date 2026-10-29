import { MistakeRecord } from '../types';

export const REPETITION_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export function computeNextReviewDate(intervalDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().split('T')[0];
}

export function isMistakeDue(mistake: MistakeRecord, currentDateStr?: string): boolean {
  const today = currentDateStr || new Date().toISOString().split('T')[0];
  return mistake.status !== 'mastered' && mistake.nextReviewDate <= today;
}

/**
 * Updates a mistake record after a spaced repetition recall attempt.
 * @param mistake Existing mistake record
 * @param recalledSuccessfully Whether the user accurately recalled the key observation / fix
 * @param confidence 1 (low) to 5 (high)
 */
export function recordReviewAttempt(
  mistake: MistakeRecord,
  recalledSuccessfully: boolean,
  confidence: number
): MistakeRecord {
  const currentReviewCount = mistake.reviewCount + 1;

  if (!recalledSuccessfully || confidence < 3) {
    // Reset to interval 1
    return {
      ...mistake,
      intervalDays: 1,
      reviewCount: currentReviewCount,
      nextReviewDate: computeNextReviewDate(1),
      status: 'scheduled',
    };
  }

  // Advance to next interval
  const currentIndex = REPETITION_INTERVALS_DAYS.indexOf(mistake.intervalDays);
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  if (nextIndex >= REPETITION_INTERVALS_DAYS.length) {
    // Mastered after passing all interval tiers
    return {
      ...mistake,
      reviewCount: currentReviewCount,
      intervalDays: REPETITION_INTERVALS_DAYS[REPETITION_INTERVALS_DAYS.length - 1],
      status: 'mastered',
    };
  }

  const nextInterval = REPETITION_INTERVALS_DAYS[nextIndex];
  return {
    ...mistake,
    intervalDays: nextInterval,
    reviewCount: currentReviewCount,
    nextReviewDate: computeNextReviewDate(nextInterval),
    status: 'scheduled',
  };
}

export function getMistakeCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    misread_statement: 'Misread Statement / Constraints',
    wrong_observation: 'Incorrect Observation / Logic Flaw',
    incorrect_algorithm: 'Wrong Algorithmic Choice',
    wrong_complexity: 'Time or Memory Limit Exceeded',
    implementation_bug: 'Implementation / Typo Bug',
    integer_overflow: 'Integer Overflow (32-bit vs 64-bit)',
    boundary_case: 'Corner / Boundary Case (N=0,1,Max)',
    indexing_error: '0-based vs 1-based Indexing Error',
    wrong_data_structure: 'Suboptimal Data Structure',
    poor_time_management: 'Rushed / Poor Time Management',
    needed_too_many_hints: 'Required Excessive Hints',
    could_not_prove_correctness: 'Could Not Prove Correctness',
  };
  return labels[category] || category;
}
