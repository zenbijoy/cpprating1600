import { ProblemAttempt, UserProfile, MistakeRecord } from '../types';
import { StreakAnalysis } from './streak';
import { calculateTheoreticalRating } from './ratingEstimator';

export type AchievementCategory = 'streak' | 'volume' | 'rating' | 'mastery' | 'topics';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  targetValue: number;
  progress: number; // 0 to 1
  unit: string;
  xp: number;
  rarity: AchievementRarity;
  hint: string;
  claimed?: boolean;
}

export interface AchievementStats {
  total: number;
  unlockedCount: number;
  completionPercent: number;
  recentUnlocks: AchievementBadge[];
  nextClosestBadge?: AchievementBadge;
  totalXP: number;
  earnedXP: number;
  level: number;
  levelTitle: string;
  levelProgress: number; // 0 to 1
  xpForNextLevel: number;
  claimableCount: number;
  tierCounts: Record<AchievementTier, { unlocked: number; total: number }>;
  categoryCounts: Record<AchievementCategory, { unlocked: number; total: number }>;
}

export interface EvaluationInput {
  attempts: ProblemAttempt[];
  streakAnalysis?: StreakAnalysis;
  profile?: UserProfile;
  mistakes?: MistakeRecord[];
  theoreticalRating?: number;
  claimedIds?: string[];
}

/**
 * Storage helpers for gamified claimed rewards & pinned goals
 */
const CLAIMED_KEY = 'climb1600_claimed_achievements';
const PINNED_KEY = 'climb1600_pinned_achievement_id';

export function getClaimedBadgeIds(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(CLAIMED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function claimBadgeId(id: string): string[] {
  try {
    const current = getClaimedBadgeIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CLAIMED_KEY, JSON.stringify(updated));
      }
      return updated;
    }
    return current;
  } catch {
    return [id];
  }
}

export function getPinnedBadgeId(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(PINNED_KEY);
  } catch {
    return null;
  }
}

export function setPinnedBadgeId(id: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (id) {
      window.localStorage.setItem(PINNED_KEY, id);
    } else {
      window.localStorage.removeItem(PINNED_KEY);
    }
  } catch {
    // Ignore storage issues in test/restricted environments
  }
}

/**
 * Definition template for system achievement badges
 */
interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  targetValue: number;
  unit: string;
  xp: number;
  rarity: AchievementRarity;
  hint: string;
  getValue: (metrics: ComputedMetrics) => number;
}

interface ComputedMetrics {
  solvedCount: number;
  currentStreak: number;
  longestStreak: number;
  maxStreak: number;
  effectiveRating: number;
  zeroHintSolves: number;
  highestRatingSolved: number;
  mistakesCount: number;
  fastSolves: number;
  mathSolves: number;
  greedySolves: number;
  binarySearchSolves: number;
  dpSolves: number;
  graphSolves: number;
  stringSolves: number;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- STREAK ACHIEVEMENTS ---
  {
    id: 'streak_1',
    title: 'First Spark',
    description: 'Complete practice on at least 1 day.',
    category: 'streak',
    tier: 'bronze',
    icon: 'Flame',
    targetValue: 1,
    unit: 'day',
    xp: 50,
    rarity: 'Common',
    hint: 'Solve any problem or log a practice session to start your streak fire.',
    getValue: (m) => m.maxStreak,
  },
  {
    id: 'streak_3',
    title: 'Consistency Habit',
    description: 'Maintain an active practice streak of 3 consecutive days.',
    category: 'streak',
    tier: 'bronze',
    icon: 'Flame',
    targetValue: 3,
    unit: 'days',
    xp: 50,
    rarity: 'Common',
    hint: 'Solve problems on 3 consecutive days to build a consistent habit loop.',
    getValue: (m) => m.maxStreak,
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Maintain an active practice streak of 7 consecutive days.',
    category: 'streak',
    tier: 'silver',
    icon: 'Flame',
    targetValue: 7,
    unit: 'days',
    xp: 100,
    rarity: 'Rare',
    hint: 'One full calendar week of unbroken practice. True discipline.',
    getValue: (m) => m.maxStreak,
  },
  {
    id: 'streak_10',
    title: '10-Day Streak',
    description: 'Keep the momentum burning for 10 days in a row.',
    category: 'streak',
    tier: 'silver',
    icon: 'Flame',
    targetValue: 10,
    unit: 'days',
    xp: 100,
    rarity: 'Rare',
    hint: 'Double digits! Keep solving daily to stay in the flow zone.',
    getValue: (m) => m.maxStreak,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable Momentum',
    description: 'Achieve a legendary 30-day streak of disciplined problem solving.',
    category: 'streak',
    tier: 'platinum',
    icon: 'Zap',
    targetValue: 30,
    unit: 'days',
    xp: 500,
    rarity: 'Legendary',
    hint: 'A full month of non-stop competitive programming growth.',
    getValue: (m) => m.maxStreak,
  },

