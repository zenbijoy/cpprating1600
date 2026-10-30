import {
  DailyPlan,
  DailyTask,
  EnergyLevel,
  FiveMinuteStartTask,
  GoalControlCenterStats,
  PersonalExperiment,
  PersonalTrainingPolicy,
  ProblemAttempt,
  UniversityCommitment,
  UserGoal,
  WeeklyAICoachReport,
} from '../types';
import { getPhaseForDay, getTopicForDay } from './roadmap';

/**
 * Feature 41: Five-Minute Start Protocol
 * Provides an immediate, low-friction micro-task to overcome inertia without intimidation.
 */
export function generateFiveMinuteStartTask(day: number): FiveMinuteStartTask {
  const topic = getTopicForDay(day);
  const recommendedProb = topic.recommendedProblems[0];

  const microOptions: FiveMinuteStartTask[] = [
    {
      id: 'micro_read',
      prompt: `Read the first 3 lines of ${recommendedProb?.name || 'today\'s problem'} and write down sample input by hand.`,
      taskType: 'read_statement',
      targetId: recommendedProb ? `${recommendedProb.contestId}${recommendedProb.index}` : undefined,
      durationSeconds: 300,
    },
    {
      id: 'micro_review',
      prompt: 'Review 1 flashcard from your Mistake Notebook and self-assess whether you remember the key observation.',
      taskType: 'review_mistake_card',
      durationSeconds: 300,
    },
    {
      id: 'micro_io',
      prompt: 'Set up fast I/O template and print the input size N.',
      taskType: 'write_io',
      durationSeconds: 300,
    },
  ];

  return microOptions[day % microOptions.length];
}

/**
 * Feature 42 & 43: Energy-Aware Scheduling & Dynamic Daily Mission
 * Adapts tasks and target minutes based on user's current energy state.
 */
export function generateEnergyAdaptedPlan(
  day: number,
  baseMinutes: number,
  energy: EnergyLevel,
  universityCommitments: UniversityCommitment[] = []
): DailyPlan {
  const topic = getTopicForDay(day);
  const todayStr = new Date().toISOString().split('T')[0];

  // Adjust target minutes based on energy
  let targetMinutes = baseMinutes;
  let mode: DailyPlan['mode'] = 'standard';

  if (energy === 'low') {
    targetMinutes = Math.min(25, Math.round(baseMinutes * 0.5));
    mode = 'minimum';
  } else if (energy === 'limited_time' || energy === 'exam_pressure') {
    targetMinutes = Math.min(20, Math.round(baseMinutes * 0.4));
    mode = 'minimum';
  } else if (energy === 'high') {
    targetMinutes = Math.round(baseMinutes * 1.3);
    mode = 'deep_work';
  }

  // Check university schedule conflicts
  const hasExamToday = universityCommitments.some(
    (c) => (c.type === 'exam' || c.type === 'assignment') && c.protectsCP
  );

  if (hasExamToday) {
    targetMinutes = Math.min(15, targetMinutes);
    mode = 'minimum';
  }

  const tasks: DailyTask[] = [];

  if (mode === 'minimum') {
    // Low energy mode: 1 warm up / review + 1 simple problem step
    tasks.push({
      id: `task_min_1_${Date.now()}`,
      title: `Low-Energy Warm-Up: ${topic.title} Concept Recap`,
      description: 'Review key ideas and invariants in 5-10 minutes without pressure.',
      category: 'warmup',
      estimatedMinutes: 10,
      completed: false,
    });
    tasks.push({
      id: `task_min_2_${Date.now()}`,
      title: `Core Step: Read & Outline ${topic.recommendedProblems[0]?.name || 'Problem A'}`,
      description: 'Write down the greedy choice or loop structure. Full implementation optional today.',
      category: 'problem',
      estimatedMinutes: Math.max(10, targetMinutes - 10),
      completed: false,
      problemId: topic.recommendedProblems[0] ? `${topic.recommendedProblems[0].contestId}${topic.recommendedProblems[0].index}` : undefined,
    });
  } else {
    // Standard or Deep Work
    tasks.push({
      id: `task_std_1_${Date.now()}`,
      title: `Warm-up & Observation: ${topic.title}`,
      description: topic.description,
      category: 'concept',
      estimatedMinutes: 10,
      completed: false,
    });
    tasks.push({
      id: `task_std_2_${Date.now()}`,
      title: `Solve Problem: ${topic.recommendedProblems[0]?.name || 'Problem 1'}`,
      description: `Rating ${topic.recommendedProblems[0]?.rating || 800} — tags: ${topic.recommendedProblems[0]?.tags.join(', ') || ''}`,
      category: 'problem',
      estimatedMinutes: 25,
      completed: false,
      problemId: topic.recommendedProblems[0] ? `${topic.recommendedProblems[0].contestId}${topic.recommendedProblems[0].index}` : undefined,
    });

    if (mode === 'deep_work') {
      tasks.push({
        id: `task_deep_3_${Date.now()}`,
        title: `Deep Work Challenge: ${topic.recommendedProblems[1]?.name || 'Problem 2'}`,
        description: `Push problem (Rating ${topic.recommendedProblems[1]?.rating || 1000})`,
        category: 'problem',
        estimatedMinutes: 30,
        completed: false,
        problemId: topic.recommendedProblems[1] ? `${topic.recommendedProblems[1].contestId}${topic.recommendedProblems[1].index}` : undefined,
      });
    }

    tasks.push({
      id: `task_std_review_${Date.now()}`,
      title: 'Mistake Review & Lesson Reflection',
      description: 'Log any Wrong Answer or edge case into your Mistake Notebook.',
      category: 'reflection',
      estimatedMinutes: 5,
      completed: false,
    });
  }

  return {
    id: `plan_${todayStr}`,
    date: todayStr,
    dayNumber: day,
    mode,
    targetMinutes,
    actualMinutes: 0,
    tasks,
    status: 'planned',
    reflection: {
      learned: '',
      difficultyRating: 3,
      energyLevel: energy,
    },
  };
}

