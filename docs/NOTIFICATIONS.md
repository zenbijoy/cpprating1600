# CLIMB 1600 — Production-Ready Smart Notification & Reminder System

## 1. Architectural Overview

The **CLIMB 1600 Notification & Reminder System** is an event-driven, multi-channel notification engine engineered to support competitive programmers on their journey to 1600+ rating on Codeforces. It bridges the web platform (React 19 + TypeScript + Vite), the backend daemon (Express + Supabase PostgreSQL), and the native Android Guardian Companion (`com.climb1600.companion`).

```
                               ┌──────────────────────────────────────────────┐
                               │             EVENT SOURCES                    │
                               │  - Codeforces Activity Tracker (user.status) │
                               │  - Contest Poller (contest.list)             │
                               │  - Practice Reminder Scheduler               │
                               │  - Guardian Focus Sessions                   │
                               │  - System Announcements                      │
                               └──────────────────────┬───────────────────────┘
                                                      │ Typed Event Payloads
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           TYPED EVENT REGISTRY               │
                               │      (Strict Zod validation on 18 events)    │
                               └──────────────────────┬───────────────────────┘
                                                      │ Validated Event
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            QUALITY RULE ENGINE               │
                               │  - Category Preferences & Channel Filtering  │
                               │  - Quiet Hours in Local IANA Timezone        │
                               │  - Cooldown Map (Prevents notification spam) │
                               │  - Non-shaming, constructive copy generation │
                               │  - Historical Backfill Suppression           │
                               │  - Stale Event Detection                     │
                               └──────────────────────┬───────────────────────┘
                                                      │ Notification Action
                                                      ▼
                     ┌────────────────────────────────┴────────────────────────────────┐
                     │                                                                 │
          [Immediate or Urgent]                                            [Scheduled / Retried]
                     │                                                                 │
                     ▼                                                                 ▼
      ┌─────────────────────────────┐                                   ┌─────────────────────────────┐
      │     CHANNEL DISPATCHER      │                                   │   DURABLE DATABASE QUEUE    │
      │  - In-App Inbox (Supabase)  │◄──────────────────────────────────│ (scheduled_notification_jobs│
      │  - W3C Web Push (VAPID)     │     Atomic Worker Claims          │  atomic locks & exp-backoff)│
      │  - Android Push (FCM / URIs)│                                   └─────────────────────────────┘
      │  - Optional Email Digest    │
      └─────────────────────────────┘
```

---

## 2. Typed Event Registry (18 Event Types)

All notifications are governed by strict Zod schemas defined in `src/services/notifications/eventRegistry.ts`. Unregistered event types and malformed payloads are strictly rejected:

| # | Event Type | Category | Default Priority | Channels | Notification Generated? |
|---|---|---|---|---|---|
| 1 | `submission.detected` | `submission` | `low` | In-App | ❌ Internal tracking only |
| 2 | `submission.verdict_updated` | `submission` | `normal` | In-App, Web Push, Android | ✅ On verdict change |
| 3 | `submission.accepted` | `submission` | `high` | In-App, Web Push, Android | ✅ Instant celebration |
| 4 | `practice.reminder_due` | `practice` | `normal` | In-App, Web Push, Android | ✅ Configurable study alert |
| 5 | `daily_goal.incomplete` | `practice` | `normal` | In-App, Web Push, Android | ✅ Evening reminder (19:00-22:00) |
| 6 | `daily_goal.completed` | `practice` | `high` | In-App, Web Push, Android | ✅ Congratulations on target met |
| 7 | `streak.at_risk` | `streak` | `urgent` | In-App, Web Push, Android | ✅ 3-4h before local midnight |
| 8 | `streak.milestone_reached` | `streak` | `high` | In-App, Web Push, Android | ✅ 7, 14, 30, 60-day milestones |
| 9 | `contest.upcoming` | `contest` | `normal` | In-App, Web Push, Android, Email | ✅ 24h & 1h advance notice |
| 10 | `contest.starting_soon` | `contest` | `urgent` | In-App, Web Push, Android | ✅ 15m countdown alert |
| 11 | `contest.ended` | `contest` | `low` | In-App | ✅ Upsolving reminder |
| 12 | `new_problem.matching_preferences` | `curriculum` | `low` | In-App | ✅ Rating-aligned recommendation |
| 13 | `training_plan.created` | `curriculum` | `low` | In-App | ❌ Internal milestone |
| 14 | `training_plan.updated` | `curriculum` | `low` | In-App | ❌ Internal milestone |
| 15 | `revision.due` | `practice` | `normal` | In-App, Web Push, Android | ✅ Spaced repetition review |
| 16 | `guardian.focus_session.started` | `guardian` | `normal` | In-App, Android | ✅ Companion lock engaged |
| 17 | `guardian.focus_session.ended` | `guardian` | `normal` | In-App, Android | ✅ Focus stats & distraction count |
| 18 | `system.announcement` | `system` | `high` | In-App, Web Push, Android, Email | ✅ Platform announcements |

