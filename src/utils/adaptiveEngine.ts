import {
  AdaptiveProblemRecommendation,
  CFProblem,
  ComplexityCoachSession,
  MistakeCategory,
  MistakeRecord,
  PreContestMistakeChecklist,
  ProblemAttempt,
  UserGoal,
  VirtualContestSession,
  WeaknessDetectionReport,
} from '../types';
import { CURATED_PROBLEMS_CATALOG } from './roadmap';

// Standard constraint guidelines for CP
export const COMPLEXITY_RULES = [
  { maxN: 10, targetComplexity: 'O(N!) or O(2^N)', description: 'Backtracking, Bitmask DP' },
  { maxN: 20, targetComplexity: 'O(2^N * N)', description: 'Bitmask DP, Meet in the Middle' },
  { maxN: 50, targetComplexity: 'O(N^4)', description: 'Polynomial Floyd-Warshall, 4D DP' },
  { maxN: 400, targetComplexity: 'O(N^3)', description: 'Floyd-Warshall, Matrix Multiplication, 3D DP' },
  { maxN: 2000, targetComplexity: 'O(N^2)', description: 'Nested loops, 2D DP, all pairs' },
  { maxN: 100000, targetComplexity: 'O(N log N) or O(N)', description: 'Sorting, Binary Search, Two Pointers, Fenwick/Segment Tree' },
  { maxN: 1000000, targetComplexity: 'O(N) or O(log N)', description: 'Linear scan, Hash Map, Two Pointers, Sieve, Math' },
  { maxN: 1000000000, targetComplexity: 'O(log N) or O(1)', description: 'Binary Search on Answer, Fast Exponentiation, Math formula' },
];

export interface RecommendationWeights {
  difficultyMatchWeight: number; // default 0.35
  topicDeficitWeight: number;     // default 0.25
  errorPatternWeight: number;     // default 0.20
  recencyWeight: number;          // default 0.10
  timeFitWeight: number;          // default 0.10
}

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  difficultyMatchWeight: 0.35,
  topicDeficitWeight: 0.25,
  errorPatternWeight: 0.20,
  recencyWeight: 0.10,
  timeFitWeight: 0.10,
};

export interface RecommendationOptions {
  targetRating?: number;
  excludeTopics?: string[];
  includeTopics?: string[];
  availablePracticeTimeMinutes?: number;
  catalog?: CFProblem[];
  weights?: Partial<RecommendationWeights>;
  allowSolvedRevisions?: boolean;
}

export interface ScoredProblemCandidate {
  problem: CFProblem;
  totalScore: number;
  difficultyScore: number;
  topicScore: number;
  weaknessScore: number;
  explainableReason: string;
}

/**
 * Feature 31: Adaptive Problem Difficulty & Explainable Recommendation Engine
 * Dynamically selects the next problem based on:
 * - Current verified or estimated rating & target rating (1200, 1400, 1600)
 * - Recent solving rate, streak, and independent vs hint solves
 * - Mistake notebook weak patterns and topic performance
 * - Problem catalog filtering, topic inclusion/exclusion, duplicate avoidance
 * - Explainable score and human-readable reason
 */
