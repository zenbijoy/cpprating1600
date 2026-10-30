# CLIMB 1600 — From Zero to Strong Problem Solver

An AI-Powered Competitive Programming Training Platform designed for students starting from scratch to systematically work toward a **Codeforces rating of 1600 (Specialist) in 180 days**.

---

## 🏔️ Core Product Philosophy

1. **One Clear Next Action At All Times**: Avoid decision fatigue and overwhelming dashboards.
2. **Real Data, Zero Hallucinations**: Live integration with official Codeforces APIs (`user.info`, `user.rating`, `user.status`, `contest.list`, `problemset.problems`).
3. **Adaptive Recommendation & Spaced Revision**: Deterministic multi-factor ranking balancing difficulty progression, topic weaknesses, overdue mistake reviews, and target rating milestones.
4. **Socratic AI Guidance (English & Bengali)**: Graduated 5-step hint ladder + full editorial explanation using Gemini 3.8 Flash with server-side caching and rate-limiting. Never gives away answers prematurely.
5. **Anti-Procrastination & Recovery Engine**:
   - 5-Minute Start focus timer
   - Low-Energy Mode for busy university exam days
   - Non-punitive missed-day recovery without doubling workload
6. **Mistake Notebook & Submission Autopsy**:
   - SuperMemo/SM-2-inspired spaced repetition (easy, difficult, failed intervals)
   - Recall-first flashcard review before revealing notes
   - Root-cause tagging (Integer overflow, Boundary case, Indexing error, TLE complexity, etc.)
7. **Virtual Contest Arena**:
   - Simulated and practice rounds on curated past Codeforces contests
   - ICPC/CF penalty scoring (solve time + 20 min per WA prior to AC)
   - Real-time Strategy Coach prompts and comprehensive post-contest debrief with upsolving queue
   - Live local scoreboard standings with tie-breaking
8. **Community & Cohort Hub**:
   - Peer study groups and collaborative practice circles with invite codes
   - Weekly training sprints and social challenges
   - Cohort trajectory benchmarking against the Target 1600 community
9. **Offline-First Synchronization**:
   - Persistent client-side queue draining with last-write-wins timestamp conflict resolution
   - Live connectivity & sync indicator in desktop sidebar and mobile header
10. **Study Guardian Android Companion**:
   - Native Kotlin + Jetpack Compose application with Room DB, WorkManager, and Foreground Service
   - Strict privacy safeguards: Zero covert keylogging, non-punitive focus recovery

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite
- **Backend Runtime**: Node.js & Express (`server.ts`) with sandboxed code execution, rate limiter, and response caching
- **Database**: Supabase PostgreSQL with 11 normalized tables and Row-Level Security (RLS)
- **AI Engine**: Official Google GenAI SDK (`@google/genai`) with Gemini 3.8 Flash, English & Bengali explanations
- **Dataset**: 11,481 indexed official Codeforces problems + 5,164 verified C++ solutions under permissive MIT/Apache-2.0 licenses
- **Android App**: Kotlin 2.1, Jetpack Compose, Material 3, AndroidX Room, Retrofit, Coroutines

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Key environment variables:
- `GEMINI_API_KEY`: API key for Google Gemini AI Coach Studio.
- `PORT`: Node/Express backend port (default `3000`).
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`: Supabase connection credentials.
- `SUPABASE_SERVICE_ROLE_KEY`: Admin service role for backend imports and sync.

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🧪 Automated Verification & Testing

### Web Platform Tests (Node.js Native Test Runner)
```bash
npm test
```
**Results**: 142 passing tests across 27 test suites covering:
- Adaptive Recommendation Engine & Weakness Detection
- Spaced Repetition Scheduling & Revision Queue
- Virtual Contest Penalty & Local Standings
- Solution Engine Normalization, Deduplication & Safety
- Sync Service Offline Queue & Reconnection
- Guardian Classification & Distraction Cost
- Socratic AI Coach & Multilingual Fallback

### TypeScript Linting
```bash
npm run lint
```
Passes with 0 errors (`tsc --noEmit`).

### Production Build
```bash
npm run build
```
Builds production assets to `dist/` cleanly via Vite.

### Android Companion Unit Tests
```bash
cd android
.\gradlew.bat test
```
All debug and release unit tests compile and pass (`BUILD SUCCESSFUL`).

---

## 📑 Feature Modules

| Section | Description |
|---|---|
| **Mission Control** | "Your Climb" — 1 prominent next action, day counter (1 to 180), target 1600, 3 mission sizes (Minimum, Standard, Deep Work), weekly consistency. |
| **Workspace IDE** | Statement, timer, notes, complexity analyzer, C++/Python editor, sample test runner, Socratic hint ladder, and Codeforces verdict logger. |
| **Solution Library** | 5,164 verified, permissively licensed (MIT/Apache-2.0) Modern C++ solutions across 11,481 problems with side-by-side comparison. |
| **Skill Tree** | 14-topic interactive algorithm skill tree with mastery scores, prerequisite dependency checks, and recommended learning sequence. |
| **Submission Autopsy** | Evidence-based diagnostic classifications (Boundary error, Integer overflow, Complexity, Indexing) based on Codeforces verdicts. |
| **Virtual Contests** | Strict contest simulation with ICPC/CF penalty scoring, mid-contest advice, post-contest debrief, and local scoreboard standings. |
| **Mistake Notebook** | Root-cause tagged mistake cards with SuperMemo/SM-2 spaced revision intervals and flashcard self-assessment. |
| **Community Hub** | Peer study groups with invite codes, weekly community challenges with progress tracking, and cohort benchmark charts. |
| **Study Guardian** | Focus timeline, app/website restrictions, YouTube lecture classification, and companion Android synchronization. |
| **AI Coach Studio** | Modes A–F with English and Bengali explanations, progressive hint ladder, and code review. |
