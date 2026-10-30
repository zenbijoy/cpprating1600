import { CFProblem, MistakeRecord } from '../types';

export type ContestDivision = 'Div. 2' | 'Div. 3' | 'Div. 4' | 'Educational' | 'Div. 1 + Div. 2' | 'Other';

export type ContestSessionMode = 'simulated' | 'practice';

export interface ContestProblemState {
  problem: CFProblem;
  status: 'unattempted' | 'attempting' | 'solved' | 'failed';
  verdict?: string;
  attemptsCount: number;
  solvedTimeSeconds?: number;
  penaltyMinutes: number;
  userNotes?: string;
}

export interface VirtualContestState {
  id: string;
  contestId: number;
  contestName: string;
  division: ContestDivision;
  mode: ContestSessionMode;
  durationSeconds: number;
  secondsRemaining: number;
  isPaused: boolean;
  isCompleted: boolean;
  startedAt: string;
  endedAt?: string;
  hideTagsAndRatings: boolean;
  problems: ContestProblemState[];
  strategyPrompts: { id: string; timestamp: number; message: string; type: 'warning' | 'tip' | 'decision' }[];
}

export interface ContestDebrief {
  contestId: number;
  contestName: string;
  totalSolved: number;
  totalProblems: number;
  totalPenaltyMinutes: number;
  estimatedPerformanceRating: number;
  ratingDeltaEstimate: number;
  upsolvingQueue: CFProblem[];
  keyTakeaways: string[];
  plannedVsActualSummary: string;
}

/**
 * Determines the division of a contest from its title.
 */
export function parseContestDivision(name: string): ContestDivision {
  const lower = name.toLowerCase();
  if (lower.includes('div. 4') || lower.includes('div.4') || lower.includes('division 4')) return 'Div. 4';
  if (lower.includes('div. 3') || lower.includes('div.3') || lower.includes('division 3')) return 'Div. 3';
  if (lower.includes('div. 2') || lower.includes('div.2') || lower.includes('division 2')) return 'Div. 2';
  if (lower.includes('educational')) return 'Educational';
  if (lower.includes('div. 1') && lower.includes('div. 2')) return 'Div. 1 + Div. 2';
  return 'Other';
}

/**
 * Generates recommended time allocations per problem letter.
 */
export function getRecommendedTimeAllocations(problemLetters: string[]): Record<string, number> {
  const allocation: Record<string, number> = {};
  const defaults: Record<string, number> = {
    A: 15, // 15 mins for A
    B: 25, // 25 mins for B
    C: 45, // 45 mins for C
    D: 35, // 35 mins for D
    E: 0,  // Stretch goal
    F: 0,
  };

  problemLetters.forEach((letter) => {
    allocation[letter] = defaults[letter] ?? 20;
  });

  return allocation;
}

/**
 * Calculates Codeforces/ICPC contest penalty points:
 * Each solved problem adds solve time (in minutes from contest start) + 20 minutes for each failed attempt prior to AC.
 */
export function calculateContestPenalty(problems: ContestProblemState[]): { solvedCount: number; totalPenaltyMinutes: number } {
  let solvedCount = 0;
  let totalPenaltyMinutes = 0;

  problems.forEach((p) => {
    if (p.status === 'solved' && p.solvedTimeSeconds !== undefined) {
      solvedCount++;
      const timeInMinutes = Math.floor(p.solvedTimeSeconds / 60);
      const failedAttemptsPenalty = Math.max(0, p.attemptsCount - 1) * 20;
      totalPenaltyMinutes += timeInMinutes + failedAttemptsPenalty;
    }
  });

  return { solvedCount, totalPenaltyMinutes };
}

/**
 * Estimates realistic performance rating from solved count, contest division, and penalty.
 * Based on historical Codeforces rating percentiles:
 * - In Div. 3: solving A,B,C,D (~4 problems) achieves ~1350; A,B,C,D,E (5 problems) achieves ~1550-1650.
 * - In Div. 2: solving A,B (2 problems) achieves ~1350-1450; A,B,C (3 problems) achieves ~1600-1700.
 * - In Div. 4: solving 6 problems achieves ~1400; 7 problems achieves ~1600.
 */
