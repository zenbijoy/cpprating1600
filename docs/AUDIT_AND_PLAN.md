# CLIMB 1600 — Architectural Audit & Implementation Plan

## 1. Executive Summary & Baseline Audit

An exhaustive audit of the `CLIMB 1600` repository was conducted across frontend (React 19 + TypeScript + Vite + Tailwind CSS), backend (Node.js + Express + Zod + Supabase), data assets (11,481 official Codeforces problems + 5,164 solution manifests), and the native Android application (Kotlin + Jetpack Compose + Room + WorkManager).

### Baseline Check Status
- **TypeScript Typecheck (`npm run lint` / `tsc --noEmit`)**: ✅ **PASSED (0 errors)**
- **Unit Test Runner (`npm test` / `tsx --test`)**: ✅ **PASSED (115 tests across 27 suites, 0 failures)**
- **Production Frontend Bundle (`npm run build` / `vite build`)**: ✅ **PASSED (dist/ compiled cleanly)**
- **Android Gradle Unit Tests (`gradlew test`)**: ✅ **PASSED (45 tasks executed/up-to-date, 0 failures)**

---

## 2. Feature Audit & Status Matrix

| Feature Module | Current Status | Assessment & Gap Analysis | Action Required |
|---|---|---|---|
| **1. Adaptive Training Engine** | Partially Implemented | Baseline heuristic exists in `adaptiveEngine.ts` but relies primarily on a hardcoded 30-problem catalog rather than dynamic scoring across the 11,481 indexed problems. Lacks topic exclusion and multi-factor weighted scoring. | Expand to multi-factor explainable recommendation scoring (topic mastery, error patterns, target rating 1200/1400/1600, recency, solve time) with fallback for cold-start users. |
| **2. Topic Mastery Map** | Partially Implemented | 23-node skill tree DAG in `skillTree.ts`, heatmaps, and radars exist. Confidence/sample size indicator and direct connection with dynamic problem queries need improvement. | Connect topic mastery with verified tag performance, calculate explainable confidence, and add topic-specific practice filters. |
| **3. Mistake Notebook & Autopsy** | Working / Needs Extension | Solid verdict normalization, compiler diagnostics, and AST/regex integer overflow/TLE detection exist in `autopsy.ts`. SM2 interval scheduling in `spacedRepetition.ts`. | Add structured hypothesis labeling (never claim exact WA root cause without test data), persist review history over time, and support snoozing/skipping. |
| **4. Smart Revision Engine** | Working / Needs Extension | SM2 spaced repetition interval logic works in unit tests. Needs tighter integration into daily planner and revision history persistence. | Build revision queue snapshots, handle timezone-aware scheduling, prevent duplicate review tasks, and link with sync engine. |
| **5. AI Socratic CP Coach** | Working / Needs Extension | Express `/api/ai/coach` and `/api/ai/analyze-submission` with Gemini 3.8 / 2.5 Flash and offline fallbacks. | Implement 5-level hint ladder with English & Bengali language support, per-user usage quotas/rate-limiting, request limits, and output sanitization. |
| **6. Virtual Contest System** | Working / Needs Extension | `VirtualContestArenaView.tsx` and `virtualContest.ts` simulate past CF rounds, compute penalties, and provide debriefs. | Add custom contest creation from problem set, live local standings table, pause/resume state handling, and unattempted problem upsolving queue. |
| **7. Focus Guardian (Android & Web)** | Working | Android app has Room DB, Foreground Service, Accessibility interception, Local VPN, and Web sync. Web has `GuardianView.tsx` and telemetry. | Connect focus sessions directly to practice tasks, track solved problems during focus sessions, and document Android permissions/limitations. |
| **8. Social & Leaderboards** | Missing | Local achievements and community benchmark comparisons exist, but multi-user social challenges and opt-in leaderboards are missing. | Implement study groups, weekly challenges, opt-in leaderboards with privacy controls, and server-side score verification. |
| **9. Offline-First & Synchronization** | Partially Implemented | LocalStorage persistence with sample seeds on web; Room DB on Android; partial Supabase tables. Missing sync queue and conflict resolution. | Implement client sync queue with UUIDs, idempotent server sync endpoints, conflict handling, and UI sync status indicator. |
| **10. Solution & Problem Intelligence** | Working | Importer tooling in `tools/codeforces_importer`, deduplication, license exclusion, Supabase migration for `cf_problems` and `cf_solutions`. | Enhance search filters, admin telemetry reporting, and ensure zero client execution of C++ code. |
| **11. Database & Migrations** | Partially Implemented | Migrations 1 & 2 exist (`cf_problems`, `cf_solutions`, `profiles`, `user_cf_accounts`, `user_practice_attempts`, `user_mistakes`). Missing tables for plans, sessions, revisions, groups, and usage accounting. | Create versioned migration `20261031_learning_platform_schema.sql` with all missing entities and strict RLS policies. |
| **12. Security, Privacy & Quotas** | Partially Implemented | Zod validation on endpoints, sandboxed g++ execution with timeouts, server-side secret protection. | Add per-user AI rate limiting, quota tracking, and audit logging. |

---

## 3. Implementation Phases (Phases B through H)

1. **Phase B — Core Learning Data & Database Schema**
   - Supabase migration `20261031_learning_platform_schema.sql` (Daily Plans, Tasks, Revision History, AI Usage, Virtual Contests, Focus Sessions, Social Groups & Challenges, Sync Events).
   - Server-side models, sync endpoints, and RLS policies.
   - Enhanced spaced-repetition and mistake tracking services.

2. **Phase C — Adaptive Training Engine**
   - Multi-factor deterministic recommendation algorithm with explainable reasons.
   - Configurable recommendation weights, topic exclusion, and target ratings (1200, 1400, 1600).
   - Cold-start handling and full unit test coverage.
   - Daily training plan integration.

3. **Phase D — AI CP Coach Evolution**
   - 5-stage hint ladder (Conceptual Nudge -> Key Observation -> Algorithm Direction -> Pseudocode -> Complexity Analysis).
   - Bilingual support: English and Bengali.
   - Server-side rate limiting, quota accounting, and response caching.

4. **Phase E — Virtual Contests & Analytics**
   - Custom contest creation, local live standings, pause/resume, and upsolving pipeline.
   - Advanced analytics separating official CF data, local practice data, and estimated analytics.

5. **Phase F — Guardian & Engagement**
   - Task-to-focus-session linkage.
   - Opt-in social study groups, weekly challenges, and secure leaderboards.

6. **Phase G — Offline Support & Dataset Intelligence**
   - Client sync queue with conflict resolution and offline storage cache.
   - Importer status monitoring, license verification, and full search indexing.

7. **Phase H — Verification, Documentation & Final Report**
   - Full test run (`npm test`, `npm run lint`, `npm run build`, `gradlew test`).
   - Documentation updates (`README.md`, `ARCHITECTURE.md`).
   - Master delivery report.