---

## 3. Codeforces Activity Tracking & Synchronization

Implemented in `src/services/notifications/cfActivityTracker.ts`:

- **Official API Compliance**: Uses `https://codeforces.com/api/user.status` and `contest.list`. Never requests or stores user Codeforces passwords.
- **Incremental Cursor Sync**: Stores the highest observed submission ID in `public.cf_sync_history (last_submission_id)`. Subsequent sync cycles only query submissions with `id > last_submission_id`.
- **Historical Backfill Distinction**: When a user first links their Codeforces handle or performs an initial sync, existing submissions establish the baseline cursor without generating spurious notifications. Subsequent sync cycles recognize only newly detected submissions.
- **Verdict Transitions**: Detects transitions from `TESTING` to `OK`, `WRONG_ANSWER`, or `TIME_LIMIT_EXCEEDED` and fires `submission.verdict_updated` or `submission.accepted`.
- **Rate-Limit & Fault Protection**: Bounded concurrency and minimum 2000ms delay between API calls with polite User-Agent headers (`CLIMB-1600-Activity-Tracker/1.0`). Outages or rate limits log `rate_limited` or `error` in `cf_sync_history` without wiping or corrupting the sync cursor.

---

## 4. Smart Practice & Contest Reminders

Implemented in `src/services/notifications/practiceReminderScheduler.ts`, `quietHours.ts`, and `ruleEngine.ts`:

- **Accurate IANA Timezone Support**: Converts user local time across any IANA timezone (e.g. `America/New_York`, `Asia/Kolkata`, `Europe/London`, `UTC`).
- **Overnight & Daytime Quiet Hours**: Correctly evaluates windows spanning midnight (e.g. `23:00` to `07:00`) as well as single-day windows.
- **Urgent Notification Exemption**: Urgent events (`contest.starting_soon`, `streak.at_risk`) bypass quiet hours for push notifications; normal notifications are deferred until quiet hours end.
- **Obsolete Job Cancellation**: If a user finishes their daily target minutes or logs an accepted solve, all pending `daily_goal.incomplete` reminders for that day are immediately cancelled in the database queue (`cancelObsoleteJobs`).
- **Stale Reminder Suppression**: If a contest has already started or a reminder was delayed past its useful window during downtime, it is marked stale and dropped instead of sending bursts.
- **Constructive, Non-Shaming Copywriting**: Notification text is encouraging, empathetic, and objective. Guilt-inducing or manipulative language is strictly prohibited.
- **Configurable Contest Reminders**: Default advance alerts at 24 hours (`1440m`), 1 hour (`60m`), and 15 minutes (`15m`), with direct links to the official contest page.

---

## 5. Multi-Channel Delivery Infrastructure

### 5.1 In-App Notifications
- Stored persistently in `public.notifications`.
- Filterable by categories (`submission`, `practice`, `contest`, `streak`, `guardian`, `system`).
- Paginated inbox with unread counter, `mark-as-read`, `mark-all-read`, and dismissal (`archived = true`).
- Deep links to the relevant problem (`/problems?id=...`), contest (`https://codeforces.com/contest/...`), plan, or Guardian session.