export function estimatePerformanceRating(
  solvedCount: number,
  division: ContestDivision,
  penaltyMinutes: number = 0
): number {
  let baseRating = 800;

  if (division === 'Div. 3') {
    if (solvedCount === 0) baseRating = 600;
    else if (solvedCount === 1) baseRating = 850;
    else if (solvedCount === 2) baseRating = 1050;
    else if (solvedCount === 3) baseRating = 1250;
    else if (solvedCount === 4) baseRating = 1420;
    else if (solvedCount === 5) baseRating = 1620;
    else baseRating = 1750 + (solvedCount - 6) * 100;
  } else if (division === 'Div. 2' || division === 'Educational') {
    if (solvedCount === 0) baseRating = 800;
    else if (solvedCount === 1) baseRating = 1150;
    else if (solvedCount === 2) baseRating = 1420;
    else if (solvedCount === 3) baseRating = 1630;
    else if (solvedCount === 4) baseRating = 1850;
    else baseRating = 2000;
  } else if (division === 'Div. 4') {
    if (solvedCount <= 2) baseRating = 700 + solvedCount * 100;
    else if (solvedCount === 3) baseRating = 950;
    else if (solvedCount === 4) baseRating = 1150;
    else if (solvedCount === 5) baseRating = 1320;
    else if (solvedCount === 6) baseRating = 1480;
    else if (solvedCount >= 7) baseRating = 1640;
  } else {
    baseRating = 1000 + solvedCount * 180;
  }

  // Slight penalty decay (fast solves earn up to +40, very slow solves lose up to -40)
  if (penaltyMinutes > 0 && solvedCount > 0) {
    const avgPenaltyPerSolve = penaltyMinutes / solvedCount;
    if (avgPenaltyPerSolve < 30) {
      baseRating += 30;
    } else if (avgPenaltyPerSolve > 90) {
      baseRating = Math.max(600, baseRating - 30);
    }
  }

  return baseRating;
}

/**
 * Mid-contest strategy coach prompt generator.
 */
export function generateMidContestAdvice(
  timeSpentOnCurrentProblemSeconds: number,
  attemptsCount: number,
  problemIndex: string
): string | null {
  const minutesSpent = Math.floor(timeSpentOnCurrentProblemSeconds / 60);

  if (attemptsCount >= 3) {
    return `You have ${attemptsCount} consecutive failed submissions on Problem ${problemIndex}. STOP and do NOT resubmit without a counterexample! Step away from the code, trace minimum N=1 boundary on paper, and check for 32-bit integer overflow.`;
  }

  if (minutesSpent >= 25 && (problemIndex === 'A' || problemIndex === 'B')) {
    return `You have spent ${minutesSpent} minutes on Problem ${problemIndex}. In Div. 2/3, Problem ${problemIndex} is designed to be solved within 15–20 minutes. Consider reading the next problem to unlock momentum!`;
  }

  if (minutesSpent >= 40) {
    return `Stuck on Problem ${problemIndex} for ${minutesSpent} minutes. Decision point: write down the simplest greedy exchange argument or take a 2-minute water break to reset tunnel vision.`;
  }

  return null;
}

/**
 * Generates pre-contest checklist tailored to user's mistake history.
 */
export function generatePreContestChecklist(
  division: ContestDivision,
  mistakes: MistakeRecord[]
): string[] {
  const baseChecklist = [
    'Fast I/O verified: ios_base::sync_with_stdio(false); cin.tie(NULL);',
    'Use long long for accumulators, sums, and prefix queries to prevent 32-bit overflow.',
    'Test sample testcases AND at least one manual boundary case (N=1, all equal, max bounds) before submitting.',
    '0-based vs 1-based indexing checked in all arrays and loop bounds.',
    'Do not linger more than 25 minutes on Problem A/B without reading Problem C.',
  ];

  // If user has recent mistakes in integer overflow, add explicit reminder
  const hasOverflowMistakes = mistakes.some((m) => m.category === 'integer_overflow');
  if (hasOverflowMistakes) {
    baseChecklist.unshift('⚠️ CAUTION: Integer overflow was logged in your recent mistake notebook. Type 1LL for bitshifts and multiply with long long!');
  }

  return baseChecklist;
}

