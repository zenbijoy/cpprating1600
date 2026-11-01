import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { leetCodeProvider } from '../services/leetcodeProvider';
import { optionalAuth, verifyAuth, AuthenticatedRequest, getSupabaseAdmin } from '../../../services/authServer';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';
import { LeetCodeProblem, UserLeetCodeProgress } from '../types/leetcode.types';

export const leetcodeRouter = Router();

// In-memory rate limiter for LeetCode upstream queries (max 60/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

// 1. GET /api/leetcode/problems
const ProblemsQuerySchema = z.object({
  search: z.string().optional(),
  difficulty: z.enum(['All', 'Easy', 'Medium', 'Hard']).optional(),
  tags: z.string().optional(), // comma-separated
  sortBy: z.enum(['id', 'title', 'difficulty', 'acceptanceRate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

leetcodeRouter.get('/problems', async (req: Request, res: Response) => {
  const clientIp = req.ip || 'anonymous';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const parsed = ProblemsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.issues });
  }

  const { search, difficulty, tags, sortBy, sortOrder, page, limit } = parsed.data;
  const topicTags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  try {
    const result = await leetCodeProvider.getProblems({
      search,
      difficulty,
      topicTags,
      sortBy,
      sortOrder,
      page,
      limit,
    });
    return res.json({ status: 'OK', ...result });
  } catch (err: any) {
    return res.status(500).json({ status: 'ERROR', error: err.message || 'Failed to fetch LeetCode problems' });
  }
});

// 2. GET /api/leetcode/problem/:slug
leetcodeRouter.get('/problem/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Problem slug is required' });
  }

  try {
    const problem = await leetCodeProvider.getProblemDetail(slug);
    if (!problem) {
      return res.status(404).json({ status: 'NOT_FOUND', error: `Problem "${slug}" not found.` });
    }
    return res.json({ status: 'OK', problem });
  } catch (err: any) {
    return res.status(500).json({ status: 'ERROR', error: err.message || 'Failed to fetch problem detail' });
  }
});

// 3. GET /api/leetcode/daily
leetcodeRouter.get('/daily', async (_req: Request, res: Response) => {
  try {
    const daily = await leetCodeProvider.getDailyChallenge();
    return res.json({ status: 'OK', daily });
  } catch (err: any) {
    return res.status(500).json({ status: 'ERROR', error: err.message || 'Failed to fetch daily challenge' });
  }
});

// 4. GET /api/leetcode/tags
leetcodeRouter.get('/tags', async (_req: Request, res: Response) => {
  try {
    const tags = await leetCodeProvider.getAvailableTags();
    return res.json({ status: 'OK', tags });
  } catch (err: any) {
    return res.status(500).json({ status: 'ERROR', error: err.message || 'Failed to fetch topic tags' });
  }
});

// 5. GET /api/leetcode/profile/:username
leetcodeRouter.get('/profile/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  const clientIp = req.ip || 'anonymous';
  if (!checkRateLimit(clientIp, 30)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  try {
    const profile = await leetCodeProvider.getUserProfile(username);
    return res.json({ status: 'OK', profile });
  } catch (err: any) {
    return res.status(500).json({ status: 'ERROR', error: err.message || 'Failed to fetch LeetCode profile' });
  }
});

// 6. GET /api/leetcode/recommendations (Adaptive training recommendations)
leetcodeRouter.get('/recommendations', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const problems = CURATED_LEETCODE_PROBLEMS;
    const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    // Daily problem
    const dailyProblem = problems[dayNumber % problems.length] || problems[0];

    // Weak topic selection based on day or curriculum rotation
    const topics = ['Array', 'Two Pointers', 'Sliding Window', 'Stack', 'Dynamic Programming', 'Binary Search', 'Tree'];
    const focusTopic = topics[dayNumber % topics.length];
    const weakTopicProblems = problems.filter((p) => p.topicTags.includes(focusTopic)).slice(0, 3);

    // Harder challenge problem for stretch goals
    const challengeProblem = problems.find((p) => p.difficulty === 'Hard') || problems[3];

    // Minimum daily goal for busy days (an approachable Easy problem with 15-20 min target)
    const easyProblems = problems.filter((p) => p.difficulty === 'Easy');
    const minGoalProblem = easyProblems[(dayNumber + 3) % easyProblems.length] || easyProblems[0];

    return res.json({
      status: 'OK',
      recommendations: {
        dailyProblem,
        weakTopicProblems,
        dueRevisions: [],
        challengeProblem,
        focusTopic,
        minimumDailyGoal: {
          problem: minGoalProblem,
          targetMinutes: 20,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'ERROR', error: err.message || 'Failed to compute recommendations' });
  }
});

// 7. GET /api/leetcode/progress (Get user's progress records)
leetcodeRouter.get('/progress', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.json({ status: 'OK', progress: [] });
  }

  try {
    const { data, error } = await supabase
      .from('user_leetcode_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('[LeetCode Progress] Supabase select failed:', error.message);
      return res.json({ status: 'OK', progress: [] });
    }

    return res.json({ status: 'OK', progress: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/leetcode/progress (Upsert progress record)
const ProgressUpsertSchema = z.object({
  problemSlug: z.string(),
  status: z.enum(['unsolved', 'attempted', 'solved']).default('unsolved'),
  bookmark: z.boolean().default(false),
  personalNotes: z.string().optional(),
  userCode: z.string().optional(),
  codeLanguage: z.string().default('cpp20'),
  hintsUsed: z.number().default(0),
  mistakeCategory: z.string().optional(),
  difficultyOfRecall: z.number().min(1).max(5).optional(),
  lastAttemptedAt: z.string().optional(),
  solvedAt: z.string().optional(),
  nextRevisionAt: z.string().optional(),
  selfReported: z.boolean().default(false),
});

leetcodeRouter.post('/progress', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = ProgressUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid progress payload', details: parsed.error.issues });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.json({ status: 'OK', progress: parsed.data, message: 'Saved in local mode' });
  }

  try {
    const payload = {
      user_id: userId,
      problem_slug: parsed.data.problemSlug,
      status: parsed.data.status,
      bookmark: parsed.data.bookmark,
      personal_notes: parsed.data.personalNotes,
      user_code: parsed.data.userCode,
      code_language: parsed.data.codeLanguage,
      hints_used: parsed.data.hintsUsed,
      mistake_category: parsed.data.mistakeCategory,
      difficulty_of_recall: parsed.data.difficultyOfRecall,
      last_attempted_at: parsed.data.lastAttemptedAt || new Date().toISOString(),
      solved_at: parsed.data.solvedAt,
      next_revision_at: parsed.data.nextRevisionAt,
      self_reported: parsed.data.selfReported,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_leetcode_progress')
      .upsert(payload, { onConflict: 'user_id,problem_slug' })
      .select()
      .single();

    if (error) {
      console.warn('[LeetCode Progress] Supabase upsert failed:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ status: 'OK', progress: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
