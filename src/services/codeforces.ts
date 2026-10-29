import { CFProblem, CFSubmission } from '../types';

export interface CodeforcesUser {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface RatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: 'BEFORE' | 'CODING' | 'PENDING_SYSTEM_TEST' | 'SYSTEM_TEST' | 'FINISHED';
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
}

export const codeforcesService = {
  async getUserInfo(handle: string): Promise<CodeforcesUser> {
    const res = await fetch(`/api/codeforces/user-info?handle=${encodeURIComponent(handle)}`);
    const data = await res.json();
    if (data.status !== 'OK' || !data.result?.[0]) {
      throw new Error(data.comment || `Codeforces handle "${handle}" not found`);
    }
    return data.result[0];
  },

  async getUserRating(handle: string): Promise<RatingChange[]> {
    const res = await fetch(`/api/codeforces/user-rating?handle=${encodeURIComponent(handle)}`);
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch rating history');
    }
    return data.result || [];
  },

  async getUserSubmissions(handle: string, count = 50): Promise<CFSubmission[]> {
    const res = await fetch(`/api/codeforces/user-status?handle=${encodeURIComponent(handle)}&count=${count}`);
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch user submissions');
    }
    return data.result || [];
  },

  async getUpcomingContests(): Promise<CFContest[]> {
    const res = await fetch('/api/codeforces/contests');
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch contests');
    }
    const contests: CFContest[] = data.result || [];
    // Filter to BEFORE or recently finished
    return contests
      .filter((c) => c.phase === 'BEFORE' || (c.relativeTimeSeconds && c.relativeTimeSeconds < 86400 * 3))
      .sort((a, b) => (a.startTimeSeconds || 0) - (b.startTimeSeconds || 0));
  },

  async getProblems(params?: { tag?: string; minRating?: number; maxRating?: number }): Promise<CFProblem[]> {
    const query = new URLSearchParams();
    if (params?.tag) query.set('tag', params.tag);
    if (params?.minRating) query.set('minRating', String(params.minRating));
    if (params?.maxRating) query.set('maxRating', String(params.maxRating));

    const res = await fetch(`/api/codeforces/problems?${query.toString()}`);
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch problems');
    }
    return data.result?.problems || [];
  },
};
