import { SupabaseClient } from '@supabase/supabase-js';
import { jobProcessor } from './jobProcessor';
import { CFSyncHistoryRecord } from './types';

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    rating?: number;
    tags?: string[];
  };
  author: {
    contestId?: number;
    members: { handle: string }[];
  };
  programmingLanguage: string;
  verdict?: string;
  testset?: string;
  passedTestCount?: number;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
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

export class CodeforcesActivityTracker {
  private lastApiCallTime = 0;
  private minCallIntervalMs = 2000; // Rate limit protection: 2 seconds between CF API calls
  private isTrackerRunning = false;
  private trackerTimer: NodeJS.Timeout | null = null;
  private pollingIntervalMs: number;

  constructor() {
    this.pollingIntervalMs = parseInt(process.env.CF_POLLING_INTERVAL_MS || '120000', 10); // 2 minutes default
  }

  /**
   * Helper to fetch Codeforces API respecting rate limits and timeouts.
   */
  async fetchCodeforcesApi<T = any>(endpoint: string, timeoutMs = 8000): Promise<{ status: 'OK' | 'FAILED'; result?: T; comment?: string }> {
    const now = Date.now();
    const elapsed = now - this.lastApiCallTime;
    if (elapsed < this.minCallIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minCallIntervalMs - elapsed));
    }
    this.lastApiCallTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`https://codeforces.com/api/${endpoint}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'CLIMB-1600-Activity-Tracker/1.0' },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return { status: 'FAILED', comment: `HTTP status ${res.status}: ${res.statusText}` };
      }

      const json = await res.json();
      return json;
    } catch (err: any) {
      clearTimeout(timeout);
      return { status: 'FAILED', comment: err.message || 'Network request failed' };
    }
  }

  /**
   * Synchronizes submissions for a single verified user.
   * Explicitly distinguishes initial backfill from newly detected submissions.
   */
  async syncUserSubmissions(
    supabase: SupabaseClient,
    userId: string,
    handle: string
  ): Promise<{
    isInitialSync: boolean;
    newSubmissionsCount: number;
    acceptedCount: number;
    highestSubmissionId?: number;
  }> {
    // 1. Fetch current sync cursor
    const { data: syncHistory } = await supabase
      .from('cf_sync_history')
      .select('*')
      .eq('user_id', userId)
      .eq('cf_handle', handle)
      .maybeSingle();

    const isInitial = !syncHistory || syncHistory.last_submission_id == null;
    const fetchCount = isInitial ? 50 : 25;

    // 2. Fetch submissions from Codeforces API
    const response = await this.fetchCodeforcesApi<CFSubmission[]>(
      `user.status?handle=${encodeURIComponent(handle)}&from=1&count=${fetchCount}`
    );

    if (response.status !== 'OK' || !Array.isArray(response.result)) {
      await supabase
        .from('cf_sync_history')
        .upsert({
          user_id: userId,
          cf_handle: handle,
          sync_status: response.comment?.includes('limit') ? 'rate_limited' : 'error',
          error_details: response.comment || 'Failed to fetch status',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,cf_handle' });

      throw new Error(response.comment || 'Codeforces API status query returned error');
    }

    const submissions = response.result;
    if (submissions.length === 0) {
      await supabase.from('cf_sync_history').upsert({
        user_id: userId,
        cf_handle: handle,
        last_sync_time: new Date().toISOString(),
        sync_status: 'success',
        is_initial_import: isInitial,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,cf_handle' });

      return { isInitialSync: isInitial, newSubmissionsCount: 0, acceptedCount: 0 };
    }

    // Determine max ID in the fetched batch
    const maxFetchedId = Math.max(...submissions.map((s) => s.id));

    if (isInitial) {
      // INITIAL BACKFILL: Set cursor to highest seen ID, but do NOT fire new submission notifications!
      await supabase.from('cf_sync_history').upsert({
        user_id: userId,
        cf_handle: handle,
        last_submission_id: maxFetchedId,
        last_sync_time: new Date().toISOString(),
        sync_status: 'success',
        is_initial_import: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,cf_handle' });

      return {
        isInitialSync: true,
        newSubmissionsCount: 0,
        acceptedCount: 0,
        highestSubmissionId: maxFetchedId,
      };
    }

    // INCREMENTAL SYNC: Find submissions with ID > previous cursor
    const previousCursor = Number(syncHistory.last_submission_id);
    const newSubmissions = submissions
      .filter((s) => s.id > previousCursor)
      .sort((a, b) => a.id - b.id); // Oldest to newest

    let acceptedCount = 0;

    for (const sub of newSubmissions) {
      const contestId = sub.problem.contestId ?? sub.contestId;
      const probIndex = sub.problem.index;
      const probName = sub.problem.name;
      const verdict = sub.verdict || 'TESTING';

      // If accepted: schedule 'submission.accepted'
      if (verdict === 'OK') {
        acceptedCount++;
        await jobProcessor.scheduleJob(supabase, {
          userId,
          jobType: 'submission.accepted',
          idempotencyKey: `cf_sub_accepted_${sub.id}_user_${userId}`,
          scheduledFor: new Date(),
          payload: {
            userId,
            submissionId: sub.id,
            contestId,
            problemIndex: probIndex,
            problemName: probName,
            rating: sub.problem.rating,
            tags: sub.problem.tags || [],
            handle,
            solvedAt: new Date(sub.creationTimeSeconds * 1000).toISOString(),
          },
        });
      } else if (verdict !== 'TESTING') {
        // Meaningful non-OK verdict
        await jobProcessor.scheduleJob(supabase, {
          userId,
          jobType: 'submission.verdict_updated',
          idempotencyKey: `cf_sub_verdict_${sub.id}_${verdict}_user_${userId}`,
          scheduledFor: new Date(),
          payload: {
            userId,
            submissionId: sub.id,
            contestId,
            problemIndex: probIndex,
            problemName: probName,
            oldVerdict: 'TESTING',
            newVerdict: verdict,
            handle,
          },
        });
      }
    }

    // Update cursor in database
    await supabase.from('cf_sync_history').upsert({
      user_id: userId,
      cf_handle: handle,
      last_submission_id: maxFetchedId,
      last_sync_time: new Date().toISOString(),
      sync_status: 'success',
      is_initial_import: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,cf_handle' });

    return {
      isInitialSync: false,
      newSubmissionsCount: newSubmissions.length,
      acceptedCount,
      highestSubmissionId: maxFetchedId,
    };
  }

  /**
   * Tracks upcoming Codeforces contests and schedules advance notifications.
   */
  async syncContestsAndScheduleReminders(supabase: SupabaseClient): Promise<{
    contestsFound: number;
    remindersScheduled: number;
  }> {
    const response = await this.fetchCodeforcesApi<CFContest[]>('contest.list?gym=false');
    if (response.status !== 'OK' || !Array.isArray(response.result)) {
      console.warn('[CF Contest Tracker] Failed to fetch contests:', response.comment);
      return { contestsFound: 0, remindersScheduled: 0 };
    }

    // Filter upcoming contests (phase === 'BEFORE' and startTimeSeconds in the future)
    const nowSec = Math.floor(Date.now() / 1000);
    const upcomingContests = response.result.filter(
      (c) => c.phase === 'BEFORE' && c.startTimeSeconds && c.startTimeSeconds > nowSec
    );

    if (upcomingContests.length === 0) {
      return { contestsFound: 0, remindersScheduled: 0 };
    }

    // Fetch all users with verified accounts and contest category enabled
    const { data: users } = await supabase
      .from('user_cf_accounts')
      .select('user_id, cf_handle')
      .eq('verification_status', 'verified');

    if (!users || users.length === 0) {
      return { contestsFound: upcomingContests.length, remindersScheduled: 0 };
    }

    let scheduledCount = 0;

    for (const contest of upcomingContests) {
      const startTimeMs = (contest.startTimeSeconds || 0) * 1000;
      const contestUrl = `https://codeforces.com/contest/${contest.id}`;

      for (const u of users) {
        const prefs = await jobProcessor.getUserPreferences(supabase, u.user_id);
        if (!prefs.categories_enabled.contest) continue;

        const advanceMinutesList = prefs.contest_advance_minutes || [1440, 60, 15];

        for (const advanceMin of advanceMinutesList) {
          const scheduledTimeMs = startTimeMs - advanceMin * 60 * 1000;

          // If the scheduled time is still in the future:
          if (scheduledTimeMs > Date.now()) {
            const isStartingSoon = advanceMin <= 20;
            const jobType = isStartingSoon ? 'contest.starting_soon' : 'contest.upcoming';
            const idempotencyKey = `contest_${contest.id}_notice_${advanceMin}m_user_${u.user_id}`;

            const payload = isStartingSoon
              ? {
                  contestId: contest.id,
                  contestName: contest.name,
                  startTimeSeconds: contest.startTimeSeconds,
                  minutesUntilStart: advanceMin,
                  contestUrl,
                  userId: u.user_id,
                }
              : {
                  contestId: contest.id,
                  contestName: contest.name,
                  startTimeSeconds: contest.startTimeSeconds,
                  durationSeconds: contest.durationSeconds,
                  advanceNoticeMinutes: advanceMin,
                  contestUrl,
                  userId: u.user_id,
                };

            const result = await jobProcessor.scheduleJob(supabase, {
              userId: u.user_id,
              jobType,
              idempotencyKey,
              scheduledFor: new Date(scheduledTimeMs),
              payload,
            });

            if (result.scheduled) {
              scheduledCount++;
            }
          }
        }
      }
    }

    return {
      contestsFound: upcomingContests.length,
      remindersScheduled: scheduledCount,
    };
  }

  /**
   * Runs one full sync cycle across all linked verified users.
   */
  async runSyncCycle(supabase: SupabaseClient): Promise<{ usersSynced: number; errors: string[] }> {
    const { data: verifiedUsers, error } = await supabase
      .from('user_cf_accounts')
      .select('user_id, cf_handle')
      .eq('verification_status', 'verified');

    if (error || !verifiedUsers) {
      return { usersSynced: 0, errors: [error?.message || 'Failed to list verified users'] };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    for (const user of verifiedUsers) {
      try {
        await this.syncUserSubmissions(supabase, user.user_id, user.cf_handle);
        syncedCount++;
      } catch (err: any) {
        errors.push(`User ${user.cf_handle}: ${err.message}`);
      }
    }

    // Sync contests
    try {
      await this.syncContestsAndScheduleReminders(supabase);
    } catch (err: any) {
      errors.push(`Contest sync error: ${err.message}`);
    }

    return { usersSynced: syncedCount, errors };
  }

  /**
   * Starts periodic Codeforces activity tracker.
   */
  start(supabase: SupabaseClient) {
    if (this.isTrackerRunning) return;
    this.isTrackerRunning = true;
    console.log(`[CFActivityTracker] Started tracking with polling interval ${this.pollingIntervalMs}ms`);

    const cycle = async () => {
      if (!this.isTrackerRunning) return;
      try {
        await this.runSyncCycle(supabase);
      } catch (err) {
        console.error('[CFActivityTracker] Cycle error:', err);
      } finally {
        if (this.isTrackerRunning) {
          this.trackerTimer = setTimeout(cycle, this.pollingIntervalMs);
        }
      }
    };

    // First cycle after brief delay (5 seconds after server boot)
    this.trackerTimer = setTimeout(cycle, 5000);
  }

  /**
   * Stops periodic tracker.
   */
  stop() {
    this.isTrackerRunning = false;
    if (this.trackerTimer) {
      clearTimeout(this.trackerTimer);
      this.trackerTimer = null;
    }
    console.log('[CFActivityTracker] Stopped tracking');
  }
}

export const cfActivityTracker = new CodeforcesActivityTracker();
