-- =========================================================================
-- CLIMB 1600 — AUTHENTICATION & CODEFORCES ACCOUNT LINKING SCHEMA MIGRATION
-- Migration: 20261030_auth_and_codeforces_linking.sql
-- Description: Creates user profiles, linked Codeforces accounts, cryptographic
--              verification challenges, and strict Row Level Security (RLS) policies.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USER PROFILES TABLE (CLIMB 1600 Application Identity)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'cpp20',
    theme TEXT NOT NULL DEFAULT 'dark',
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    daily_minutes INTEGER NOT NULL DEFAULT 45,
    target_rating INTEGER NOT NULL DEFAULT 1600,
    total_days INTEGER NOT NULL DEFAULT 180,
    current_day INTEGER NOT NULL DEFAULT 1,
    current_phase INTEGER NOT NULL DEFAULT 1,
    is_guest BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 2. LINKED CODEFORCES ACCOUNTS TABLE (Codeforces Account Identity)
CREATE TABLE IF NOT EXISTS public.user_cf_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cf_handle TEXT NOT NULL,
    normalized_handle TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified', 'pending_verification', 'verified')),
    verified_at TIMESTAMPTZ,
    cf_rating INTEGER,
    cf_max_rating INTEGER,
    cf_rank TEXT,
    cf_max_rank TEXT,
    cf_avatar TEXT,
    cf_solved_count INTEGER NOT NULL DEFAULT 0,
    synced_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_cf_accounts_user UNIQUE (user_id)
);

-- Unique index to prevent duplicate ownership claims of the same verified handle
CREATE UNIQUE INDEX IF NOT EXISTS uq_verified_cf_handle 
    ON public.user_cf_accounts (normalized_handle) 
    WHERE verification_status = 'verified';

CREATE INDEX IF NOT EXISTS idx_user_cf_accounts_user_id ON public.user_cf_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_user_cf_accounts_norm_handle ON public.user_cf_accounts (normalized_handle);

-- 3. CODEFORCES VERIFICATION CHALLENGES TABLE (Cryptographic Ownership Nonces)
CREATE TABLE IF NOT EXISTS public.cf_verification_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cf_handle TEXT NOT NULL,
    normalized_handle TEXT NOT NULL,
    challenge_code TEXT NOT NULL,
    target_field TEXT NOT NULL DEFAULT 'firstName_lastName_or_organization',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'consumed', 'expired', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cf_challenges_user_id ON public.cf_verification_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_cf_challenges_code ON public.cf_verification_challenges (challenge_code);
CREATE INDEX IF NOT EXISTS idx_cf_challenges_expires ON public.cf_verification_challenges (expires_at);

-- 4. USER PRACTICE ATTEMPTS TABLE (Cloud Sync for Authenticated Users)
CREATE TABLE IF NOT EXISTS public.user_practice_attempts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    contest_id INTEGER,
    problem_index TEXT NOT NULL,
    problem_name TEXT NOT NULL,
    rating INTEGER,
    tags TEXT[] DEFAULT '{}',
    url TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    verdict TEXT NOT NULL DEFAULT 'ATTEMPTED',
    hints_used INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON public.user_practice_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_problem_id ON public.user_practice_attempts (problem_id);

-- 5. USER MISTAKES TABLE (Spaced Repetition Cloud Sync)
CREATE TABLE IF NOT EXISTS public.user_mistakes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    problem_name TEXT NOT NULL,
    problem_url TEXT,
    rating INTEGER,
    tags TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    original_approach TEXT,
    why_it_failed TEXT,
    correct_observation TEXT,
    correct_approach TEXT,
    personal_lesson TEXT,
    interval_days INTEGER NOT NULL DEFAULT 1,
    review_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'due',
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_mistakes_user_id ON public.user_mistakes (user_id);

-- =========================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        avatar_url,
        preferred_language,
        theme,
        onboarding_completed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
        'cpp20',
        'dark',
        false,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cf_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own CF account" ON public.user_cf_accounts;
DROP POLICY IF EXISTS "Users can read own challenges" ON public.cf_verification_challenges;
DROP POLICY IF EXISTS "Users can read own practice attempts" ON public.user_practice_attempts;
DROP POLICY IF EXISTS "Users can insert own practice attempts" ON public.user_practice_attempts;
DROP POLICY IF EXISTS "Users can update own practice attempts" ON public.user_practice_attempts;
DROP POLICY IF EXISTS "Users can delete own practice attempts" ON public.user_practice_attempts;
DROP POLICY IF EXISTS "Users can read own mistakes" ON public.user_mistakes;
DROP POLICY IF EXISTS "Users can insert own mistakes" ON public.user_mistakes;
DROP POLICY IF EXISTS "Users can update own mistakes" ON public.user_mistakes;
DROP POLICY IF EXISTS "Users can delete own mistakes" ON public.user_mistakes;

DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access to user_cf_accounts" ON public.user_cf_accounts;
DROP POLICY IF EXISTS "Service role has full access to cf_verification_challenges" ON public.cf_verification_challenges;
DROP POLICY IF EXISTS "Service role has full access to user_practice_attempts" ON public.user_practice_attempts;
DROP POLICY IF EXISTS "Service role has full access to user_mistakes" ON public.user_mistakes;

-- Profiles policies
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Linked CF accounts policies: Read-only for authenticated user; writes happen via trusted service-role backend
CREATE POLICY "Users can read own CF account"
    ON public.user_cf_accounts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Challenges policies: Read-only for authenticated user; challenge creation & validation happen via trusted service-role backend
CREATE POLICY "Users can read own challenges"
    ON public.cf_verification_challenges FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Practice attempts policies: Full CRUD for authenticated user on their own data
CREATE POLICY "Users can read own practice attempts"
    ON public.user_practice_attempts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice attempts"
    ON public.user_practice_attempts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice attempts"
    ON public.user_practice_attempts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice attempts"
    ON public.user_practice_attempts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Mistakes policies: Full CRUD for authenticated user on their own data
CREATE POLICY "Users can read own mistakes"
    ON public.user_mistakes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes"
    ON public.user_mistakes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes"
    ON public.user_mistakes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mistakes"
    ON public.user_mistakes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Privileged Service Role policies (full read/write access for Express backend)
CREATE POLICY "Service role has full access to profiles"
    ON public.profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to user_cf_accounts"
    ON public.user_cf_accounts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to cf_verification_challenges"
    ON public.cf_verification_challenges FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to user_practice_attempts"
    ON public.user_practice_attempts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to user_mistakes"
    ON public.user_mistakes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
