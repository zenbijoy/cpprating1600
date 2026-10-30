import { CFProblem, CFRatingChange, CFSubmission, CFSubmissionRecord, CFUserInfo, ProblemAttempt } from '../types';

export type { CFUserInfo };
export type RatingChange = CFRatingChange;
export interface CodeforcesUser extends CFUserInfo {}

export interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: 'BEFORE' | 'CODING' | 'PENDING_SYSTEM_TEST' | 'SYSTEM_TEST' | 'FINISHED';
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
  preparedBy?: string;
  websiteUrl?: string;
  description?: string;
  difficulty?: number;
  kind?: string;
  icpcRegion?: string;
  country?: string;
  city?: string;
  season?: string;
}

export interface CFProblemStats {
  totalSolved: number;
  totalAttempted: number;
  accuracy: number;
  byRating: Record<string, number>;
  byTag: Record<string, number>;
  tagCounts: Record<string, number>; // alias for backwards compatibility
  byLanguage: Record<string, number>;
  verdictCounts: Record<string, number>;
  activityByDay: { date: string; count: number }[];
}

export function deriveStats(submissions: (CFSubmission | CFSubmissionRecord)[]): CFProblemStats {
  const solvedProblemIds = new Set<string>();
  const attemptedProblemIds = new Set<string>();
  const byRating: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};
  const verdictCounts: Record<string, number> = {};
  const activityMap: Record<string, number> = {};

  for (const sub of submissions) {
    const pid = `${sub.contestId ?? sub.problem.contestId ?? ''}${sub.problem.index}`;
    const verdict = sub.verdict ?? 'UNKNOWN';

    attemptedProblemIds.add(pid);
    verdictCounts[verdict] = (verdictCounts[verdict] ?? 0) + 1;
    if (sub.programmingLanguage) {
      byLanguage[sub.programmingLanguage] = (byLanguage[sub.programmingLanguage] ?? 0) + 1;
    }

    if (sub.creationTimeSeconds) {
      const dateKey = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
      activityMap[dateKey] = (activityMap[dateKey] ?? 0) + 1;
    }

    if (verdict === 'OK') {
      if (!solvedProblemIds.has(pid)) {
        solvedProblemIds.add(pid);
        const r = sub.problem.rating;
        if (r) {
          const bucket = String(Math.floor(r / 100) * 100);
          byRating[bucket] = (byRating[bucket] ?? 0) + 1;
        }
        for (const tag of sub.problem.tags ?? []) {
          byTag[tag] = (byTag[tag] ?? 0) + 1;
        }
      }
    }
  }

  const accuracy =
    attemptedProblemIds.size > 0
      ? Math.round((solvedProblemIds.size / attemptedProblemIds.size) * 100)
      : 0;

  const activityByDay = Object.entries(activityMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSolved: solvedProblemIds.size,
    totalAttempted: attemptedProblemIds.size,
    accuracy,
    byRating,
    byTag,
    tagCounts: byTag,
    byLanguage,
    verdictCounts,
    activityByDay,
  };
}

export function getRankColor(rank: string | undefined): string {
  if (!rank) return 'text-slate-400';
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('international grandmaster') || r.includes('grandmaster')) return 'text-red-500';
  if (r.includes('candidate master')) return 'text-violet-400';
  if (r.includes('international master') || r.includes('master')) return 'text-orange-500';
  if (r.includes('expert')) return 'text-blue-400';
  if (r.includes('specialist')) return 'text-cyan-400';
  if (r.includes('pupil')) return 'text-green-500';
  if (r.includes('newbie')) return 'text-slate-400';
  return 'text-slate-400';
}

export function getRankBg(rank: string | undefined): string {
  if (!rank) return 'bg-slate-800/60 border-slate-700/40';
  const r = rank.toLowerCase();
  if (r.includes('grandmaster')) return 'bg-red-950/40 border-red-800/50';
  if (r.includes('candidate master')) return 'bg-violet-950/40 border-violet-800/50';
  if (r.includes('master')) return 'bg-orange-950/40 border-orange-800/50';
  if (r.includes('expert')) return 'bg-blue-950/40 border-blue-800/50';
  if (r.includes('specialist')) return 'bg-cyan-950/40 border-cyan-800/50';
  if (r.includes('pupil')) return 'bg-green-950/40 border-green-800/50';
  return 'bg-slate-800/60 border-slate-700/40';
}

/**
 * Robust fetch wrapper with exponential backoff and jitter for transient API failures.
 */
async function fetchWithRetry(url: string, retries = 2, delayMs = 800): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      // Bad request or user not found shouldn't be retried
      if (res.status === 400 || res.status === 404) return res;
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      const jitter = Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt) + jitter));
    }
  }
  throw lastError || new Error(`Network failure requesting ${url}`);
}

/**
 * Returns remaining cooldown seconds before a manual sync is permitted (default: 30s).
 */
export function getSyncCooldownSeconds(lastSyncIso?: string | null, cooldownDurationSeconds = 30): number {
  if (!lastSyncIso) return 0;
  const lastTime = new Date(lastSyncIso).getTime();
  if (isNaN(lastTime)) return 0;
  const elapsed = Math.floor((Date.now() - lastTime) / 1000);
  return Math.max(0, cooldownDurationSeconds - elapsed);
}

/**
 * Calculates rating trajectory summary metrics across contest history.
 */
