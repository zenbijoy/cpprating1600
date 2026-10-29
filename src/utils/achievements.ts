import { ProblemAttempt, UserProfile, MistakeRecord } from '../types';
import { StreakAnalysis } from './streak';
import { calculateTheoreticalRating } from './ratingEstimator';

export type AchievementCategory = 'streak' | 'volume' | 'rating' | 'mastery';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

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
}

export interface AchievementStats {
  total: number;
  unlockedCount: number;
  completionPercent: number;
  recentUnlocks: AchievementBadge[];
  nextClosestBadge?: AchievementBadge;
}

export interface EvaluationInput {
  attempts: ProblemAttempt[];
  streakAnalysis?: StreakAnalysis;
  profile?: UserProfile;
  mistakes?: MistakeRecord[];
  theoreticalRating?: number;
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
    getValue: (m) => m.highestRatingSolved,
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
    getValue: (m) => m.mistakesCount,
  },
];

/**
 * Evaluates all milestone badges given attempts, streaks, rating, and mistakes.
 */
export function evaluateAchievements(input: EvaluationInput): AchievementBadge[] {
  const { attempts, streakAnalysis, profile, mistakes = [] } = input;

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
  };

  return BADGE_DEFINITIONS.map((def) => {
    const rawVal = def.getValue(metrics);
    const currentValue = Math.max(0, rawVal);
    const unlocked = currentValue >= def.targetValue;
    const progress = Math.min(1, Math.max(0, currentValue / def.targetValue));

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
    };
  });
}

/**
 * Calculates aggregate achievement stats and finds closest locked badge.
 */
export function getAchievementStats(badges: AchievementBadge[]): AchievementStats {
  const total = badges.length;
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const unlockedCount = unlockedBadges.length;
  const completionPercent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

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
  };
}
