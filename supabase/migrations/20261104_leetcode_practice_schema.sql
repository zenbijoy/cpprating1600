-- =========================================================================
-- LEETCODE PRACTICE MODULE — SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Migration: 20261104_leetcode_practice_schema.sql
-- Description: Extends CLIMB 1600 with LeetCode problem catalogue cache,
--              user practice progress, bookmarks, revision queue,
--              and profile integration with strict Row Level Security (RLS).
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. LEETCODE PROBLEMS CATALOGUE TABLE (Cached public problem metadata)
CREATE TABLE IF NOT EXISTS public.leetcode_problems (
    id TEXT PRIMARY KEY,                            -- e.g. "two-sum" or frontend id
    question_frontend_id TEXT NOT NULL,             -- e.g. "1"
    title TEXT NOT NULL,                            -- e.g. "Two Sum"
    title_slug TEXT NOT NULL UNIQUE,                -- e.g. "two-sum"
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    topic_tags TEXT[] NOT NULL DEFAULT '{}',        -- e.g. ARRAY['Array', 'Hash Table']
    paid_only BOOLEAN NOT NULL DEFAULT false,
    acceptance_rate NUMERIC(5, 2),                  -- e.g. 52.40 (%)
    canonical_url TEXT NOT NULL,                    -- e.g. "https://leetcode.com/problems/two-sum/"
    source TEXT NOT NULL DEFAULT 'leetcode',
    hints JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Socratic hint ladder strings
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{ input, output, explanation }]
    constraints TEXT[] NOT NULL DEFAULT '{}',       -- ['2 <= nums.length <= 10^4', ...]
    starter_code JSONB NOT NULL DEFAULT '{}'::jsonb,-- { "cpp20": "...", "python": "..." }
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for fast search, filter, and pagination
CREATE INDEX IF NOT EXISTS idx_leetcode_problems_difficulty ON public.leetcode_problems (difficulty);
CREATE INDEX IF NOT EXISTS idx_leetcode_problems_tags ON public.leetcode_problems USING GIN (topic_tags);
CREATE INDEX IF NOT EXISTS idx_leetcode_problems_frontend_id ON public.leetcode_problems (question_frontend_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_problems_slug ON public.leetcode_problems (title_slug);

-- RLS: Public catalog is read-only for anonymous & authenticated users
ALTER TABLE public.leetcode_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for leetcode problems"
    ON public.leetcode_problems
    FOR SELECT
    USING (true);

CREATE POLICY "Service role write access for leetcode problems"
    ON public.leetcode_problems
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- 2. USER LEETCODE PRACTICE PROGRESS & BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.user_leetcode_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unsolved' CHECK (status IN ('unsolved', 'attempted', 'solved')),
    bookmark BOOLEAN NOT NULL DEFAULT false,
    personal_notes TEXT,
    user_code TEXT,
    code_language TEXT NOT NULL DEFAULT 'cpp20',
    hints_used INTEGER NOT NULL DEFAULT 0,
    mistake_category TEXT,
    difficulty_of_recall INTEGER CHECK (difficulty_of_recall BETWEEN 1 AND 5),
    last_attempted_at TIMESTAMPTZ,
    solved_at TIMESTAMPTZ,
    next_revision_at TIMESTAMPTZ,
    self_reported BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_leetcode_progress UNIQUE (user_id, problem_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_leetcode_progress_user ON public.user_leetcode_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_leetcode_progress_slug ON public.user_leetcode_progress (problem_slug);
CREATE INDEX IF NOT EXISTS idx_user_leetcode_progress_status ON public.user_leetcode_progress (status);
CREATE INDEX IF NOT EXISTS idx_user_leetcode_progress_bookmark ON public.user_leetcode_progress (bookmark) WHERE bookmark = true;
CREATE INDEX IF NOT EXISTS idx_user_leetcode_progress_revision ON public.user_leetcode_progress (next_revision_at);

-- RLS: Users can only see and modify their own progress
ALTER TABLE public.user_leetcode_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leetcode progress"
    ON public.user_leetcode_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. USER LEETCODE PROFILES TABLE (Linked public handle & cached statistics)
CREATE TABLE IF NOT EXISTS public.user_leetcode_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    leetcode_username TEXT NOT NULL,
    cached_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_leetcode_profiles_username ON public.user_leetcode_profiles (leetcode_username);

-- RLS: Users can manage their own profile record
ALTER TABLE public.user_leetcode_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leetcode profile"
    ON public.user_leetcode_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read for leetcode profiles"
    ON public.user_leetcode_profiles
    FOR SELECT
    USING (true);