export function calculateRatingDelta(history: CFRatingChange[]): {
  totalChange: number;
  lastContestDelta: number;
  bestDelta: number;
  worstDelta: number;
} {
  if (!history || history.length === 0) {
    return { totalChange: 0, lastContestDelta: 0, bestDelta: 0, worstDelta: 0 };
  }
  const last = history[history.length - 1];
  const lastContestDelta = last.newRating - last.oldRating;
  let bestDelta = -Infinity;
  let worstDelta = Infinity;
  for (const h of history) {
    const d = h.newRating - h.oldRating;
    if (d > bestDelta) bestDelta = d;
    if (d < worstDelta) worstDelta = d;
  }
  const totalChange = history[history.length - 1].newRating - history[0].oldRating;
  return {
    totalChange,
    lastContestDelta,
    bestDelta: bestDelta === -Infinity ? 0 : bestDelta,
    worstDelta: worstDelta === Infinity ? 0 : worstDelta,
  };
}

export const codeforcesService = {
  getRankColor,
  getRankBg,
  getSyncCooldownSeconds,
  calculateRatingDelta,

  async getUserInfo(handle: string): Promise<CodeforcesUser> {
    const res = await fetchWithRetry(`/api/codeforces/user-info?handle=${encodeURIComponent(handle)}`);
    const data = await res.json();
    if (data.status !== 'OK' || !data.result?.[0]) {
      throw new Error(data.comment || `Codeforces handle "${handle}" not found`);
    }
    return data.result[0] as CodeforcesUser;
  },

  async getUserRating(handle: string): Promise<CFRatingChange[]> {
    const res = await fetchWithRetry(`/api/codeforces/user-rating?handle=${encodeURIComponent(handle)}`);
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch rating history');
    }
    return (data.result as CFRatingChange[]) ?? [];
  },

  async getUserSubmissions(handle: string, count = 100): Promise<CFSubmissionRecord[]> {
    const res = await fetchWithRetry(
      `/api/codeforces/user-status?handle=${encodeURIComponent(handle)}&count=${count}`
    );
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch user submissions');
    }
    return (data.result as CFSubmissionRecord[]) ?? [];
  },

  async getUpcomingContests(): Promise<CFContest[]> {
    const res = await fetchWithRetry('/api/codeforces/contests');
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch contests');
    }
    const contests: CFContest[] = data.result ?? [];
    return contests
      .filter(
        (c) =>
          c.phase === 'BEFORE' ||
          (c.phase === 'FINISHED' && c.relativeTimeSeconds != null && c.relativeTimeSeconds < 86400 * 7)
      )
      .sort((a, b) => (a.startTimeSeconds ?? 0) - (b.startTimeSeconds ?? 0));
  },

  async getAllContests(): Promise<CFContest[]> {
    const res = await fetchWithRetry('/api/codeforces/contests');
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch contests');
    return (data.result as CFContest[]) ?? [];
  },

  async getProblems(params?: {
    tag?: string;
    minRating?: number;
    maxRating?: number;
  }): Promise<CFProblem[]> {
    const query = new URLSearchParams();
    if (params?.tag) query.set('tag', params.tag);
    if (params?.minRating) query.set('minRating', String(params.minRating));
    if (params?.maxRating) query.set('maxRating', String(params.maxRating));
    const res = await fetchWithRetry(`/api/codeforces/problems?${query.toString()}`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch problems');
    return (data.result?.problems as CFProblem[]) ?? [];
  },
};

/**
 * Converts official Codeforces submission telemetry into standardized ProblemAttempt objects.
 * Populates real user practice sessions, activity heatmaps, solve rates, and problem statuses.
 */
export function convertCfSubmissionsToAttempts(submissions: (CFSubmission | CFSubmissionRecord)[]): ProblemAttempt[] {
  const attempts: ProblemAttempt[] = [];
  const seenIds = new Set<string>();

  for (const sub of submissions) {
    if (!sub) continue;
    const subId = String(sub.id || `${sub.contestId || ''}_${sub.problem.index}_${sub.creationTimeSeconds}`);
    if (seenIds.has(subId)) continue;
    seenIds.add(subId);

    const contestId = sub.problem?.contestId ?? sub.contestId;
    const index = (sub.problem?.index || 'A').toUpperCase();
    const problemId = `${contestId ?? ''}${index}`;
    const isOk = sub.verdict === 'OK';
    const creationSec = sub.creationTimeSeconds || Math.floor(Date.now() / 1000);
    const startedAt = new Date(creationSec * 1000).toISOString();
    const durationSeconds = Math.max(60, Math.round((sub.timeConsumedMillis || 60000) / 1000));
    const endedAt = new Date(creationSec * 1000 + durationSeconds * 1000).toISOString();

    attempts.push({
      id: `cf_${subId}`,
      problemId,
      contestId,
      index,
      name: sub.problem?.name || `Problem ${problemId}`,
      rating: sub.problem?.rating,
      tags: sub.problem?.tags && sub.problem?.tags.length > 0 ? sub.problem?.tags : ['implementation'],
      url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
      startedAt,
      endedAt,
      timeSpentSeconds: durationSeconds,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      outcome: isOk ? 'solved_independently' : 'attempted_gave_up',
      officialVerdict: (sub.verdict as any) || (isOk ? 'OK' : 'UNSUBMITTED'),
      selfReported: false,
      codeLanguage: (sub.programmingLanguage as any) || 'cpp20',
      approachNotes: isOk
        ? `Accepted on Codeforces in ${sub.programmingLanguage || 'C++'}. Runtime: ${sub.timeConsumedMillis || 0}ms.`
        : `Verdict: ${sub.verdict || 'WA'}. Passed tests: ${sub.passedTestCount ?? 0}.`,
    });
  }

  // Sort chronologically descending (newest submissions first)
  return attempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}
