import { DailyPlan, ProblemAttempt } from '../types';

export interface DayStreakStatus {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Oct 29"
  weekday: string; // e.g. "Wed"
  dayIndex: number; // 0 to 29 (29 is today)
  status: 'full_practice' | 'recovery' | 'rest';
  isToday: boolean;
  solvedCount: number;
  minutes: number;
  tooltipText: string;
}

export interface StreakAnalysis {
  days: DayStreakStatus[];
  currentStreak: number;
  longestStreak: number;
  activeDaysLast30: number;
  consistencyPercentage: number;
  totalSolvedLast30: number;
}

/**
 * Computes a detailed 30-day streak timeline based on user problem attempts and daily plans.
 */
export function compute30DayStreak(
  attempts: ProblemAttempt[],
  dailyPlans: DailyPlan[] = [],
  referenceDate?: Date
): StreakAnalysis {
  const today = referenceDate || new Date();
  const days: DayStreakStatus[] = [];

  // Index attempts by date YYYY-MM-DD
  const attemptsByDate: Record<string, ProblemAttempt[]> = {};
  for (const a of attempts) {
    const dStr = (a.endedAt || a.startedAt || '').split('T')[0];
    if (dStr) {
      if (!attemptsByDate[dStr]) attemptsByDate[dStr] = [];
      attemptsByDate[dStr].push(a);
    }
  }

  // Index plans by date YYYY-MM-DD
  const plansByDate: Record<string, DailyPlan> = {};
  for (const p of dailyPlans) {
    if (p.date) {
      plansByDate[p.date] = p;
    }
  }

  let totalSolvedLast30 = 0;
  let activeDaysLast30 = 0;

  // Build 30-day window ending on today
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;

    const dayAttempts = attemptsByDate[dateStr] || [];
    const dayPlan = plansByDate[dateStr];

    const solvedCount = dayAttempts.filter(
      (a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently' || a.outcome === 'solved_with_hints'
    ).length;

    totalSolvedLast30 += solvedCount;

    let minutes = dayAttempts.reduce((sum, a) => sum + Math.round((a.timeSpentSeconds || 0) / 60), 0);
    if (dayPlan?.actualMinutes) {
      minutes = Math.max(minutes, dayPlan.actualMinutes);
    }

    let status: 'full_practice' | 'recovery' | 'rest' = 'rest';

    if (solvedCount >= 1 || (dayPlan && dayPlan.tasks.some((t) => t.completed && t.category === 'problem'))) {
      status = 'full_practice';
      activeDaysLast30++;
    } else if (
      minutes >= 5 ||
      (dayPlan && dayPlan.tasks.some((t) => t.completed)) ||
      dayPlan?.mode === 'minimum' ||
      dayAttempts.length > 0
    ) {
      status = 'recovery';
      activeDaysLast30++;
    }

    // Default seed for user experience: if today has an active session
    if (isToday && (dayAttempts.length > 0 || dayPlan?.tasks.some((t) => t.completed))) {
      status = solvedCount >= 1 ? 'full_practice' : 'recovery';
    }

    const monthName = d.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = d.getDate();
    const weekday = d.toLocaleString('en-US', { weekday: 'narrow' });

    let tooltipText = `${monthName} ${dayOfMonth}: Rest Day`;
    if (status === 'full_practice') {
      tooltipText = `${monthName} ${dayOfMonth}: Full Practice (${solvedCount} problem${solvedCount === 1 ? '' : 's'} solved, ${minutes}m)`;
    } else if (status === 'recovery') {
      tooltipText = `${monthName} ${dayOfMonth}: Habit Recovery (${minutes > 0 ? `${minutes}m` : 'Concept/Mistake Review'})`;
    }
    if (isToday) tooltipText += ' (Today)';

    days.push({
      dateStr,
      dayLabel: `${monthName} ${dayOfMonth}`,
      weekday,
      dayIndex: 29 - i,
      status,
      isToday,
      solvedCount,
      minutes,
      tooltipText,
    });
  }

  // Calculate current active streak (counting backwards from today)
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].status !== 'rest') {
      currentStreak++;
    } else {
      // If today is not completed yet, check if yesterday was active
      if (i === days.length - 1) {
        continue;
      }
      break;
    }
  }

  // Calculate longest streak in the 30-day window
  let longestStreak = 0;
  let running = 0;
  for (const day of days) {
    if (day.status !== 'rest') {
      running++;
      if (running > longestStreak) longestStreak = running;
    } else {
      running = 0;
    }
  }

  const consistencyPercentage = Math.round((activeDaysLast30 / 30) * 100);

  return {
    days,
    currentStreak: Math.max(currentStreak, activeDaysLast30 > 0 ? 1 : 0),
    longestStreak: Math.max(longestStreak, currentStreak, 1),
    activeDaysLast30,
    consistencyPercentage,
    totalSolvedLast30,
  };
}
