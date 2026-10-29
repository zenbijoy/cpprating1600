import { ProblemAttempt } from '../types';

export interface TodayMinutesProgress {
  totalSeconds: number;
  totalMinutes: number;
  exactMinutes: number;
  goalMinutes: number;
  percent: number;
  clampedPercent: number;
  isGoalMet: boolean;
  remainingMinutes: number;
  excessMinutes: number;
  todayAttemptsCount: number;
  todayAttempts: ProblemAttempt[];
  todayDateStr: string;
}

/**
 * Calculates progress towards today's daily minutes goal based on
 * total time spent across all problem attempts logged today.
 */
export function calculateTodayMinutesProgress(
  attempts: ProblemAttempt[],
  dailyMinutesGoal: number = 45,
  referenceDate?: Date
): TodayMinutesProgress {
  const ref = referenceDate || new Date();
  const todayDateStr = ref.toISOString().split('T')[0];
  const validGoalMinutes = Math.max(1, dailyMinutesGoal || 45);

  // Filter attempts logged today (matching endedAt or startedAt date)
  const todayAttempts = attempts.filter((attempt) => {
    const rawDate = attempt.endedAt || attempt.startedAt;
    if (!rawDate) return false;
    const dateStr = rawDate.split('T')[0];
    return dateStr === todayDateStr;
  });

  // Calculate total seconds spent across all today's attempts
  const totalSeconds = todayAttempts.reduce(
    (sum, a) => sum + (typeof a.timeSpentSeconds === 'number' && !isNaN(a.timeSpentSeconds) ? a.timeSpentSeconds : 0),
    0
  );

  const exactMinutes = totalSeconds / 60;
  const totalMinutes = Math.round(exactMinutes);

  const percent = Math.round((totalMinutes / validGoalMinutes) * 100);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const isGoalMet = totalMinutes >= validGoalMinutes;
  const remainingMinutes = Math.max(0, validGoalMinutes - totalMinutes);
  const excessMinutes = Math.max(0, totalMinutes - validGoalMinutes);

  return {
    totalSeconds,
    totalMinutes,
    exactMinutes,
    goalMinutes: validGoalMinutes,
    percent,
    clampedPercent,
    isGoalMet,
    remainingMinutes,
    excessMinutes,
    todayAttemptsCount: todayAttempts.length,
    todayAttempts,
    todayDateStr,
  };
}
