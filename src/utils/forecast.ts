export interface ForecastPoint {
  day: number;
  label: string;
  actualRating: number | null;
  projectedRating: number | null;
  targetBenchmark: number;
  lowerBound?: number | null;
  upperBound?: number | null;
}

export interface ForecastSummary {
  points: ForecastPoint[];
  currentVelocityProblemsPerWeek: number;
  projectedFinalRating: number;
  projectedDayTo1600: number | null;
  paceStatus: 'ahead' | 'on_track' | 'needs_acceleration';
  insights: string;
}

/**
 * Calculates a 180-day rating projection trajectory based on solving velocity and current milestone.
 */
export function calculateRatingForecast(
  currentDay: number,
  solvedCount: number,
  currentVerifiedRating?: number,
  targetRating: number = 1600,
  totalDays: number = 180
): ForecastSummary {
  const baseline = currentVerifiedRating || 800;
  const daysElapsed = Math.max(1, currentDay);
  
  // Weekly solving velocity (assume minimum 3 problems/week as healthy baseline if brand new)
  const solvedRatePerDay = solvedCount / daysElapsed;
  const currentVelocityProblemsPerWeek = Math.max(1, Math.round(solvedRatePerDay * 7 * 10) / 10);

  // Growth model:
  // To reach 1600 from 800 in 180 days requires ~4.44 rating points per day,
  // typically driven by solving ~1.5 - 2 problems daily with progressive difficulty.
  // We model expected rating gain based on solving volume and consistency.
  const requiredDailyGain = (targetRating - 800) / totalDays;
  
  // Effective daily gain based on solved problems vs expected baseline (1 problem/day = target pace)
  const velocityFactor = Math.min(1.8, Math.max(0.6, (solvedCount + 1) / (daysElapsed * 0.8)));
  const estimatedDailyGain = requiredDailyGain * velocityFactor;

  // Key day milestones to plot: 1, 30, 60, 90, 120, 150, 180
  const milestoneDays = [1, 15, 30, 60, 90, 120, 150, 180];
  const points: ForecastPoint[] = [];

  for (const day of milestoneDays) {
    const isPast = day <= currentDay;
    const isPresent = Math.abs(day - currentDay) <= 7 || (day <= currentDay && day === 1);

    // Target benchmark curve (smooth linear ramp from 800 to 1600 across 180 days)
    const targetBenchmark = Math.round(800 + ((targetRating - 800) * (day / totalDays)));

    let actualRating: number | null = null;
    let projectedRating: number | null = null;
    let lowerBound: number | null = null;
    let upperBound: number | null = null;

    if (day === 1) {
      actualRating = baseline;
      projectedRating = baseline;
      lowerBound = baseline;
      upperBound = baseline;
    } else if (isPast) {
      // Historical estimated rating based on progress
      const historicalGain = Math.round((currentVerifiedRating || baseline) + (estimatedDailyGain * day));
      actualRating = Math.min(targetRating + 100, Math.max(baseline, historicalGain));
      projectedRating = actualRating;
      lowerBound = Math.max(baseline, actualRating - 40);
      upperBound = Math.min(1800, actualRating + 40);
    } else {
      // Future projection
      const currentAnchor = points[points.length - 1]?.actualRating || baseline;
      const daysFromCurrent = day - currentDay;
      const projected = Math.round(currentAnchor + (estimatedDailyGain * daysFromCurrent));
      projectedRating = Math.min(1800, Math.max(800, projected));
      
      // Expanding uncertainty corridor for future days
      const uncertainty = Math.round(30 + (daysFromCurrent * 0.45));
      lowerBound = Math.max(800, projectedRating - uncertainty);
      upperBound = Math.min(1800, projectedRating + uncertainty);
    }

    points.push({
      day,
      label: `Day ${day}`,
      actualRating,
      projectedRating,
      targetBenchmark,
      lowerBound,
      upperBound,
    });
  }

  const finalProjected = points[points.length - 1]?.projectedRating || targetRating;
  
  // Calculate projected day to reach 1600
  let projectedDayTo1600: number | null = null;
  if (estimatedDailyGain > 0) {
    const daysNeeded = Math.round((targetRating - baseline) / estimatedDailyGain);
    projectedDayTo1600 = Math.max(currentDay, Math.min(300, daysNeeded));
  }

  let paceStatus: 'ahead' | 'on_track' | 'needs_acceleration' = 'on_track';
  if (finalProjected >= targetRating + 50) paceStatus = 'ahead';
  else if (finalProjected < targetRating - 50) paceStatus = 'needs_acceleration';

  let insights = '';
  if (paceStatus === 'ahead') {
    insights = `At your current velocity (~${currentVelocityProblemsPerWeek} problems/wk), you are tracking ahead of schedule to cross 1600 around Day ${projectedDayTo1600 || 160}.`;
  } else if (paceStatus === 'on_track') {
    insights = `You are maintaining a steady trajectory aligned with the 180-day curriculum. Keep solving 1–2 target problems daily and review mistake notes.`;
  } else {
    insights = `Pace is currently conservative. Completing standard daily missions and upsolving one problem per contest will accelerate your slope towards 1600.`;
  }

  return {
    points,
    currentVelocityProblemsPerWeek,
    projectedFinalRating: finalProjected,
    projectedDayTo1600,
    paceStatus,
    insights,
  };
}