export function recommendAdaptiveProblem(
  userRating: number,
  attempts: ProblemAttempt[],
  activeTopicId: string,
  mistakes: MistakeRecord[],
  options?: RecommendationOptions
): AdaptiveProblemRecommendation {
  const baseRating = userRating > 0 ? userRating : 800;
  const targetRating = options?.targetRating || 1600;
  const excludeTopics = new Set((options?.excludeTopics || []).map((t) => t.toLowerCase()));
  const includeTopics = options?.includeTopics && options.includeTopics.length > 0
    ? new Set(options.includeTopics.map((t) => t.toLowerCase()))
    : null;
  const weights: RecommendationWeights = {
    ...DEFAULT_RECOMMENDATION_WEIGHTS,
    ...(options?.weights || {}),
  };

  // 1. Calculate performance statistics from attempts
  const recentAttempts = attempts.slice(0, 5);
  const recentSolves = recentAttempts.filter(
    (a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently'
  );
  const independentSolves = recentAttempts.filter((a) => a.outcome === 'solved_independently');
  const recentFailures = recentAttempts.filter(
    (a) => a.officialVerdict && a.officialVerdict !== 'OK' && a.officialVerdict !== 'UNSUBMITTED'
  );

  let difficultyOffset = 0;
  let rationale = '';

  if (attempts.length === 0) {
    // Cold-start user
    difficultyOffset = 0;
    rationale = `Balanced targeted practice matching your baseline skill level (calibrated for ${targetRating} goal).`;
  } else if (recentAttempts.length >= 3 && independentSolves.length >= 3) {
    // High confidence: push slightly higher difficulty (+100)
    difficultyOffset = 100;
    rationale = 'This problem is a small step (+100) above your recent successful solves to build rating progression.';
  } else if (recentAttempts.length >= 3 && recentSolves.length <= 1) {
    // Struggling recently: consolidate fundamentals (-100 rating)
    difficultyOffset = -100;
    rationale = 'Consolidating confidence after recent difficult attempts (-100 rating).';
  } else {
    // Balanced practice at current rating
    difficultyOffset = 0;
    rationale = 'Balanced targeted practice matching your verified skill level.';
  }

  // Calculate target difficulty bounded by base rating offset and target rating cap
  const targetDifficulty = Math.max(800, Math.min(targetRating, baseRating + difficultyOffset));

  // 2. Identify weak topic tags from mistake notebook
  const weaknessReport = detectWeaknesses(mistakes);
  const topWeakness = weaknessReport.weaknesses[0];
  const recurringCategory = topWeakness ? topWeakness.category : null;

  // 3. Collect attempted problem IDs to avoid recommending previously attempted problems
  const attemptedProblemIds = new Set(
    attempts.map((a) => `${a.contestId || ''}${a.index}`.toUpperCase())
  );
  const solvedProblemIds = new Set(
    attempts
      .filter((a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently' || a.outcome === 'solved_with_hints')
      .map((a) => `${a.contestId || ''}${a.index}`.toUpperCase())
  );

  // 4. Candidate problem pool from supplied catalog or curated catalog
  const catalogPool: CFProblem[] = (options?.catalog && options.catalog.length > 0)
    ? options.catalog
    : CURATED_PROBLEMS_CATALOG;

  // 5. Filter candidates:
  // - Exclude user-excluded topics
  // - Respect user-requested specific topics if supplied
  // - Avoid previously solved problems unless revision is explicitly enabled
  let candidates = catalogPool.filter((p) => {
    const key = `${p.contestId || ''}${p.index}`.toUpperCase();

    // Check duplicate avoidance
    if (!options?.allowSolvedRevisions) {
      if (solvedProblemIds.has(key) || attemptedProblemIds.has(key)) {
        return false;
      }
    }

    // Check excluded topics
    const pTags = (p.tags || []).map((t) => t.toLowerCase());
    if (pTags.some((t) => excludeTopics.has(t))) {
      return false;
    }

    // Check included topics
    if (includeTopics && includeTopics.size > 0) {
      if (!pTags.some((t) => includeTopics.has(t))) {
        return false;
      }
    }

    return true;
  });

  // If strict filtering left no candidates, fall back to catalog items avoiding solved problems
  if (candidates.length === 0) {
    candidates = catalogPool.filter((p) => {
      const key = `${p.contestId || ''}${p.index}`.toUpperCase();
      return !solvedProblemIds.has(key);
    });
  }

  // If still empty (e.g. user solved everything in small catalog), allow any from catalog
  if (candidates.length === 0) {
    candidates = [...catalogPool];
  }

  // 6. Score and rank candidates deterministically
  const scoredCandidates: ScoredProblemCandidate[] = candidates.map((p) => {
    const pRating = p.rating || targetDifficulty;
    const diffDistance = Math.abs(pRating - targetDifficulty);
    // Difficulty score: 100 max, decays with rating difference
    const difficultyScore = Math.max(0, 100 - diffDistance * 0.25);

    // Topic score: higher if tags match active topic or weak topic
    const pTags = (p.tags || []).map((t) => t.toLowerCase());
    let topicScore = 50;
    if (activeTopicId && pTags.some((t) => activeTopicId.toLowerCase().includes(t) || t.includes(activeTopicId.toLowerCase()))) {
      topicScore += 30;
    }

    // Weakness score: bonus if problem addresses top weakness
    let weaknessScore = 0;
    let candidateReason = rationale;

    if (topWeakness) {
      if (
        (topWeakness.category === 'integer_overflow' || topWeakness.category === 'boundary_case') &&
        pTags.includes('math')
      ) {
        weaknessScore += 25;
        candidateReason = `Recommended to address your recurring ${topWeakness.title} pattern.`;
      } else if (topWeakness.category === 'wrong_complexity' && (pTags.includes('binary search') || pTags.includes('two pointers'))) {
        weaknessScore += 25;
        candidateReason = 'Recommended because optimizing time complexity with binary search / two pointers is a priority focus.';
      }
    }

    const totalScore =
      difficultyScore * weights.difficultyMatchWeight +
      topicScore * weights.topicDeficitWeight +
      weaknessScore * weights.errorPatternWeight;

    return {
      problem: p,
      totalScore,
      difficultyScore,
      topicScore,
      weaknessScore,
      explainableReason: candidateReason,
    };
  });

  // Sort by total score descending
  scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

  const bestCandidate = scoredCandidates[0] || {
    problem: {
      contestId: 1352,
      index: 'C',
      name: 'K-th Not Divisible by n',
      rating: targetDifficulty,
      tags: ['binary search', 'math'],
    },
    explainableReason: rationale,
  };

  const selectedProblem = bestCandidate.problem;

  return {
    problem: {
      contestId: selectedProblem.contestId,
      index: selectedProblem.index,
      name: selectedProblem.name,
      rating: selectedProblem.rating || targetDifficulty,
      tags: selectedProblem.tags || [],
    },
    rationale: bestCandidate.explainableReason || rationale,
    targetSkill: (selectedProblem.tags || []).join(', '),
    expectedDifficulty: selectedProblem.rating || targetDifficulty,
    matchedTopicId: activeTopicId,
  };
}

/**
 * Feature 32: Personalized Weakness Detection
 * Analyzes mistake notebook and attempt failures to detect recurring patterns.
 */
export function detectWeaknesses(mistakes: MistakeRecord[]): WeaknessDetectionReport {
  const categoryCounts: Partial<Record<MistakeCategory, number>> = {};
  for (const m of mistakes) {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  }

  const weaknessMap: Record<MistakeCategory, { title: string; action: string }> = {
    integer_overflow: {
      title: 'Integer Overflow in 32-bit arithmetic',
      action: 'Always use long long / int64_t for products, factorials, and running prefix sums exceeding 2e9.',
    },
    boundary_case: {
      title: 'Boundary & Edge Case Oversights (N=1, N=0, empty arrays)',
      action: 'Always trace extreme constraints manually before submitting code.',
    },
    wrong_complexity: {
      title: 'Time Limit Exceeded (TLE) & Complexity Misestimation',
      action: 'Estimate operation count against 1e8 limit before choosing algorithm.',
    },
    misread_statement: {
      title: 'Misreading Constraints or Problem Details',
      action: 'Restate inputs, outputs, and 1-based indexing explicitly before coding.',
    },
    wrong_observation: {
      title: 'Missing Key Invariant or Greedy Symmetry',
      action: 'Sort the array or write down 3 small examples by hand to observe monotonicity.',
    },
    incorrect_algorithm: {
      title: 'Applying Inappropriate Algorithmic Paradigm',
      action: 'Consult algorithmic checklist: can it be sorted? Is it two-pointers? Is it prefix sum?',
    },
    implementation_bug: {
      title: 'Implementation & Logic Glitches',
      action: 'Structure code into short pure helper functions and verify sample tests incrementally.',
    },
    indexing_error: {
      title: '0-based vs 1-based Off-by-one errors',
      action: 'Stick strictly to 0-based arrays or pad by 1 element with vector<long long>(n + 1).',
    },
    wrong_data_structure: {
      title: 'Suboptimal Data Structure Selection',
      action: 'Evaluate query times: std::set vs std::unordered_set vs std::vector.',
    },
    poor_time_management: {
      title: 'Spending Too Long on Dead-End Approaches',
      action: 'Set a hard 15-minute timer before stepping back or requesting Socratic Hint 1.',
    },
    needed_too_many_hints: {
      title: 'Over-reliance on Solution Reveals',
      action: 'Practice independent struggle: spend at least 20 minutes proving invariants independently.',
    },
    could_not_prove_correctness: {
      title: 'Submitting Guesswork Without Proof',
      action: 'Write down a 1-sentence proof of greedy exchange or DP state transitions.',
    },
    monotonicity_violation: {
      title: 'Monotonicity Violation (Two-Pointers / Binary Search Condition Broken)',
      action: 'Verify that the predicate function or data sequence is strictly monotonic before applying binary search or two pointers.',
    },
  };

  const detected = Object.entries(categoryCounts)
    .filter(([_, count]) => (count || 0) >= 1)
    .map(([cat, count]) => {
      const category = cat as MistakeCategory;
      const meta = weaknessMap[category];
      const freq = count || 0;
      return {
        category,
        title: meta.title,
        frequency: freq,
        impact: (freq >= 3 ? 'high' : freq >= 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        recommendedAction: meta.action,
        recommendedProblemIds: mistakes.filter((m) => m.category === category).map((m) => m.problemId),
      };
    })
    .sort((a, b) => b.frequency - a.frequency);

  return { weaknesses: detected };
}

/**
 * Feature 35: Complexity and Constraint Coach
 * Evaluates whether user's time and space complexity estimate matches problem constraints.
 */
export function evaluateComplexityEstimation(
  maxN: number,
  estimatedTime: string,
  estimatedSpace: string
): { isValid: boolean; expectedComplexity: string; feedback: string } {
  const normTime = estimatedTime.toLowerCase().replace(/\s+/g, '');

  let rule = COMPLEXITY_RULES[COMPLEXITY_RULES.length - 1];
  for (const r of COMPLEXITY_RULES) {
    if (maxN <= r.maxN) {
      rule = r;
      break;
    }
  }

  let isValid = false;
  let feedback = '';

  if (maxN <= 2000 && normTime.includes('o(n^2)')) {
    isValid = true;
    feedback = `Accurate! For N = ${maxN}, an O(N^2) solution executes ~${(maxN * maxN).toLocaleString()} operations, safely under the 10^8 Codeforces limit.`;
  } else if (maxN <= 100000 && (normTime.includes('o(nlogn)') || normTime.includes('o(n)'))) {
    isValid = true;
    feedback = `Correct! For N = ${maxN}, O(N log N) runs in ~1.7 x 10^6 operations, well within 1.0s.`;
  } else if (maxN > 2000 && normTime.includes('o(n^2)')) {
    isValid = false;
    feedback = `Caution! For N = ${maxN}, an O(N^2) algorithm requires ~${Math.pow(maxN, 2).toLocaleString()} operations. This will trigger Time Limit Exceeded (TLE)! You need O(N log N) or O(N).`;
  } else {
    isValid = normTime.includes('o(');
    feedback = `Target complexity for N <= ${maxN} is ${rule.targetComplexity} (${rule.description}).`;
  }

  return {
    isValid,
    expectedComplexity: rule.targetComplexity,
    feedback,
  };
}

/**
 * Feature 36: Mistake Pattern Engine & Pre-Contest Checklist
 * Creates a personalized pre-contest checklist based on user's active mistake notebook.
 */
export function generatePreContestChecklist(
  contestTitle: string,
  mistakes: MistakeRecord[]
): PreContestMistakeChecklist {
  const defaultItems = [
    {
      id: 'chk_1',
      rule: 'Check for 64-bit integer overflow on sums & products',
      rationale: 'Products of 10^5 elements or values up to 10^9 require long long in C++.',
      rootCause: 'integer_overflow' as MistakeCategory,
      verified: false,
    },
    {
      id: 'chk_2',
      rule: 'Test minimal boundary inputs: N = 1, N = 2, all elements identical',
      rationale: 'Boundary cases account for over 35% of first-submission Wrong Answers on Div.2 A/B.',
      rootCause: 'boundary_case' as MistakeCategory,
      verified: false,
    },
    {
      id: 'chk_3',
      rule: 'Verify fast I/O is present in C++ main()',
      rationale: 'cin.tie(NULL); ios_base::sync_with_stdio(false); prevents TLE on large testcases.',
      rootCause: 'wrong_complexity' as MistakeCategory,
      verified: false,
    },
  ];

  // Add customized items from user's most frequent mistakes
  const customItems = mistakes.slice(0, 3).map((m, idx) => ({
    id: `chk_custom_${idx + 1}`,
    rule: `Remember lesson from ${m.problemName}: ${m.personalLesson}`,
    rationale: `Previously failed due to: ${m.whyItFailed}`,
    rootCause: m.category,
    verified: false,
  }));

  return {
    id: `checklist_${Date.now()}`,
    contestTitle,
    generatedAt: new Date().toISOString(),
    items: [...defaultItems, ...customItems],
  };
}

/**
 * Feature 38: Contest Decision Coach
 * Evaluates pacing, skip thresholds, and post-contest upsolving priorities.
 */
export function evaluateContestDecisions(
  totalTimeMinutes: number,
  problemsAttempted: { index: string; timeSpentMinutes: number; solved: boolean }[]
): { pacingAdvice: string; upsolvingPriority: string[] } {
  const unsolved = problemsAttempted.filter((p) => !p.solved);
  const tooLongAttempts = problemsAttempted.filter((p) => p.timeSpentMinutes > 35 && !p.solved);

  let pacingAdvice = '';
  if (tooLongAttempts.length > 0) {
    pacingAdvice = `You spent over 35 minutes on Problem ${tooLongAttempts[0].index} without solving it. In Div.2 contests, apply a 25-minute skip rule: if no clear invariant is proven in 25 minutes, read the next problem before returning.`;
  } else {
    pacingAdvice = 'Disciplined pacing observed. Clean time allocation across problems.';
  }

  const upsolvingPriority = unsolved.map(
    (p) => `Problem ${p.index}: Upsolve within 48 hours while the problem statement is fresh.`
  );

  return { pacingAdvice, upsolvingPriority };
}