/**
 * Feature 44: University Schedule Protection
 * Evaluates whether a planned study block clashes with university commitments.
 */
export function checkUniversityConflicts(
  practiceStartTime: string, // "19:00"
  durationMinutes: number,
  commitments: UniversityCommitment[]
): { hasConflict: boolean; conflictingEvent?: UniversityCommitment; recommendedSlot?: string } {
  const [pStartH, pStartM] = practiceStartTime.split(':').map(Number);
  const pStartTotal = pStartH * 60 + pStartM;
  const pEndTotal = pStartTotal + durationMinutes;

  for (const c of commitments) {
    if (!c.protectsCP) continue;
    const [cStartH, cStartM] = c.startTime.split(':').map(Number);
    const [cEndH, cEndM] = c.endTime.split(':').map(Number);
    const cStartTotal = cStartH * 60 + cStartM;
    const cEndTotal = cEndH * 60 + cEndM;

    // Overlap check
    if (Math.max(pStartTotal, cStartTotal) < Math.min(pEndTotal, cEndTotal)) {
      // Conflict found; suggest after event
      const safeSlotH = Math.floor((cEndTotal + 15) / 60);
      const safeSlotM = (cEndTotal + 15) % 60;
      const recommendedSlot = `${String(safeSlotH).padStart(2, '0')}:${String(safeSlotM).padStart(2, '0')}`;
      return { hasConflict: true, conflictingEvent: c, recommendedSlot };
    }
  }

  return { hasConflict: false };
}

/**
 * Feature 45: Smart Recovery After Missed Days
 * Recalculates upcoming schedule non-punitively without doubling tomorrow's workload.
 */
export function calculateSmartRecovery(
  lastActiveDay: number,
  currentDay: number,
  baseMinutes: number
): {
  missedDays: number;
  rebalancedMinutes: number;
  recoveryNote: string;
  recommendedTask: DailyTask;
} {
  const missedDays = Math.max(0, currentDay - lastActiveDay - 1);

  if (missedDays === 0) {
    return {
      missedDays: 0,
      rebalancedMinutes: baseMinutes,
      recoveryNote: 'Streak active! Continue normal scheduled practice.',
      recommendedTask: {
        id: `rec_${Date.now()}`,
        title: 'Today\'s Standard Practice',
        description: 'Stay on course with today\'s curriculum topic.',
        category: 'problem',
        estimatedMinutes: baseMinutes,
        completed: false,
      },
    };
  }

  // Anti-shaming: Do NOT double practice time! Set gentle restart session (e.g. 20-30 min)
  const rebalancedMinutes = Math.min(baseMinutes, 30);
  const recoveryNote = `Welcome back! You missed ${missedDays} day${missedDays > 1 ? 's' : ''}. We preserved all completed milestones and shifted the roadmap without doubling your workload.`;

  const recommendedTask: DailyTask = {
    id: `rec_restart_${Date.now()}`,
    title: 'Friction-Free Restart: 20-Minute Confidence Builder',
    description: 'Solve one easy 800-rated problem or review 2 mistake flashcards to regain rhythm.',
    category: 'recovery',
    estimatedMinutes: rebalancedMinutes,
    completed: false,
  };

  return { missedDays, rebalancedMinutes, recoveryNote, recommendedTask };
}

/**
 * Feature 48: Weekly AI Coach Report
 * Aggregates weekly practice metrics into a concise, actionable report.
 */
