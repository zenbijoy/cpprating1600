import { ProblemAttempt } from '../types';

export interface RatingEstimateResult {
  estimatedRating: number;
  confidenceMargin: number;
  ratingRange: [number, number];
  confidenceLevel: 'low' | 'moderate' | 'high';
  tierName: string;
  tierColor: string;
  pointsTo1600: number;
  totalQualifiedSolves: number;
  effectiveSolveWeight: number;
  topSolvesAverage: number;
  independenceRatio: number;
  targetRating: number;
  percentTowardsTarget: number;
  breakdown: {
    baseAnchor: number;
    topProblemsAnchor: number;
    volumeMultiplier: number;
    depthBonus: number;
  };
  recommendedNextTarget: {
    suggestedRating: number;
    recommendedQuantity: number;
    rationale: string;
  };
}

export interface SimulatedSolve {
  rating: number;
  count: number;
  independent: boolean;
}

/**
 * Calculates a theoretical Codeforces rating based on quantity, difficulty,
 * and independence of problems solved to date.
 */
export function calculateTheoreticalRating(
  attempts: ProblemAttempt[],
  baselineRating: number = 800,
  verifiedCfRating?: number
): RatingEstimateResult {
  const targetRating = 1600;

  // Filter to solved attempts (Accepted or solved independently/hints)
  const solvedAttempts = attempts.filter(
    (a) =>
      a.officialVerdict === 'OK' ||
      a.outcome === 'solved_independently' ||
      a.outcome === 'solved_with_hints'
  );

  // If no attempts are recorded, return baseline estimation
  if (solvedAttempts.length === 0) {
    const base = verifiedCfRating || baselineRating || 800;
    return {
      estimatedRating: base,
      confidenceMargin: 150,
      ratingRange: [Math.max(600, base - 150), base + 150],
      confidenceLevel: 'low',
      tierName: getTierName(base),
      tierColor: getTierColor(base),
      pointsTo1600: Math.max(0, targetRating - base),
      totalQualifiedSolves: 0,
      effectiveSolveWeight: 0,
      topSolvesAverage: base,
      independenceRatio: 0,
      targetRating,
      percentTowardsTarget: Math.min(100, Math.round((base / targetRating) * 100)),
      breakdown: {
        baseAnchor: base,
        topProblemsAnchor: base,
        volumeMultiplier: 0,
        depthBonus: 0,
      },
      recommendedNextTarget: {
        suggestedRating: 800,
        recommendedQuantity: 5,
        rationale: 'Solve foundational 800-rated problems to calibrate baseline confidence.',
      },
    };
  }

  // Calculate weighted items based on independence
  interface WeightedItem {
    rating: number;
    weight: number;
    outcome: string;
  }

  let totalWeight = 0;
  let independentWeight = 0;

  const weightedItems: WeightedItem[] = solvedAttempts.map((a) => {
    const rating = a.rating || 800;
    let weight = 0.8;

    if (a.outcome === 'solved_independently' || a.hintsUsedCount === 0) {
      weight = 1.0;
      independentWeight += 1.0;
    } else if (a.outcome === 'solved_with_hints') {
      const penalty = Math.min(0.25, (a.hintsUsedCount || 1) * 0.05);
      weight = Math.max(0.5, 0.75 - penalty);
      independentWeight += weight;
    } else if (a.outcome === 'editorial_studied') {
      weight = 0.4;
      independentWeight += 0.2;
    }

    totalWeight += weight;
    return { rating, weight, outcome: a.outcome };
  });

  // Sort descending by difficulty
  weightedItems.sort((a, b) => b.rating - a.rating);

  // Consider top K problems (up to 12) for the capability anchor
  const topK = weightedItems.slice(0, Math.min(12, weightedItems.length));
  const topWeightedSum = topK.reduce((sum, item) => sum + item.rating * item.weight, 0);
  const topWeightSum = topK.reduce((sum, item) => sum + item.weight, 0);
  const topSolvesAverage = topWeightSum > 0 ? Math.round(topWeightedSum / topWeightSum) : 800;

  // Base rating anchor
  const baseAnchor = verifiedCfRating || baselineRating || 800;

  // Volume factor: requires ~20 effective solved problems to fully reflect top difficulty
  const volumeMultiplier = Math.min(1.0, Number((totalWeight / 20).toFixed(2)));

  // Depth bonus: bonus for proving capability on multiple hard problems
  let depthBonus = 0;
  const count1200Plus = solvedAttempts.filter((a) => (a.rating || 0) >= 1200).length;
  const count1300Plus = solvedAttempts.filter((a) => (a.rating || 0) >= 1300).length;
  const count1400Plus = solvedAttempts.filter((a) => (a.rating || 0) >= 1400).length;

  if (count1400Plus >= 3) depthBonus += 40;
  else if (count1300Plus >= 3) depthBonus += 25;
  else if (count1200Plus >= 3) depthBonus += 15;

  // Calculate blended theoretical rating
  let estimatedRating = Math.round(
    baseAnchor * (1 - volumeMultiplier) + topSolvesAverage * volumeMultiplier + depthBonus
  );

  // Reasonable bound clamps
  estimatedRating = Math.max(600, Math.min(1900, estimatedRating));

  // Confidence margin based on volume and independence
  let confidenceLevel: 'low' | 'moderate' | 'high' = 'low';
  let confidenceMargin = 140;

  if (totalWeight >= 25 && (independentWeight / totalWeight) >= 0.6) {
    confidenceLevel = 'high';
    confidenceMargin = 50;
  } else if (totalWeight >= 10) {
    confidenceLevel = 'moderate';
    confidenceMargin = 90;
  }

  const independenceRatio = totalWeight > 0 ? Math.round((independentWeight / totalWeight) * 100) : 0;
  const pointsTo1600 = Math.max(0, targetRating - estimatedRating);
  const percentTowardsTarget = Math.min(100, Math.round((estimatedRating / targetRating) * 100));

  // Determine next practice tier recommendation
  let suggestedRating = 800;
  let recommendedQuantity = 5;
  let rationale = '';

  if (estimatedRating < 1000) {
    suggestedRating = 1000;
    recommendedQuantity = 6;
    rationale = 'Bridge toward 1000-rated greedy and string simulation problems without hints.';
  } else if (estimatedRating < 1200) {
    suggestedRating = 1200;
    recommendedQuantity = 8;
    rationale = 'Solve 1200-rated two-pointer, sorting, and binary search problems to unlock Pupil tier.';
  } else if (estimatedRating < 1400) {
    suggestedRating = 1300;
    recommendedQuantity = 10;
    rationale = 'Master 1300-1400 number theory, constructive algorithms, and prefix sums for Specialist trajectory.';
  } else {
    suggestedRating = 1500;
    recommendedQuantity = 8;
    rationale = 'Solidify Div.2 C and D problems (DP, graphs, trees) to achieve 1600 Specialist.';
  }

  return {
    estimatedRating,
    confidenceMargin,
    ratingRange: [Math.max(600, estimatedRating - confidenceMargin), estimatedRating + confidenceMargin],
    confidenceLevel,
    tierName: getTierName(estimatedRating),
    tierColor: getTierColor(estimatedRating),
    pointsTo1600,
    totalQualifiedSolves: solvedAttempts.length,
    effectiveSolveWeight: Number(totalWeight.toFixed(1)),
    topSolvesAverage,
    independenceRatio,
    targetRating,
    percentTowardsTarget,
    breakdown: {
      baseAnchor,
      topProblemsAnchor: topSolvesAverage,
      volumeMultiplier,
      depthBonus,
    },
    recommendedNextTarget: {
      suggestedRating,
      recommendedQuantity,
      rationale,
    },
  };
}

