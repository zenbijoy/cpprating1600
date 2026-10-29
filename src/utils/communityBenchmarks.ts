import { ProblemAttempt, UserGoal, UserProfile } from '../types';

export interface BenchmarkPoint {
  day: number;
  label: string;
  isHistorical: boolean;
  // Rating comparison
  userRating: number | null;
  communityAverageRating: number;
  topQuartileRating: number;
  // Volume comparison
  userCumulativeSolves: number | null;
  communityAverageSolves: number;
  topQuartileSolves: number;
}

export type PaceComparisonStatus = 'ahead' | 'on_pace' | 'behind';

export interface CommunityBenchmarkComparison {
  currentDay: number;
  userCurrentRating: number;
  userSolvedCount: number;
  userWeeklyVelocity: number;
  // Community averages for current day
  communityAvgRating: number;
  communityAvgSolves: number;
  communityWeeklyVelocity: number;
  // Differences
  ratingDelta: number; // positive = ahead
  solvesDelta: number;
  velocityDelta: number;
  paceStatus: PaceComparisonStatus;
  cohortPercentile: number; // 1 to 99
  projectedDaysTo1600: number;
  communityDaysTo1600: number; // 180 days benchmark
  insights: string;
  points: BenchmarkPoint[];
}

/**
 * Expected Codeforces rating for average 1600 aspirant cohort on a given day (0-180).
 * Models a realistic competitive programming learning curve starting from 800 up to 1600.
 */
export function getCommunityAverageRating(day: number): number {
  if (day <= 0) return 800;
  if (day >= 180) return 1600;

  // Non-linear sigmoid-like progression:
  // Phase 1 (Days 1-14): 800 -> 870
  // Phase 2 (Days 15-35): 870 -> 980
  // Phase 3 (Days 36-70): 980 -> 1160
  // Phase 4 (Days 71-105): 1160 -> 1320
  // Phase 5 (Days 106-140): 1320 -> 1460
  // Phase 6-7 (Days 141-180): 1460 -> 1600
  const progressRatio = day / 180;
  // S-curve formula mapping 800 to 1600
  const curve = Math.pow(progressRatio, 1.15);
  return Math.round(800 + 800 * curve);
}

/**
 * Expected rating for top 25% of learners (faster pace, reaching 1600 earlier).
 */
export function getTopQuartileRating(day: number): number {
  if (day <= 0) return 800;
  if (day >= 140) return 1600;

  const progressRatio = Math.min(1, day / 140);
  const curve = Math.pow(progressRatio, 1.05);
  return Math.min(1650, Math.round(800 + 800 * curve));
}

/**
 * Expected cumulative solves for average 1600 aspirant (reaches ~220-250 solves by day 180).
 */
export function getCommunityAverageSolves(day: number): number {
  if (day <= 0) return 0;
  const progressRatio = day / 180;
  // ~240 total solves at day 180
  return Math.round(240 * Math.pow(progressRatio, 1.1));
}

/**
 * Expected cumulative solves for top quartile (reaches ~300 solves).
 */
export function getTopQuartileSolves(day: number): number {
  if (day <= 0) return 0;
  const progressRatio = day / 180;
  return Math.round(310 * Math.pow(progressRatio, 1.05));
}

/**
 * Calculates comparative community benchmark data comparing user metrics against the 1600 aspirant cohort.
 */
