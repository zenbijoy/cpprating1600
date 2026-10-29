import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Initialize Google GenAI if key is present
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Cache stores for Codeforces endpoints
const cfCache = {
  contests: { data: null as any, timestamp: 0 },
  problems: { data: null as any, timestamp: 0 },
  userInfo: new Map<string, { data: any; timestamp: number }>(),
  userRating: new Map<string, { data: any; timestamp: number }>(),
  userStatus: new Map<string, { data: any; timestamp: number }>(),
};

const ONE_HOUR = 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

// Curated high-quality problem fallback dataset when Codeforces API is temporarily unreachable or rate-limited
const CURATED_PROBLEMS = [
  { contestId: 4, index: 'A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
  { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
  { contestId: 231, index: 'A', name: 'Team', rating: 800, tags: ['implementation'] },
  { contestId: 282, index: 'A', name: 'Bit++', rating: 800, tags: ['implementation'] },
  { contestId: 112, index: 'A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
  { contestId: 236, index: 'A', name: 'Boy or Girl', rating: 800, tags: ['strings'] },
  { contestId: 339, index: 'A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'strings'] },
  { contestId: 546, index: 'A', name: 'Soldier and Bananas', rating: 800, tags: ['math'] },
  { contestId: 791, index: 'A', name: 'Bear and Big Brother', rating: 800, tags: ['implementation'] },
  { contestId: 617, index: 'A', name: 'Elephant', rating: 800, tags: ['math'] },
  { contestId: 405, index: 'A', name: 'Gravity Flip', rating: 900, tags: ['greedy', 'sortings'] },
  { contestId: 96, index: 'A', name: 'Football', rating: 900, tags: ['strings'] },
  { contestId: 160, index: 'A', name: 'Twins', rating: 900, tags: ['greedy', 'sortings'] },
  { contestId: 133, index: 'A', name: 'HQ9+', rating: 900, tags: ['implementation'] },
  { contestId: 313, index: 'B', name: 'Ilya and Queries', rating: 1100, tags: ['dp', 'prefix sums'] },
  { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers', 'binary search'] },
  { contestId: 706, index: 'B', name: 'Interesting drink', rating: 1100, tags: ['binary search', 'dp'] },
  { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
  { contestId: 1613, index: 'C', name: 'Poisoned Dagger', rating: 1200, tags: ['binary search'] },
  { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
  { contestId: 1285, index: 'B', name: 'Just Eat It!', rating: 1300, tags: ['dp', 'greedy'] },
  { contestId: 189, index: 'A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
  { contestId: 1374, index: 'D', name: 'Zero Remainder Array', rating: 1400, tags: ['math', 'sortings'] },
  { contestId: 520, index: 'B', name: 'Two Buttons', rating: 1400, tags: ['dfs and similar', 'graphs'] },
  { contestId: 277, index: 'A', name: 'Learning Languages', rating: 1400, tags: ['dsu', 'dfs and similar'] },
  { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
  { contestId: 545, index: 'C', name: 'Woodcutters', rating: 1500, tags: ['dp', 'greedy'] },
  { contestId: 580, index: 'C', name: 'Kefa and Park', rating: 1500, tags: ['dfs and similar', 'trees'] },
  { contestId: 1520, index: 'E', name: 'Arranging The Sheep', rating: 1400, tags: ['greedy', 'math'] },
  { contestId: 1551, index: 'C', name: 'Interesting Story', rating: 1400, tags: ['greedy', 'sortings', 'strings'] },
];

// Helper to make fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// -------------------------------------------------------------
// CODEFORCES PROXY API ENDPOINTS
// -------------------------------------------------------------

// 1. User Info
app.get('/api/codeforces/user-info', async (req: Request, res: Response) => {
  const handle = String(req.query.handle || '').trim();
  if (!handle) {
    return res.status(400).json({ status: 'FAILED', comment: 'Handle is required' });
  }

  const cached = cfCache.userInfo.get(handle.toLowerCase());
  if (cached && Date.now() - cached.timestamp < TEN_MINUTES) {
    return res.json(cached.data);
  }

  try {
    const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status === 'OK') {
      cfCache.userInfo.set(handle.toLowerCase(), { data, timestamp: Date.now() });
      return res.json(data);
    } else {
      return res.status(404).json(data);
    }
  } catch (err: any) {
    return res.status(502).json({
      status: 'FAILED',
      comment: err.message || 'Could not reach Codeforces API',
    });
  }
});

// 2. User Rating History
app.get('/api/codeforces/user-rating', async (req: Request, res: Response) => {
  const handle = String(req.query.handle || '').trim();
  if (!handle) {
    return res.status(400).json({ status: 'FAILED', comment: 'Handle is required' });
  }

  const cached = cfCache.userRating.get(handle.toLowerCase());
  if (cached && Date.now() - cached.timestamp < TEN_MINUTES) {
    return res.json(cached.data);
  }

  try {
    const url = `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status === 'OK') {
      cfCache.userRating.set(handle.toLowerCase(), { data, timestamp: Date.now() });
      return res.json(data);
    } else {
      return res.status(404).json(data);
    }
  } catch (err: any) {
    return res.status(502).json({
      status: 'FAILED',
      comment: err.message || 'Could not fetch rating history',
    });
  }
});

// 3. User Submissions
app.get('/api/codeforces/user-status', async (req: Request, res: Response) => {
  const handle = String(req.query.handle || '').trim();
  const count = parseInt(String(req.query.count || '50'), 10);
  if (!handle) {
    return res.status(400).json({ status: 'FAILED', comment: 'Handle is required' });
  }

  const cacheKey = `${handle.toLowerCase()}_${count}`;
  const cached = cfCache.userStatus.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TEN_MINUTES) {
    return res.json(cached.data);
  }

  try {
    const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status === 'OK') {
      cfCache.userStatus.set(cacheKey, { data, timestamp: Date.now() });
      return res.json(data);
    } else {
      return res.status(404).json(data);
    }
  } catch (err: any) {
    return res.status(502).json({
      status: 'FAILED',
      comment: err.message || 'Could not fetch user submissions',
    });
  }
});

// 4. Upcoming Contests
app.get('/api/codeforces/contests', async (_req: Request, res: Response) => {
  if (cfCache.contests.data && Date.now() - cfCache.contests.timestamp < ONE_HOUR) {
    return res.json(cfCache.contests.data);
  }

  try {
    const url = 'https://codeforces.com/api/contest.list?gym=false';
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status === 'OK') {
      cfCache.contests = { data, timestamp: Date.now() };
      return res.json(data);
    } else {
      return res.status(502).json(data);
    }
  } catch (err: any) {
    return res.status(502).json({
      status: 'FAILED',
      comment: err.message || 'Could not fetch contest list',
    });
  }
});

// 5. Problem Set
app.get('/api/codeforces/problems', async (req: Request, res: Response) => {
  const tag = req.query.tag ? String(req.query.tag) : undefined;
  const minRating = req.query.minRating ? parseInt(String(req.query.minRating), 10) : undefined;
  const maxRating = req.query.maxRating ? parseInt(String(req.query.maxRating), 10) : undefined;

  // Serve from cache if fresh
  if (cfCache.problems.data && Date.now() - cfCache.problems.timestamp < ONE_HOUR) {
    let list = cfCache.problems.data.result.problems;
    if (tag) list = list.filter((p: any) => p.tags.includes(tag));
    if (minRating) list = list.filter((p: any) => p.rating && p.rating >= minRating);
    if (maxRating) list = list.filter((p: any) => p.rating && p.rating <= maxRating);
    return res.json({ status: 'OK', result: { problems: list.slice(0, 100) } });
  }

  try {
    const url = 'https://codeforces.com/api/problemset.problems';
    const response = await fetchWithTimeout(url, 10000);
    const data = await response.json();

    if (data.status === 'OK') {
      cfCache.problems = { data, timestamp: Date.now() };
      let list = data.result.problems;
      if (tag) list = list.filter((p: any) => p.tags.includes(tag));
      if (minRating) list = list.filter((p: any) => p.rating && p.rating >= minRating);
      if (maxRating) list = list.filter((p: any) => p.rating && p.rating <= maxRating);
      return res.json({ status: 'OK', result: { problems: list.slice(0, 100) } });
    }
  } catch (err) {
    console.warn('Codeforces problemset API request timed out or failed, serving curated dataset.');
  }

  // Fallback to curated dataset
  let fallbackList = [...CURATED_PROBLEMS];
  if (tag) fallbackList = fallbackList.filter((p) => p.tags.includes(tag));
  if (minRating) fallbackList = fallbackList.filter((p) => p.rating >= minRating);
  if (maxRating) fallbackList = fallbackList.filter((p) => p.rating <= maxRating);

  return res.json({
    status: 'OK',
    source: 'curated_catalog',
    result: { problems: fallbackList },
  });
});

// -------------------------------------------------------------
// GEMINI AI COACH ENDPOINT (MODES A-F)
// -------------------------------------------------------------

const CoachRequestSchema = z.object({
  mode: z.enum([
    'concept_teacher',
    'hint_ladder',
    'code_review',
    'editorial_explainer',
    'personal_coach',
    'mock_contest',
    'anti_procrastination',
  ]),
  payload: z.object({
    topicTitle: z.string().optional(),
    problemName: z.string().optional(),
    problemStatement: z.string().optional(),
    userCode: z.string().optional(),
    codeLanguage: z.string().optional(),
    hintLevel: z.number().min(1).max(6).optional(),
    userApproach: z.string().optional(),
    userQuestion: z.string().optional(),
    failedTestcase: z.string().optional(),
    userProfile: z
      .object({
        targetRating: z.number().optional(),
        currentDay: z.number().optional(),
        streak: z.number().optional(),
        weakTopic: z.string().optional(),
        recentAttempts: z.number().optional(),
      })
      .optional(),
  }),
});

app.post('/api/ai/coach', async (req: Request, res: Response) => {
  const parsed = CoachRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid coach request format', details: parsed.error.issues });
  }

  const { mode, payload } = parsed.data;

  // System instruction for disciplined competitive programming coach
  const systemInstruction = `You are the lead Competitive Programming Coach for CLIMB 1600.
Your student is starting from scratch and aiming for a Codeforces rating of 1600 in 180 days.
CORE PRINCIPLES:
1. Never shame the user for struggling, asking questions, or taking time.
2. Teach independent problem-solving and rigorous reasoning, not mere copy-pasting.
3. Keep hints minimal and graduated (Socratic). Never give away the full solution unless Hint Level 6 (Full Editorial) is explicitly requested.
4. When reviewing code, look for:
   - Integer overflow (int vs long long in C++)
   - Time complexity limit: usually 10^8 ops per second. N <= 10^5 needs O(N log N) or O(N).
   - Off-by-one errors (0-based vs 1-based indexing)
   - Edge cases: N=1, N=0, all elements equal, negative values, extreme constraints.
5. Format mathematical equations clearly and maintain concise, structured markdown with bullet points.`;

  let prompt = '';

  switch (mode) {
    case 'concept_teacher':
      prompt = `MODE A: CONCEPT TEACHER.
Topic: "${payload.topicTitle || 'Basic Problem Solving'}"
Student Question / Focus: "${payload.userQuestion || 'Explain from absolute fundamentals.'}"

Teach this concept step-by-step:
1. Intuition: What problem does this solve in competitive programming?
2. How it works (with a simple visual or array example).
3. Time & Space Complexity analysis.
4. Common traps / mistakes beginners make on Codeforces.
5. Check-for-Understanding: End with ONE quick 1-sentence diagnostic question to test the student's grasp.`;
      break;

    case 'hint_ladder': {
      const level = payload.hintLevel || 1;
      const problem = payload.problemName || 'the problem';
      const approach = payload.userApproach ? `User's current approach: "${payload.userApproach}"` : '';

      if (level === 1) {
        prompt = `MODE B: SOCRATIC HINT 1 (Key Observation).
Problem: "${problem}"
${approach}
Give ONLY Hint 1: Restate the single key physical/mathematical observation without giving away the algorithm or formula. Do not mention code or full solution.`;
      } else if (level === 2) {
        prompt = `MODE B: SOCRATIC HINT 2 (Guiding Question).
Problem: "${problem}"
${approach}
Give ONLY Hint 2: Ask a thought-provoking guiding question that directs the student's attention to an invariant, symmetry, or order (e.g. "What happens if we sort?" or "Is the condition monotonic?").`;
      } else if (level === 3) {
        prompt = `MODE B: SOCRATIC HINT 3 (Technique / Data Structure Suggestion).
Problem: "${problem}"
${approach}
Give ONLY Hint 3: Suggest the candidate algorithmic paradigm or data structure (e.g. Two Pointers, Prefix Sums, Binary Search on Answer, Frequency Map) and explain WHY it fits the constraints.`;
      } else if (level === 4) {
        prompt = `MODE B: SOCRATIC HINT 4 (Core Algorithm Outline).
Problem: "${problem}"
${approach}
Give ONLY Hint 4: Outline the high-level steps of the algorithm in 3-4 bullet points. No full code.`;
      } else if (level === 5) {
        prompt = `MODE B: SOCRATIC HINT 5 (Pseudocode).
Problem: "${problem}"
${approach}
Give ONLY Hint 5: Provide clean, structured pseudocode showing the loop structure and state transitions.`;
      } else {
        prompt = `MODE B: FULL EDITORIAL EXPLANATION.
Problem: "${problem}"
${approach}
Provide a complete, masterclass editorial:
1. Core Idea & Observation
2. Algorithm & Invariant
3. Correctness Proof / Argument
4. Complexity: Time & Space
5. Clean implementation in ${payload.codeLanguage || 'C++20'}
6. Pitfalls to avoid.`;
      }
      break;
    }

    case 'code_review':
      prompt = `MODE C: CODE REVIEWER.
Problem: "${payload.problemName || 'Unknown Problem'}"
Language: ${payload.codeLanguage || 'C++20'}
User's Code:
\`\`\`${payload.codeLanguage || 'cpp'}
${payload.userCode || '// No code provided'}
\`\`\`
${payload.failedTestcase ? `Failed on Testcase: "${payload.failedTestcase}"` : ''}

Inspect the code rigorously:
1. Correctness: Are there logical flaws or wrong assumptions?
2. Boundary / Edge cases: How does it handle N=1, extreme bounds, negative values, empty inputs?
3. Complexity check: Will it exceed the typical 1.0s time limit (TLE)?
4. Potential integer overflow: Are products/sums exceeding 2*10^9 without 64-bit integers?
5. Constructive suggestions: Explain how to fix the issue without shaming.`;
      break;

    case 'editorial_explainer':
      prompt = `MODE D: EDITORIAL EXPLAINER.
Problem: "${payload.problemName || 'Problem'}"
Statement / Context: "${payload.problemStatement || 'Div.2 problem'}"
Explain the standard editorial solution in plain, beginner-friendly terms. Emphasize WHY the naive O(N^2) or brute-force approach fails and how the optimal observation is discovered.`;
      break;

    case 'personal_coach':
      prompt = `MODE E: PERSONAL COACH CHECK-IN.
Student Progress:
- Day: ${payload.userProfile?.currentDay || 1} of 180
- Target Rating: ${payload.userProfile?.targetRating || 1600}
- Current Streak: ${payload.userProfile?.streak || 0} days
- Weakest Identified Area: "${payload.userProfile?.weakTopic || 'Implementation & Loops'}"

Give an encouraging, disciplined 3-part review:
1. Progress Validation: Celebrate consistency and effort.
2. Direct Actionable Advice: 1-2 concrete training adjustments for this week.
3. Motivation: A short, grounding thought on how problem-solving intuition compounds over time.`;
      break;

    case 'anti_procrastination':
      prompt = `MODE ANTI-PROCRASTINATION:
Student is feeling resistant or finding it hard to begin today's session.
Topic: "${payload.topicTitle || 'Foundations'}"

Generate ONE tiny, completely friction-free micro-action (5 minutes maximum) to get fingers moving. No pressure, no lecture. Just a simple, concrete first move.`;
      break;
  }

  if (!ai) {
    // Return high quality fallback response when API key is not yet set
    return res.json({
      success: true,
      mode,
      source: 'offline_coach',
      message: getOfflineCoachResponse(mode, payload),
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const text = response.text || 'Unable to generate coach advice at this moment.';
    return res.json({
      success: true,
      mode,
      source: 'gemini-3.8-flash',
      message: text,
    });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    return res.json({
      success: true,
      mode,
      source: 'offline_fallback',
      message: getOfflineCoachResponse(mode, payload),
      warning: 'Live AI request hit rate limit or error; served prepared CP coach guidance.',
    });
  }
});

function getOfflineCoachResponse(mode: string, payload: any): string {
  switch (mode) {
    case 'hint_ladder': {
      const lvl = payload.hintLevel || 1;
      if (lvl === 1) {
        return `**Hint 1 (Core Observation):** Look at the parity (even/odd) or order of the elements. In many Codeforces problems, checking if the sum or difference satisfies a simple invariant reveals the answer without simulation.`;
      }
      if (lvl === 2) {
        return `**Hint 2 (Guiding Question):** If the array was sorted in non-decreasing order, would making the best choice at each step ever prevent a better future outcome? Can you construct a counter-example to a greedy pick?`;
      }
      if (lvl === 3) {
        return `**Hint 3 (Technique Suggestion):** Notice that the constraints allow up to $N = 10^5$. An $O(N^2)$ brute force will trigger Time Limit Exceeded (TLE). Consider using **Prefix Sums** or **Two Pointers** to evaluate queries in $O(1)$ or $O(N)$ total time.`;
      }
      if (lvl === 4) {
        return `**Hint 4 (Algorithm Outline):**
1. Read inputs and precalculate prefix values: \`pref[i] = pref[i-1] + a[i]\`.
2. For each query $(L, R)$, the answer is simply \`pref[R] - pref[L-1]\`.
3. Handle 0-based vs 1-based indexing carefully.`;
      }
      if (lvl === 5) {
        return `**Hint 5 (Pseudocode):**
\`\`\`cpp
vector<long long> pref(n + 1, 0);
for (int i = 1; i <= n; i++) {
    pref[i] = pref[i - 1] + a[i - 1];
}
// For query [L, R]:
long long sum = pref[R] - pref[L - 1];
\`\`\``;
      }
      return `**Full Editorial Summary:**
The problem asks for fast range queries. Computing the sum iteratively takes $O(N)$ per query, resulting in $O(Q \\cdot N) \\approx 10^{10}$ operations (TLE). By precomputing prefix sums in $O(N)$ time and space, each query is answered in $O(1)$ time. Watch out for integer overflow: if individual values are up to $10^9$, use \`long long\` for the prefix array!`;
    }
    case 'code_review':
      return `**Code Review Inspection:**
1. **Integer Overflow Check:** Check if the running sum or multiplication of values can exceed $2 \\times 10^9$. If so, replace \`int\` with \`long long\` in C++ (\`int64_t\`).
2. **Time Complexity:** Ensure you are not performing an inner loop over $N$ inside an outer loop over $N$ when $N > 5000$.
3. **Corner Cases:** Test $N = 1$, all elements identical, and minimum/maximum boundary constraints.
4. **Fast I/O:** Make sure \`cin.tie(NULL); ios_base::sync_with_stdio(false);\` is included at the start of \`main()\`.`;
    case 'concept_teacher':
      return `**Concept Summary: ${payload.topicTitle || 'Problem Solving Foundations'}**
- **Why it matters:** In competitive programming, pattern recognition and constraint awareness save you hours of trial and error during contests.
- **Key rule of thumb:** Codeforces machines execute approximately $10^8$ basic operations per second.
  - $N \\le 10^5 \\implies O(N \\log N)$ or $O(N)$
  - $N \\le 2000 \\implies O(N^2)$
  - $N \\le 500 \\implies O(N^3)$
- **Quick Check:** If $N = 2 \\times 10^5$, why will a nested double loop \`for(int i=0; i<n; i++) for(int j=i; j<n; j++)\` get TLE? *(Because $N(N+1)/2 \\approx 2 \\times 10^{10} \\gg 10^8$ operations!)*`;
    case 'personal_coach':
      return `**Coach Check-in:**
You are making deliberate progress toward the 1600 goal. Remember: rating is an outcome, but problem-solving muscle is the skill. Even attempting a problem for 20 minutes without an editorial strengthens neural connections. Stay consistent, log any mistake you encounter, and protect your daily streak!`;
    default:
      return `**Coach Advice:** Focus on the problem constraints, write down the smallest sample input by hand, and identify the simplest invariant before writing any code.`;
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'CLIMB 1600',
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLIMB 1600 full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
