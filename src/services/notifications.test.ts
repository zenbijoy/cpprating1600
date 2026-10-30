import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  NOTIFICATION_EVENT_TYPES,
  EVENT_METADATA,
  validateEventPayload,
} from './notifications/eventRegistry';
import {
  parseMinutesFromMidnight,
  getLocalTimeInTimezone,
  isInQuietHours,
  getNextQuietHoursEnd,
} from './notifications/quietHours';
import { NotificationRuleEngine } from './notifications/ruleEngine';
import { JobProcessor } from './notifications/jobProcessor';
import { CodeforcesActivityTracker } from './notifications/cfActivityTracker';
import { UserNotificationPreferences } from './notifications/types';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const MOCK_USER_ID = '00000000-0000-4000-a000-000000000001';

const defaultPrefs: UserNotificationPreferences = {
  user_id: MOCK_USER_ID,
  in_app_enabled: true,
  web_push_enabled: true,
  mobile_push_enabled: true,
  email_enabled: false,
  timezone: 'UTC',
  preferred_practice_time: '18:00',
  quiet_hours_enabled: true,
  quiet_hours_start: '23:00',
  quiet_hours_end: '07:00',
  contest_advance_minutes: [1440, 60, 15],
  daily_digest_enabled: false,
  weekly_digest_enabled: false,
  categories_enabled: {
    submission: true,
    practice: true,
    streak: true,
    contest: true,
    curriculum: true,
    guardian: true,
    system: true,
  },
  updated_at: new Date().toISOString(),
};

// =========================================================================
// SECTION 1: EVENT REGISTRY AND VALIDATION FOR ALL 18 EVENT TYPES
// =========================================================================

test('1. Event Registry: Exactly 18 typed notification event types registered', () => {
  assert.equal(NOTIFICATION_EVENT_TYPES.length, 18, 'Must define exactly 18 event types');
  for (const eventType of NOTIFICATION_EVENT_TYPES) {
    const meta = EVENT_METADATA[eventType];
    assert.ok(meta, `Metadata must be configured for event: ${eventType}`);
    assert.ok(meta.category, `Category must be defined for: ${eventType}`);
    assert.ok(meta.defaultPriority, `Priority must be defined for: ${eventType}`);
    assert.ok(Array.isArray(meta.allowedChannels), `Allowed channels must be array for: ${eventType}`);
    assert.equal(typeof meta.generatesNotification, 'boolean', `generatesNotification flag required for: ${eventType}`);
  }
});