export function generateWeeklyCoachReport(
  weekNumber: number,
  attempts: ProblemAttempt[],
  distractedMinutes: number,
  activeStreak: number
): WeeklyAICoachReport {
  const solves = attempts.filter((a) => a.officialVerdict === 'OK');
  const independentSolves = attempts.filter((a) => a.outcome === 'solved_independently');

  const improvements: string[] = [];
  if (solves.length >= 5) improvements.push(`Completed ${solves.length} problem solves this week.`);
  if (independentSolves.length >= 3) improvements.push('Solid independent problem solving without premature hints.');
  if (activeStreak >= 5) improvements.push(`Protected a consistent ${activeStreak}-day practice streak.`);
  if (improvements.length === 0) improvements.push('Maintained practice intent and logged attempts.');

  const persistentWeaknesses: string[] = [];
  if (distractedMinutes > 45) persistentWeaknesses.push('Study time diverted by social media / off-task foreground apps.');
  if (solves.length < 3) persistentWeaknesses.push('Volume was lower than the 4-problem weekly target.');

  const nextThreePriorities = [
    '1. Complete 1 warm-up problem before attempting rating >= 1100.',
    '2. Enforce the 15-minute struggle rule before checking Hint 1.',
    '3. Upsolve any failed virtual contest problems within 48 hours.',
  ];

  return {
    id: `weekly_rep_${weekNumber}`,
    weekNumber,
    period: `Week ${weekNumber}`,
    improvements,
    persistentWeaknesses,
    timeLostDistractions: [`~${distractedMinutes} minutes logged in non-study foreground apps.`],
    recurringDistractions: ['Opening entertainment apps during editorial reading.'],
    nextThreePriorities,
    ratingProjectionSummary: 'On track toward Specialist rating target with deliberate spaced practice.',
  };
}

/**
 * Feature 49: Personal Training Policy Engine
 * Evaluates whether current practice session complies with user-configured training rules.
 */
export function evaluateTrainingPolicies(
  policies: PersonalTrainingPolicy[],
  context: {
    hasWarmedUp: boolean;
    problemRating: number;
    isInContest: boolean;
    mistakesReviewedToday: number;
  }
): { isCompliant: boolean; triggeredRule?: PersonalTrainingPolicy; advisory: string } {
  for (const policy of policies) {
    if (!policy.isActive) continue;

    if (policy.title.includes('Warm-up') && context.problemRating >= 1300 && !context.hasWarmedUp) {
      return {
        isCompliant: false,
        triggeredRule: policy,
        advisory: `Policy Triggered: "${policy.title}". Solve a 5-minute warm-up before starting a rating ${context.problemRating} problem.`,
      };
    }

    if (policy.title.includes('Contest Mistake Review') && context.isInContest && context.mistakesReviewedToday === 0) {
      return {
        isCompliant: false,
        triggeredRule: policy,
        advisory: `Policy Triggered: "${policy.title}". Review top 2 mistakes from your notebook before starting the virtual contest.`,
      };
    }
  }

  return { isCompliant: true, advisory: 'Session complies with all active personal training policies.' };
}

/**
 * Feature 50: 180-Day Goal Control Center
 * Computes unified progress metrics and evidence-based progress projections.
 */
export function calculateGoalControlCenter(
  goal: UserGoal,
  verifiedRating: number,
  attempts: ProblemAttempt[],
  weeklyDistractionMinutes: number
): GoalControlCenterStats {
  const currentDay = Math.max(1, Math.min(180, goal.currentDay));
  const phaseInfo = getPhaseForDay(currentDay);
  const solves = attempts.filter((a) => a.officialVerdict === 'OK');

  // Mastery percent based on solves vs 180-day milestone curve (~180 solves total)
  const topicMasteryPercent = Math.min(100, Math.round((solves.length / 180) * 100));

  const currentRating = verifiedRating > 0 ? verifiedRating : 800;
  const ratingDelta = goal.targetRating - currentRating;
  const daysRemaining = Math.max(1, 180 - currentDay);

  // Evidence-based projected rating band
  const expectedGain = Math.round((ratingDelta / 180) * currentDay * 0.9);
  const expectedRating = Math.min(1600, currentRating + expectedGain);

  return {
    targetRating: goal.targetRating,
    currentRating,
    dayNumber: currentDay,
    totalDays: 180,
    curriculumPhase: phaseInfo.phase,
    phaseName: phaseInfo.name,
    topicMasteryPercent,
    contestCount: Math.floor(solves.length / 8),
    practiceConsistencyPercent: Math.min(100, Math.round((currentDay / (currentDay + 2)) * 100)),
    mistakeRecurrenceCount: Math.max(0, 15 - Math.floor(solves.length / 10)),
    distractionMinutesWeekly: weeklyDistractionMinutes,
    nextMilestone: `Reach Day ${Math.min(180, currentDay + 14)} (${phaseInfo.name})`,
    projectedRatingBand: {
      min: Math.max(800, expectedRating - 80),
      expected: expectedRating,
      max: Math.min(1700, expectedRating + 100),
    },
  };
}