  // --- VOLUME ACHIEVEMENTS ---
  {
    id: 'volume_1',
    title: 'First Blood',
    description: 'Solve your very first competitive programming problem.',
    category: 'volume',
    tier: 'bronze',
    icon: 'Award',
    targetValue: 1,
    unit: 'problems',
    xp: 50,
    rarity: 'Common',
    hint: 'Pick any 800-rated problem from Day 1 and submit an Accepted solution.',
    getValue: (m) => m.solvedCount,
  },
  {
    id: 'volume_5',
    title: 'High Five',
    description: 'Complete your first 5 competitive programming problems.',
    category: 'volume',
    tier: 'bronze',
    icon: 'Award',
    targetValue: 5,
    unit: 'problems',
    xp: 50,
    rarity: 'Common',
    hint: 'Complete the foundational problem set to sharpen initial implementation mechanics.',
    getValue: (m) => m.solvedCount,
  },
  {
    id: 'volume_10',
    title: 'First 10 Problems Solved',
    description: 'Conquer your first 10 Codeforces problems.',
    category: 'volume',
    tier: 'silver',
    icon: 'CheckCircle2',
    targetValue: 10,
    unit: 'problems',
    xp: 100,
    rarity: 'Rare',
    hint: 'Solve across multiple basic categories: implementation, math, and greedy.',
    getValue: (m) => m.solvedCount,
  },
  {
    id: 'volume_25',
    title: 'Centurion Grinder',
    description: 'Reach 25 solved problems across all curriculum modules.',
    category: 'volume',
    tier: 'gold',
    icon: 'Trophy',
    targetValue: 25,
    unit: 'problems',
    xp: 250,
    rarity: 'Epic',
    hint: 'Tackle daily problem recommendations to build steady breadth.',
    getValue: (m) => m.solvedCount,
  },
  {
    id: 'volume_50',
    title: 'Half-Century Mastery',
    description: 'Solve 50 verified problems and build formidable muscle memory.',
    category: 'volume',
    tier: 'platinum',
    icon: 'Trophy',
    targetValue: 50,
    unit: 'problems',
    xp: 500,
    rarity: 'Legendary',
    hint: '50 solves develops deep algorithmic pattern recognition.',
    getValue: (m) => m.solvedCount,
  },
  {
    id: 'volume_100',
    title: 'The Century Club',
    description: 'Break through the prestigious 100-problem milestone.',
    category: 'volume',
    tier: 'platinum',
    icon: 'Trophy',
    targetValue: 100,
    unit: 'problems',
    xp: 500,
    rarity: 'Legendary',
    hint: 'Triple digit solves sets you firmly on track for candidate master level.',
    getValue: (m) => m.solvedCount,
  },

  // --- RATING ACHIEVEMENTS ---
  {
    id: 'rating_1000',
    title: 'Rating 1000 Calibrated',
    description: 'Attain a theoretical or verified rating of 1000+ points.',
    category: 'rating',
    tier: 'bronze',
    icon: 'TrendingUp',
    targetValue: 1000,
    unit: 'rating',
    xp: 50,
    rarity: 'Common',
    hint: 'Master 800-900 rating tier problems with clean logic and fast acceptance.',
    getValue: (m) => m.effectiveRating,
  },
  {
    id: 'rating_1200',
    title: 'Rating 1200 Reached',
    description: 'Graduate past Newbie and cross into Pupil tier (1200+ rating).',
    category: 'rating',
    tier: 'silver',
    icon: 'Shield',
    targetValue: 1200,
    unit: 'rating',
    xp: 100,
    rarity: 'Rare',
    hint: 'Solve 1000-1100 rated problems independently under 25 minutes.',
    getValue: (m) => m.effectiveRating,
  },
  {
    id: 'rating_1400',
    title: 'Specialist Candidate 1400',
    description: 'Climb above 1400 rating through rigorous problem tackling.',
    category: 'rating',
    tier: 'gold',
    icon: 'Target',
    targetValue: 1400,
    unit: 'rating',
    xp: 250,
    rarity: 'Epic',
    hint: 'Solidify Binary Search, Two Pointers, and greedy observations.',
    getValue: (m) => m.effectiveRating,
  },
  {
    id: 'rating_1600',
    title: '1600 Target Specialist',
    description: 'Reach your ultimate 1600 Codeforces rating goal!',
    category: 'rating',
    tier: 'platinum',
    icon: 'Sparkles',
    targetValue: 1600,
    unit: 'rating',
    xp: 500,
    rarity: 'Legendary',
    hint: 'Consistently solve Div.2 Problem C and contest-level problems.',
    getValue: (m) => m.effectiveRating,
  },

