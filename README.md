# CLIMB 1600 — From Zero to Strong Problem Solver

An AI-Powered Competitive Programming Training Platform designed for students starting from scratch to systematically work toward a **Codeforces rating of 1600 (Specialist) in 180 days**.

---

## 🏔️ Core Product Philosophy

1. **One Clear Next Action At All Times**: Avoid decision fatigue and overwhelming dashboards.
2. **Real Data, Zero Hallucinations**: Live integration with official Codeforces APIs (`user.info`, `user.rating`, `user.status`, `contest.list`, `problemset.problems`).
3. **Socratic AI Guidance**: Graduated 5-step hint ladder + full editorial explanation. Never gives away answers prematurely.
4. **Anti-Procrastination & Recovery Engine**:
   - 5-Minute Start focus timer
   - Low-Energy Mode for busy university exam days
   - Non-punitive missed-day recovery without doubling workload
5. **Mistake Notebook & Spaced Revision**:
   - SuperMemo-inspired intervals (1d, 3d, 7d, 14d, 30d)
   - Recall-first flashcard review before revealing notes
   - Root-cause tagging (Integer overflow, Boundary case, Indexing error, TLE complexity, etc.)

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend Runtime**: Node.js & Express (`server.ts`) with Vite middleware in development
- **AI Engine**: Official Google GenAI SDK (`@google/genai`) with `gemini-3.8-flash`
- **Validation**: Zod schema validation on all backend endpoints
- **Storage**: Persistent client-side storage with automated drafts, full JSON export & import, and Firebase readiness

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Variables:
- `GEMINI_API_KEY`: Injected automatically by AI Studio secrets or configured in your environment.
- `PORT`: Defaults to `3000`.

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🧪 Automated Unit Testing

Unit tests run with Node's native test runner via `tsx`:

```bash
npx --yes tsx --test src/utils/roadmap.test.ts src/utils/spacedRepetition.test.ts
```

All 7 core curriculum and spaced repetition unit tests pass deterministically.

---

## 📑 Feature Modules

| Section | Description |
|---|---|
| **Dashboard** | "Your Climb" — 1 prominent next action, day counter (1 to 180), target 1600, 3 mission sizes (Minimum, Standard, Deep Work), weekly consistency. |
| **Learn** | 26-week / 180-day curriculum spanning 7 phases: Foundations, Basic Problem Solving, Core Algorithmic Skills, Intermediate DP/Graphs, Contest Readiness, Rating Push, and Final Assessment. |
| **Problem Arena** | Live Codeforces problem set with filters for rating (800–1600), tags, solved status, and launch button. |
| **Problem Workspace** | Statement, timer, notes, complexity analyzer, C++/Python editor, sample test runner, Socratic hint ladder, and Codeforces verdict logger. |
| **AI Coach Studio** | Modes A–F: Concept Teacher, Socratic Hint Ladder, Code Reviewer (catches TLE & overflow), Editorial Explainer, and Personal Coach Check-In. |
| **Contests** | Official Codeforces contest calendar in user local timezone + Virtual Contest Mock Simulator with countdown. |
| **Mistake Notebook** | Root-cause tagged mistake cards with scheduled recall intervals and flashcard self-assessment. |
| **Progress** | Interpretable analytics: practice time, solved by rating, hint dependence, and weekly coach report. |
| **Settings** | Daily time budget, language selection, Codeforces handle sync, and full JSON backup export/import. |