/**
 * Generates complete post-contest debrief, calculating estimated rating, takeaways, and populating upsolving queue.
 */
export function generateContestDebrief(
  contestState: VirtualContestState,
  targetRating: number = 1600
): ContestDebrief {
  const { solvedCount, totalPenaltyMinutes } = calculateContestPenalty(contestState.problems);
  const estimatedRating = estimatePerformanceRating(
    solvedCount,
    contestState.division,
    totalPenaltyMinutes
  );

  const ratingDeltaEstimate = estimatedRating - targetRating;

  // Unsolved problems automatically queue into upsolving queue
  const upsolvingQueue: CFProblem[] = contestState.problems
    .filter((p) => p.status !== 'solved')
    .map((p) => p.problem);

  const keyTakeaways: string[] = [];

  if (solvedCount >= 3) {
    keyTakeaways.push(`Strong performance! You solved ${solvedCount} problems under contest conditions.`);
  } else {
    keyTakeaways.push(`Practice pace: ${solvedCount} solved. Consistent contest participation builds time-management instinct.`);
  }

  const failedAttemptsTotal = contestState.problems.reduce(
    (acc, curr) => acc + (curr.status === 'solved' ? Math.max(0, curr.attemptsCount - 1) : curr.attemptsCount),
    0
  );

  if (failedAttemptsTotal > 2) {
    keyTakeaways.push(`Penalty cost: ${failedAttemptsTotal} wrong submissions cost you ${failedAttemptsTotal * 20} penalty minutes. Always verify corner cases before submitting!`);
  }

  if (upsolvingQueue.length > 0) {
    keyTakeaways.push(`Top priority upsolve: Problem ${upsolvingQueue[0].index} (${upsolvingQueue[0].name}). Upsolving the first unsolved problem within 48 hours is the single highest-yield training habit.`);
  }

  const plannedVsActualSummary = `Solved ${solvedCount} of ${contestState.problems.length} problems in ${Math.round((contestState.durationSeconds - contestState.secondsRemaining) / 60)} minutes. Total penalty time: ${totalPenaltyMinutes}m. Estimated performance: ~${estimatedRating}.`;

  return {
    contestId: contestState.contestId,
    contestName: contestState.contestName,
    totalSolved: solvedCount,
    totalProblems: contestState.problems.length,
    totalPenaltyMinutes,
    estimatedPerformanceRating: estimatedRating,
    ratingDeltaEstimate,
    upsolvingQueue,
    keyTakeaways,
    plannedVsActualSummary,
  };
}

/**
 * Initializes a new virtual contest session.
 */
