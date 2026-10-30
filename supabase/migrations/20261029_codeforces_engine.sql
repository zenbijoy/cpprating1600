-- =========================================================================
-- CODEFORCES SOLUTION ENGINE — SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Migration: 20261029_codeforces_engine.sql
-- Description: Creates normalized tables, indexes, and RLS policies for 
--              official Codeforces problems, community solutions, provenance,
--              import jobs, and the curation review queue.
-- =========================================================================

-- Enable pgcrypto extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROBLEMS TABLE
CREATE TABLE IF NOT EXISTS public.cf_problems (
    id TEXT PRIMARY KEY,                       -- e.g. "1000A" (contest_id + problem_index)
    contest_id INTEGER NOT NULL,               -- e.g. 1000
    problem_index TEXT NOT NULL,               -- e.g. "A", "B", "C1"
    problem_name TEXT NOT NULL,                -- e.g. "Codehorses T-shirts"
    problem_type TEXT DEFAULT 'PROGRAMMING',
    rating INTEGER,                            -- e.g. 1400 (nullable for unrated problems)
    tags TEXT[] DEFAULT '{}',                  -- e.g. ARRAY['greedy', 'strings']
    statement_url TEXT,                        -- e.g. "https://codeforces.com/problemset/problem/1000/A"
    time_limit_ms INTEGER DEFAULT 1000,
    memory_limit_mb INTEGER DEFAULT 256,
    metadata_source TEXT DEFAULT 'codeforces_api',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cf_problems_contest_index UNIQUE (contest_id, problem_index)
);

-- Indexing for fast search, filter, and sorting
CREATE INDEX IF NOT EXISTS idx_cf_problems_contest_id ON public.cf_problems (contest_id);
CREATE INDEX IF NOT EXISTS idx_cf_problems_rating ON public.cf_problems (rating);
CREATE INDEX IF NOT EXISTS idx_cf_problems_tags ON public.cf_problems USING GIN (tags);