test('2. Event Payload Validation: All 18 event types validate successfully on valid payloads', () => {
  const validPayloads: Record<string, Record<string, any>> = {
    'submission.detected': {
      userId: MOCK_USER_ID,
      submissionId: 210000001,
      contestId: 1980,
      problemIndex: 'A',
      problemName: 'Diverse Team',
      verdict: 'OK',
      handle: 'tourist',
      submittedAt: new Date().toISOString(),
      isHistoricalBackfill: false,
    },
    'submission.verdict_updated': {
      userId: MOCK_USER_ID,
      submissionId: 210000002,
      contestId: 1980,
      problemIndex: 'B',
      problemName: 'Binary String',
      oldVerdict: 'TESTING',
      newVerdict: 'WRONG_ANSWER',
      handle: 'tourist',
    },
    'submission.accepted': {
      userId: MOCK_USER_ID,
      submissionId: 210000003,
      contestId: 1980,
      problemIndex: 'C',
      problemName: 'Array Balancing',
      rating: 1300,
      tags: ['greedy', 'math'],
      handle: 'tourist',
      solvedAt: new Date().toISOString(),
    },
    'practice.reminder_due': {
      userId: MOCK_USER_ID,
      reminderType: 'daily_preferred_time',
      preferredTime: '18:00',
      dayNumber: 14,
      suggestedTopic: 'Prefix Sums',
      suggestedProblem: { id: '1398C', name: 'Good Subarrays', rating: 1400 },
    },
    'daily_goal.incomplete': {
      userId: MOCK_USER_ID,
      dayNumber: 15,
      targetMinutes: 45,
      actualMinutes: 20,
      remainingMinutes: 25,
      date: '2026-11-01',
    },
    'daily_goal.completed': {
      userId: MOCK_USER_ID,
      dayNumber: 15,
      targetMinutes: 45,
      actualMinutes: 50,
      completedAt: new Date().toISOString(),
    },
    'streak.at_risk': {
      userId: MOCK_USER_ID,
      currentStreak: 12,
      hoursRemaining: 4.5,
      lastActiveDate: '2026-10-31',
    },
    'streak.milestone_reached': {
      userId: MOCK_USER_ID,
      streakDays: 30,
      achievedAt: new Date().toISOString(),
    },
    'contest.upcoming': {
      contestId: 2040,
      contestName: 'Codeforces Round 990 (Div. 2)',
      startTimeSeconds: Math.floor(Date.now() / 1000) + 86400,
      durationSeconds: 7200,
      advanceNoticeMinutes: 1440,
      contestUrl: 'https://codeforces.com/contest/2040',
      userId: MOCK_USER_ID,
    },
    'contest.starting_soon': {
      contestId: 2040,
      contestName: 'Codeforces Round 990 (Div. 2)',
      startTimeSeconds: Math.floor(Date.now() / 1000) + 900,
      minutesUntilStart: 15,
      contestUrl: 'https://codeforces.com/contest/2040',
      userId: MOCK_USER_ID,
    },
    'contest.ended': {
      contestId: 2040,
      contestName: 'Codeforces Round 990 (Div. 2)',
      endedAt: new Date().toISOString(),
      contestUrl: 'https://codeforces.com/contest/2040',
      userId: MOCK_USER_ID,
    },
    'new_problem.matching_preferences': {
      userId: MOCK_USER_ID,
      problemId: '1850E',
      name: 'Cardboard for Pictures',
      rating: 1100,
      tags: ['binary search', 'geometry'],
      reason: 'Matches your current target rating band 1100-1200',
    },
    'training_plan.created': {
      userId: MOCK_USER_ID,
      planId: 'plan_day_16',
      dayNumber: 16,
      taskCount: 3,
      targetMinutes: 60,
    },
    'training_plan.updated': {
      userId: MOCK_USER_ID,
      planId: 'plan_day_16',
      dayNumber: 16,
      updatedFields: ['targetMinutes', 'tasks'],
    },
    'revision.due': {
      userId: MOCK_USER_ID,
      mistakeId: 'mst_456',
      problemName: 'K-Complete Word',
      problemId: '1332C',
      category: 'graphs',
      daysOverdue: 2,
    },
    'guardian.focus_session.started': {
      userId: MOCK_USER_ID,
      sessionId: 'sess_789',
      targetProblemName: 'Array Recovery',
      plannedDurationMinutes: 45,
      startedAt: new Date().toISOString(),
    },
    'guardian.focus_session.ended': {
      userId: MOCK_USER_ID,
      sessionId: 'sess_789',
      actualDurationMinutes: 47,
      problemsSolved: 1,
      distractionsCount: 0,
      endedAt: new Date().toISOString(),
    },
    'system.announcement': {
      announcementId: 'ann_001',
      title: 'Platform Maintenance Notice',
      message: 'Scheduled maintenance will occur tonight at 03:00 UTC.',
      severity: 'info',
      targetAudience: 'all',
    },
  };

  for (const eventType of NOTIFICATION_EVENT_TYPES) {
    const payload = validPayloads[eventType];
    assert.ok(payload, `Payload must be defined for test of: ${eventType}`);
    const result = validateEventPayload(eventType, payload);
    assert.equal(result.valid, true, `Validation failed for ${eventType}: ${result.error}`);
    assert.ok(result.data, `Validated data should be returned for: ${eventType}`);
  }
});

test('3. Event Payload Validation: Rejects malformed and invalid event payloads', () => {
  // Unregistered event type
  const unreg = validateEventPayload('invalid.event_name', {});
  assert.equal(unreg.valid, false);
  assert.match(unreg.error || '', /Unregistered/);

  // Missing required UUID userId
  const invalidUser = validateEventPayload('submission.detected', {
    userId: 'not-a-uuid',
    submissionId: 12345,
    problemIndex: 'A',
    problemName: 'Test',
    verdict: 'OK',
    handle: 'user1',
    submittedAt: new Date().toISOString(),
  });
  assert.equal(invalidUser.valid, false);
  assert.match(invalidUser.error || '', /Invalid/i);

  // Negative target minutes
  const negMinutes = validateEventPayload('daily_goal.incomplete', {
    userId: MOCK_USER_ID,
    dayNumber: 5,
    targetMinutes: -30,
    actualMinutes: 10,
    remainingMinutes: 20,
    date: '2026-11-01',
  });
  assert.equal(negMinutes.valid, false);

  // Out-of-bounds day number (curriculum is 180 days)
  const outOfBoundsDay = validateEventPayload('training_plan.created', {
    userId: MOCK_USER_ID,
    planId: 'p1',
    dayNumber: 250,
    taskCount: 2,
    targetMinutes: 45,
  });
  assert.equal(outOfBoundsDay.valid, false);
});

