-- =========================================================================
-- CLIMB 1600 — NOTIFICATION & REMINDER SYSTEM SCHEMA MIGRATION
-- Migration: 20261101_notifications_and_scheduler_schema.sql
-- Description: Creates persistent notification inbox, user preferences, device
--              tokens, web push subscriptions, durable job queue, sync cursors,
--              delivery audit logs, and strict Row Level Security (RLS) policies.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. NOTIFICATIONS TABLE (In-App Inbox)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('submission', 'practice', 'contest', 'streak', 'system', 'guardian', 'curriculum')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_category ON public.notifications (user_id, category);

-- 2. USER NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    web_push_enabled BOOLEAN NOT NULL DEFAULT false,
    mobile_push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
    quiet_hours_end TEXT NOT NULL DEFAULT '08:00',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    categories_enabled JSONB NOT NULL DEFAULT '{"submission":true,"practice":true,"contest":true,"streak":true,"system":true,"guardian":true,"curriculum":true}'::jsonb,
    preferred_practice_time TEXT NOT NULL DEFAULT '20:00',
    contest_advance_minutes INTEGER[] NOT NULL DEFAULT '{1440, 60, 15}'::INTEGER[],
    daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
    weekly_digest_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. USER DEVICE TOKENS TABLE (Android / Mobile Native Push)
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_device_token UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user ON public.user_device_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_active ON public.user_device_tokens (token) WHERE is_active = true;

-- 4. USER WEB PUSH SUBSCRIPTIONS TABLE (W3C Push API / VAPID)
CREATE TABLE IF NOT EXISTS public.user_web_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_web_push_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_web_push_subs_user ON public.user_web_push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_web_push_subs_active ON public.user_web_push_subscriptions (endpoint) WHERE is_active = true;

-- 5. SCHEDULED NOTIFICATION JOBS TABLE (Durable Background Queue)
CREATE TABLE IF NOT EXISTS public.scheduled_notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status_due ON public.scheduled_notification_jobs (status, scheduled_for) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user_type ON public.scheduled_notification_jobs (user_id, job_type, status);

-- 6. CODEFORCES SYNC HISTORY & CURSORS TABLE
CREATE TABLE IF NOT EXISTS public.cf_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cf_handle TEXT NOT NULL,
    last_submission_id BIGINT,
    last_sync_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    sync_status TEXT NOT NULL DEFAULT 'success' CHECK (sync_status IN ('success', 'rate_limited', 'error')),
    error_details TEXT,
    is_initial_import BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_cf_sync_handle UNIQUE (user_id, cf_handle)
);

CREATE INDEX IF NOT EXISTS idx_cf_sync_user ON public.cf_sync_history (user_id);

-- 7. NOTIFICATION DELIVERY LOGS TABLE (Multi-channel audit trail)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('in_app', 'web_push', 'android_push', 'email')),
    status TEXT NOT NULL CHECK (status IN ('delivered', 'failed', 'skipped', 'expired')),
    provider_response JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_user ON public.notification_delivery_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_notif ON public.notification_delivery_logs (notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created ON public.notification_delivery_logs (created_at DESC);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_web_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- 1. Notifications RLS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to notifications" ON public.notifications;
CREATE POLICY "Service role has full access to notifications"
    ON public.notifications FOR ALL
    USING (true) WITH CHECK (true);

-- 2. User Notification Preferences RLS
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can view own preferences"
    ON public.user_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can insert own preferences"
    ON public.user_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can update own preferences"
    ON public.user_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to preferences" ON public.user_notification_preferences;
CREATE POLICY "Service role has full access to preferences"
    ON public.user_notification_preferences FOR ALL
    USING (true) WITH CHECK (true);

-- 3. User Device Tokens RLS
DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.user_device_tokens;
CREATE POLICY "Users can manage own device tokens"
    ON public.user_device_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to device tokens" ON public.user_device_tokens;
CREATE POLICY "Service role has full access to device tokens"
    ON public.user_device_tokens FOR ALL
    USING (true) WITH CHECK (true);

-- 4. User Web Push Subscriptions RLS
DROP POLICY IF EXISTS "Users can manage own web push subscriptions" ON public.user_web_push_subscriptions;
CREATE POLICY "Users can manage own web push subscriptions"
    ON public.user_web_push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to web push subscriptions" ON public.user_web_push_subscriptions;
CREATE POLICY "Service role has full access to web push subscriptions"
    ON public.user_web_push_subscriptions FOR ALL
    USING (true) WITH CHECK (true);

-- 5. Scheduled Jobs RLS
DROP POLICY IF EXISTS "Users can view own scheduled jobs" ON public.scheduled_notification_jobs;
CREATE POLICY "Users can view own scheduled jobs"
    ON public.scheduled_notification_jobs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to scheduled jobs" ON public.scheduled_notification_jobs;
CREATE POLICY "Service role has full access to scheduled jobs"
    ON public.scheduled_notification_jobs FOR ALL
    USING (true) WITH CHECK (true);

-- 6. CF Sync History RLS
DROP POLICY IF EXISTS "Users can view own CF sync history" ON public.cf_sync_history;
CREATE POLICY "Users can view own CF sync history"
    ON public.cf_sync_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to CF sync history" ON public.cf_sync_history;
CREATE POLICY "Service role has full access to CF sync history"
    ON public.cf_sync_history FOR ALL
    USING (true) WITH CHECK (true);

-- 7. Delivery Logs RLS
DROP POLICY IF EXISTS "Users can view own delivery logs" ON public.notification_delivery_logs;
CREATE POLICY "Users can view own delivery logs"
    ON public.notification_delivery_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to delivery logs" ON public.notification_delivery_logs;
CREATE POLICY "Service role has full access to delivery logs"
    ON public.notification_delivery_logs FOR ALL
    USING (true) WITH CHECK (true);