  // --- MASTERY & DISCIPLINE ACHIEVEMENTS ---
  {
    id: 'mastery_zero_hints',
    title: 'Zero-Hint Purist',
    description: 'Solve 5 problems completely independently with 0 hints opened.',
    category: 'mastery',
    tier: 'silver',
    icon: 'Sparkles',
    targetValue: 5,
    unit: 'solves',
    xp: 100,
    rarity: 'Rare',
    hint: 'Work with paper and pencil for at least 20 minutes before even looking at hints.',
    getValue: (m) => m.zeroHintSolves,
  },
  {
    id: 'mastery_hard_solve',
    title: 'Giant Slayer (1300+)',
    description: 'Solve a problem rated 1300 or higher without giving up.',
    category: 'mastery',
    tier: 'gold',
    icon: 'Zap',
    targetValue: 1300,
    unit: 'rating',
    xp: 250,
    rarity: 'Epic',
    hint: 'Step into stretch zone problems and fight through to an Accepted verdict.',
    getValue: (m) => m.highestRatingSolved,
  },
  {
    id: 'mastery_speed_demon',
    title: 'Speed Demon',
    description: 'Solve a competitive problem independently in under 15 minutes.',
    category: 'mastery',
    tier: 'silver',
    icon: 'Zap',
    targetValue: 1,
    unit: 'solves',
    xp: 100,
    rarity: 'Rare',
    hint: 'Write clean, bug-free logic swiftly on an 800-1000 rated problem.',
    getValue: (m) => m.fastSolves,
  },
  {
    id: 'mastery_mistakes',
    title: 'Mistake Hunter',
    description: 'Log and catalog 3 insightful mistakes into your mistake notebook.',
    category: 'mastery',
    tier: 'bronze',
    icon: 'AlertTriangle',
    targetValue: 3,
    unit: 'logs',
    xp: 50,
    rarity: 'Common',
    hint: 'When you get WA or TLE, log the root failure cause into your notebook.',
    getValue: (m) => m.mistakesCount,
  },

  // --- TOPIC MASTERY ACHIEVEMENTS ---
  {
    id: 'topic_math',
    title: 'Number Theory Alchemist',
    description: 'Solve 5 Math or Number Theory problems.',
    category: 'topics',
    tier: 'bronze',
    icon: 'Award',
    targetValue: 5,
    unit: 'solves',
    xp: 50,
    rarity: 'Common',
    hint: 'Practice problems tagged math or number theory in the curriculum.',
    getValue: (m) => m.mathSolves,
  },
  {
    id: 'topic_greedy',
    title: 'Greedy Tactician',
    description: 'Solve 5 Greedy approach problems.',
    category: 'topics',
    tier: 'bronze',
    icon: 'CheckCircle2',
    targetValue: 5,
    unit: 'solves',
    xp: 50,
    rarity: 'Common',
    hint: 'Identify local optimal choices that lead to globally optimal solutions.',
    getValue: (m) => m.greedySolves,
  },
  {
    id: 'topic_binary_search',
    title: 'Binary Search Marksman',
    description: 'Solve 5 Binary Search problems.',
    category: 'topics',
    tier: 'silver',
    icon: 'Target',
    targetValue: 5,
    unit: 'solves',
    xp: 100,
    rarity: 'Rare',
    hint: 'Formulate monotonic check predicates and search the optimal answer.',
    getValue: (m) => m.binarySearchSolves,
  },
  {
    id: 'topic_dp',
    title: 'DP Apprentice',
    description: 'Solve 3 Dynamic Programming problems.',
    category: 'topics',
    tier: 'gold',
    icon: 'Shield',
    targetValue: 3,
    unit: 'solves',
    xp: 250,
    rarity: 'Epic',
    hint: 'Define optimal subproblems, state transitions, and base cases.',
    getValue: (m) => m.dpSolves,
  },
  {
    id: 'topic_graphs',
    title: 'Graph Pathfinder',
    description: 'Solve 3 Graph or Tree problems.',
    category: 'topics',
    tier: 'gold',
    icon: 'TrendingUp',
    targetValue: 3,
    unit: 'solves',
    xp: 250,
    rarity: 'Epic',
    hint: 'Master BFS, DFS, and adjacency representations.',
    getValue: (m) => m.graphSolves,
  },
];