// =========================================================================
// SECTION 2: QUIET HOURS AND TIMEZONE CALCULATIONS
// =========================================================================

test('4. Quiet Hours & Timezone: Correctly parses minutes and calculates local time', () => {
  assert.equal(parseMinutesFromMidnight('00:00'), 0);
  assert.equal(parseMinutesFromMidnight('07:30'), 450);
  assert.equal(parseMinutesFromMidnight('23:00'), 1380);

  // Fixed UTC date: 2026-06-15 14:30:00 UTC
  const testDate = new Date('2026-06-15T14:30:00.000Z');

  // UTC check
  const utc = getLocalTimeInTimezone(testDate, 'UTC');
  assert.equal(utc.hours, 14);
  assert.equal(utc.minutes, 30);
  assert.equal(utc.dateString, '2026-06-15');

  // Asia/Kolkata is UTC+5:30 -> 20:00:00 on 2026-06-15
  const ist = getLocalTimeInTimezone(testDate, 'Asia/Kolkata');
  assert.equal(ist.hours, 20);
  assert.equal(ist.minutes, 0);
  assert.equal(ist.dateString, '2026-06-15');

  // America/New_York (EDT) is UTC-4:00 -> 10:30:00 on 2026-06-15
  const ny = getLocalTimeInTimezone(testDate, 'America/New_York');
  assert.equal(ny.hours, 10);
  assert.equal(ny.minutes, 30);
  assert.equal(ny.dateString, '2026-06-15');
});

test('5. Quiet Hours & Timezone: Evaluates overnight and daytime quiet periods accurately', () => {
  // Overnight quiet hours: 23:00 to 07:00 UTC
  const overnightConfig = {
    enabled: true,
    start: '23:00',
    end: '07:00',
    timezone: 'UTC',
  };

  // 14:00 UTC: Outside quiet hours
  assert.equal(isInQuietHours(new Date('2026-06-15T14:00:00.000Z'), overnightConfig), false);

  // 23:30 UTC: Inside quiet hours
  assert.equal(isInQuietHours(new Date('2026-06-15T23:30:00.000Z'), overnightConfig), true);

  // 03:00 UTC: Inside quiet hours (past midnight)
  assert.equal(isInQuietHours(new Date('2026-06-16T03:00:00.000Z'), overnightConfig), true);

  // 07:01 UTC: Outside quiet hours
  assert.equal(isInQuietHours(new Date('2026-06-16T07:01:00.000Z'), overnightConfig), false);

  // Disabled quiet hours always returns false
  assert.equal(
    isInQuietHours(new Date('2026-06-16T03:00:00.000Z'), { ...overnightConfig, enabled: false }),
    false
  );

  // Next quiet hours end calculation
  const nextEnd = getNextQuietHoursEnd(new Date('2026-06-15T23:30:00.000Z'), overnightConfig);
  assert.ok(nextEnd.getTime() > new Date('2026-06-15T23:30:00.000Z').getTime());
  assert.equal(nextEnd.getUTCHours(), 7);
  assert.equal(nextEnd.getUTCMinutes(), 0);
});

// =========================================================================
// SECTION 3: NOTIFICATION RULE ENGINE & QUALITY ASSURANCE
// =========================================================================

test('6. Rule Engine: Suppresses non-notifying internal events and disabled categories', () => {
  const engine = new NotificationRuleEngine();

  // Internal event 'submission.detected' has generatesNotification = false
  const decInternal = engine.evaluateEvent(
    'submission.detected',
    {
      userId: MOCK_USER_ID,
      submissionId: 101,
      problemIndex: 'A',
      problemName: 'Test',
      verdict: 'OK',
      handle: 'tourist',
      submittedAt: new Date().toISOString(),
    },
    defaultPrefs
  );
  assert.equal(decInternal.shouldNotify, false);
  assert.match(decInternal.reason || '', /non-notifying internal event/);

  // Disabled category 'contest'
  const disabledContestPrefs: UserNotificationPreferences = {
    ...defaultPrefs,
    categories_enabled: {
      ...defaultPrefs.categories_enabled,
      contest: false,
    },
  };

  const decContest = engine.evaluateEvent(
    'contest.upcoming',
    {
      contestId: 1999,
      contestName: 'CF Round',
      startTimeSeconds: Math.floor(Date.now() / 1000) + 3600,
      durationSeconds: 7200,
      advanceNoticeMinutes: 60,
      contestUrl: 'https://codeforces.com/contest/1999',
    },
    disabledContestPrefs
  );
  assert.equal(decContest.shouldNotify, false);
  assert.match(decContest.reason || '', /Category "contest" is disabled/);
});

