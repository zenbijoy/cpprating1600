import { ProblemAttempt } from '../types';

export type TagPracticeStatus = 'critical' | 'moderate' | 'solid' | 'mastered';

export interface TagPracticeMetric {
  tag: string;
  displayName: string;
  solvedCount: number;
  attemptCount: number;
  failedCount: number;
  targetSolves: number;
  practiceNeedScore: number; // 0 to 100 (100 = critically needs practice, 0 = mastered/exceeded)
  status: TagPracticeStatus;
  recommendedRating: number;
  category: 'foundations' | 'algorithmic' | 'advanced';
  description: string;
}

export interface TopicAnalysisResult {
  tags: TagPracticeMetric[];
  topDeficitTags: TagPracticeMetric[]; // Tags with highest practiceNeedScore
  topStrengths: TagPracticeMetric[];
  totalTagsAnalyzed: number;
  overallCoveragePercent: number;
  totalUniqueTagsSolved: number;
}

interface BenchmarkTagConfig {
  tag: string;
  displayName: string;
  category: 'foundations' | 'algorithmic' | 'advanced';
  baseTarget: number;
  recommendedRating: number;
  description: string;
}

export const BENCHMARK_TAGS: BenchmarkTagConfig[] = [
  // Foundations
  {
    tag: 'implementation',
    displayName: 'Implementation',
    category: 'foundations',
    baseTarget: 12,
    recommendedRating: 800,
    description: 'Translating problem rules and simulations into clean, bug-free code.',
  },
  {
    tag: 'math',
    displayName: 'Basic Math',
    category: 'foundations',
    baseTarget: 10,
    recommendedRating: 800,
    description: 'Parity, divisibility, sequences, modular arithmetic, and formula derivation.',
  },
  {
    tag: 'brute force',
    displayName: 'Brute Force',
    category: 'foundations',
    baseTarget: 8,
    recommendedRating: 900,
    description: 'Exhaustive search within safe constraints (N <= 20 or small grids).',
  },
  {
    tag: 'strings',
    displayName: 'Strings',
    category: 'foundations',
    baseTarget: 8,
    recommendedRating: 900,
    description: 'Palindromes, anagrams, substring sliding, and character manipulations.',
  },

  // Algorithmic
  {
    tag: 'greedy',
    displayName: 'Greedy Reasoning',
    category: 'algorithmic',
    baseTarget: 10,
    recommendedRating: 1000,
    description: 'Making locally optimal choices that guarantee global optimality.',
  },
  {
    tag: 'sortings',
    displayName: 'Sorting & Comparators',
    category: 'algorithmic',
    baseTarget: 8,
    recommendedRating: 1000,
    description: 'Custom comparators, sorting by endpoints, coordinate compression.',
  },
  {
    tag: 'two pointers',
    displayName: 'Two Pointers',
    category: 'algorithmic',
    baseTarget: 6,
    recommendedRating: 1100,
    description: 'Opposite-end and same-direction pointers on monotonic arrays.',
  },
  {
    tag: 'binary search',
    displayName: 'Binary Search',
    category: 'algorithmic',
    baseTarget: 8,
    recommendedRating: 1100,
    description: 'Binary search on sorted arrays and binary search on monotonic answers.',
  },
  {
    tag: 'number theory',
    displayName: 'Number Theory',
    category: 'algorithmic',
    baseTarget: 6,
    recommendedRating: 1200,
    description: 'GCD/LCM, prime sieves, factorization, and modular exponentiation.',
  },
  {
    tag: 'prefix sums',
    displayName: 'Prefix Sums',
    category: 'algorithmic',
    baseTarget: 6,
    recommendedRating: 1100,
    description: 'O(1) range sum queries and 2D prefix grids.',
  },

  // Advanced / Specialist
  {
    tag: 'dp',
    displayName: 'Dynamic Programming',
    category: 'advanced',
    baseTarget: 8,
    recommendedRating: 1200,
    description: 'Subproblems, state transitions, memoization, and optimal substructure.',
  },
  {
    tag: 'constructive algorithms',
    displayName: 'Constructive Thinking',
    category: 'advanced',
    baseTarget: 6,
    recommendedRating: 1300,
    description: 'Building valid configurations or invariants meeting unusual constraints.',
  },
  {
    tag: 'graphs',
    displayName: 'Graphs & BFS/DFS',
    category: 'advanced',
    baseTarget: 6,
    recommendedRating: 1300,
    description: 'Adjacency lists, shortest paths, connected components, and traversals.',
  },
  {
    tag: 'trees',
    displayName: 'Trees',
    category: 'advanced',
    baseTarget: 5,
    recommendedRating: 1400,
    description: 'Tree traversals, depths, subtrees, and tree dynamic programming.',
  },
  {
    tag: 'dsu',
    displayName: 'Disjoint Set Union (DSU)',
    category: 'advanced',
    baseTarget: 4,
    recommendedRating: 1400,
    description: 'Union-find data structure for dynamic connectivity and Kruskal algorithm.',
  },
  {
    tag: 'bit manipulation',
    displayName: 'Bit Manipulation',
    category: 'algorithmic',
    baseTarget: 4,
    recommendedRating: 1200,
    description: 'Bitwise operations, masks, subsets, and XOR properties.',
  },
];