/**
 * Helper to check tags case-insensitively
 */
function hasTagKeyword(attempt: ProblemAttempt, keywords: string[]): boolean {
  if (!attempt.tags || !Array.isArray(attempt.tags)) return false;
  return attempt.tags.some((t) =>
    keywords.some((k) => t.toLowerCase().includes(k.toLowerCase()))
  );
}

/**
 * Evaluates all milestone badges given attempts, streaks, rating, and mistakes.
 */
export function evaluateAchievements(input: EvaluationInput): AchievementBadge[] {
  const { attempts, streakAnalysis, profile, mistakes = [], claimedIds } = input;

  // Filter solved attempts
  const solvedAttempts = attempts.filter(
    (a) =>
      a.officialVerdict === 'OK' ||
      a.outcome === 'solved_independently' ||
      a.outcome === 'solved_with_hints'
  );

  const solvedCount = solvedAttempts.length;

  const currentStreak = streakAnalysis?.currentStreak ?? 0;
  const longestStreak = streakAnalysis?.longestStreak ?? 0;
  const maxStreak = Math.max(currentStreak, longestStreak);

  // Compute rating if not provided
  let calculatedRating = input.theoreticalRating;
  if (calculatedRating === undefined) {
    const est = calculateTheoreticalRating(attempts, 800, profile?.verifiedCfRating);
    calculatedRating = est.estimatedRating;
  }

  const effectiveRating = Math.max(
    profile?.verifiedCfRating || 0,
    profile?.maxCfRating || 0,
    calculatedRating || 0
  );

  // Zero-hint solves count
  const zeroHintSolves = solvedAttempts.filter(
    (a) => a.outcome === 'solved_independently' || a.hintsUsedCount === 0
  ).length;

  // Highest rating problem solved
  let highestRatingSolved = 0;
  for (const a of solvedAttempts) {
    if (a.rating && a.rating > highestRatingSolved) {
      highestRatingSolved = a.rating;
    }
  }

  // Fast solves under 15m (900s)
  const fastSolves = solvedAttempts.filter(
    (a) => a.timeSpentSeconds > 0 && a.timeSpentSeconds <= 900
  ).length;

  // Topic-specific solve counts
  const mathSolves = solvedAttempts.filter((a) =>
    hasTagKeyword(a, ['math', 'number theory'])
  ).length;

  const greedySolves = solvedAttempts.filter((a) =>
    hasTagKeyword(a, ['greedy'])
  ).length;

  const binarySearchSolves = solvedAttempts.filter((a) =>
    hasTagKeyword(a, ['binary search', 'two pointers'])
  ).length;

  const dpSolves = solvedAttempts.filter((a) =>
    hasTagKeyword(a, ['dp', 'dynamic programming'])
  ).length;

  const graphSolves = solvedAttempts.filter((a) =>
    hasTagKeyword(a, ['graphs', 'trees', 'dfs and similar'])
  ).length;

  const stringSolves = solvedAttempts.filter((a) =>
    hasTagKeyword(a, ['strings', 'hashing', 'string suffix structures'])
  ).length;

  const metrics: ComputedMetrics = {
    solvedCount,
    currentStreak,
    longestStreak,
    maxStreak,
    effectiveRating,
    zeroHintSolves,
    highestRatingSolved,
    mistakesCount: mistakes.length,
    fastSolves,
    mathSolves,
    greedySolves,
    binarySearchSolves,
    dpSolves,
    graphSolves,
    stringSolves,
  };

  const storedClaimed = claimedIds || getClaimedBadgeIds();

  return BADGE_DEFINITIONS.map((def) => {
    const rawVal = def.getValue(metrics);
    const currentValue = Math.max(0, rawVal);
    const unlocked = currentValue >= def.targetValue;
    const progress = Math.min(1, Math.max(0, currentValue / def.targetValue));
    const claimed = unlocked && storedClaimed.includes(def.id);

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      tier: def.tier,
      icon: def.icon,
      unlocked,
      unlockedAt: unlocked ? new Date().toISOString() : undefined,
      currentValue,
      targetValue: def.targetValue,
      progress,
      unit: def.unit,
      xp: def.xp,
      rarity: def.rarity,
      hint: def.hint,
      claimed,
    };
  });
}