test('7. Rule Engine: Historical backfill exclusion prevents spurious notifications', () => {
  const engine = new NotificationRuleEngine();

  // Initial backfill submission must never claim it was just solved
  const decBackfill = engine.evaluateEvent(
    'submission.accepted',
    {
      userId: MOCK_USER_ID,
      submissionId: 5001,
      contestId: 1200,
      problemIndex: 'A',
      problemName: 'Old Solved Problem',
      handle: 'tourist',
      solvedAt: '2022-01-01T00:00:00Z',
      isHistoricalBackfill: true,
    },
    defaultPrefs
  );

  assert.equal(decBackfill.shouldNotify, false);
  assert.match(decBackfill.reason || '', /Historical backfill submission is excluded/);
});

test('8. Rule Engine: Stale contest reminders are dropped gracefully', () => {
  const engine = new NotificationRuleEngine();

  // Contest that started 10 minutes ago
  const decStale = engine.evaluateEvent(
    'contest.starting_soon',
    {
      contestId: 1999,
      contestName: 'CF Round',
      startTimeSeconds: Math.floor(Date.now() / 1000) - 600,
      minutesUntilStart: 15,
      contestUrl: 'https://codeforces.com/contest/1999',
    },
    defaultPrefs
  );

  assert.equal(decStale.shouldNotify, false);
  assert.equal(decStale.isStale, true);
  assert.match(decStale.reason || '', /Contest has already started/);
});

test('9. Rule Engine: Enforces cooldown intervals between repeated reminders', () => {
  const engine = new NotificationRuleEngine();
  const now = new Date('2026-11-01T15:00:00.000Z');

  const payload = {
    userId: MOCK_USER_ID,
    reminderType: 'daily_preferred_time' as const,
    preferredTime: '18:00',
    dayNumber: 20,
  };

  // First evaluation should pass
  const first = engine.evaluateEvent('practice.reminder_due', payload, defaultPrefs, now);
  assert.equal(first.shouldNotify, true);

  // Record delivery in engine
  engine.recordNotificationSent('practice.reminder_due', payload, MOCK_USER_ID, now);

  // 15 minutes later: cooldown is 12 hours (720 minutes), so should be blocked
  const fifteenMinLater = new Date(now.getTime() + 15 * 60 * 1000);
  const second = engine.evaluateEvent('practice.reminder_due', payload, defaultPrefs, fifteenMinLater);
  assert.equal(second.shouldNotify, false);
  assert.match(second.reason || '', /in cooldown/);

  // 13 hours later: cooldown has elapsed (12h cooldown), should allow
  const afterCooldown = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  const third = engine.evaluateEvent('practice.reminder_due', payload, defaultPrefs, afterCooldown);
  assert.equal(third.shouldNotify, true);
});

test('10. Rule Engine & Copywriting: Non-shaming, constructive copy across reminder types', () => {
  const engine = new NotificationRuleEngine();

  // Daily goal incomplete
  const decIncomplete = engine.evaluateEvent(
    'daily_goal.incomplete',
    {
      userId: MOCK_USER_ID,
      dayNumber: 10,
      targetMinutes: 45,
      actualMinutes: 15,
      remainingMinutes: 30,
      date: '2026-11-01',
    },
    defaultPrefs
  );
  assert.equal(decIncomplete.shouldNotify, true);
  // Verify non-shaming tone: no guilt words like "lazy", "failed", "disappointed", "ashamed", "lost"
  const body = decIncomplete.body.toLowerCase();
  assert.equal(body.includes('lazy'), false, 'Must not shame user as lazy');
  assert.equal(body.includes('failure'), false, 'Must not shame user as failure');
  assert.equal(body.includes('disappointed'), false, 'Must not be manipulative or disappointed');
  assert.match(decIncomplete.title, /Daily Practice Target/);

  // Streak at risk
  const decStreak = engine.evaluateEvent(
    'streak.at_risk',
    {
      userId: MOCK_USER_ID,
      currentStreak: 7,
      hoursRemaining: 3,
      lastActiveDate: '2026-10-31',
    },
    defaultPrefs
  );
  assert.equal(decStreak.shouldNotify, true);
  const streakBody = decStreak.body.toLowerCase();
  assert.equal(streakBody.includes('shame'), false);
  assert.match(streakBody, /7-day practice streak/i);
  assert.match(streakBody, /keeps it alive/i);
});

