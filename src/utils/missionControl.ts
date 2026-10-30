import {
  CFProblem,
  DailyPlan,
  DailyTask,
  MistakeRecord,
  ProblemAttempt,
  UserGoal,
  UserProfile,
} from '../types';
import { CURATED_PROBLEMS_CATALOG } from './roadmap';

export interface MilestoneInfo {
  milestoneNumber: number;
  title: string;
  description: string;
  minRating: number;
  maxRating: number;
  progressPercent: number;
  ratingGap: number;
}

export interface DifficultyEvaluation {
  currentEffectiveRating: number;
  adjustmentType: 'step_down' | 'step_up' | 'maintain';
  recommendedRating: number;
  reason: string;
  suggestedPrerequisites: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  recentSolveRate: number;
  consecutiveFailsAtDifficulty: number;
}

export interface WeeklyCoachReport {
  id: string;
  generatedAt: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  measuredResults: {
    problemsAttempted: number;
    problemsAccepted: number;
    solveRatePercent: number;
    totalFocusedMinutes: number;
    activeDaysCount: number;
    mistakesReviewedCount: number;
    averageRatingSolved: number;
    topMistakeCategory: string | null;
  };
  aiInterpretations: {
    whatImproved: string[];
    whatRemainedWeak: string[];
    recurringMistakePatterns: string[];
    mostProductiveSessionSummary: string;
    consistencyAssessment: string;
    nextWeekStrategicFocus: string[];
  };
}

export function calculateMilestone(currentRating: number = 800, targetRating: number = 1600): MilestoneInfo {
  const effective = Math.max(800, currentRating);
  const ratingGap = Math.max(0, targetRating - effective);

  if (effective < 1000) {
    const progress = Math.min(100, Math.round(((effective - 800) / 200) * 100));
    return {
      milestoneNumber: 1,
      title: 'Milestone 1: Foundations',
      description: 'Master implementation, math parity, simple greedy, and brute force (800-999).',
      minRating: 800,
      maxRating: 999,
      progressPercent: progress,
      ratingGap,
    };
  } else if (effective < 1200) {
    const progress = Math.min(100, Math.round(((effective - 1000) / 200) * 100));
    return {
      milestoneNumber: 2,
      title: 'Milestone 2: Algorithmic Core',
      description: 'Prefix sums, two pointers, binary search, and frequency arrays (1000-1199).',
      minRating: 1000,
      maxRating: 1199,
      progressPercent: progress,
      ratingGap,
    };
  } else if (effective < 1400) {
    const progress = Math.min(100, Math.round(((effective - 1200) / 200) * 100));
    return {
      milestoneNumber: 3,
      title: 'Milestone 3: Core CP Patterns',
      description: 'Number theory, dynamic programming basics, DFS/BFS, and greedy scheduling (1200-1399).',
      minRating: 1200,
      maxRating: 1399,
      progressPercent: progress,
      ratingGap,
    };
  } else if (effective < 1600) {
    const progress = Math.min(100, Math.round(((effective - 1400) / 200) * 100));
    return {
      milestoneNumber: 4,
      title: 'Milestone 4: Specialist Push',
      description: 'Trees, shortest paths, disjoint set union, bit manipulation, and Div.2 C/D problems (1400-1599).',
      minRating: 1400,
      maxRating: 1599,
      progressPercent: progress,
      ratingGap,
    };
  } else {
    return {
      milestoneNumber: 5,
      title: 'Milestone 5: 1600 Specialist Achieved',
      description: 'Rating 1600 milestone unlocked! Consolidate contest speed and tackle 1600+ Div.2 D/E challenges.',
      minRating: 1600,
      maxRating: 1800,
      progressPercent: 100,
      ratingGap: 0,
    };
  }
}

/**
 * Intelligent Difficulty Adjustment
 * Never adjusts based on a single attempt alone. Uses multi-attempt historical window.
 */
