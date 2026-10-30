-- =========================================================================
-- CLIMB 1600 — COMPREHENSIVE LEARNING PLATFORM SCHEMA MIGRATION
-- Migration: 20261031_learning_platform_schema.sql
-- Description: Extends schema with Daily Plans, Tasks, Topic Mastery, Revision
--              History, AI Usage Accounting, Virtual Contests, Focus Sessions,
--              Study Groups, Social Challenges, and Sync Events with strict RLS.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USER DAILY PLANS TABLE
CREATE TABLE IF NOT EXISTS public.user_daily_plans (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_number INTEGER NOT NULL,
    mode TEXT NOT NULL DEFAULT 'standard' CHECK (mode IN ('minimum', 'standard', 'deep_work')),
    target_minutes INTEGER NOT NULL DEFAULT 45,
    actual_minutes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'missed', 'recovery')),
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    reflection JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_daily_plans_date UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_plans_user_id ON public.user_daily_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_plans_date ON public.user_daily_plans (date);

-- 2. USER REVISION HISTORY TABLE (Persistent review trail for spaced repetition)
CREATE TABLE IF NOT EXISTS public.user_revision_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mistake_id TEXT NOT NULL REFERENCES public.user_mistakes(id) ON DELETE CASCADE,
    review_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    outcome TEXT NOT NULL CHECK (outcome IN ('easy', 'difficult', 'failed')),
    previous_interval INTEGER NOT NULL,
    new_interval INTEGER NOT NULL,
    confidence_score INTEGER NOT NULL DEFAULT 3 CHECK (confidence_score BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_revision_history_user ON public.user_revision_history (user_id);
CREATE INDEX IF NOT EXISTS idx_user_revision_history_mistake ON public.user_revision_history (mistake_id);
CREATE INDEX IF NOT EXISTS idx_user_revision_history_date ON public.user_revision_history (review_date);

-- 3. USER TOPIC MASTERY TABLE (Aggregated deterministic mastery per topic tag)
CREATE TABLE IF NOT EXISTS public.user_topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_tag TEXT NOT NULL,
    solved_count INTEGER NOT NULL DEFAULT 0,
    attempted_count INTEGER NOT NULL DEFAULT 0,
    accuracy_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    confidence_level TEXT NOT NULL DEFAULT 'low' CHECK (confidence_level IN ('low', 'medium', 'high')),
    sample_size INTEGER NOT NULL DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_topic_mastery UNIQUE (user_id, topic_tag)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_mastery_user ON public.user_topic_mastery (user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_mastery_tag ON public.user_topic_mastery (topic_tag);

-- 4. USER AI USAGE ACCOUNTING TABLE (Token budgeting & rate limiting protection)
CREATE TABLE IF NOT EXISTS public.user_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_mode TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    endpoint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user ON public.user_ai_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_created ON public.user_ai_usage (created_at);

-- 5. USER VIRTUAL CONTESTS TABLE (Contest simulation records)
CREATE TABLE IF NOT EXISTS public.user_virtual_contests (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contest_id INTEGER,
    contest_name TEXT NOT NULL,
    division TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'simulated' CHECK (mode IN ('simulated', 'practice')),
    duration_seconds INTEGER NOT NULL DEFAULT 7200,
    seconds_remaining INTEGER NOT NULL DEFAULT 7200,
    solved_count INTEGER NOT NULL DEFAULT 0,
    total_penalty_minutes INTEGER NOT NULL DEFAULT 0,
    performance_rating_estimate INTEGER,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'abandoned')),
    problems JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_virtual_contests_user ON public.user_virtual_contests (user_id);

-- 6. USER FOCUS SESSIONS TABLE (Focus Guardian session sync)
CREATE TABLE IF NOT EXISTS public.user_focus_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    planned_duration_minutes INTEGER NOT NULL DEFAULT 25,
    actual_duration_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'interrupted', 'paused')),
    associated_task_id TEXT,
    associated_problem_id TEXT,
    problems_solved_count INTEGER NOT NULL DEFAULT 0,
    distractions_recorded INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_focus_sessions_user ON public.user_focus_sessions (user_id);

-- 7. STUDY GROUPS TABLE (Social study circles)
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_groups_code ON public.study_groups (invite_code);

-- 8. STUDY GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_study_group_membership UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members (user_id);

-- 9. SOCIAL CHALLENGES TABLE (Weekly community challenges)
CREATE TABLE IF NOT EXISTS public.social_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('problems_solved', 'streak_days', 'topic_mastery', 'virtual_contest')),
    target_value INTEGER NOT NULL,
    topic_tag TEXT,
    min_rating INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_official BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_social_challenges_dates ON public.social_challenges (start_date, end_date);

-- 10. SOCIAL CHALLENGE PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.social_challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.social_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_progress INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_challenge_participation UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.social_challenge_participants (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.social_challenge_participants (user_id);

-- 11. SYNC EVENTS TABLE (Idempotent event sync queue with stable UUIDs)
CREATE TABLE IF NOT EXISTS public.sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_event_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('attempt', 'mistake', 'plan', 'focus_session', 'contest')),
    action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
    payload JSONB NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_sync_event UNIQUE (user_id, client_event_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_events_user ON public.sync_events (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_client ON public.sync_events (client_event_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.user_daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_revision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_virtual_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

-- 1. Daily Plans RLS
CREATE POLICY "Users can manage own daily plans"
    ON public.user_daily_plans FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Revision History RLS
CREATE POLICY "Users can manage own revision history"
    ON public.user_revision_history FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Topic Mastery RLS
CREATE POLICY "Users can manage own topic mastery"
    ON public.user_topic_mastery FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. AI Usage RLS
CREATE POLICY "Users can view own AI usage"
    ON public.user_ai_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. Virtual Contests RLS
CREATE POLICY "Users can manage own virtual contests"
    ON public.user_virtual_contests FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Focus Sessions RLS
CREATE POLICY "Users can manage own focus sessions"
    ON public.user_focus_sessions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Study Groups RLS
CREATE POLICY "Public study groups are visible to authenticated"
    ON public.study_groups FOR SELECT
    TO authenticated
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create study groups"
    ON public.study_groups FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
    ON public.study_groups FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- 8. Group Members RLS
CREATE POLICY "Members can view other members in same group"
    ON public.study_group_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        group_id IN (SELECT gm.group_id FROM public.study_group_members gm WHERE gm.user_id = auth.uid())
    );

CREATE POLICY "Users can join groups"
    ON public.study_group_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
    ON public.study_group_members FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 9. Social Challenges RLS
CREATE POLICY "All authenticated users can view challenges"
    ON public.social_challenges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create custom challenges"
    ON public.social_challenges FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- 10. Challenge Participants RLS
CREATE POLICY "Users can view challenge participants"
    ON public.social_challenge_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage own challenge participation"
    ON public.social_challenge_participants FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 11. Sync Events RLS
CREATE POLICY "Users can manage own sync events"
    ON public.sync_events FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Privileged Service Role access for all tables
CREATE POLICY "Service role full access on user_daily_plans" ON public.user_daily_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_revision_history" ON public.user_revision_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_topic_mastery" ON public.user_topic_mastery FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_ai_usage" ON public.user_ai_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_virtual_contests" ON public.user_virtual_contests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_focus_sessions" ON public.user_focus_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on study_groups" ON public.study_groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on study_group_members" ON public.study_group_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on social_challenges" ON public.social_challenges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on social_challenge_participants" ON public.social_challenge_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on sync_events" ON public.sync_events FOR ALL TO service_role USING (true) WITH CHECK (true);
