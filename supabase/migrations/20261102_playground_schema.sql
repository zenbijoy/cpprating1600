-- =========================================================================
-- CLIMB 1600 — PLAYGROUND SCHEMA MIGRATION
-- Migration: 20261102_playground_schema.sql
-- Description: Adds playground_snippets table for cloud-saved code snippets
--              with strict Row Level Security (RLS) ownership enforcement.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PLAYGROUND SNIPPETS TABLE
CREATE TABLE IF NOT EXISTS public.playground_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    description TEXT CHECK (char_length(description) <= 500),
    language TEXT NOT NULL CHECK (language IN ('cpp20', 'cpp17', 'c', 'python')),
    code TEXT NOT NULL CHECK (char_length(code) <= 65536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_playground_snippets_user ON public.playground_snippets (user_id);
CREATE INDEX IF NOT EXISTS idx_playground_snippets_updated ON public.playground_snippets (updated_at DESC);

-- Unique title per user to prevent duplicate snippet names
CREATE UNIQUE INDEX IF NOT EXISTS idx_playground_snippets_user_title
    ON public.playground_snippets (user_id, lower(title));

-- Row Level Security
ALTER TABLE public.playground_snippets ENABLE ROW LEVEL SECURITY;

-- Users can only select their own snippets
CREATE POLICY "playground_snippets_select_own" ON public.playground_snippets
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own snippets
CREATE POLICY "playground_snippets_insert_own" ON public.playground_snippets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own snippets
CREATE POLICY "playground_snippets_update_own" ON public.playground_snippets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own snippets
CREATE POLICY "playground_snippets_delete_own" ON public.playground_snippets
    FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp on edit
CREATE OR REPLACE FUNCTION public.update_playground_snippet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_playground_snippets_updated ON public.playground_snippets;
CREATE TRIGGER trg_playground_snippets_updated
    BEFORE UPDATE ON public.playground_snippets
    FOR EACH ROW EXECUTE FUNCTION public.update_playground_snippet_timestamp();