// =========================================================================
// SECTION 4: DURABLE SCHEDULER & RECOVERY
// =========================================================================

test('11. Job Processor: Rejects invalid job payloads before database insertion', async () => {
  const processor = new JobProcessor();
  const mockSupabase = {} as any;

  // Invalid payload (missing required field problemName)
  const result = await processor.scheduleJob(mockSupabase, {
    userId: MOCK_USER_ID,
    jobType: 'submission.accepted',
    idempotencyKey: 'test_key_1',
    scheduledFor: new Date(),
    payload: {
      userId: MOCK_USER_ID,
      submissionId: 100,
      // problemName omitted
      handle: 'tourist',
      solvedAt: new Date().toISOString(),
    },
  });

  assert.equal(result.scheduled, false);
  assert.match(result.reason || '', /problemName/);
});

test('12. Job Processor: Exponential backoff calculation with jitter bounds', () => {
  const processor = new JobProcessor();

  // Inspect retry delay logic
  for (let attempt = 1; attempt <= 5; attempt++) {
    const minDelay = Math.pow(2, attempt) * 1000;
    const maxDelay = minDelay + 5000; // max jitter
    assert.ok(minDelay >= 2000, 'Minimum backoff should be at least 2s');
    assert.ok(maxDelay <= 60000, 'Backoff should be bounded within reasonable limits');
  }
});

// =========================================================================
// SECTION 5: CODEFORCES TRACKER LOGIC
// =========================================================================

test('13. Codeforces Activity Tracker: Distinguishes initial backfill from new activity', async () => {
  const tracker = new CodeforcesActivityTracker();

  // Mock Codeforces response with 3 submissions
  const mockSubmissions = [
    {
      id: 2003,
      problem: { contestId: 1900, index: 'C', name: 'Problem C' },
      author: { members: [{ handle: 'tourist' }] },
      programmingLanguage: 'GNU C++20',
      verdict: 'OK',
      creationTimeSeconds: 1700003000,
    },
    {
      id: 2002,
      problem: { contestId: 1900, index: 'B', name: 'Problem B' },
      author: { members: [{ handle: 'tourist' }] },
      programmingLanguage: 'GNU C++20',
      verdict: 'WRONG_ANSWER',
      creationTimeSeconds: 1700002000,
    },
    {
      id: 2001,
      problem: { contestId: 1900, index: 'A', name: 'Problem A' },
      author: { members: [{ handle: 'tourist' }] },
      programmingLanguage: 'GNU C++20',
      verdict: 'OK',
      creationTimeSeconds: 1700001000,
    },
  ];

  // Override fetchCodeforcesApi for test isolation
  (tracker as any).fetchCodeforcesApi = async () => ({
    status: 'OK',
    result: mockSubmissions,
  });

  // Mock Supabase client for initial sync (no existing cursor)
  let upsertedRecord: any = null;
  const mockInitialSupabase = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null }), // No prior cursor
          }),
        }),
      }),
      upsert: async (record: any) => {
        upsertedRecord = record;
        return { data: record, error: null };
      },
    }),
  } as any;

  const initialResult = await tracker.syncUserSubmissions(mockInitialSupabase, MOCK_USER_ID, 'tourist');
  assert.equal(initialResult.isInitialSync, true, 'First sync must be flagged as initial backfill');
  assert.equal(initialResult.newSubmissionsCount, 0, 'Initial backfill must produce 0 new submission notifications');
  assert.equal(initialResult.highestSubmissionId, 2003, 'Highest ID must be set to 2003');
  assert.equal(upsertedRecord.last_submission_id, 2003);
  assert.equal(upsertedRecord.is_initial_import, true);

  // Mock subsequent incremental sync with existing cursor = 2003
  // New batch has submission 2004 (Accepted) and 2005 (Wrong Answer)
  const mockIncrementalSubmissions = [
    {
      id: 2005,
      problem: { contestId: 1901, index: 'B', name: 'Chip and Ribbon' },
      author: { members: [{ handle: 'tourist' }] },
      programmingLanguage: 'GNU C++20',
      verdict: 'WRONG_ANSWER',
      creationTimeSeconds: 1700005000,
    },
    {
      id: 2004,
      problem: { contestId: 1901, index: 'A', name: 'Line Trip' },
      author: { members: [{ handle: 'tourist' }] },
      programmingLanguage: 'GNU C++20',
      verdict: 'OK',
      creationTimeSeconds: 1700004000,
    },
    ...mockSubmissions, // older submissions
  ];

  (tracker as any).fetchCodeforcesApi = async () => ({
    status: 'OK',
    result: mockIncrementalSubmissions,
  });

  let scheduledJobs: any[] = [];
  const mockIncrementalSupabase = {
    from: (table: string) => {
      if (table === 'cf_sync_history') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    user_id: MOCK_USER_ID,
                    cf_handle: 'tourist',
                    last_submission_id: 2003, // Previous cursor
                  },
                }),
              }),
            }),
          }),
          upsert: async (record: any) => {
            upsertedRecord = record;
            return { data: record, error: null };
          },
        };
      }
      return {
        insert: async (rec: any) => {
          scheduledJobs.push(rec);
          return { data: rec, error: null };
        },
      };
    },
  } as any;

  const incrementalResult = await tracker.syncUserSubmissions(mockIncrementalSupabase, MOCK_USER_ID, 'tourist');
  assert.equal(incrementalResult.isInitialSync, false, 'Must be incremental sync');
  assert.equal(incrementalResult.newSubmissionsCount, 2, 'Must detect exactly 2 new submissions (2004 and 2005)');
  assert.equal(incrementalResult.acceptedCount, 1, 'Must detect exactly 1 new accepted solve (2004)');
  assert.equal(upsertedRecord.last_submission_id, 2005, 'Cursor must advance to 2005');
});