/**
 * Normalizes problem tags into lowercase canonical strings.
 */
function normalizeTag(rawTag: string): string {
  return rawTag.trim().toLowerCase();
}

/**
 * Computes frequency analysis across solved and attempted problems,
 * ranking tags by practice deficit (how urgently the user needs to practice each topic).
 */
export function analyzeTopicFrequencies(
  attempts: ProblemAttempt[],
  currentDay: number = 1
): TopicAnalysisResult {
  // Aggregate stats per normalized tag
  const solvedByTag: Record<string, number> = {};
  const attemptsByTag: Record<string, number> = {};
  const failedByTag: Record<string, number> = {};

  for (const attempt of attempts) {
    const isSolved =
      attempt.officialVerdict === 'OK' ||
      attempt.outcome === 'solved_independently' ||
      attempt.outcome === 'solved_with_hints';

    const tags = attempt.tags || [];
    for (const rawTag of tags) {
      const tag = normalizeTag(rawTag);
      attemptsByTag[tag] = (attemptsByTag[tag] || 0) + 1;
      if (isSolved) {
        solvedByTag[tag] = (solvedByTag[tag] || 0) + 1;
      } else {
        failedByTag[tag] = (failedByTag[tag] || 0) + 1;
      }
    }
  }

  // Phase scaling factor (higher training days scale target benchmark expectations)
  const phaseMultiplier = Math.min(1.5, Math.max(0.6, 0.6 + (currentDay / 180) * 0.9));

  let coveredCount = 0;

  const tagMetrics: TagPracticeMetric[] = BENCHMARK_TAGS.map((cfg) => {
    const solved = solvedByTag[cfg.tag] || 0;
    const totalAttempts = attemptsByTag[cfg.tag] || 0;
    const failed = failedByTag[cfg.tag] || 0;
    const target = Math.max(2, Math.round(cfg.baseTarget * phaseMultiplier));

    if (solved >= 1) {
      coveredCount++;
    }

    // Practice Need Score (0 to 100):
    // Based on distance to target solves + penalty for failed attempts
    const deficitRatio = Math.max(0, (target - solved) / target);
    const failurePenalty = Math.min(25, failed * 5); // up to 25 points bonus urgency if failing
    const rawScore = deficitRatio * 75 + failurePenalty;
    const practiceNeedScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let status: TagPracticeStatus = 'critical';
    if (solved >= target) {
      status = solved >= target * 1.5 ? 'mastered' : 'solid';
    } else if (solved >= Math.ceil(target * 0.4)) {
      status = 'moderate';
    } else {
      status = 'critical';
    }

    return {
      tag: cfg.tag,
      displayName: cfg.displayName,
      solvedCount: solved,
      attemptCount: totalAttempts,
      failedCount: failed,
      targetSolves: target,
      practiceNeedScore,
      status,
      recommendedRating: cfg.recommendedRating,
      category: cfg.category,
      description: cfg.description,
    };
  });

  // Sort by practiceNeedScore descending (most needed first)
  const sortedByNeed = [...tagMetrics].sort((a, b) => b.practiceNeedScore - a.practiceNeedScore);

  // Top strengths (solved >= target, sorted by solvedCount desc)
  const topStrengths = [...tagMetrics]
    .filter((t) => t.solvedCount > 0)
    .sort((a, b) => b.solvedCount - a.solvedCount);

  const totalTagsAnalyzed = BENCHMARK_TAGS.length;
  const overallCoveragePercent = Math.round((coveredCount / totalTagsAnalyzed) * 100);

  return {
    tags: tagMetrics,
    topDeficitTags: sortedByNeed,
    topStrengths,
    totalTagsAnalyzed,
    overallCoveragePercent,
    totalUniqueTagsSolved: coveredCount,
  };
}
