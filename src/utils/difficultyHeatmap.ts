import { ProblemAttempt } from '../types';

export interface DifficultyBand {
  id: string;
  label: string;
  minRating: number;
  maxRating: number;
  tierColor: string;
  badge: string;
}

export interface HeatmapTimeBucket {
  id: string;
  label: string; // e.g. "W1", "W2", or "Oct 1-7"
  shortLabel: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface HeatmapCellProblem {
  id: string;
  name: string;
  rating?: number;
  verdict?: string;
}

export interface HeatmapCell {
  bucketId: string;
  bandId: string;
  solvedCount: number;
  attemptCount: number;
  problems: HeatmapCellProblem[];
  intensity: number; // 0 (none), 1 (1), 2 (2-3), 3 (4-5), 4 (6+)
}

export interface PlateauDiagnostic {
  status: 'plateau_detected' | 'healthy_progression' | 'overreaching' | 'early_stage';
  riskScore: number; // 0 to 100
  title: string;
  summary: string;
  actionableRecommendation: string;
  recentAverageDifficulty: number;
  peakDifficultySolved: number;
  recommendedNextBand: string;
}

export interface DifficultyHeatmapData {
  bands: DifficultyBand[];
  buckets: HeatmapTimeBucket[];
  cells: Record<string, HeatmapCell>; // key: `${bucketId}_${bandId}`
  diagnostic: PlateauDiagnostic;
  totalAnalyzedSolves: number;
  highestRatingSolved: number;
}

export const DIFFICULTY_BANDS: DifficultyBand[] = [
  {
    id: 'band_1600_plus',
    label: '1600+ (Specialist)',
    minRating: 1600,
    maxRating: 3500,
    tierColor: '#06b6d4', // cyan
    badge: 'Specialist Target',
  },
  {
    id: 'band_1400_1599',
    label: '1400 - 1599',
    minRating: 1400,
    maxRating: 1599,
    tierColor: '#818cf8', // indigo
    badge: 'Candidate Specialist',
  },
  {
    id: 'band_1200_1399',
    label: '1200 - 1399',
    minRating: 1200,
    maxRating: 1399,
    tierColor: '#10b981', // emerald
    badge: 'Pupil Tier',
  },
  {
    id: 'band_1000_1199',
    label: '1000 - 1199',
    minRating: 1000,
    maxRating: 1199,
    tierColor: '#f59e0b', // amber
    badge: 'Intermediate Newbie',
  },
  {
    id: 'band_800_999',
    label: '800 - 999',
    minRating: 800,
    maxRating: 999,
    tierColor: '#94a3b8', // slate
    badge: 'Foundations',
  },
];

/**
 * Maps problem rating to appropriate difficulty band.
 */
export function getBandForRating(rating: number = 800): DifficultyBand {
  for (const band of DIFFICULTY_BANDS) {
    if (rating >= band.minRating && rating <= band.maxRating) {
      return band;
    }
  }
  // Default to lowest if under 800, highest if above 1600
  return rating < 800 ? DIFFICULTY_BANDS[DIFFICULTY_BANDS.length - 1] : DIFFICULTY_BANDS[0];
}

/**
 * Calculates intensity level (0 to 4) based on solve count.
 */
function getIntensity(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

/**
 * Generates the Difficulty Distribution Heatmap across temporal weekly buckets.
 */
export function generateDifficultyHeatmap(
  attempts: ProblemAttempt[],
  weeksCount: number = 8,
  referenceDate?: Date
): DifficultyHeatmapData {
  const now = referenceDate || new Date();

  // Filter to solved attempts with dates
  const solvedAttempts = attempts.filter(
    (a) =>
      a.officialVerdict === 'OK' ||
      a.outcome === 'solved_independently' ||
      a.outcome === 'solved_with_hints'
  );

  // Generate weekly time buckets (most past on left, current week on right)
  const buckets: HeatmapTimeBucket[] = [];
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  for (let i = weeksCount - 1; i >= 0; i--) {
    const end = new Date(now.getTime() - i * oneWeekMs);
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    const weekNumber = weeksCount - i;

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const startMonth = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    buckets.push({
      id: `w_${weekNumber}`,
      label: `W${weekNumber} (${startMonth})`,
      shortLabel: `W${weekNumber}`,
      startDate: startStr,
      endDate: endStr,
      isCurrent: i === 0,
    });
  }

  // Initialize cells
  const cells: Record<string, HeatmapCell> = {};
  for (const bucket of buckets) {
    for (const band of DIFFICULTY_BANDS) {
      const key = `${bucket.id}_${band.id}`;
      cells[key] = {
        bucketId: bucket.id,
        bandId: band.id,
        solvedCount: 0,
        attemptCount: 0,
        problems: [],
        intensity: 0,
      };
    }
  }

  // Populate cells with problem attempts
  let highestRatingSolved = 0;

  for (const attempt of attempts) {
    const dateStr = (attempt.endedAt || attempt.startedAt || '').split('T')[0];
    const rating = attempt.rating || 800;
    const band = getBandForRating(rating);
    const isSolved =
      attempt.officialVerdict === 'OK' ||
      attempt.outcome === 'solved_independently' ||
      attempt.outcome === 'solved_with_hints';

    if (isSolved && rating > highestRatingSolved) {
      highestRatingSolved = rating;
    }

    // Find corresponding bucket
    for (const bucket of buckets) {
      if (dateStr >= bucket.startDate && dateStr <= bucket.endDate) {
        const key = `${bucket.id}_${band.id}`;
        if (cells[key]) {
          cells[key].attemptCount++;
          if (isSolved) {
            cells[key].solvedCount++;
            cells[key].problems.push({
              id: attempt.problemId,
              name: attempt.name,
              rating: attempt.rating,
              verdict: attempt.officialVerdict,
            });
          }
        }
        break;
      }
    }
  }

  // Update intensity values
  for (const key of Object.keys(cells)) {
    cells[key].intensity = getIntensity(cells[key].solvedCount);
  }

  // --- PLATEAU DIAGNOSTIC ENGINE ---
  const diagnostic = evaluatePlateau(buckets, cells, solvedAttempts.length, highestRatingSolved);

  return {
    bands: DIFFICULTY_BANDS,
    buckets,
    cells,
    diagnostic,
    totalAnalyzedSolves: solvedAttempts.length,
    highestRatingSolved,
  };
}

/**
 * Diagnoses whether the user is in a skill plateau (comfort trap),
 * advancing steadily, or overreaching.
 */
function evaluatePlateau(
  buckets: HeatmapTimeBucket[],
  cells: Record<string, HeatmapCell>,
  totalSolves: number,
  highestRatingSolved: number
): PlateauDiagnostic {
  // If user has solved very few problems
  if (totalSolves < 4) {
    return {
      status: 'early_stage',
      riskScore: 10,
      title: 'Foundations Calibration Phase',
      summary: 'You are in the initial calibration phase. Focus on building consistency and basic speed.',
      actionableRecommendation: 'Solve 1-2 standard problems daily around rating 800-900 to establish reliable problem-solving habits.',
      recentAverageDifficulty: highestRatingSolved || 800,
      peakDifficultySolved: highestRatingSolved || 800,
      recommendedNextBand: '800 - 999',
    };
  }

  // Analyze recent buckets (last 2-3 weeks) vs earlier buckets
  const recentBuckets = buckets.slice(-3);
  let recentTotalSolves = 0;
  let recentWeightedRatingSum = 0;
  let recentLowBandSolves = 0; // <= 999
  let recentMidBandSolves = 0; // 1000-1399
  let recentHighBandSolves = 0; // >= 1400

  for (const b of recentBuckets) {
    for (const band of DIFFICULTY_BANDS) {
      const cell = cells[`${b.id}_${band.id}`];
      if (cell && cell.solvedCount > 0) {
        recentTotalSolves += cell.solvedCount;
        const avgBandRating = (band.minRating + Math.min(1600, band.maxRating)) / 2;
        recentWeightedRatingSum += cell.solvedCount * avgBandRating;

        if (band.id === 'band_800_999') {
          recentLowBandSolves += cell.solvedCount;
        } else if (band.id === 'band_1000_1199' || band.id === 'band_1200_1399') {
          recentMidBandSolves += cell.solvedCount;
        } else {
          recentHighBandSolves += cell.solvedCount;
        }
      }
    }
  }

  const recentAvgDifficulty =
    recentTotalSolves > 0 ? Math.round(recentWeightedRatingSum / recentTotalSolves) : 800;

  // Check for Plateau: high volume in 800-999 with 0 or negligible mid/high solves
  const lowRatio = recentTotalSolves > 0 ? recentLowBandSolves / recentTotalSolves : 1;
  const isPlateau = recentTotalSolves >= 4 && lowRatio >= 0.8 && recentMidBandSolves === 0;

  if (isPlateau) {
    return {
      status: 'plateau_detected',
      riskScore: 78,
      title: 'Skill Plateau Detected (800–900 Comfort Trap)',
      summary: `You have solved ${recentLowBandSolves} problems recently, but ${Math.round(lowRatio * 100)}% are confined to the 800–900 foundations band without stepping up.`,
      actionableRecommendation: 'Deliberately step out of your comfort zone. Allocate your next 3 sessions strictly to 1100–1200 problems (Div.2 B). It is normal for solves to take longer; cognitive stretch is where rating growth happens.',
      recentAverageDifficulty: recentAvgDifficulty,
      peakDifficultySolved: highestRatingSolved,
      recommendedNextBand: '1000 - 1199',
    };
  }

  // Healthy Progression: balanced or upward shifting difficulty
  if (recentMidBandSolves > 0 || recentHighBandSolves > 0) {
    return {
      status: 'healthy_progression',
      riskScore: 15,
      title: 'Healthy Upward Difficulty Migration',
      summary: `Your practice is actively penetrating the ${recentHighBandSolves > 0 ? '1400+' : '1000–1399'} difficulty bands with an average rating of ${recentAvgDifficulty}.`,
      actionableRecommendation: 'Maintain this balanced distribution: 60% at your frontier rating (1200–1400) and 40% speed consolidation (1000).',
      recentAverageDifficulty: recentAvgDifficulty,
      peakDifficultySolved: highestRatingSolved,
      recommendedNextBand: recentAvgDifficulty >= 1200 ? '1400 - 1599' : '1200 - 1399',
    };
  }

  // Default baseline
  return {
    status: 'early_stage',
    riskScore: 30,
    title: 'Foundations Consolidating',
    summary: 'Steady foundation practice. Prepare to introduce higher rating problems soon.',
    actionableRecommendation: 'Target your next solve at rating 1000 or 1100 to begin upward migration.',
    recentAverageDifficulty: recentAvgDifficulty,
    peakDifficultySolved: highestRatingSolved,
    recommendedNextBand: '1000 - 1199',
  };
}
