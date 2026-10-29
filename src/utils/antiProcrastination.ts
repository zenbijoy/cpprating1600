import { ConsistencyStats, DailyPlan, DailyTask } from '../types';

export type EnergyState =
  | 'tired'
  | 'overwhelmed'
  | 'distracted'
  | 'afraid_of_difficult'
  | 'behind_schedule'
  | 'no_motivation'
  | 'very_busy';

export interface LowEnergyRecommendation {
  title: string;
  durationMinutes: number;
  description: string;
  actionType: 'read_concept' | 'review_mistake' | 'speed_800' | 'read_editorial' | 'explain_algorithm';
  suggestedTask: DailyTask;
}

export function getLowEnergyTask(state: EnergyState, currentTopicTitle: string): LowEnergyRecommendation {
  switch (state) {
    case 'tired':
      return {
        title: 'Passive Concept Absorption',
        durationMinutes: 10,
        description: `Read the high-level intuition for "${currentTopicTitle}". No code, just visualize the idea.`,
        actionType: 'read_concept',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: `Low-Energy: Read "${currentTopicTitle}" Summary`,
          description: 'Skim the key ideas and time complexity. No code required.',
          category: 'recovery',
          estimatedMinutes: 10,
          completed: false,
        },
      };
    case 'overwhelmed':
      return {
        title: 'Micro-Step: Just 1 Sample Input',
        durationMinutes: 8,
        description: 'Take one problem. Do not write code. Just trace the sample input by hand on paper or notes.',
        actionType: 'explain_algorithm',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: 'Manual Trace of 1 Test Case',
          description: 'Simulate how the answer is formed for Sample 1 on paper. Stop right after.',
          category: 'recovery',
          estimatedMinutes: 8,
          completed: false,
        },
      };
    case 'distracted':
      return {
        title: '5-Minute Focus Sprint',
        durationMinutes: 5,
        description: 'Set a single 5-minute countdown. Focus on reading one problem statement without tabs open.',
        actionType: 'read_concept',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: '5-Minute Single-Focus Sprint',
          description: 'Read the problem statement and identify the constraints (N, time limit).',
          category: 'recovery',
          estimatedMinutes: 5,
          completed: false,
        },
      };
    case 'afraid_of_difficult':
      return {
        title: 'Confidence Builder (800-Rated Quick Solve)',
        durationMinutes: 12,
        description: 'Solve an easy, familiar problem to restore momentum and reassure your problem-solving instinct.',
        actionType: 'speed_800',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: 'Confidence Re-ignition (Rating 800)',
          description: 'Fast, comfortable implementation to regain forward rhythm.',
          category: 'recovery',
          estimatedMinutes: 12,
          completed: false,
        },
      };
    case 'behind_schedule':
      return {
        title: 'Reset & Resume (No Catch-Up Trap)',
        durationMinutes: 15,
        description: 'Do not try to do 3 days of work today. Just do today’s primary task. Past days are safely reconciled.',
        actionType: 'read_editorial',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: 'Single Present-Day Step',
          description: 'Focus entirely on the present lesson. Zero guilt, zero backlog cramming.',
          category: 'recovery',
          estimatedMinutes: 15,
          completed: false,
        },
      };
    case 'no_motivation':
      return {
        title: 'Mistake Journal Reflection',
        durationMinutes: 7,
        description: 'Review one mistake you logged last week. See how much clearer the problem seems in hindsight.',
        actionType: 'review_mistake',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: 'Review 1 Past Mistake Note',
          description: 'Read what went wrong and remind yourself of the correct pattern.',
          category: 'recovery',
          estimatedMinutes: 7,
          completed: false,
        },
      };
    case 'very_busy':
    default:
      return {
        title: '10-Minute Minimum Viable Commitment',
        durationMinutes: 10,
        description: 'A tight 10-minute session that protects your habit without colliding with university exams.',
        actionType: 'read_concept',
        suggestedTask: {
          id: `task_low_energy_${Date.now()}`,
          title: '10-Minute Habit Protector',
          description: 'Quick concept intuition review to maintain unbroken touch with competitive programming.',
          category: 'recovery',
          estimatedMinutes: 10,
          completed: false,
        },
      };
  }
}

/**
 * Recalculates user training trajectory when days are missed.
 * Does NOT double workload or guilt-trip. Simply shifts active day pointer and offers small restart.
 */
export function handleMissedDayRecovery(
  lastActiveDateStr: string,
  currentDayNumber: number
): {
  daysMissed: number;
  recommendedDayNumber: number;
  recoveryNote: string;
} {
  const lastDate = new Date(lastActiveDateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return {
      daysMissed: 0,
      recommendedDayNumber: currentDayNumber,
      recoveryNote: 'You are on track. Continue with your scheduled mission.',
    };
  }

  // Graceful recovery: do not advance days blindly if inactive
  return {
    daysMissed: diffDays,
    recommendedDayNumber: currentDayNumber, // keep on current curriculum node
    recoveryNote: `Welcome back! You took a ${diffDays}-day pause. Your roadmap is preserved exactly where you paused. We recommend a gentle 15-minute Minimum Mode session today to restart smoothly.`,
  };
}

export function computeConsistency(history: DailyPlan[]): ConsistencyStats {
  const activePlans = history.filter((h) => h.actualMinutes > 0 || h.status === 'completed');
  const fullPracticePlans = activePlans.filter((h) => h.mode !== 'minimum');
  const recoveryPlans = activePlans.filter((h) => h.mode === 'minimum');

  const totalFocusedMinutes = activePlans.reduce((sum, h) => sum + (h.actualMinutes || h.targetMinutes || 0), 0);

  // Return rate after missed: how many times user returned after an inactive gap
  let missedGaps = 0;
  let successfulReturns = 0;

  // Sort history by date ascending
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 1) {
      missedGaps++;
      if (sorted[i].actualMinutes > 0) {
        successfulReturns++;
      }
    }
  }

  const returnRateAfterMissed = missedGaps === 0 ? 100 : Math.round((successfulReturns / missedGaps) * 100);

  return {
    totalActiveDays: activePlans.length,
    fullPracticeDays: fullPracticePlans.length,
    recoveryDays: recoveryPlans.length,
    currentStreak: Math.min(activePlans.length, 7), // calculated conservatively
    longestStreak: Math.max(activePlans.length, 1),
    totalFocusedMinutes,
    solvedProblemsCount: 0, // updated in combination with attempts
    returnRateAfterMissed,
  };
}