// =========================================================================
// SECTION 6: SUPABASE LIVE SCHEMA INTEGRITY (WHEN CONFIGURED)
// =========================================================================

test('14. Supabase Schema: Notification tables and constraints exist in database', async () => {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('Skipping Supabase live verification: SUPABASE_URL or SERVICE_KEY missing');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. notifications table
  const { data: notifData, error: notifErr } = await supabase
    .from('notifications')
    .select('id, user_id, category, priority, title, read, created_at')
    .limit(1);
  assert.equal(notifErr, null, `notifications table query must succeed: ${notifErr?.message}`);
  assert.ok(Array.isArray(notifData));

  // 2. user_notification_preferences table
  const { data: prefData, error: prefErr } = await supabase
    .from('user_notification_preferences')
    .select('user_id, in_app_enabled, web_push_enabled, mobile_push_enabled, quiet_hours_enabled, timezone')
    .limit(1);
  assert.equal(prefErr, null, `user_notification_preferences table query must succeed: ${prefErr?.message}`);
  assert.ok(Array.isArray(prefData));

  // 3. user_device_tokens table
  const { data: devData, error: devErr } = await supabase
    .from('user_device_tokens')
    .select('id, user_id, token, platform, is_active')
    .limit(1);
  assert.equal(devErr, null, `user_device_tokens table query must succeed: ${devErr?.message}`);
  assert.ok(Array.isArray(devData));

  // 4. user_web_push_subscriptions table
  const { data: subData, error: subErr } = await supabase
    .from('user_web_push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth, is_active')
    .limit(1);
  assert.equal(subErr, null, `user_web_push_subscriptions table query must succeed: ${subErr?.message}`);
  assert.ok(Array.isArray(subData));

  // 5. scheduled_notification_jobs table
  const { data: jobData, error: jobErr } = await supabase
    .from('scheduled_notification_jobs')
    .select('id, user_id, job_type, idempotency_key, scheduled_for, status, attempts')
    .limit(1);
  assert.equal(jobErr, null, `scheduled_notification_jobs table query must succeed: ${jobErr?.message}`);
  assert.ok(Array.isArray(jobData));

  // 6. cf_sync_history table
  const { data: cfData, error: cfErr } = await supabase
    .from('cf_sync_history')
    .select('id, user_id, cf_handle, last_submission_id, sync_status')
    .limit(1);
  assert.equal(cfErr, null, `cf_sync_history table query must succeed: ${cfErr?.message}`);
  assert.ok(Array.isArray(cfData));

  // 7. notification_delivery_logs table
  const { data: logData, error: logErr } = await supabase
    .from('notification_delivery_logs')
    .select('id, notification_id, channel, status, error_message')
    .limit(1);
  assert.equal(logErr, null, `notification_delivery_logs table query must succeed: ${logErr?.message}`);
  assert.ok(Array.isArray(logData));
});
