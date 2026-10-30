# CODEFORCES SOLUTION ENGINE — OPERATIONAL RUNBOOK

**System:** CLIMB 1600 Codeforces Solution Engine  
**Version:** 1.0.0 (Production Ready)  
**Target Environment:** Node.js 24 + React 19 + Supabase PostgreSQL  
**Documentation Location:** `docs/codeforces-solution-engine/`  

---

## 1. System Overview

The Codeforces Solution Engine is an autonomous, high-throughput pipeline and user interface integrated into the `climb-1600` application. It provides:
1. **5,164 Unique Permissively-Licensed Solutions:** Fully audited from eligible public repositories under MIT and Apache-2.0 licenses.
2. **Official Problem Dictionary:** 11,481 Codeforces problems indexed with official ratings, tags, titles, and contest metadata.
3. **Multi-Level Deduplication:** Exact SHA-256 byte matching and normalized AST/whitespace matching with multi-source provenance preservation.
4. **Isolated Static & Compiler Validation:** Static AST/brace checking and safe, sandboxed syntax validation (`g++ -fsyntax-only`).
5. **Full-Stack Search & Comparison Interface:** High-performance React 19 UI with Monaco/syntax-highlighted code viewers, copy actions, rating filters, and side-by-side solution comparison.
6. **Telemetry & Admin Dashboard:** Real-time visibility into repository inventory, license exclusions, compiler logs, review queues, and database import execution.

---

## 2. Directory Structure & Key Files

```text
climb-1600/
├── data/codeforces/
│   ├── manifest.json             # 5,164 verified solutions (canonical)
│   ├── import_manifest.json      # Mirror for production bulk upsert
│   ├── solutions_store.json      # Keyed dictionary for O(1) server access
│   ├── official_problems.json    # 11,481 official Codeforces problems
│   ├── repository_inventory.json # 17 scanned repositories audit
│   ├── license_exclusions.json   # Log of repositories excluded for licensing
│   ├── duplicate_report.json     # Multi-level duplicate audit
│   ├── unmatched_problems.json   # Review queue for uncertain mappings
│   ├── validation_report.json    # GCC compilation & syntax test logs
│   └── import_summary.json       # Top-level ingestion metrics
├── supabase/migrations/
│   └── 20261029_codeforces_engine.sql # Complete PostgreSQL schema & RLS policies
├── tools/codeforces_importer/
│   ├── config.json               # Repository source catalog & licenses
│   ├── clone_repositories.ts     # Resumable, shallow git cloning engine
│   ├── scan_sources.ts           # Recursive source file discoverer
│   ├── extract_metadata.ts       # Multi-signal problem & author extractor
│   ├── match_problems.ts         # Official problemset cross-referencer
│   ├── detect_duplicates.ts      # Exact & normalized deduplication
│   ├── validate_solutions.ts     # Static syntax & sandbox GCC compiler
│   ├── build_import_manifest.ts  # End-to-end manifest pipeline runner
│   ├── import_to_supabase.ts     # Resumable, idempotent Supabase bulk importer
│   └── types.ts                  # Shared TypeScript interfaces
├── src/
│   ├── components/
│   │   ├── SolutionLibraryView.tsx # Search, filter, code viewer, comparison UI
│   │   ├── AdminDashboardView.tsx  # Ingestion metrics, telemetry, controls
│   │   └── ProblemWorkspaceModal.tsx # Problem solving IDE with solution tab
│   └── services/
│       ├── solutionEngineServer.ts # Express API routes & in-memory cache
│       └── solutionEngine.test.ts  # Automated test suite (100% pass)
└── server.ts                     # Full-stack backend mounting /api/solutions
```

---

## 3. Database Migration Execution (Supabase)

The database schema and Row Level Security (RLS) policies are completely specified in:
`supabase/migrations/20261029_codeforces_engine.sql`

### How to apply the migration in Supabase:
1. Open your Supabase Dashboard:
   `https://supabase.com/dashboard/project/ptwrscbantaseijldwgt/sql/new`
2. Open `supabase/migrations/20261029_codeforces_engine.sql` in your editor.
3. Copy the entire file contents and paste them into the Supabase SQL Editor.
4. Click **Run**.
5. The following 6 tables with foreign keys, indexes, and RLS will be created:
   - `public.cf_problems`
   - `public.cf_solutions`
   - `public.cf_solution_sources`
   - `public.cf_import_jobs`
   - `public.cf_import_errors`
   - `public.cf_review_queue`

---

## 4. Running the Ingestion Pipeline

### Step 1: Clone Repositories
Clones all eligible repositories (shallow clone, `--depth 1`) into `.importer_cache/repos/`:
```bash
npx tsx tools/codeforces_importer/clone_repositories.ts
```

### Step 2: Build Import Manifest & Validate
Scans files, extracts problem IDs, matches against official problems, deduplicates, runs compiler validation on samples, and generates all JSON reports:
```bash
npx tsx tools/codeforces_importer/build_import_manifest.ts
```

### Step 3: Run Database Importer
**Dry-Run Mode (Safe test, no database writes):**
```bash
npx tsx tools/codeforces_importer/import_to_supabase.ts --dry-run
```

**Production Mode (Upserts records into Supabase):**
```bash
npx tsx tools/codeforces_importer/import_to_supabase.ts --prod
```

**Partial / Batch Import Test (e.g. 50 records):**
```bash
npx tsx tools/codeforces_importer/import_to_supabase.ts --prod --max 50 --batch 25
```

---

## 5. Web Interface Access

Start the full-stack development server:
```bash
npm start
```
Navigate to:
- **C++ Solution Library:** `http://localhost:3000/?tab=solutions`
- **Importer Admin Dashboard:** `http://localhost:3000/?tab=admin`
- **Problem Workspace with Solutions Tab:** Open any problem from Problem Explorer or Mission Control, and click the **C++ Code** tab in the right panel.

---

## 6. Testing & Quality Assurance

Run the complete automated test suite:
```bash
npm test
```
All 110 tests across 27 test suites execute in ~4 seconds with a 100% pass rate.

Verify frontend production build:
```bash
npm run build
```
Typecheck verification:
```bash
npm run lint
```