/**
 * Calculates level based on earned XP
 */
export function calculateLevel(earnedXP: number): {
  level: number;
  levelTitle: string;
  currentLevelBaseXP: number;
  nextLevelXP: number;
  progress: number;
  xpForNextLevel: number;
} {
  const tiers = [
    { level: 1, title: 'Codeforces Initiate', minXP: 0, nextXP: 150 },
    { level: 2, title: 'Algorithm Apprentice', minXP: 150, nextXP: 350 },
    { level: 3, title: 'Problem Hunter', minXP: 350, nextXP: 700 },
    { level: 4, title: 'Logic Specialist', minXP: 700, nextXP: 1200 },
    { level: 5, title: 'Contest Contender', minXP: 1200, nextXP: 1900 },
    { level: 6, title: 'Specialist Aspirant', minXP: 1900, nextXP: 2800 },
    { level: 7, title: 'Algorithmic Grandmaster', minXP: 2800, nextXP: 4000 },
  ];

  let currentTier = tiers[0];
  for (const t of tiers) {
    if (earnedXP >= t.minXP) {
      currentTier = t;
    }
  }

  const range = currentTier.nextXP - currentTier.minXP;
  const progressInLevel = Math.max(0, earnedXP - currentTier.minXP);
  const progress = range > 0 ? Math.min(1, progressInLevel / range) : 1;
  const xpForNextLevel = Math.max(0, currentTier.nextXP - earnedXP);

  return {
    level: currentTier.level,
    levelTitle: currentTier.title,
    currentLevelBaseXP: currentTier.minXP,
    nextLevelXP: currentTier.nextXP,
    progress,
    xpForNextLevel,
  };
}

/**
 * Calculates aggregate achievement stats and finds closest locked badge.
 */
export function getAchievementStats(badges: AchievementBadge[]): AchievementStats {
  const total = badges.length;
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const unlockedCount = unlockedBadges.length;
  const completionPercent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  // XP Calculations
  const totalXP = badges.reduce((sum, b) => sum + b.xp, 0);
  const earnedXP = unlockedBadges.reduce((sum, b) => sum + b.xp, 0);
  const levelData = calculateLevel(earnedXP);

  // Claimable count (unlocked but not yet claimed)
  const claimableCount = unlockedBadges.filter((b) => !b.claimed).length;

  // Tier counts
  const tierCounts: Record<AchievementTier, { unlocked: number; total: number }> = {
    bronze: { unlocked: 0, total: 0 },
    silver: { unlocked: 0, total: 0 },
    gold: { unlocked: 0, total: 0 },
    platinum: { unlocked: 0, total: 0 },
  };

  // Category counts
  const categoryCounts: Record<AchievementCategory, { unlocked: number; total: number }> = {
    streak: { unlocked: 0, total: 0 },
    volume: { unlocked: 0, total: 0 },
    rating: { unlocked: 0, total: 0 },
    mastery: { unlocked: 0, total: 0 },
    topics: { unlocked: 0, total: 0 },
  };

  for (const b of badges) {
    if (tierCounts[b.tier]) {
      tierCounts[b.tier].total += 1;
      if (b.unlocked) tierCounts[b.tier].unlocked += 1;
    }
    if (categoryCounts[b.category]) {
      categoryCounts[b.category].total += 1;
      if (b.unlocked) categoryCounts[b.category].unlocked += 1;
    }
  }

  // Find locked badge with highest progress (< 1.0)
  const lockedBadges = badges
    .filter((b) => !b.unlocked)
    .sort((a, b) => b.progress - a.progress);

  const nextClosestBadge = lockedBadges.length > 0 ? lockedBadges[0] : undefined;

  return {
    total,
    unlockedCount,
    completionPercent,
    recentUnlocks: unlockedBadges.slice(0, 3),
    nextClosestBadge,
    totalXP,
    earnedXP,
    level: levelData.level,
    levelTitle: levelData.levelTitle,
    levelProgress: levelData.progress,
    xpForNextLevel: levelData.xpForNextLevel,
    claimableCount,
    tierCounts,
    categoryCounts,
  };
}
