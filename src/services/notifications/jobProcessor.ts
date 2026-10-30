import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { ScheduledJob, UserNotificationPreferences } from './types';
import { NotificationEventType, validateEventPayload } from './eventRegistry';
import { notificationRuleEngine } from './ruleEngine';
import { channelDispatcher } from './channels/channelDispatcher';

export class JobProcessor {
  private instanceId: string;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollIntervalMs: number;

  constructor() {
    this.instanceId = `worker_${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
    this.pollIntervalMs = parseInt(process.env.NOTIFICATION_POLL_INTERVAL_MS || '15000', 10);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Schedules a background notification job with an idempotency key.
   */
  async scheduleJob(
    supabase: SupabaseClient,
    job: {
      userId?: string;
      jobType: NotificationEventType;
      idempotencyKey: string;
      scheduledFor: Date;
      payload: Record<string, any>;
      maxAttempts?: number;
    }
  ): Promise<{ scheduled: boolean; jobId?: string; reason?: string }> {
    // 1. Validate payload against event schema
    const validation = validateEventPayload(job.jobType, job.payload);
    if (!validation.valid) {
      return { scheduled: false, reason: validation.error };
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_notification_jobs')
        .insert({
          user_id: job.userId || null,
          job_type: job.jobType,
          idempotency_key: job.idempotencyKey,
          scheduled_for: job.scheduledFor.toISOString(),
          payload: validation.data,
          status: 'pending',
          attempts: 0,
          max_attempts: job.maxAttempts || 5,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('idempotency_key')) {
          return { scheduled: false, reason: 'Duplicate idempotency key; job already scheduled.' };
        }
        return { scheduled: false, reason: error.message };
      }

      return { scheduled: true, jobId: data.id };
    } catch (err: any) {
      return { scheduled: false, reason: err.message };
    }
  }

  /**
   * Cancels obsolete pending jobs for a specific user and job types.
   * e.g., when daily target is met, cancel remaining 'daily_goal.incomplete' reminders.
   */
  async cancelObsoleteJobs(
    supabase: SupabaseClient,
    userId: string,
    jobTypes: NotificationEventType[]
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('scheduled_notification_jobs')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .in('job_type', jobTypes)
        .eq('status', 'pending')
        .select('id');

      if (error) {
        console.error('[JobProcessor] Error cancelling obsolete jobs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (err) {
      console.error('[JobProcessor] Fatal error cancelling obsolete jobs:', err);
      return 0;
    }
  }

  /**
   * Recovers stale jobs that have been locked in 'processing' status for > 5 minutes
   * (e.g. if a previous worker crashed or restarted during execution).
   */
  async recoverStaleJobs(supabase: SupabaseClient): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    try {
      const { data, error } = await supabase
        .from('scheduled_notification_jobs')
        .update({
          status: 'pending',
          locked_at: null,
          locked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'processing')
        .lt('locked_at', fiveMinutesAgo)
        .select('id');

      if (error) {
        console.error('[JobProcessor] Error recovering stale jobs:', error);
        return 0;
      }
      return data?.length || 0;
    } catch (err) {
      console.error('[JobProcessor] Exception during stale job recovery:', err);
      return 0;
    }
  }

  /**
   * Fetches user preferences or returns default preferences if not yet initialized.
   */
  async getUserPreferences(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserNotificationPreferences> {
    const defaultPrefs: UserNotificationPreferences = {
      user_id: userId,
      in_app_enabled: true,
      web_push_enabled: false,
      mobile_push_enabled: true,
      email_enabled: false,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC',
      categories_enabled: {
        submission: true,
        practice: true,
        contest: true,
        streak: true,
        system: true,
        guardian: true,
        curriculum: true,
      },
      preferred_practice_time: '20:00',
      contest_advance_minutes: [1440, 60, 15],
      daily_digest_enabled: false,
      weekly_digest_enabled: true,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: prefs, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!prefs || error) {
        // Auto-create default preferences
        await supabase
          .from('user_notification_preferences')
          .insert(defaultPrefs)
          .maybeSingle();
        return defaultPrefs;
      }

      return prefs as UserNotificationPreferences;
    } catch {
      return defaultPrefs;
    }
  }

  /**
   * Processes a single job transactionally.
   */
  async processJob(supabase: SupabaseClient, job: ScheduledJob): Promise<boolean> {
    const now = new Date();
    const eventType = job.job_type as NotificationEventType;
    const userId = job.user_id;

    if (!userId) {
      // System broadcast or untargeted event
      await supabase
        .from('scheduled_notification_jobs')
        .update({ status: 'completed', updated_at: now.toISOString() })
        .eq('id', job.id);
      return true;
    }

    try {
      const prefs = await this.getUserPreferences(supabase, userId);
      const decision = notificationRuleEngine.evaluateEvent(
        eventType,
        job.payload,
        prefs,
        now
      );

      if (!decision.shouldNotify) {
        // Condition not met (e.g. disabled, quiet hours, cooldown, or stale)
        await supabase
          .from('scheduled_notification_jobs')
          .update({
            status: 'completed',
            last_error: decision.reason || 'Skipped by rule engine evaluation.',
            updated_at: now.toISOString(),
          })
          .eq('id', job.id);
        return true;
      }

      // Dispatch notification
      const dispatchResult = await channelDispatcher.dispatch(supabase, {
        userId,
        type: eventType,
        category: decision.category,
        priority: decision.priority,
        title: decision.title,
        body: decision.body,
        actionUrl: decision.actionUrl,
        data: job.payload,
        channels: decision.channels,
      });

      // Mark job completed
      await supabase
        .from('scheduled_notification_jobs')
        .update({
          status: 'completed',
          updated_at: now.toISOString(),
        })
        .eq('id', job.id);

      return true;
    } catch (err: any) {
      console.error(`[JobProcessor] Error executing job ${job.id}:`, err);
      const nextAttempt = job.attempts + 1;
      const isFinalFailure = nextAttempt >= job.max_attempts;

      // Exponential backoff with jitter: min(1 hr, 1000 * 2^attempts + jitter)
      const jitterMs = Math.floor(Math.random() * 1000);
      const backoffMs = Math.min(3600_000, 1000 * Math.pow(2, job.attempts) + jitterMs);
      const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

      await supabase
        .from('scheduled_notification_jobs')
        .update({
          status: isFinalFailure ? 'failed' : 'pending',
          attempts: nextAttempt,
          next_retry_at: isFinalFailure ? null : nextRetryAt,
          locked_at: null,
          locked_by: null,
          last_error: err.message || 'Execution failure',
          updated_at: now.toISOString(),
        })
        .eq('id', job.id);

      return false;
    }
  }

  /**
   * Main poll cycle: recovers stale jobs and processes due jobs.
   */
  async runDueJobsBatch(supabase: SupabaseClient, limit = 10): Promise<{ processed: number; recovered: number }> {
    const recovered = await this.recoverStaleJobs(supabase);
    const nowIso = new Date().toISOString();

    // 1. Find candidates due for execution
    const { data: candidates, error } = await supabase
      .from('scheduled_notification_jobs')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('scheduled_for', nowIso)
      .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error || !candidates || candidates.length === 0) {
      return { processed: 0, recovered };
    }

    let processedCount = 0;

    for (const cand of candidates) {
      // 2. Concurrency lock: atomically claim candidate
      const { data: claimed, error: lockErr } = await supabase
        .from('scheduled_notification_jobs')
        .update({
          status: 'processing',
          locked_at: new Date().toISOString(),
          locked_by: this.instanceId,
        })
        .eq('id', cand.id)
        .in('status', ['pending', 'failed'])
        .select()
        .maybeSingle();

      if (lockErr || !claimed) {
        // Another worker instance claimed this job
        continue;
      }

      await this.processJob(supabase, claimed as ScheduledJob);
      processedCount++;
    }

    return { processed: processedCount, recovered };
  }

  /**
   * Starts periodic polling worker.
   */
  start(supabase: SupabaseClient) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[JobProcessor] Started notification worker "${this.instanceId}" with interval ${this.pollIntervalMs}ms`);

    const cycle = async () => {
      if (!this.isRunning) return;
      try {
        await this.runDueJobsBatch(supabase, 10);
      } catch (err) {
        console.error('[JobProcessor] Error in worker poll cycle:', err);
      } finally {
        if (this.isRunning) {
          this.pollTimer = setTimeout(cycle, this.pollIntervalMs);
        }
      }
    };

    // First cycle after brief delay
    this.pollTimer = setTimeout(cycle, 1500);
  }

  /**
   * Stops worker gracefully.
   */
  stop() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log(`[JobProcessor] Stopped notification worker "${this.instanceId}"`);
  }
}

export const jobProcessor = new JobProcessor();