### 5.2 W3C Web Push (Service Worker & VAPID)
- Standard W3C Push API with service worker located at `/public/sw.js`.
- Automatic VAPID keypair generation or server configuration via `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
- Subscriptions securely stored in `public.user_web_push_subscriptions` with endpoint deduplication.
- Dead endpoints (HTTP 404/410) are automatically marked inactive (`is_active = false`).
- Handles foreground notifications and service worker `notificationclick` events with deep link navigation.

### 5.3 Android Push & Deep Linking
- Native push payload adapter via `src/services/notifications/channels/androidPushChannel.ts`.
- Deep link scheme `climb1600://` handled by `MainActivity` in `com.climb1600.companion`.
  - `climb1600://practice?day=...` -> Daily Practice Screen
  - `climb1600://contest?contestId=...` -> Contest / Upsolving Screen
  - `climb1600://guardian?session=...` -> Guardian Focus Session Screen
- Pure Kotlin URI parser (`DeepLinkParser`) ensures testability on JVM unit tests without framework mocks.
- Android 13+ `POST_NOTIFICATIONS` runtime permission handling and notification channels:
  - `climb1600_practice` (High Importance, lights & vibration)
  - `climb1600_contests` (Max Importance, heads-up display)
  - `climb1600_submissions` (Default Importance)
  - `climb1600_guardian` (High Importance)

### 5.4 Email Channel (Optional)
- Optional provider adapter supporting Resend or standard SMTP.
- Designed for low-frequency summaries: Weekly Progress Reports, Contest Reminders, and Urgent System Announcements.

---

## 6. Durable Job Processing & Concurrency

Implemented in `src/services/notifications/jobProcessor.ts`:

- **Database-Backed Queue**: Stored in `public.scheduled_notification_jobs`. Does not rely on ephemeral in-memory queues. Survives server restarts and multi-instance container restarts.
- **Idempotency Keys**: Unique constraint on `(user_id, idempotency_key)` prevents duplicate job scheduling for the same event and target window.
- **Concurrency Locks**: Atomically claims pending jobs using:
  ```sql
  UPDATE public.scheduled_notification_jobs
  SET status = 'processing', locked_at = now(), locked_by = :workerId
  WHERE id = :candidateId AND status IN ('pending', 'failed')
  ```
- **Bounded Retries with Exponential Backoff + Jitter**:
  $$\text{delay} = \min(60000, 2^{\text{attempts}} \times 1000 + \text{jitter}(0..5000))$$
- **Stale Job Recovery**: Automatically frees jobs locked in `processing` status for $> 5$ minutes if a previous worker crashed.

---

## 7. Supabase Security & Row Level Security (RLS)

All 7 notification tables have Row Level Security enabled:

1. `public.notifications`: Users can select and update (read/archive) only their own notifications (`auth.uid() = user_id`).
2. `public.user_notification_preferences`: Users can read and update only their own settings (`auth.uid() = user_id`).
3. `public.user_device_tokens`: Users can register/deactivate only their own devices (`auth.uid() = user_id`).
4. `public.user_web_push_subscriptions`: Users can register/deactivate only their own web push endpoints (`auth.uid() = user_id`).
5. `public.scheduled_notification_jobs`: Strictly accessible by the backend `service_role`. Clients cannot read or tamper with background jobs.
6. `public.cf_sync_history`: Users can read their own sync status; background worker manages cursors with `service_role`.
7. `public.notification_delivery_logs`: Users can view their own delivery logs; client cannot forge log entries.

---

## 8. Admin & Observability Telemetry

Mounted at `/api/admin/notifications`:

- `GET /api/admin/notifications/health`:
  - Worker status and instance ID.
  - Queue depth (pending, processing, failed, completed, cancelled jobs).
  - Codeforces tracker status, last poll timestamp, active synced accounts.
  - Delivery stats (delivered, failed, skipped counts across channels).
- `POST /api/admin/notifications/sync-cf`: Triggers manual sync cycle across linked handles.
- `POST /api/admin/notifications/trigger-job-poll`: Forces immediate processing of due jobs in queue.
- `POST /api/notifications/test`: Dispatches a test notification across in-app, web push, and Android push to verify device connectivity.