export function evaluateDifficultyTrajectory(
  recentAttempts: ProblemAttempt[],
  userRating: number = 800
): DifficultyEvaluation {
  const baseRating = Math.max(800, userRating);
  if (!recentAttempts || recentAttempts.length < 3) {
    return {
      currentEffectiveRating: baseRating,
      adjustmentType: 'maintain',
      recommendedRating: baseRating,
      reason: 'Building baseline performance data across initial attempts.',
      suggestedPrerequisites: [],
      confidenceLevel: 'low',
      recentSolveRate: 100,
      consecutiveFailsAtDifficulty: 0,
    };
  }

  // Look at the last 8 attempts sorted newest first
  const sorted = [...recentAttempts].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  const sample = sorted.slice(0, 8);

  const solved = sample.filter(
    (a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently' || a.outcome === 'solved_with_hints'
  );
  const solveRate = Math.round((solved.length / sample.length) * 100);

  // Group by rating
  const highestRatingAttempted = Math.max(...sample.map((a) => a.rating || baseRating));
  const attemptsAtHighest = sample.filter((a) => (a.rating || baseRating) >= highestRatingAttempted - 100);

  let consecutiveFails = 0;
  for (const att of attemptsAtHighest) {
    const isSuccess = att.officialVerdict === 'OK' || att.outcome === 'solved_independently';
    if (!isSuccess) {
      consecutiveFails++;
    } else {
      break;
    }
  }

  // Check for repeated struggle (>= 2 consecutive fails or solve rate < 40% at high ratings)
  if (consecutiveFails >= 2 || (attemptsAtHighest.length >= 3 && solveRate < 40)) {
    const steppedDown = Math.max(800, highestRatingAttempted - 100);
    const weakTags = new Set<string>();
    attemptsAtHighest
      .filter((a) => a.officialVerdict !== 'OK' && a.outcome !== 'solved_independently')
      .forEach((a) => (a.tags || []).forEach((t) => weakTags.add(t)));

    const prerequisites: string[] = [];
    if (weakTags.has('dp')) prerequisites.push('Recursive state definition', 'Memoization arrays');
    if (weakTags.has('binary search')) prerequisites.push('Monotonic condition verification', 'Safe mid calculation: l + (r - l) / 2');
    if (weakTags.has('graphs') || weakTags.has('dfs and similar')) prerequisites.push('Adjacency list representation', 'Visited array tracking');
    if (weakTags.has('math')) prerequisites.push('Integer overflow boundaries', 'Modulo arithmetic rules');
    if (prerequisites.length === 0) prerequisites.push('Trace smallest inputs by hand', 'Fast I/O and boundary testing');

    return {
      currentEffectiveRating: highestRatingAttempted,
      adjustmentType: 'step_down',
      recommendedRating: steppedDown,
      reason: `Struggled with ${consecutiveFails} recent attempts at rating ${highestRatingAttempted}. Temporarily easing to rating ${steppedDown} to rebuild confidence and solidify core invariants.`,
      suggestedPrerequisites: prerequisites,
      confidenceLevel: 'high',
      recentSolveRate: solveRate,
      consecutiveFailsAtDifficulty: consecutiveFails,
    };
  }

  // Check for comfortable solving (solve rate >= 75% on last 5 problems with low hint usage)
  const comfortable = sample.slice(0, 5).every(
    (a) => (a.officialVerdict === 'OK' || a.outcome === 'solved_independently') && (a.hintsUsedCount || 0) <= 1
  );

  if (comfortable && sample.length >= 5) {
    const steppedUp = Math.min(1600, highestRatingAttempted + 100);
    return {
      currentEffectiveRating: highestRatingAttempted,
      adjustmentType: 'step_up',
      recommendedRating: steppedUp,
      reason: `Consistently accepted ${sample.slice(0, 5).length} consecutive problems at rating ${highestRatingAttempted} with minimal hints. Advancing difficulty to ${steppedUp} to stretch your reasoning.`,
      suggestedPrerequisites: ['Read problem statement twice before coding', 'Design counterexamples before first submission'],
      confidenceLevel: 'high',
      recentSolveRate: solveRate,
      consecutiveFailsAtDifficulty: 0,
    };
  }

  return {
    currentEffectiveRating: baseRating,
    adjustmentType: 'maintain',
    recommendedRating: baseRating,
    reason: `Steady performance at rating ${baseRating} (${solveRate}% recent accuracy). Continuing with targeted pattern practice.`,
    suggestedPrerequisites: [],
    confidenceLevel: 'medium',
    recentSolveRate: solveRate,
    consecutiveFailsAtDifficulty: 0,
  };
}

export type MissionDurationMode = '30min' | '60min' | '90min' | 'custom';

export interface GenerateMissionParams {
  userProfile: UserProfile;
  userGoal: UserGoal;
  recentAttempts: ProblemAttempt[];
  mistakesDue: MistakeRecord[];
  weakestTopic?: { id: string; name: string };
  durationMode?: MissionDurationMode;
  customMinutes?: number;
}

/**
 * Daily Mission Generator
 * Generates structured tasks matching:
 * 1. Warm-up problem
 * 2. Appropriately challenging target problem
 * 3. Targeted weak topic practice
 * 4. Revision of a previous mistake
 * 5. Optional timed practice
 * 6. Short end-of-day review
 */
export function generatePersonalizedMission(params: GenerateMissionParams): DailyPlan {
  const {
    userProfile,
    userGoal,
    recentAttempts,
    mistakesDue,
    weakestTopic,
    durationMode = '60min',
    customMinutes = 45,
  } = params;

  let targetMinutes = 60;
  if (durationMode === '30min') targetMinutes = 30;
  else if (durationMode === '60min') targetMinutes = 60;
  else if (durationMode === '90min') targetMinutes = 90;
  else targetMinutes = Math.max(15, Math.min(240, customMinutes));

  const diffEval = evaluateDifficultyTrajectory(recentAttempts, userProfile.verifiedCfRating || 800);
  const targetRating = diffEval.recommendedRating;
  const warmupRating = Math.max(800, targetRating - 200);

  // Pick problems from curated list
  const warmupProblem =
    CURATED_PROBLEMS_CATALOG.find((p) => p.rating === warmupRating) ||
    CURATED_PROBLEMS_CATALOG[0];

  const challengingProblem =
    CURATED_PROBLEMS_CATALOG.find((p) => p.rating === targetRating && p.contestId !== warmupProblem.contestId) ||
    CURATED_PROBLEMS_CATALOG.find((p) => p.rating >= targetRating) ||
    CURATED_PROBLEMS_CATALOG[1];

  const weakTopicName = weakestTopic?.name || 'Binary Search';
  const weakTopicProblem =
    CURATED_PROBLEMS_CATALOG.find((p) => p.tags.some((t) => t.toLowerCase().includes(weakTopicName.toLowerCase()))) ||
    CURATED_PROBLEMS_CATALOG.find((p) => p.rating === targetRating) ||
    CURATED_PROBLEMS_CATALOG[2];

  const tasks: DailyTask[] = [];

  // Task 1: Warm-up
  tasks.push({
    id: `task_warmup_${Date.now()}_1`,
    title: `Warm-up: ${warmupProblem.name} (${warmupProblem.rating})`,
    description: `Solve this ${warmupProblem.rating}-rated problem quickly to prime your focus and fast I/O setup.`,
    category: 'warmup',
    estimatedMinutes: durationMode === '30min' ? 8 : 12,
    completed: false,
    problemId: `${warmupProblem.contestId}${warmupProblem.index}`,
  });

  // Task 2: Challenging Problem
  tasks.push({
    id: `task_challenge_${Date.now()}_2`,
    title: `Challenge: ${challengingProblem.name} (${challengingProblem.rating})`,
    description: `Target rating ${challengingProblem.rating} problem. Spend 15 minutes thinking independently before opening hints.`,
    category: 'problem',
    estimatedMinutes: durationMode === '30min' ? 14 : durationMode === '60min' ? 25 : 35,
    completed: false,
    problemId: `${challengingProblem.contestId}${challengingProblem.index}`,
  });

  // Task 3: Targeted Weak Topic Practice
  if (targetMinutes >= 45) {
    tasks.push({
      id: `task_weak_topic_${Date.now()}_3`,
      title: `Weak Topic Focus: ${weakTopicName} — ${weakTopicProblem.name}`,
      description: `Targeted practice for ${weakTopicName}. Focus on proving monotonicity or state bounds carefully.`,
      category: 'problem',
      estimatedMinutes: durationMode === '60min' ? 15 : 25,
      completed: false,
      problemId: `${weakTopicProblem.contestId}${weakTopicProblem.index}`,
      topicId: weakestTopic?.id,
    });
  }

  // Task 4: Mistake Revision
  if (mistakesDue && mistakesDue.length > 0) {
    const dueMistake = mistakesDue[0];
    tasks.push({
      id: `task_revision_${Date.now()}_4`,
      title: `Spaced Revision: ${dueMistake.problemName} (${dueMistake.problemId})`,
      description: `Recall the root cause: ${dueMistake.category.replace(/_/g, ' ')}. Why did it fail? Re-solve without peeking at the editorial.`,
      category: 'mistake_review',
      estimatedMinutes: durationMode === '30min' ? 5 : 8,
      completed: false,
      problemId: dueMistake.problemId,
    });
  } else {
    tasks.push({
      id: `task_revision_${Date.now()}_4`,
      title: 'Spaced Revision Check: Quick Invariant Recall',
      description: 'Review your personal mistake notebook concepts (integer overflow boundaries, 0-based indexing limits).',
      category: 'mistake_review',
      estimatedMinutes: durationMode === '30min' ? 4 : 5,
      completed: false,
    });
  }

  // Task 5: Optional Timed Speed Practice (for 90min or deep work)
  if (targetMinutes >= 90) {
    tasks.push({
      id: `task_speed_${Date.now()}_5`,
      title: 'Timed Speed Run: 15-Minute Div.2 A/B Sprint',
      description: 'Simulate contest pressure: read statement, code, and submit within 15 minutes with zero penalties.',
      category: 'problem',
      estimatedMinutes: 15,
      completed: false,
    });
  }

  // Task 6: End-of-Day Review
  tasks.push({
    id: `task_review_${Date.now()}_6`,
    title: 'Daily Debrief & Log',
    description: 'Log any new bugs or tricky edge cases into the Mistake Notebook and rate your session confidence.',
    category: 'reflection',
    estimatedMinutes: 5,
    completed: false,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    id: `plan_${todayStr}_${Date.now()}`,
    date: todayStr,
    dayNumber: userGoal.currentDay,
    mode: durationMode === '30min' ? 'minimum' : durationMode === '60min' ? 'standard' : 'deep_work',
    targetMinutes,
    actualMinutes: 0,
    tasks,
    status: 'planned',
  };
}

/**
 * Reschedule mission without shame or punitive streak resets
 */
export function rescheduleMission(
  plan: DailyPlan,
  newDate: string,
  reason: string = 'Schedule adjusted to accommodate academic or personal workload.'
): DailyPlan {
  return {
    ...plan,
    date: newDate,
    status: 'planned',
    tasks: plan.tasks.map((t) => ({
      ...t,
      completed: false,
      notes: t.notes ? `${t.notes} | Rescheduled: ${reason}` : `Rescheduled: ${reason}`,
    })),
  };
}

/**
 * Generate Weekly AI Coach Report with distinct measured results vs AI interpretations
 */
export function generateWeeklyCoachReport(
  attempts: ProblemAttempt[],
  mistakes: MistakeRecord[],
  weekNumber: number = 1
): WeeklyCoachReport {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyAttempts = attempts.filter((a) => new Date(a.startedAt) >= sevenDaysAgo);
  const accepted = weeklyAttempts.filter(
    (a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently'
  );

  const totalMinutes = Math.round(
    weeklyAttempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0) / 60
  );

  // Active days count
  const activeDays = new Set(weeklyAttempts.map((a) => a.startedAt.split('T')[0])).size;

  // Mistakes count
  const weeklyMistakes = mistakes.filter((m) => new Date(m.createdAt) >= sevenDaysAgo);
  const mistakeCounts: Record<string, number> = {};
  weeklyMistakes.forEach((m) => {
    mistakeCounts[m.category] = (mistakeCounts[m.category] || 0) + 1;
  });

  let topMistakeCategory: string | null = null;
  let topMistakeCount = 0;
  for (const [cat, cnt] of Object.entries(mistakeCounts)) {
    if (cnt > topMistakeCount) {
      topMistakeCount = cnt;
      topMistakeCategory = cat;
    }
  }

  const ratingsSolved = accepted.map((a) => a.rating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratingsSolved.length > 0 ? Math.round(ratingsSolved.reduce((a, b) => a + b, 0) / ratingsSolved.length) : 800;

  const solveRate = weeklyAttempts.length > 0 ? Math.round((accepted.length / weeklyAttempts.length) * 100) : 0;

  // Rule-based deterministic interpretations distinguishing measured vs strategic
  const whatImproved: string[] = [];
  if (accepted.length >= 5) {
    whatImproved.push(`Strong solving velocity with ${accepted.length} accepted problems logged this week.`);
  } else {
    whatImproved.push('Maintained steady deliberate problem analysis on foundational problem sets.');
  }
  if (avgRating >= 1100) {
    whatImproved.push(`Elevated average solved rating to ${avgRating}, demonstrating comfort beyond beginner 800-900 problems.`);
  } else {
    whatImproved.push('Reinforced core problem-solving hygiene on introductory 800-1000 ratings.');
  }

  const whatRemainedWeak: string[] = [];
  if (topMistakeCategory) {
    whatRemainedWeak.push(`Frequent errors under "${topMistakeCategory.replace(/_/g, ' ')}" (${topMistakeCount} recorded).`);
  } else {
    whatRemainedWeak.push('Edge-case verification before first submission requires more systematic paper dry-runs.');
  }
  if (solveRate < 60 && weeklyAttempts.length > 0) {
    whatRemainedWeak.push(`First-attempt solve rate (${solveRate}%) indicates premature submissions before verifying boundary constraints.`);
  }

  const recurringMistakePatterns: string[] = [];
  if (topMistakeCategory) {
    recurringMistakePatterns.push(`Concentrated in ${topMistakeCategory.replace(/_/g, ' ')}.`);
  }
  recurringMistakePatterns.push('Off-by-one boundary indices when transitioning between 0-based and 1-based arrays.');

  const focusSuggestions: string[] = [
    'Dedicate 10 minutes to pre-submission edge-case checklists (N=1, N=max, duplicates).',
    'Review scheduled spaced repetition mistakes before beginning daily challenge problems.',
    'Increase practice on weakest topic tags identified in your Algorithm Skill Tree.',
  ];

  return {
    id: `weekly_report_${weekNumber}_${Date.now()}`,
    generatedAt: now.toISOString(),
    weekNumber,
    startDate: sevenDaysAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    measuredResults: {
      problemsAttempted: weeklyAttempts.length,
      problemsAccepted: accepted.length,
      solveRatePercent: solveRate,
      totalFocusedMinutes: totalMinutes,
      activeDaysCount: activeDays,
      mistakesReviewedCount: weeklyMistakes.length,
      averageRatingSolved: avgRating,
      topMistakeCategory,
    },
    aiInterpretations: {
      whatImproved,
      whatRemainedWeak,
      recurringMistakePatterns,
      mostProductiveSessionSummary: `${activeDays} active practice days with ${totalMinutes} total focused minutes logged.`,
      consistencyAssessment: activeDays >= 4 ? 'Consistent training rhythm. Habitual practice is established.' : 'Variable cadence. Use Low-Energy or 30-Minute mode to protect consistency on busier days.',
      nextWeekStrategicFocus: focusSuggestions,
    },
  };
}