export function calculateCommunityBenchmarks(
  attempts: ProblemAttempt[],
  goal: UserGoal,
  profile?: UserProfile
): CommunityBenchmarkComparison {
  const currentDay = Math.min(180, Math.max(1, goal.currentDay || 1));

  const solvedAttempts = attempts.filter(
    (a) =>
      a.officialVerdict === 'OK' ||
      a.outcome === 'solved_independently' ||
      a.outcome === 'solved_with_hints'
  );

  const userSolvedCount = solvedAttempts.length;

  // Rating baseline
  let userCurrentRating = profile?.verifiedCfRating || 800;
  if (!profile?.verifiedCfRating && userSolvedCount > 0) {
    // Estimate based on solves
    const avgRating =
      solvedAttempts.reduce((sum, a) => sum + (a.rating || 800), 0) / userSolvedCount;
    userCurrentRating = Math.min(1600, Math.round(Math.max(800, avgRating + userSolvedCount * 12)));
  }

  // User velocity: problems per week
  const elapsedWeeks = Math.max(0.5, currentDay / 7);
  const userWeeklyVelocity = parseFloat((userSolvedCount / elapsedWeeks).toFixed(1));

  // Community baseline metrics for current day
  const communityAvgRating = getCommunityAverageRating(currentDay);
  const communityAvgSolves = getCommunityAverageSolves(currentDay);
  const communityWeeklyVelocity = 5.0; // standard cohort velocity is ~5 solves/week

  const ratingDelta = userCurrentRating - communityAvgRating;
  const solvesDelta = userSolvedCount - communityAvgSolves;
  const velocityDelta = parseFloat((userWeeklyVelocity - communityWeeklyVelocity).toFixed(1));

  // Pace comparison status
  let paceStatus: PaceComparisonStatus = 'on_pace';
  if (ratingDelta >= 40 || solvesDelta >= 5 || velocityDelta >= 1.5) {
    paceStatus = 'ahead';
  } else if (ratingDelta <= -50 || solvesDelta <= -6 || velocityDelta <= -2.0) {
    paceStatus = 'behind';
  }

  // Cohort Percentile estimation (1 to 99)
  // 50 is median; performance above/below shifts percentile
  const ratingFactor = (ratingDelta / 200) * 25;
  const solvesFactor = (solvesDelta / Math.max(5, communityAvgSolves || 5)) * 25;
  const rawPercentile = 50 + ratingFactor + solvesFactor;
  const cohortPercentile = Math.min(98, Math.max(5, Math.round(rawPercentile)));

  // Projected days to 1600 based on velocity and rating
  const remainingRating = Math.max(0, 1600 - userCurrentRating);
  const estimatedDaysRemaining =
    userWeeklyVelocity > 0
      ? Math.round((remainingRating / 12) * (7 / Math.max(1, userWeeklyVelocity)))
      : 180;
  const projectedDaysTo1600 = Math.min(240, Math.max(currentDay, currentDay + estimatedDaysRemaining));

  // Generate 13 sample points across 180 days (every 15 days)
  const sampleDays = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
  const points: BenchmarkPoint[] = sampleDays.map((day) => {
    const isHistorical = day <= currentDay;
    const commRating = getCommunityAverageRating(day);
    const topRating = getTopQuartileRating(day);
    const commSolves = getCommunityAverageSolves(day);
    const topSolves = getTopQuartileSolves(day);

    let uRating: number | null = null;
    let uSolves: number | null = null;

    if (day === 0) {
      uRating = 800;
      uSolves = 0;
    } else if (isHistorical) {
      // Historical or current interpolation
      const dayFraction = day / currentDay;
      uRating = Math.round(800 + (userCurrentRating - 800) * dayFraction);
      uSolves = Math.round(userSolvedCount * dayFraction);
    } else {
      // Future projection at user's current velocity
      const futureDaysFromNow = day - currentDay;
      const projectedRatingGain = Math.round(
        (userWeeklyVelocity / 5) * (futureDaysFromNow / 7) * 28
      );
      uRating = Math.min(1600, Math.max(800, userCurrentRating + projectedRatingGain));
      const projectedSolvesGain = Math.round((userWeeklyVelocity / 7) * futureDaysFromNow);
      uSolves = userSolvedCount + projectedSolvesGain;
    }

    return {
      day,
      label: `Day ${day}`,
      isHistorical,
      userRating: uRating,
      communityAverageRating: commRating,
      topQuartileRating: topRating,
      userCumulativeSolves: uSolves,
      communityAverageSolves: commSolves,
      topQuartileSolves: topSolves,
    };
  });

  // Coaching Insights
  let insights = '';
  if (paceStatus === 'ahead') {
    insights = `You are performing in the top ${100 - cohortPercentile}% of competitive programmers targeting 1600. Your weekly solving velocity (${userWeeklyVelocity} probs/wk) is outpacing the median community cohort (+${velocityDelta}/wk). Maintain this momentum and focus on stepping into Div.2 B & C problems.`;
  } else if (paceStatus === 'on_pace') {
    insights = `Your progress is closely tracking the 1600 aspirant cohort benchmark. You have solved ${userSolvedCount} problems vs. the community average of ${communityAvgSolves}. Consistency is your strongest lever to maintain this trajectory through Phase 4.`;
  } else {
    insights = `You are currently ${Math.abs(solvesDelta)} problems behind the average cohort pace for Day ${currentDay}. A small boost of 1 extra problem every 2 days will quickly bring you back into the top 50th percentile.`;
  }

  return {
    currentDay,
    userCurrentRating,
    userSolvedCount,
    userWeeklyVelocity,
    communityAvgRating,
    communityAvgSolves,
    communityWeeklyVelocity,
    ratingDelta,
    solvesDelta,
    velocityDelta,
    paceStatus,
    cohortPercentile,
    projectedDaysTo1600,
    communityDaysTo1600: 180,
    insights,
    points,
  };
}