/**
 * Simulates how completing additional problems of specific ratings
 * alters the user's theoretical rating.
 */
export function simulateRatingProgression(
  existingAttempts: ProblemAttempt[],
  simulated: SimulatedSolve[],
  baselineRating: number = 800,
  verifiedCfRating?: number
): RatingEstimateResult {
  const simulatedAttempts: ProblemAttempt[] = [...existingAttempts];

  simulated.forEach((s, sIdx) => {
    for (let i = 0; i < s.count; i++) {
      simulatedAttempts.push({
        id: `sim_${sIdx}_${i}`,
        problemId: `SIM_${s.rating}_${i}`,
        index: 'A',
        name: `Simulated Problem (${s.rating})`,
        rating: s.rating,
        tags: ['simulation'],
        url: '',
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 1500,
        hintsUsedCount: s.independent ? 0 : 2,
        highestHintLevel: s.independent ? 0 : 2,
        officialVerdict: 'OK',
        outcome: s.independent ? 'solved_independently' : 'solved_with_hints',
        selfReported: true,
      });
    }
  });

  return calculateTheoreticalRating(simulatedAttempts, baselineRating, verifiedCfRating);
}

export function getTierName(rating: number): string {
  if (rating < 1000) return 'Newbie (Foundational)';
  if (rating < 1200) return 'Newbie (Advanced)';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist Candidate';
  return 'Specialist (Goal Achieved)';
}

export function getTierColor(rating: number): string {
  if (rating < 1200) return '#94a3b8'; // Slate/Grey (Newbie)
  if (rating < 1400) return '#10b981'; // Green (Pupil)
  if (rating < 1600) return '#06b6d4'; // Cyan (Specialist)
  return '#3b82f6'; // Blue
}