export function createVirtualContestSession(options: {
  contestId?: number;
  contestName: string;
  division?: ContestDivision;
  durationSeconds?: number;
  problems: CFProblem[];
  mode?: ContestSessionMode;
}): VirtualContestState {
  const duration = options.durationSeconds || 7200; // default 2 hours
  const division = options.division || parseContestDivision(options.contestName);
  const mode = options.mode || 'simulated';

  const problems: ContestProblemState[] = options.problems.map((p) => ({
    problem: p,
    status: 'unattempted',
    attemptsCount: 0,
    penaltyMinutes: 0,
  }));

  return {
    id: `vcontest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contestId: options.contestId || Math.floor(Date.now() / 1000),
    contestName: options.contestName,
    division,
    mode,
    durationSeconds: duration,
    secondsRemaining: duration,
    isPaused: false,
    isCompleted: false,
    startedAt: new Date().toISOString(),
    hideTagsAndRatings: mode === 'simulated',
    problems,
    strategyPrompts: [],
  };
}

/**
 * Records a submission inside a virtual contest session with penalty computation and advice.
 */
export function recordContestSubmission(
  contestState: VirtualContestState,
  problemIndex: string,
  verdict: 'OK' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR',
  elapsedSeconds: number
): VirtualContestState {
  // If contest is already completed or problem is already solved, ignore duplicates
  if (contestState.isCompleted) return contestState;

  const updatedProblems = contestState.problems.map((p) => {
    if (p.problem.index.toUpperCase() !== problemIndex.toUpperCase()) {
      return p;
    }

    // Ignore duplicate submissions once accepted
    if (p.status === 'solved') {
      return p;
    }

    const nextAttempts = p.attemptsCount + 1;
    if (verdict === 'OK') {
      return {
        ...p,
        status: 'solved' as const,
        verdict: 'OK',
        attemptsCount: nextAttempts,
        solvedTimeSeconds: elapsedSeconds,
      };
    } else {
      return {
        ...p,
        status: 'failed' as const,
        verdict,
        attemptsCount: nextAttempts,
      };
    }
  });

  // Check for mid-contest coaching advice
  const targetProb = updatedProblems.find(
    (p) => p.problem.index.toUpperCase() === problemIndex.toUpperCase()
  );
  const newPrompts = [...contestState.strategyPrompts];

  if (targetProb && targetProb.status !== 'solved') {
    const advice = generateMidContestAdvice(elapsedSeconds, targetProb.attemptsCount, problemIndex);
    if (advice && !newPrompts.some((pr) => pr.message === advice)) {
      newPrompts.unshift({
        id: `prompt_${Date.now()}`,
        timestamp: elapsedSeconds,
        message: advice,
        type: 'warning',
      });
    }
  }

  return {
    ...contestState,
    problems: updatedProblems,
    strategyPrompts: newPrompts,
  };
}

/**
 * Finalizes a virtual contest (e.g. time ran out, or user submitted "Finish Contest").
 */
export function finalizeVirtualContest(
  contestState: VirtualContestState,
  abandoned = false
): VirtualContestState {
  return {
    ...contestState,
    isCompleted: true,
    isPaused: false,
    endedAt: new Date().toISOString(),
    secondsRemaining: abandoned ? contestState.secondsRemaining : 0,
    hideTagsAndRatings: false, // reveal tags and ratings upon debrief
  };
}

export interface StandingsRow {
  rank: number;
  handle: string;
  isCurrentUser: boolean;
  solvedCount: number;
  totalPenaltyMinutes: number;
  problemStatuses: Record<string, { solved: boolean; attempts: number; solveTimeMin?: number }>;
}

/**
 * Generates local contest standings ranking competitors by:
 * 1. Solved count (descending)
 * 2. Total penalty minutes (ascending, tie-breaker)
 */
export function generateLocalStandings(
  contestState: VirtualContestState,
  currentUserHandle = 'You',
  simulatedCompetitors?: Array<{ handle: string; solvedCount: number; penaltyMinutes: number }>
): StandingsRow[] {
  const { solvedCount: userSolves, totalPenaltyMinutes: userPenalty } = calculateContestPenalty(
    contestState.problems
  );

  const userProblemStatuses: Record<string, { solved: boolean; attempts: number; solveTimeMin?: number }> = {};
  for (const p of contestState.problems) {
    userProblemStatuses[p.problem.index] = {
      solved: p.status === 'solved',
      attempts: p.attemptsCount,
      solveTimeMin: p.solvedTimeSeconds !== undefined ? Math.floor(p.solvedTimeSeconds / 60) : undefined,
    };
  }

  const competitors = simulatedCompetitors || [
    { handle: 'tourist_bot', solvedCount: contestState.problems.length, penaltyMinutes: 125 },
    { handle: 'alex_1500', solvedCount: Math.min(contestState.problems.length, 3), penaltyMinutes: 85 },
    { handle: 'cf_climber', solvedCount: 2, penaltyMinutes: 64 },
    { handle: 'novice_dev', solvedCount: 1, penaltyMinutes: 22 },
  ];

  const allRows = [
    {
      handle: currentUserHandle,
      isCurrentUser: true,
      solvedCount: userSolves,
      totalPenaltyMinutes: userPenalty,
      problemStatuses: userProblemStatuses,
    },
    ...competitors.map((c) => ({
      handle: c.handle,
      isCurrentUser: false,
      solvedCount: c.solvedCount,
      totalPenaltyMinutes: c.penaltyMinutes,
      problemStatuses: {},
    })),
  ];

  // Sort by solved count desc, then penalty asc
  allRows.sort((a, b) => {
    if (b.solvedCount !== a.solvedCount) {
      return b.solvedCount - a.solvedCount;
    }
    return a.totalPenaltyMinutes - b.totalPenaltyMinutes;
  });

  return allRows.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}