-- 2. SOLUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.cf_solutions (
    id TEXT PRIMARY KEY,                       -- Deterministic hash UUID
    problem_id TEXT REFERENCES public.cf_problems(id) ON DELETE SET NULL,
    language TEXT NOT NULL DEFAULT 'cpp',      -- 'cpp'
    source_code TEXT NOT NULL,
    source_sha256 TEXT NOT NULL,               -- Byte-level exact SHA-256
    normalized_sha256 TEXT NOT NULL,           -- AST/normalized SHA-256
    compiler_standard TEXT DEFAULT 'c++17',    -- 'c++17' or 'c++20'
    validation_status TEXT NOT NULL DEFAULT 'source_checked', -- 'source_checked', 'compiled', 'needs_review'
    validation_notes TEXT,
    mapping_confidence TEXT NOT NULL DEFAULT 'high',           -- 'high', 'medium', 'low', 'unmatched'
    source_repository TEXT NOT NULL,           -- e.g. "DionysiosB/CodeForces"
    source_repository_url TEXT,                -- e.g. "https://github.com/DionysiosB/CodeForces"
    source_file_path TEXT NOT NULL,            -- e.g. "1000A-CodehorsesTshirts.cpp"
    source_commit TEXT,                        -- Verified commit SHA
    original_author TEXT,                      -- Author attribution
    license_spdx TEXT NOT NULL,                -- e.g. "MIT", "Apache-2.0"
    license_verified BOOLEAN NOT NULL DEFAULT true,
    attribution_text TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for fast solution queries
CREATE INDEX IF NOT EXISTS idx_cf_solutions_problem_id ON public.cf_solutions (problem_id);
CREATE INDEX IF NOT EXISTS idx_cf_solutions_source_sha ON public.cf_solutions (source_sha256);
CREATE INDEX IF NOT EXISTS idx_cf_solutions_norm_sha ON public.cf_solutions (normalized_sha256);
CREATE INDEX IF NOT EXISTS idx_cf_solutions_status ON public.cf_solutions (validation_status);
CREATE INDEX IF NOT EXISTS idx_cf_solutions_public ON public.cf_solutions (is_public);
CREATE INDEX IF NOT EXISTS idx_cf_solutions_repo ON public.cf_solutions (source_repository);

-- 3. SOLUTION SOURCES (PROVENANCE REPOSITORY MAPPINGS)
CREATE TABLE IF NOT EXISTS public.cf_solution_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id TEXT NOT NULL REFERENCES public.cf_solutions(id) ON DELETE CASCADE,
    source_repository TEXT NOT NULL,
    source_repository_url TEXT,
    source_commit TEXT,
    source_file_path TEXT NOT NULL,
    original_author TEXT,
    license_spdx TEXT,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cf_solution_sources_sol_id ON public.cf_solution_sources (solution_id);

-- 4. INGESTION JOBS
CREATE TABLE IF NOT EXISTS public.cf_import_jobs (
    job_id TEXT PRIMARY KEY,
    source_repositories TEXT[] NOT NULL DEFAULT '{}',
    current_phase TEXT NOT NULL,
    total_discovered INTEGER DEFAULT 0,
    eligible_files INTEGER DEFAULT 0,
    imported_records INTEGER DEFAULT 0,
    skipped_files INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_checkpoint TEXT,
    error_summary TEXT,
    status TEXT NOT NULL DEFAULT 'running',    -- 'running', 'completed', 'failed', 'paused'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. IMPORT ERRORS
CREATE TABLE IF NOT EXISTS public.cf_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT REFERENCES public.cf_import_jobs(job_id) ON DELETE CASCADE,
    source_repository TEXT,
    source_file_path TEXT,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. REVIEW QUEUE FOR UNCERTAIN MAPPINGS
CREATE TABLE IF NOT EXISTS public.cf_review_queue (
    id TEXT PRIMARY KEY,
    source_repository TEXT NOT NULL,
    source_file_path TEXT NOT NULL,
    raw_filename TEXT NOT NULL,
    inferred_problem_id TEXT,
    confidence TEXT NOT NULL DEFAULT 'unmatched',
    validation_status TEXT NOT NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.cf_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_solution_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_review_queue ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public can view problems" ON public.cf_problems;
DROP POLICY IF EXISTS "Public can view public solutions" ON public.cf_solutions;
DROP POLICY IF EXISTS "Public can view solution sources" ON public.cf_solution_sources;
DROP POLICY IF EXISTS "Service role has full access to cf_problems" ON public.cf_problems;
DROP POLICY IF EXISTS "Service role has full access to cf_solutions" ON public.cf_solutions;
DROP POLICY IF EXISTS "Service role has full access to cf_solution_sources" ON public.cf_solution_sources;
DROP POLICY IF EXISTS "Service role has full access to cf_import_jobs" ON public.cf_import_jobs;
DROP POLICY IF EXISTS "Service role has full access to cf_import_errors" ON public.cf_import_errors;
DROP POLICY IF EXISTS "Service role has full access to cf_review_queue" ON public.cf_review_queue;

-- Public read policies (anyone can read problem catalog and public solutions)
CREATE POLICY "Public can view problems"
    ON public.cf_problems FOR SELECT
    USING (true);

CREATE POLICY "Public can view public solutions"
    ON public.cf_solutions FOR SELECT
    USING (is_public = true);

CREATE POLICY "Public can view solution sources"
    ON public.cf_solution_sources FOR SELECT
    USING (true);

-- Privileged Service Role policies (full write access for the ingestion pipeline and admins)
CREATE POLICY "Service role has full access to cf_problems"
    ON public.cf_problems FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to cf_solutions"
    ON public.cf_solutions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to cf_solution_sources"
    ON public.cf_solution_sources FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to cf_import_jobs"
    ON public.cf_import_jobs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to cf_import_errors"
    ON public.cf_import_errors FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to cf_review_queue"
    ON public.cf_review_queue FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
