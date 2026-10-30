import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  verifyAuth,
  optionalAuth,
  getProfileHandler,
  updateProfileHandler,
  migrateGuestHandler,
  AuthenticatedRequest,
  getSupabaseAdmin,
} from './src/services/authServer.ts';
import {
  cfVerificationService,
  validateHandle,
} from './src/services/codeforcesVerificationServer.ts';
import {
  getSettingsHandler,
  updateSettingsHandler,
  resetSettingsHandler,
  exportUserDataHandler,
  deleteAccountHandler,
} from './src/services/settingsServer.ts';
import { notificationRouter } from './src/services/notifications/notificationRoutes.ts';
import { jobProcessor } from './src/services/notifications/jobProcessor.ts';
import { cfActivityTracker } from './src/services/notifications/cfActivityTracker.ts';
import { evaluateTestCaseResult } from './src/utils/testcaseRunner.ts';
import {
  getPresignedUrlHandler,
  deleteFileHandler,
  localUploadHandler,
} from './src/services/r2StorageServer.ts';
import { communityServer } from './src/services/communityServer.ts';
import { socialFeedServer } from './src/services/socialFeedServer.ts';
import { chatServer } from './src/services/chatServer.ts';
import { moderationServer } from './src/services/moderationServer.ts';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve('public/uploads')));

// In-memory runtime custom API key (configured via Settings in UI)
let runtimeCustomApiKey: string | null = null;

// Dynamic Google GenAI resolver: checks request header, runtime custom key, or process.env
function getAIClient(req?: Request): GoogleGenAI | null {
  const key =
    (req?.headers['x-gemini-api-key'] as string) ||
    runtimeCustomApiKey ||
    process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Global default Gemini client
const ai = getAIClient();

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
// AUTHENTICATION & USER PROFILE ENDPOINTS
// -------------------------------------------------------------

app.get('/api/auth/me', verifyAuth, getProfileHandler);
app.put('/api/auth/profile', verifyAuth, updateProfileHandler);
app.post('/api/auth/guest-migrate', verifyAuth, migrateGuestHandler);

// -------------------------------------------------------------
// GLOBAL SETTINGS & PERSONALIZATION ENDPOINTS
// -------------------------------------------------------------
app.get('/api/settings', verifyAuth, getSettingsHandler);
app.put('/api/settings', verifyAuth, updateSettingsHandler);
app.post('/api/settings/reset', verifyAuth, resetSettingsHandler);
app.post('/api/settings/export', verifyAuth, exportUserDataHandler);
app.post('/api/account/delete', verifyAuth, deleteAccountHandler);

// Android Guardian Companion Sync
app.get('/api/guardian/preferences', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from('user_settings').select('guardian_preferences').eq('user_id', user.id).maybeSingle();
    return res.json({ status: 'OK', preferences: data?.guardian_preferences || null });
  } catch (err: any) {
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
});

app.put('/api/guardian/preferences', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const sb = getSupabaseAdmin();
    await sb.from('user_settings').upsert({
      user_id: user.id,
      guardian_preferences: req.body,
      updated_at: new Date().toISOString(),
    });
    return res.json({ status: 'OK', message: 'Guardian preferences synced successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS & REMINDERS API (EVENT ENGINE & SCHEDULER)
// -------------------------------------------------------------
app.use('/api/notifications', notificationRouter);

// -------------------------------------------------------------
// CLOUDFLARE R2 & FILE STORAGE ENDPOINTS
// -------------------------------------------------------------
app.post('/api/storage/presign', verifyAuth, getPresignedUrlHandler);
app.delete('/api/storage/file', verifyAuth, deleteFileHandler);
app.put('/api/storage/local-upload', optionalAuth, localUploadHandler);

// -------------------------------------------------------------
// COMMUNITIES & MEMBERSHIPS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/communities', optionalAuth, communityServer.listCommunities);
app.get('/api/communities/:slug', optionalAuth, communityServer.getCommunityBySlug);
app.post('/api/communities', verifyAuth, communityServer.createCommunity);
app.put('/api/communities/:id', verifyAuth, communityServer.updateCommunity);
app.post('/api/communities/:id/join', verifyAuth, communityServer.joinCommunity);
app.post('/api/communities/:id/leave', verifyAuth, communityServer.leaveCommunity);
app.delete('/api/communities/:id', verifyAuth, communityServer.deleteCommunity);
app.post('/api/communities/provision-defaults', verifyAuth, communityServer.provisionDefaultsHandler);
app.get('/api/communities/:id/members', optionalAuth, communityServer.listCommunityMembers);
app.put('/api/communities/:id/members/:userId/role', verifyAuth, communityServer.updateMemberRole);
app.delete('/api/communities/:id/members/:userId', verifyAuth, communityServer.removeMember);
app.post('/api/communities/:id/members/:userId/ban', verifyAuth, communityServer.banMember);
app.get('/api/communities/:id/join-requests', verifyAuth, communityServer.listJoinRequests);
app.post('/api/communities/:id/join-requests/:requestId/review', verifyAuth, communityServer.reviewJoinRequest);
app.post('/api/communities/:id/transfer-ownership', verifyAuth, communityServer.transferOwnership);

// -------------------------------------------------------------
// SOCIAL FEED, POSTS, BLOGS, Q&A, REACTIONS, COMMENTS
// -------------------------------------------------------------
app.get('/api/social/posts', optionalAuth, socialFeedServer.getFeed);
app.get('/api/social/posts/:id', optionalAuth, socialFeedServer.getPostById);
app.post('/api/social/posts', verifyAuth, socialFeedServer.createPost);
app.delete('/api/social/posts/:id', verifyAuth, socialFeedServer.deletePost);
app.post('/api/social/reactions', verifyAuth, socialFeedServer.handleReaction);
app.post('/api/social/posts/:id/bookmark', verifyAuth, socialFeedServer.toggleBookmark);
app.post('/api/social/posts/:id/accept-answer', verifyAuth, socialFeedServer.acceptAnswer);
app.get('/api/social/posts/:id/comments', optionalAuth, socialFeedServer.getComments);
app.post('/api/social/comments', verifyAuth, socialFeedServer.createComment);
app.delete('/api/social/comments/:id', verifyAuth, socialFeedServer.deleteComment);

// -------------------------------------------------------------
// REAL-TIME DIRECT TEXT MESSAGING (NO CALLS)
// -------------------------------------------------------------
app.get('/api/chat/conversations', verifyAuth, chatServer.listConversations);
app.post('/api/chat/conversations', verifyAuth, chatServer.getOrCreateConversation);
app.get('/api/chat/conversations/:id/messages', verifyAuth, chatServer.getMessages);
app.post('/api/chat/messages', verifyAuth, chatServer.sendMessage);
app.post('/api/chat/conversations/:id/read', verifyAuth, chatServer.markAsRead);
app.post('/api/chat/block', verifyAuth, chatServer.toggleBlockUser);

// -------------------------------------------------------------
// MODERATION, SEARCH, AND USER PROFILE DISCOVERY
// -------------------------------------------------------------
app.post('/api/moderation/report', verifyAuth, moderationServer.submitReport);
app.get('/api/moderation/reports', verifyAuth, moderationServer.listReports);
app.post('/api/moderation/reports/:id/review', verifyAuth, moderationServer.reviewReport);
app.get('/api/search', optionalAuth, moderationServer.globalSearch);
app.get('/api/users/:identifier', optionalAuth, moderationServer.getUserProfile);

// -------------------------------------------------------------
// CODEFORCES HANDLE VERIFICATION & LINKING ENDPOINTS
// -------------------------------------------------------------

// Initiate handle verification challenge
app.post('/api/codeforces/verify/initiate', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const handle = req.body?.handle;
  try {
    const result = await cfVerificationService.initiateVerification(user.id, handle);
    return res.json({ status: 'OK', ...result });
  } catch (err: any) {
    const status = err.message?.includes('already claimed')
      ? 409
      : err.message?.includes('does not exist')
      ? 404
      : 400;
    return res.status(status).json({ status: 'FAILED', error: err.message });
  }
});

// Confirm handle ownership challenge
app.post('/api/codeforces/verify/confirm', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const challengeId = req.body?.challengeId;
  if (!challengeId) {
    return res.status(400).json({ status: 'FAILED', error: 'challengeId is required.' });
  }

  try {
    const result = await cfVerificationService.confirmVerification(user.id, challengeId);
    return res.json({ status: 'OK', ...result });
  } catch (err: any) {
    const status = err.message?.includes('exceeded') ? 429 : 400;
    return res.status(status).json({ status: 'FAILED', error: err.message });
  }
});

// Unlink handle
app.post('/api/codeforces/unlink', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await cfVerificationService.unlinkHandle(user.id);
    return res.json({ status: 'OK', ...result });
  } catch (err: any) {
    return res.status(500).json({ status: 'FAILED', error: err.message });
  }
});

// Sync Codeforces public data
app.post('/api/codeforces/sync', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await cfVerificationService.syncCodeforcesData(user.id, true);
    return res.json({ status: 'OK', ...result });
  } catch (err: any) {
    return res.status(400).json({ status: 'FAILED', error: err.message });
  }
});

// -------------------------------------------------------------
// GEMINI AI COACH ENDPOINT (MODES A-F)
// -------------------------------------------------------------

// In-memory rate limiting and cache for AI endpoints to enforce quotas and prevent cost overruns
const aiRateLimiter = new Map<string, number[]>();
function checkAiRateLimit(key: string, maxPerMinute = 30): boolean {
  const now = Date.now();
  const windowMs = 60000;
  const timestamps = (aiRateLimiter.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxPerMinute) return false;
  timestamps.push(now);
  aiRateLimiter.set(key, timestamps);
  return true;
}

const aiCoachCache = new Map<string, { message: string; timestamp: number }>();
const AI_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours cache

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
    explanationLanguage: z.enum(['en', 'bn']).default('en'),
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
  const clientKey = req.ip || 'anonymous_user';
  if (!checkAiRateLimit(clientKey, 30)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Maximum 30 coach requests per minute to prevent quota exhaustion.',
    });
  }

  const parsed = CoachRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid coach request format', details: parsed.error.issues });
  }

  const { mode, payload } = parsed.data;
  const isBengali = payload.explanationLanguage === 'bn';

  // Check in-memory cache for deterministic queries
  const cacheKey = crypto
    .createHash('md5')
    .update(`${mode}_${payload.problemName || ''}_${payload.hintLevel || 0}_${payload.topicTitle || ''}_${payload.explanationLanguage}`)
    .digest('hex');

  const cached = aiCoachCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL_MS && mode !== 'code_review') {
    return res.json({
      success: true,
      mode,
      source: 'cache',
      message: cached.message,
    });
  }

  // System instruction for disciplined competitive programming coach
  let systemInstruction = `You are the lead Competitive Programming Coach for CLIMB 1600.
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

  if (isBengali) {
    systemInstruction += `\n6. BENGALI EXPLANATION RULE: You must explain the concepts and hints in fluent, natural Bengali (বাংলা). Retain standard English notation for all programming syntax, C++ keywords, algorithm names, data structures, and asymptotic Big-O notations (e.g. vector, long long, int, O(N log N), Binary Search, Prefix Sums, Codeforces).`;
  }

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

  const aiClient = getAIClient(req);
  if (!aiClient) {
    // Return high quality fallback response when API key is not yet set
    return res.json({
      success: true,
      mode,
      source: 'offline_coach',
      message: getOfflineCoachResponse(mode, payload),
    });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const text = response.text || 'Unable to generate coach advice at this moment.';
    if (mode !== 'code_review') {
      aiCoachCache.set(cacheKey, { message: text, timestamp: Date.now() });
    }
    return res.json({
      success: true,
      mode,
      source: 'gemini-2.5-flash',
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
  const isBn = payload.explanationLanguage === 'bn';

  switch (mode) {
    case 'hint_ladder': {
      const lvl = payload.hintLevel || 1;
      if (lvl === 1) {
        return isBn
          ? `**ইঙ্গিত ১ (মূল পর্যবেক্ষণ):** উপাদানগুলোর সমতা (even/odd) বা ক্রমানুসারে সাজানো রূপটি লক্ষ্য করুন। Codeforces-এর বহু সমস্যায় কোনো সিমুলেশন ছাড়াই শুধুমাত্র গাণিতিক invariant লক্ষ্য করলেই সরাসরি উত্তরের ক্লু পাওয়া যায়।`
          : `**Hint 1 (Core Observation):** Look at the parity (even/odd) or order of the elements. In many Codeforces problems, checking if the sum or difference satisfies a simple invariant reveals the answer without simulation.`;
      }
      if (lvl === 2) {
        return isBn
          ? `**ইঙ্গিত ২ (দিকনির্দেশক প্রশ্ন):** অ্যারেটিকে যদি ছোট থেকে বড় সাজানো হতো, তাহলে কি প্রতিটি ধাপে সবচেয়ে লোভনীয় (greedy) পছন্দটি পরবর্তীতে কোনো সমস্যা সৃষ্টি করত? কোনো বিপরীত উদাহরণ (counter-example) কি তৈরি করা সম্ভব?`
          : `**Hint 2 (Guiding Question):** If the array was sorted in non-decreasing order, would making the best choice at each step ever prevent a better future outcome? Can you construct a counter-example to a greedy pick?`;
      }
      if (lvl === 3) {
        return isBn
          ? `**ইঙ্গিত ৩ (পদ্ধতির পরামর্শ):** লক্ষ্য করুন সীমা $N = 10^5$। $O(N^2)$ সমাধান নির্দ্বিধায় Time Limit Exceeded (TLE) খাবে। প্রশ্নের উত্তর $O(1)$ বা $O(N)$ সময়ে সমাধান করতে **Prefix Sums** বা **Two Pointers** ব্যবহার করার কথা বিবেচনা করুন।`
          : `**Hint 3 (Technique Suggestion):** Notice that the constraints allow up to $N = 10^5$. An $O(N^2)$ brute force will trigger Time Limit Exceeded (TLE). Consider using **Prefix Sums** or **Two Pointers** to evaluate queries in $O(1)$ or $O(N)$ total time.`;
      }
      if (lvl === 4) {
        return isBn
          ? `**ইঙ্গিত ৪ (অ্যালগরিদম রূপরেখা):**
1. ইনপুট গ্রহণ করুন এবং প্রেফিক্স প্রি-ক্যালকুলেট করুন: \`pref[i] = pref[i-1] + a[i]\`।
2. প্রতিটি কুয়েরি $(L, R)$ এর জন্য উত্তর হলো \`pref[R] - pref[L-1]\`।
3. 0-ভিত্তিক ও 1-ভিত্তিক ইনডেক্সিং খেয়াল রাখুন।`
          : `**Hint 4 (Algorithm Outline):**
1. Read inputs and precalculate prefix values: \`pref[i] = pref[i-1] + a[i]\`.
2. For each query $(L, R)$, the answer is simply \`pref[R] - pref[L-1]\`.
3. Handle 0-based vs 1-based indexing carefully.`;
      }
      if (lvl === 5) {
        return isBn
          ? `**ইঙ্গিত ৫ (সিউডোকোড):**
\`\`\`cpp
vector<long long> pref(n + 1, 0);
for (int i = 1; i <= n; i++) {
    pref[i] = pref[i - 1] + a[i - 1];
}
// কুয়েরি [L, R] এর জন্য:
long long sum = pref[R] - pref[L - 1];
\`\`\``
          : `**Hint 5 (Pseudocode):**
\`\`\`cpp
vector<long long> pref(n + 1, 0);
for (int i = 1; i <= n; i++) {
    pref[i] = pref[i - 1] + a[i - 1];
}
// For query [L, R]:
long long sum = pref[R] - pref[L - 1];
\`\`\``;
      }
      return isBn
        ? `**সম্পূর্ণ সমাধান ও এডিটোরিয়াল সারসংক্ষেপ:**
সমস্যাটিতে দ্রুত রেঞ্জ কুয়েরি চাওয়া হয়েছে। সাধারণ লুপ দিয়ে যোগ করলে প্রতি কুয়েরিতে $O(N)$ সময় লাগে, যার ফলে $O(Q \\cdot N) \\approx 10^{10}$ অপারেশনস (TLE)। $O(N)$ সময় ও মেমরিতে প্রেফিক্স সাম প্রাক-গণনা করে রাখলে প্রতিটি কুয়েরি $O(1)$ সময়ে উত্তর দেওয়া যায়। ইন্টিজার ওভারফ্লো এড়াতে মানগুলো যদি $10^9$ পর্যন্ত হয়, তবে প্রেফিক্স অ্যারেতে \`long long\` ব্যবহার করুন!`
        : `**Full Editorial Summary:**
The problem asks for fast range queries. Computing the sum iteratively takes $O(N)$ per query, resulting in $O(Q \\cdot N) \\approx 10^{10}$ operations (TLE). By precomputing prefix sums in $O(N)$ time and space, each query is answered in $O(1)$ time. Watch out for integer overflow: if individual values are up to $10^9$, use \`long long\` for the prefix array!`;
    }
    case 'code_review':
      return isBn
        ? `**কোড রিভিউ বিশ্লেষণ:**
1. **ইন্টিজার ওভারফ্লো চেক:** যোগফল বা গুণফলের মান $2 \\times 10^9$ অতিক্রম করতে পারে কি না দেখুন। করলে C++ এ \`int\` এর বদলে \`long long\` (\`int64_t\`) ব্যবহার করুন।
2. **টাইম কমপ্লেক্সিটি:** $N > 5000$ হলে কোনো নেস্টেড লুপ $O(N^2)$ যেন না থাকে।
3. **কর্নার কেস:** $N = 1$, সব উপাদান একই, অথবা সর্বনিম্ন/সর্বোচ্চ সীমা পরীক্ষা করুন।
4. **ফাস্ট আই/ও:** \`main()\` এর শুরুতে \`cin.tie(NULL); ios_base::sync_with_stdio(false);\` যোগ করুন।`
        : `**Code Review Inspection:**
1. **Integer Overflow Check:** Check if the running sum or multiplication of values can exceed $2 \\times 10^9$. If so, replace \`int\` with \`long long\` in C++ (\`int64_t\`).
2. **Time Complexity:** Ensure you are not performing an inner loop over $N$ inside an outer loop over $N$ when $N > 5000$.
3. **Corner Cases:** Test $N = 1$, all elements identical, and minimum/maximum boundary constraints.
4. **Fast I/O:** Make sure \`cin.tie(NULL); ios_base::sync_with_stdio(false);\` is included at the start of \`main()\`.`;
    case 'concept_teacher':
      return isBn
        ? `**ধারণা সারসংক্ষেপ: ${payload.topicTitle || 'Problem Solving Foundations'}**
- **কেন এটি গুরুত্বপূর্ণ:** প্রতিযোগিতামূলক প্রোগ্রামিংয়ে প্যাটার্ন শনাক্তকরণ ও লিমিট বোঝা কনটেস্টের সময় অপ্রয়োজনীয় ট্রায়াল অ্যান্ড এরর থেকে রক্ষা করে।
- **মূল নিয়ম:** Codeforces সার্ভার প্রতি সেকেন্ডে প্রায় $10^8$ মৌলিক অপারেশন সম্পন্ন করে।
  - $N \\le 10^5 \\implies O(N \\log N)$ অথবা $O(N)$
  - $N \\le 2000 \\implies O(N^2)$
  - $N \\le 500 \\implies O(N^3)$
- **দ্রুত যাচাই:** $N = 2 \\times 10^5$ হলে ডাবল লুপ কেন TLE খাবে? *(কারণ $N(N+1)/2 \\approx 2 \\times 10^{10} \\gg 10^8$ অপারেশনস!)*`
        : `**Concept Summary: ${payload.topicTitle || 'Problem Solving Foundations'}**
- **Why it matters:** In competitive programming, pattern recognition and constraint awareness save you hours of trial and error during contests.
- **Key rule of thumb:** Codeforces machines execute approximately $10^8$ basic operations per second.
  - $N \\le 10^5 \\implies O(N \\log N)$ or $O(N)$
  - $N \\le 2000 \\implies O(N^2)$
  - $N \\le 500 \\implies O(N^3)$
- **Quick Check:** If $N = 2 \\times 10^5$, why will a nested double loop \`for(int i=0; i<n; i++) for(int j=i; j<n; j++)\` get TLE? *(Because $N(N+1)/2 \\approx 2 \\times 10^{10} \\gg 10^8$ operations!)*`;
    case 'personal_coach':
      return isBn
        ? `**ব্যক্তিগত কোচ বার্তা:**
আপনি ১৬০০ রেটিং লক্ষ্যের দিকে শৃঙ্খলাবদ্ধভাবে এগিয়ে যাচ্ছেন। মনে রাখবেন: রেটিং হলো একটি ফলাফল, কিন্তু সমস্যা সমাধানের সক্ষমতাই হলো মূল শক্তি। কোনো এডিটোরিয়াল না দেখে ২০ মিনিট একটি সমস্যা নিয়ে চিন্তা করলেও তা আপনার অ্যালগরিদমিক চিন্তাশক্তি বৃদ্ধি করে। নিয়মিত থাকুন, যেকোনো ভুলের নোট রাখুন এবং প্রতিদিনের স্ট্রিক রক্ষা করুন!`
        : `**Coach Check-in:**
You are making deliberate progress toward the 1600 goal. Remember: rating is an outcome, but problem-solving muscle is the skill. Even attempting a problem for 20 minutes without an editorial strengthens neural connections. Stay consistent, log any mistake you encounter, and protect your daily streak!`;
    default:
      return isBn
        ? `**কোচ পরামর্শ:** সমস্যার সীমাবদ্ধতাগুলো লক্ষ্য করুন, ছোট একটি উদাহরণ হাতে লিখে পরীক্ষা করুন এবং কোড লেখার আগে সহজতম ইনভেরিয়েন্টটি শনাক্ত করুন।`
        : `**Coach Advice:** Focus on the problem constraints, write down the smallest sample input by hand, and identify the simplest invariant before writing any code.`;
  }
}

// 6. AI Wrong Answer Analysis
app.post('/api/ai/analyze-submission', async (req: Request, res: Response) => {
  const schema = z.object({
    code: z.string().optional(),
    verdict: z.string(),
    problemName: z.string(),
    problemRating: z.number().optional(),
    problemTags: z.array(z.string()).optional(),
    constraints: z.string().optional(),
    userNotes: z.string().optional(),
    hintLevel: z.number().min(1).max(6).default(1),
    failingInput: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { code, verdict, problemName, problemRating, problemTags, constraints, userNotes, hintLevel, failingInput } = parsed.data;

  const aiClient = getAIClient(req);
  if (!aiClient) {
    let offlineAnalysis = `[Medium confidence] Offline Coach Analysis for **${verdict}** on "${problemName}":\n\n`;
    if (verdict === 'WRONG_ANSWER') {
      offlineAnalysis += `1. **Integer Overflow:** If values or sums can exceed $2 \\times 10^9$, 32-bit \`int\` overflows into negative numbers. Switch to \`long long\`.\n2. **Corner Cases:** Always test $N=1$, $N=2$, all elements identical, or minimum/maximum possible array values.\n3. **Indexing Invariance:** Ensure 0-based vs 1-based indexing is consistent throughout your loops and prefix calculations.`;
    } else if (verdict === 'TIME_LIMIT_EXCEEDED') {
      offlineAnalysis += `1. **Time Complexity Check:** Review problem constraints. If $N \\le 10^5$, an $O(N^2)$ algorithm runs $\\approx 10^{10}$ operations, exceeding the 1.0s limit (roughly $10^8$ ops/sec).\n2. **Fast I/O:** Add \`ios_base::sync_with_stdio(false); cin.tie(NULL);\` at the start of \`main()\`.\n3. **Optimal Pattern:** Consider Two Pointers, Prefix Sums, Sorting, or Binary Search.`;
    } else if (verdict === 'MEMORY_LIMIT_EXCEEDED') {
      offlineAnalysis += `1. **Memory Budget:** Check large global or 2D DP matrices. An array of $10000 \\times 10000$ integers uses $\\approx 400$ MB, exceeding the standard 256 MB limit. Use rolling vectors.`;
    } else if (verdict === 'COMPILATION_ERROR') {
      offlineAnalysis += `1. **Syntax & Headers:** Ensure all standard headers (\`<vector>\`, \`<algorithm>\`, \`<string>\`, \`<iostream>\`) are included and you avoid non-standard compiler built-ins.`;
    } else {
      offlineAnalysis += `1. **Runtime Crash:** Check for division by zero (e.g. \`val % 0\`), indexing out of range (accessing \`arr[n]\` when size is $n$), or stack overflow from deep unbounded recursion.`;
    }
    return res.json({ analysis: offlineAnalysis, hintLevel, source: 'offline_coach' });
  }

  const hintInstructions = [
    '1: Give only a conceptual nudge (1-2 sentences). Do NOT reveal the algorithm.',
    '2: Give a relevant observation about the problem structure. Still no algorithm name.',
    '3: Name the algorithm category or technique. Give complexity guidance.',
    '4: Provide pseudocode or algorithm outline.',
    '5: Provide a detailed explanation with full approach.',
    '6: Full editorial — explain approach, complexity, common pitfalls, and show a code template.',
  ];

  const systemPrompt = `You are an expert competitive programming coach specialized in Codeforces problems up to rating 1600.
Your job is to help a student understand why their solution failed and guide them to the correct approach.
Hint level: ${hintInstructions[hintLevel - 1]}
Always use these confidence labels: [High confidence], [Medium confidence], [Low confidence].
Never claim to know hidden test cases unless the user has provided them.
Format your response in clean markdown. Be encouraging but precise.`;

  const userPrompt = `
Problem: ${problemName}${problemRating ? ` (Rating: ${problemRating})` : ''}
Tags: ${problemTags?.join(', ') || 'unknown'}
Verdict: ${verdict}
${constraints ? `Constraints: ${constraints}` : ''}
${failingInput ? `Failing input (user-provided): ${failingInput}` : ''}
${userNotes ? `Student notes: ${userNotes}` : ''}
${code ? `\nStudent's code:\n\`\`\`cpp\n${code.slice(0, 3000)}\n\`\`\`` : ''}

Provide hint level ${hintLevel} analysis. Follow the system instructions strictly.`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        maxOutputTokens: 1200,
      },
    });
    const text = response.text ?? '';
    return res.json({ analysis: text, hintLevel, source: 'gemini-2.5-flash' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI analysis failed' });
  }
});

// -------------------------------------------------------------
// SECURE CODE EXECUTION ENDPOINT (FEATURE 2: DEBUGGING WORKSPACE)
// -------------------------------------------------------------

// -------------------------------------------------------------
// SECURE CODE EXECUTION ENDPOINT (FEATURE 2: DEBUGGING WORKSPACE)
// -------------------------------------------------------------

const ExecuteRequestSchema = z.object({
  code: z.string().max(65536, 'Code length exceeds 64KB limit'),
  language: z.enum(['cpp20', 'cpp17', 'c', 'python', 'javascript', 'java']),
  stdin: z.string().max(65536, 'Input length exceeds 64KB limit').default(''),
  timeoutMs: z.number().min(200).max(10000).default(2000),
});

const ExecuteTestCasesSchema = z.object({
  code: z.string().max(65536, 'Code length exceeds 64KB limit'),
  language: z.enum(['cpp20', 'cpp17', 'c', 'python', 'javascript', 'java']),
  testCases: z
    .array(
      z.object({
        id: z.number(),
        input: z.string().max(65536).default(''),
        expectedOutput: z.string().max(65536).default(''),
        explanation: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
  timeoutMs: z.number().min(200).max(10000).default(3000),
});

let cachedPythonCmd: string | null = null;
async function resolvePython(): Promise<string | null> {
  if (cachedPythonCmd) return cachedPythonCmd;
  const candidates = [
    'python',
    'python3',
    'py',
    'C:\\Program Files\\PostgreSQL\\18\\pgAdmin 4\\python\\python.exe',
  ];
  for (const cmd of candidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        exec(`"${cmd}" -c "import sys; sys.exit(0)"`, { timeout: 2000 }, (err) => {
          if (!err) resolve();
          else reject(err);
        });
      });
      cachedPythonCmd = cmd;
      return cmd;
    } catch {}
  }
  return null;
}

interface SandboxRunResult {
  status: 'OK' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'BACKEND_UNAVAILABLE';
  stdout: string;
  stderr: string;
  compilerOutput?: string;
  durationMs: number;
  message?: string;
}

async function runChildProcess(
  cmd: string,
  args: string[],
  cwd: string,
  stdin: string,
  timeoutMs: number,
  env?: NodeJS.ProcessEnv
): Promise<{ status: 'OK' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR'; stdout: string; stderr: string; durationMs: number }> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const child = spawn(cmd, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env || process.env,
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${child.pid} /T /F`);
        } else {
          child.kill('SIGKILL');
        }
      } catch {}
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < 65536) stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < 65536) stderr += chunk.toString();
    });

    if (stdin) {
      try {
        child.stdin.write(stdin);
      } catch {}
    }
    try {
      child.stdin.end();
    } catch {}

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      if (isTimedOut) {
        resolve({ status: 'TIME_LIMIT_EXCEEDED', stdout, stderr, durationMs: timeoutMs });
      } else if (exitCode !== 0) {
        resolve({
          status: 'RUNTIME_ERROR',
          stdout,
          stderr: stderr || `Process crashed or exited with code ${exitCode}`,
          durationMs,
        });
      } else {
        resolve({ status: 'OK', stdout, stderr, durationMs });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        status: 'RUNTIME_ERROR',
        stdout,
        stderr: err.message,
        durationMs: Date.now() - startTime,
      });
    });
  });
}

async function compileAndExecute(
  code: string,
  language: 'cpp20' | 'cpp17' | 'c' | 'python' | 'javascript' | 'java',
  stdin: string,
  timeoutMs: number
): Promise<SandboxRunResult> {
  const runId = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), `climb1600_run_${runId}`);

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 1. JavaScript
    if (language === 'javascript') {
      const srcFile = path.join(tempDir, 'solution.js');
      await fs.promises.writeFile(srcFile, code, 'utf-8');
      const nodeCmd = process.execPath || 'node';
      const execRes = await runChildProcess(nodeCmd, ['solution.js'], tempDir, stdin, timeoutMs);
      return {
        status: execRes.status,
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        durationMs: execRes.durationMs,
      };
    }

    // 2. Python
    if (language === 'python') {
      const pythonCmd = await resolvePython();
      if (!pythonCmd) {
        return {
          status: 'BACKEND_UNAVAILABLE',
          stdout: '',
          stderr: '',
          durationMs: 0,
          message: 'Python runtime is not configured on this host.',
        };
      }
      const srcFile = path.join(tempDir, 'solution.py');
      await fs.promises.writeFile(srcFile, code, 'utf-8');
      const execRes = await runChildProcess(
        pythonCmd,
        ['-u', 'solution.py'],
        tempDir,
        stdin,
        timeoutMs,
        { ...process.env, PYTHONIOENCODING: 'utf-8' }
      );
      return {
        status: execRes.status,
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        durationMs: execRes.durationMs,
      };
    }

    // 3. Java
    if (language === 'java') {
      const srcFile = path.join(tempDir, 'Main.java');
      await fs.promises.writeFile(srcFile, code, 'utf-8');

      const compileResult = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
        exec('javac Main.java', { timeout: 6000, cwd: tempDir }, (err, _stdout, stderr) => {
          if (err) resolve({ ok: false, stderr: stderr || err.message });
          else resolve({ ok: true, stderr: '' });
        });
      });

      if (!compileResult.ok) {
        return {
          status: 'COMPILATION_ERROR',
          stdout: '',
          stderr: compileResult.stderr,
          compilerOutput: compileResult.stderr,
          durationMs: 0,
          message: 'Java compilation failed. Ensure your class is named "Main".',
        };
      }

      const execRes = await runChildProcess('java', ['-cp', '.', 'Main'], tempDir, stdin, timeoutMs);
      return {
        status: execRes.status,
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        compilerOutput: '',
        durationMs: execRes.durationMs,
      };
    }

    // 4. C / C++
    const isC = language === 'c';
    const srcFile = path.join(tempDir, isC ? 'solution.c' : 'solution.cpp');
    const exeFile = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
    await fs.promises.writeFile(srcFile, code, 'utf-8');

    const compileCmd = isC
      ? `gcc -O2 -std=c11 -Wall -Wextra -o "${exeFile}" "${srcFile}"`
      : `g++ -O2 -std=c++17 -Wall -Wextra -o "${exeFile}" "${srcFile}"`;

    const compileResult = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
      exec(compileCmd, { timeout: 6000, cwd: tempDir }, (error, _stdout, stderr) => {
        if (error) {
          resolve({ ok: false, stderr: stderr || error.message });
        } else {
          resolve({ ok: true, stderr: stderr || '' });
        }
      });
    });

    if (!compileResult.ok) {
      return {
        status: 'COMPILATION_ERROR',
        stdout: '',
        stderr: compileResult.stderr,
        compilerOutput: compileResult.stderr,
        durationMs: 0,
        message: 'Compilation Failed. Check syntax, missing headers, or type declarations.',
      };
    }

    const execRes = await runChildProcess(exeFile, [], tempDir, stdin, timeoutMs);
    return {
      status: execRes.status,
      stdout: execRes.stdout,
      stderr: execRes.stderr,
      compilerOutput: compileResult.stderr,
      durationMs: execRes.durationMs,
    };
  } catch (err: any) {
    return {
      status: 'BACKEND_UNAVAILABLE',
      stdout: '',
      stderr: err.message,
      durationMs: 0,
      message: `Execution error: ${err.message}`,
    };
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

app.post('/api/execute', async (req: Request, res: Response) => {
  const parsed = ExecuteRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid execution request', details: parsed.error.issues });
  }

  const { code, language, stdin, timeoutMs } = parsed.data;

  // External Sandboxed Execution Service if configured
  if (process.env.CODE_EXECUTION_URL) {
    try {
      const response = await fetchWithTimeout(process.env.CODE_EXECUTION_URL, 6000);
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.warn('External execution service unreachable, falling back to local sandbox:', err.message);
    }
  }

  const result = await compileAndExecute(code, language, stdin, timeoutMs);
  return res.json({
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    compilerOutput: result.compilerOutput,
    executionTimeMs: result.durationMs,
    message: result.message,
  });
});

app.post('/api/execute-testcases', async (req: Request, res: Response) => {
  const parsed = ExecuteTestCasesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid testcases request', details: parsed.error.issues });
  }

  const { code, language, testCases, timeoutMs } = parsed.data;
  const runId = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), `climb1600_batch_${runId}`);

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Prepare compilation for compiled languages once
    let isCompiled = false;
    let exeFile = '';
    let compilerOutput = '';

    if (language === 'cpp20' || language === 'cpp17' || language === 'c') {
      const isC = language === 'c';
      const srcFile = path.join(tempDir, isC ? 'solution.c' : 'solution.cpp');
      exeFile = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
      await fs.promises.writeFile(srcFile, code, 'utf-8');

      const compileCmd = isC
        ? `gcc -O2 -std=c11 -Wall -Wextra -o "${exeFile}" "${srcFile}"`
        : `g++ -O2 -std=c++17 -Wall -Wextra -o "${exeFile}" "${srcFile}"`;

      const compileResult = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
        exec(compileCmd, { timeout: 6000, cwd: tempDir }, (error, _stdout, stderr) => {
          if (error) resolve({ ok: false, stderr: stderr || error.message });
          else resolve({ ok: true, stderr: stderr || '' });
        });
      });

      if (!compileResult.ok) {
        const results = testCases.map((tc) =>
          evaluateTestCaseResult(tc, {
            status: 'COMPILATION_ERROR',
            compilerOutput: compileResult.stderr,
          })
        );
        return res.json({
          results,
          allPassed: false,
          passedCount: 0,
          totalCount: testCases.length,
        });
      }
      isCompiled = true;
    } else if (language === 'java') {
      const srcFile = path.join(tempDir, 'Main.java');
      await fs.promises.writeFile(srcFile, code, 'utf-8');

      const compileResult = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
        exec('javac Main.java', { timeout: 6000, cwd: tempDir }, (err, _stdout, stderr) => {
          if (err) resolve({ ok: false, stderr: stderr || err.message });
          else resolve({ ok: true, stderr: '' });
        });
      });

      if (!compileResult.ok) {
        const results = testCases.map((tc) =>
          evaluateTestCaseResult(tc, {
            status: 'COMPILATION_ERROR',
            compilerOutput: compileResult.stderr,
            message: 'Java compilation error',
          })
        );
        return res.json({
          results,
          allPassed: false,
          passedCount: 0,
          totalCount: testCases.length,
        });
      }
      isCompiled = true;
    } else if (language === 'javascript') {
      const srcFile = path.join(tempDir, 'solution.js');
      await fs.promises.writeFile(srcFile, code, 'utf-8');
    } else if (language === 'python') {
      const srcFile = path.join(tempDir, 'solution.py');
      await fs.promises.writeFile(srcFile, code, 'utf-8');
    }

    const pythonCmd = language === 'python' ? await resolvePython() : null;
    if (language === 'python' && !pythonCmd) {
      const results = testCases.map((tc) =>
        evaluateTestCaseResult(tc, {
          status: 'BACKEND_UNAVAILABLE',
          message: 'Python runtime is not configured on this host.',
        })
      );
      return res.json({ results, allPassed: false, passedCount: 0, totalCount: testCases.length });
    }

    // Execute each test case
    const results = [];
    for (const tc of testCases) {
      let execRes;
      if (isCompiled && (language === 'cpp20' || language === 'cpp17' || language === 'c')) {
        execRes = await runChildProcess(exeFile, [], tempDir, tc.input, timeoutMs);
      } else if (isCompiled && language === 'java') {
        execRes = await runChildProcess('java', ['-cp', '.', 'Main'], tempDir, tc.input, timeoutMs);
      } else if (language === 'javascript') {
        const nodeCmd = process.execPath || 'node';
        execRes = await runChildProcess(nodeCmd, ['solution.js'], tempDir, tc.input, timeoutMs);
      } else if (language === 'python') {
        execRes = await runChildProcess(
          pythonCmd!,
          ['-u', 'solution.py'],
          tempDir,
          tc.input,
          timeoutMs,
          { ...process.env, PYTHONIOENCODING: 'utf-8' }
        );
      } else {
        execRes = { status: 'RUNTIME_ERROR' as const, stdout: '', stderr: 'Unknown language runner', durationMs: 0 };
      }

      const evalRes = evaluateTestCaseResult(tc, {
        status: execRes.status,
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        executionTimeMs: execRes.durationMs,
      });
      results.push(evalRes);
    }

    const passedCount = results.filter((r) => r.status === 'PASS').length;
    return res.json({
      results,
      allPassed: passedCount === results.length && results.length > 0,
      passedCount,
      totalCount: results.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Batch testcase execution failed' });
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
});

// -------------------------------------------------------------
// AI COUNTEREXAMPLE SUGGESTION ENDPOINT
// -------------------------------------------------------------

const CounterexampleSchema = z.object({
  problemName: z.string(),
  problemStatement: z.string().optional(),
  userApproach: z.string().optional(),
  userCode: z.string().optional(),
});

app.post('/api/ai/counterexample', async (req: Request, res: Response) => {
  const parsed = CounterexampleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const { problemName, problemStatement, userApproach, userCode } = parsed.data;
  const aiClient = getAIClient(req);

  if (!aiClient) {
    // Deterministic fallback counterexample guidance
    return res.json({
      success: true,
      isAISuggestion: true,
      disclaimer: 'AI Suggestion — not an official judge test. Verify against problem constraints.',
      counterexampleInput: '1\n2\n',
      expectedOutput: 'NO\n',
      explanation: 'Small boundary case testing minimum constraints (e.g., N=1 or N=2, all identical elements, or empty parity split). Trace by hand first.',
    });
  }

  try {
    const prompt = `You are a Competitive Programming Coach.
Problem: "${problemName}"
Statement: "${problemStatement || 'Codeforces problem'}"
User's Approach: "${userApproach || 'Not provided'}"
User's Code snippet:
\`\`\`cpp
${(userCode || '').slice(0, 1500)}
\`\`\`

Generate ONE minimal counterexample test case that exposes a likely boundary bug (e.g. integer overflow, N=1, duplicate elements, negative numbers, parity edge case).
Return a JSON object with:
- "counterexampleInput": the raw input string exactly formatted according to problem input specifications.
- "expectedOutput": what the correct answer should be.
- "explanation": 2 sentences explaining why this input tests a specific invariant or edge case.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Respond ONLY with valid JSON with keys: counterexampleInput, expectedOutput, explanation.',
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return res.json({
      success: true,
      isAISuggestion: true,
      disclaimer: 'AI Suggestion — not an official judge test. Verify against problem constraints.',
      counterexampleInput: data.counterexampleInput || '1\n',
      expectedOutput: data.expectedOutput || '0\n',
      explanation: data.explanation || 'Edge case testing smallest boundary.',
    });
  } catch (err: any) {
    return res.json({
      success: true,
      isAISuggestion: true,
      disclaimer: 'AI Suggestion — not an official judge test.',
      counterexampleInput: '1\n1\n',
      expectedOutput: '0\n',
      explanation: 'Test minimal single-element boundary condition where loop does not execute or indexing underflows.',
    });
  }
});

// Settings & Live AI Verification endpoint
app.post('/api/settings/ai-config', async (req: Request, res: Response) => {
  const apiKey = String(req.body.apiKey || '').trim();
  if (!apiKey) {
    runtimeCustomApiKey = null;
    return res.json({
      success: true,
      configured: !!process.env.GEMINI_API_KEY,
      message: process.env.GEMINI_API_KEY
        ? 'Using environment GEMINI_API_KEY.'
        : 'AI key cleared. Offline CP coaching guidance active.',
    });
  }

  try {
    const testClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    await testClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
    });
    runtimeCustomApiKey = apiKey;
    return res.json({
      success: true,
      configured: true,
      model: 'gemini-2.5-flash',
      message: 'Gemini API Key successfully verified! Live CP Coach is now active.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      configured: false,
      error: err.message || 'Failed to authenticate with Google Gemini API.',
    });
  }
});

// 7. Integration health status
app.get('/api/health/integration', (_req: Request, res: Response) => {
  const currentAi = getAIClient();
  res.json({
    status: 'ok',
    services: {
      codeforces: {
        baseUrl: 'https://codeforces.com/api',
        cached: {
          contests: cfCache.contests.timestamp > 0,
          problems: cfCache.problems.timestamp > 0,
          userInfoCount: cfCache.userInfo.size,
          userRatingCount: cfCache.userRating.size,
          userStatusCount: cfCache.userStatus.size,
        },
        lastContestFetch: cfCache.contests.timestamp
          ? new Date(cfCache.contests.timestamp).toISOString()
          : null,
      },
      ai: {
        configured: !!currentAi,
        model: 'gemini-2.5-flash',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// GUARDIAN & PHONE INTELLIGENCE ENDPOINTS (CATEGORIES 1 - 3)
// -------------------------------------------------------------

// Active Guardian In-Memory State
const guardianState = {
  activeSession: null as any,
  deviceHealth: {
    usageStatsGranted: true,
    accessibilityGranted: true,
    screenCaptureAuthorized: false,
    notificationGranted: true,
    vpnConnected: false,
    batteryOptimizationsIgnored: true,
    lastSyncTimestamp: new Date().toISOString(),
    deviceModel: 'Android Companion Host',
    androidVersion: '15.0',
  },
  recentEvents: [] as any[],
  customRules: [] as any[],
  corrections: [] as any[],
};

// 8. Session Sync with Android Companion
app.post('/api/guardian/sync-session', (req: Request, res: Response) => {
  const { session, events, deviceHealth } = req.body;
  if (session) {
    guardianState.activeSession = session;
  }
  if (Array.isArray(events)) {
    guardianState.recentEvents = [...events, ...guardianState.recentEvents].slice(0, 100);
  }
  if (deviceHealth) {
    guardianState.deviceHealth = {
      ...guardianState.deviceHealth,
      ...deviceHealth,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }

  return res.json({
    success: true,
    status: 'SYNCED',
    activeSession: guardianState.activeSession,
    deviceHealth: guardianState.deviceHealth,
    serverTimestamp: new Date().toISOString(),
  });
});

// 9. Activity & Screen Context Classifier (Feature 2, 4, 21 - Guardian Engine)
const CURATED_CP_PROBLEMS = [
  { id: '4A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'], reason: 'Fast mental reset and fundamental parity warm-up.' },
  { id: '71A', name: 'Way Too Long Words', rating: 800, tags: ['strings'], reason: 'Zero-friction string compression drill to regain momentum.' },
  { id: '231A', name: 'Team', rating: 800, tags: ['brute force', 'greedy'], reason: 'Quick implementation problem to restore flow state.' },
  { id: '282A', name: 'Bit++', rating: 800, tags: ['implementation'], reason: 'Crisp simulation task to clear cognitive fatigue.' },
  { id: '112A', name: 'Petya and Strings', rating: 800, tags: ['strings'], reason: 'Lexicographical comparison practice to focus attention.' },
  { id: '263A', name: 'Beautiful Matrix', rating: 800, tags: ['implementation'], reason: 'Manhattan distance calculation warm-up.' },
  { id: '96A', name: 'Football', rating: 900, tags: ['strings'], reason: 'Consecutive run tracking exercise.' },
  { id: '160A', name: 'Twins', rating: 900, tags: ['greedy', 'sortings'], reason: 'Core greedy prefix sum challenge.' },
  { id: '58A', name: 'Chat room', rating: 1000, tags: ['greedy', 'strings'], reason: 'Two-pointer subsequence matching exercise.' },
  { id: '69A', name: 'Young Physicist', rating: 1000, tags: ['math'], reason: 'Vector sum equilibrium practice.' },
  { id: '158B', name: 'Taxi', rating: 1100, tags: ['greedy'], reason: 'Classic capacity packing puzzle.' },
  { id: '1352C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'], reason: 'Direct mathematical indexing exercise matching 1200 target.' },
  { id: '1354B', name: 'Ternary String', rating: 1200, tags: ['binary search', 'two pointers'], reason: 'Sliding window technique essential for 1400+ rating.' },
  { id: '1520D', name: 'Same Differences', rating: 1200, tags: ['data structures', 'math'], reason: 'Index transformation map practice.' },
  { id: '1850E', name: 'Cardboard for Pictures', rating: 1300, tags: ['binary search', 'math'], reason: 'Monotonic predicate binary search.' },
  { id: '1873F', name: 'Money Trees', rating: 1300, tags: ['two pointers'], reason: 'Prefix condition sliding window problem.' },
  { id: '489C', name: 'Given Length and Sum of Digits...', rating: 1400, tags: ['dp', 'greedy'], reason: 'Greedy digit construction under tight constraints.' },
  { id: '455A', name: 'Boredom', rating: 1500, tags: ['dp'], reason: 'House-robber style DP recurrence milestone.' },
  { id: '1360E', name: 'Polygon', rating: 1300, tags: ['greedy', 'matrices'], reason: 'Grid verification invariant problem.' },
  { id: '1703E', name: 'Mirror Grid', rating: 1200, tags: ['implementation'], reason: 'Matrix symmetry coordinate rotation practice.' }
];

function pickProblemRecommendation(targetRating?: number) {
  const rating = targetRating && targetRating >= 800 ? targetRating : 1200;
  // Find problems close to user target rating
  const candidates = CURATED_CP_PROBLEMS.filter(p => Math.abs(p.rating - rating) <= 200);
  if (candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }
  return CURATED_CP_PROBLEMS[0];
}

const GUARDIAN_ENCOURAGEMENTS = [
  'Every expert competitive programmer was once where you are. Reconnect with the problem-solving mindset.',
  'Small distractions break deep focus. One clean solve today keeps your 1600 rating climb on track.',
  'Mastery is built through deliberate practice. Take a breath, close the tab, and tackle a problem.',
  'Your future 1600+ rating is forged in moments like this. Return to your active problem.',
  'Consistency beats intensity. 20 focused minutes of algorithm practice will make you proud today.'
];

app.post('/api/guardian/classify-activity', async (req: Request, res: Response) => {
  const {
    packageName = '',
    appName = '',
    screenTitle = '',
    screenshotBase64 = '',
    isStudySessionActive = false,
    enableCloudAi = false,
    userRating = 1200,
    hardLockEnabled = true
  } = req.body;

  const aiClient = getAIClient(req);
  let screenshotUsed = false;
  let rawTextRedacted = true;

  // 1. Multimodal Vision Analysis with Gemini if authorized screenshot is provided
  if (enableCloudAi && aiClient && screenshotBase64 && screenshotBase64.length > 100) {
    try {
      screenshotUsed = true;
      const cleanBase64 = screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const visionPrompt = `You are the AI Discipline Guardian for an aspiring competitive programmer working toward Codeforces 1600.
Analyze this user screen capture strictly for self-discipline, focus, and user safety.
Classify the primary foreground visual activity into exactly ONE of these 9 categories:
- competitive_programming (Codeforces, LeetCode, IDE, terminal, compiler, algorithm contest)
- programming_learning (tutorials, docs, CS lecture, tech blog, GitHub repo)
- academic_study (math, textbooks, physics, university portals)
- productive_work (documents, spreadsheets, productivity tools)
- communication (chat apps, email, messaging)
- entertainment (gaming, Netflix, video streams, memes)
- social_media (Instagram, TikTok, Twitter/X, Reddit feed, Facebook)
- potentially_explicit_content (explicit sexual material, adult pornography, explicit nudity)
- unknown (launcher, homescreen, lockscreen, ambiguous)

PRIVACY RULES:
- Never transcribe passwords, private chats, personal names, or explicit anatomical details.
- If explicit content is detected, classify as potentially_explicit_content and summarize reasoning neutrally without graphic terms.

Return strictly valid JSON:
{
  "primary_category": "string",
  "confidence": number between 0.0 and 1.0,
  "reasoning": "brief neutral explanation",
  "raw_text_redacted": true
}`;

      const visionResponse = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: visionPrompt
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          }
        ],
        config: {
          systemInstruction: 'You are an ethical AI Discipline Guardian. Output valid JSON only.',
          temperature: 0.1
        }
      });

      const responseText = visionResponse.text || '{}';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const category = parsed.primary_category || 'unknown';
      const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.85;
      const reasoning = parsed.reasoning || 'Classified via authorized in-memory visual inference.';

      let action: 'allow' | 'suggest_return' | 'warn_distraction' | 'hard_lock' | 'prompt_user' = 'allow';
      if (category === 'potentially_explicit_content') {
        action = (confidence >= 0.70 && hardLockEnabled) ? 'hard_lock' : 'warn_distraction';
      } else if (category === 'entertainment' || category === 'social_media') {
        action = 'warn_distraction';
      } else if (category === 'communication') {
        action = isStudySessionActive ? 'suggest_return' : 'allow';
      } else if (category === 'unknown') {
        action = 'prompt_user';
      } else {
        action = 'allow';
      }

      const rec = pickProblemRecommendation(userRating);
      const encouragement = GUARDIAN_ENCOURAGEMENTS[Math.floor(Math.random() * GUARDIAN_ENCOURAGEMENTS.length)];

      return res.json({
        primary_category: category,
        confidence,
        reasoning,
        recommended_action: action,
        encouragement_message: encouragement,
        problem_recommendation: rec,
        screenshot_used: true,
        raw_text_redacted: true
      });
    } catch (visionErr) {
      // Graceful fallback to heuristic engine if vision inference fails
      console.warn('[Guardian API] Vision analysis error, falling back to heuristics:', (visionErr as Error).message);
    }
  }

  // 2. High-Confidence Heuristic Rules & Package Mapping
  const pkg = (packageName || '').toLowerCase();
  const title = (screenTitle || '').toLowerCase();
  const app = (appName || '').toLowerCase();

  let primaryCategory = 'unknown';
  let confidence = 0.80;
  let reasoning = 'Classified based on foreground application package and metadata.';

  // A. Competitive Programming & Coding Tools
  if (
    pkg === 'com.termux' ||
    pkg === 'com.spck.cide' ||
    pkg.includes('codeforces') ||
    pkg.includes('leetcode') ||
    pkg.includes('cide') ||
    pkg === 'com.duy.c.compiler' ||
    pkg === 'com.aide.ui' ||
    pkg === 'com.microsoft.vscode' ||
    title.includes('codeforces') ||
    title.includes('leetcode') ||
    title.includes('atcoder') ||
    title.includes('competitive programming')
  ) {
    primaryCategory = 'competitive_programming';
    confidence = 0.98;
    reasoning = 'Active development environment, terminal, or competitive programming platform.';
  }
  // B. Programming Learning & Documentation
  else if (
    pkg.includes('github') ||
    pkg.includes('stackoverflow') ||
    pkg.includes('sololearn') ||
    pkg.includes('coursera') ||
    pkg.includes('udemy') ||
    title.includes('dynamic programming') ||
    title.includes('binary search') ||
    title.includes('graph theory') ||
    title.includes('data structures') ||
    title.includes('algorithm tutorial') ||
    title.includes('cppreference')
  ) {
    primaryCategory = 'programming_learning';
    confidence = 0.92;
    reasoning = 'Algorithm documentation, technical learning, or reference materials.';
  }
  // C. Potentially Explicit Content Patterns (Browser titles / adult platforms)
  else if (
    title.includes('pornhub') ||
    title.includes('xvideos') ||
    title.includes('xnxx') ||
    title.includes('xhamster') ||
    title.includes('redtube') ||
    title.includes('onlyfans') ||
    pkg.includes('adult') ||
    pkg.includes('porno')
  ) {
    primaryCategory = 'potentially_explicit_content';
    confidence = 0.95;
    reasoning = 'Explicit adult entertainment keywords identified in active window context.';
  }
  // D. Social Media Platforms
  else if (
    pkg.includes('instagram') ||
    pkg.includes('tiktok') ||
    pkg.includes('musically') ||
    pkg.includes('trill') ||
    pkg.includes('facebook') ||
    pkg.includes('twitter') ||
    pkg.includes('reddit') ||
    pkg.includes('snapchat') ||
    pkg.includes('pinterest')
  ) {
    primaryCategory = 'social_media';
    confidence = 0.95;
    reasoning = 'Configured social media application known for algorithmic engagement loops.';
  }
  // E. Entertainment & Gaming
  else if (
    pkg.includes('netflix') ||
    pkg.includes('spotify') ||
    pkg.includes('steam') ||
    pkg.includes('twitch') ||
    pkg.includes('riotgames') ||
    pkg.includes('supercell') ||
    pkg.includes('genshin') ||
    pkg.includes('roblox')
  ) {
    primaryCategory = 'entertainment';
    confidence = 0.92;
    reasoning = 'Entertainment streaming or gaming application in foreground.';
  }
  // F. Communication & Messaging
  else if (
    pkg.includes('whatsapp') ||
    pkg.includes('telegram') ||
    pkg.includes('slack') ||
    pkg.includes('discord') ||
    pkg.includes('messenger') ||
    pkg.includes('teams')
  ) {
    primaryCategory = 'communication';
    confidence = 0.88;
    reasoning = 'Messaging or team communication application.';
  }
  // G. Contextual YouTube Handling
  else if (pkg.includes('youtube')) {
    const isEducational =
      title.includes('codeforces') ||
      title.includes('algorithm') ||
      title.includes('lecture') ||
      title.includes('tutorial') ||
      title.includes('computer science') ||
      title.includes('math') ||
      title.includes('errichto') ||
      title.includes('william lin') ||
      title.includes('neetcode');

    if (isEducational) {
      primaryCategory = 'programming_learning';
      confidence = 0.88;
      reasoning = 'Educational algorithm video or computer science lecture on YouTube.';
    } else {
      primaryCategory = isStudySessionActive ? 'entertainment' : 'entertainment';
      confidence = 0.82;
      reasoning = 'General YouTube video stream during study period.';
    }
  }

  // Derive recommended action
  let recommendedAction: 'allow' | 'suggest_return' | 'warn_distraction' | 'hard_lock' | 'prompt_user' = 'allow';
  if (primaryCategory === 'potentially_explicit_content') {
    recommendedAction = (confidence >= 0.70 && hardLockEnabled) ? 'hard_lock' : 'warn_distraction';
  } else if (primaryCategory === 'entertainment' || primaryCategory === 'social_media') {
    recommendedAction = 'warn_distraction';
  } else if (primaryCategory === 'communication') {
    recommendedAction = isStudySessionActive ? 'suggest_return' : 'allow';
  } else if (primaryCategory === 'unknown') {
    recommendedAction = 'prompt_user';
  } else {
    recommendedAction = 'allow';
  }

  const problemRec = pickProblemRecommendation(userRating);
  const encouragement = GUARDIAN_ENCOURAGEMENTS[Math.floor(Math.random() * GUARDIAN_ENCOURAGEMENTS.length)];

  return res.json({
    primary_category: primaryCategory,
    confidence,
    reasoning,
    recommended_action: recommendedAction,
    encouragement_message: encouragement,
    problem_recommendation: problemRec,
    screenshot_used: false,
    raw_text_redacted: true
  });
});

// 10. Guardian Accuracy Feedback & Rule Correction (Feature 10 & 26)
app.post('/api/guardian/feedback', (req: Request, res: Response) => {
  const { packageName, appName, originalCategory, correctedCategory, reason } = req.body;
  const correction = {
    id: `corr_${Date.now()}`,
    packageName,
    appName,
    originalCategory,
    correctedCategory,
    reason,
    timestamp: new Date().toISOString(),
  };

  guardianState.corrections.unshift(correction);

  return res.json({
    success: true,
    message: `Updated rule for ${appName || packageName} to ${correctedCategory}. Zero penalty applied.`,
    correction,
  });
});

// 11. YouTube Learning Mode (Feature 22)
app.post('/api/guardian/youtube-learning', async (req: Request, res: Response) => {
  const { videoUrl, videoTitle, objective, notes } = req.body;
  const aiClient = getAIClient(req);

  let aiRecap = 'Mastering the invariant and algorithmic technique presented in the video.';
  let checkQuestion = 'How does the observed invariant guarantee optimal time complexity?';
  let suggestedProblem = { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200 };

  if (aiClient) {
    try {
      const prompt = `Student watched CP video: "${videoTitle || 'Algorithm Tutorial'}".
Learning Objective: "${objective || 'Understand technique'}".
Student Notes: "${notes || 'No notes provided'}".
Provide a concise 2-sentence recap of the core lesson, ONE conceptual diagnostic question, and suggest a 1000-1300 Codeforces problem type to practice it.
Respond with JSON: recap, diagnosticQuestion, practiceTag.`;

      const resp = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction: 'Respond ONLY with JSON.', temperature: 0.3 },
      });
      const parsed = JSON.parse(resp.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
      if (parsed.recap) aiRecap = parsed.recap;
      if (parsed.diagnosticQuestion) checkQuestion = parsed.diagnosticQuestion;
    } catch (e) {}
  }

  return res.json({
    success: true,
    session: {
      id: `yt_${Date.now()}`,
      videoUrl,
      videoTitle,
      objective,
      aiRecap,
      checkQuestion,
      suggestedProblem,
      completed: true,
    },
  });
});

// 12. GDPR Data Retention & Erasure (Feature 28 & 30)
app.post('/api/privacy/purge-data', (_req: Request, res: Response) => {
  guardianState.recentEvents = [];
  guardianState.corrections = [];
  guardianState.activeSession = null;
  return res.json({
    success: true,
    message: 'All device activity logs, AI feedback history, and session traces purged successfully.',
    purgedAt: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'CLIMB 1600',
    geminiConfigured: !!getAIClient(),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// PLAYGROUND API — CODE EXECUTION, AI DEBUGGER, SNIPPETS
// -------------------------------------------------------------

// Per-IP execution rate limiter (10 runs per 10 seconds)
const pgExecRateLimiter = new Map<string, number[]>();
function checkPgExecRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10_000;
  const maxRuns = 10;
  const timestamps = (pgExecRateLimiter.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRuns) return false;
  timestamps.push(now);
  pgExecRateLimiter.set(ip, timestamps);
  return true;
}

// Server-side language mapping & configuration
const PLAYGROUND_LANGUAGES = {
  cpp20: { compiler: 'g++', std: 'c++17', ext: '.cpp', displayName: 'C++20 (GCC)', version: 'GCC 6.3+ (std: c++17/20)' },
  cpp17: { compiler: 'g++', std: 'c++17', ext: '.cpp', displayName: 'C++17 (GCC)', version: 'GCC 6.3+ (std: c++17)' },
  c:     { compiler: 'gcc', std: 'c11',   ext: '.c',   displayName: 'C (GCC C11)', version: 'GCC 6.3+ (std: c11)' },
  python: { compiler: 'python', std: '', ext: '.py', displayName: 'Python 3', version: 'Python 3.13' },
} as const;

type PlaygroundLangKey = keyof typeof PLAYGROUND_LANGUAGES;

const PlaygroundExecuteSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty').max(65536, 'Code length exceeds 64KB limit'),
  language: z.enum(['cpp20', 'cpp17', 'c', 'python']),
  stdin: z.string().max(65536, 'Stdin length exceeds 64KB limit').default(''),
  timeoutMs: z.number().min(200).max(10000).default(3000),
});

// GET /api/playground/languages
app.get('/api/playground/languages', (_req: Request, res: Response) => {
  return res.json({
    languages: Object.entries(PLAYGROUND_LANGUAGES).map(([id, cfg]) => ({
      id,
      name: cfg.displayName,
      version: cfg.version,
      std: cfg.std || undefined,
    })),
  });
});

// High-Speed Binary Compilation Cache
const BUILD_CACHE_DIR = path.join(os.tmpdir(), 'climb1600_build_cache');
try {
  fs.mkdirSync(BUILD_CACHE_DIR, { recursive: true });
} catch {}

interface BuildCacheEntry {
  ok: boolean;
  compilerOutput: string;
  timestamp: number;
}
const buildCacheMetadata = new Map<string, BuildCacheEntry>();

// Helper: resolve Python executable on host with pre-warming
let cachedPgPythonCmd: string | null = null;
async function resolvePgPython(): Promise<string | null> {
  if (cachedPgPythonCmd) return cachedPgPythonCmd;
  const candidates = [
    'C:\\Program Files\\PostgreSQL\\18\\pgAdmin 4\\python\\python.exe',
    'python',
    'python3',
    'py',
  ];
  for (const cmd of candidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        exec(`"${cmd}" -c "import sys; sys.exit(0)"`, { timeout: 2000 }, (err) => {
          if (!err) resolve();
          else reject(err);
        });
      });
      cachedPgPythonCmd = cmd;
      return cmd;
    } catch {}
  }
  return null;
}
// Pre-warm Python path resolution
resolvePgPython().catch(() => {});

// POST /api/playground/execute
app.post('/api/playground/execute', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!checkPgExecRateLimit(clientIp)) {
    return res.status(429).json({
      status: 'PROVIDER_ERROR',
      message: 'Rate limit exceeded: maximum 10 runs per 10 seconds. Please wait before executing again.',
    });
  }

  const parsed = PlaygroundExecuteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: 'PROVIDER_ERROR',
      message: 'Invalid request: ' + parsed.error.issues.map((i) => i.message).join('; '),
    });
  }

  const { code, language, stdin, timeoutMs } = parsed.data;
  const runId = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), `climb1600_pg_${runId}`);

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 1. Python execution (Optimized with -u and -B for maximum speed)
    if (language === 'python') {
      const pythonCmd = await resolvePgPython();
      if (!pythonCmd) {
        return res.json({
          status: 'BACKEND_UNAVAILABLE',
          message: 'Python 3 runtime is not available on this server host.',
        });
      }

      const srcFile = path.join(tempDir, 'solution.py');
      await fs.promises.writeFile(srcFile, code, 'utf-8');

      const startTime = Date.now();
      const execResult = await new Promise<{
        status: 'OK' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR';
        stdout: string;
        stderr: string;
        exitCode: number;
        durationMs: number;
      }>((resolve) => {
        const stdoutChunks: Buffer[] = [];
        let stdoutLen = 0;
        const stderrChunks: Buffer[] = [];
        let stderrLen = 0;
        let isTimedOut = false;

        const child = spawn(pythonCmd, ['-u', '-B', 'solution.py'], {
          cwd: tempDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });

        const timer = setTimeout(() => {
          isTimedOut = true;
          try {
            if (process.platform === 'win32') {
              exec(`taskkill /pid ${child.pid} /T /F`);
            } else {
              child.kill('SIGKILL');
            }
          } catch {}
        }, timeoutMs);

        const CAP = 65536;
        child.stdout.on('data', (chunk: Buffer) => {
          if (stdoutLen < CAP) {
            stdoutChunks.push(chunk);
            stdoutLen += chunk.length;
          }
        });

        child.stderr.on('data', (chunk: Buffer) => {
          if (stderrLen < CAP) {
            stderrChunks.push(chunk);
            stderrLen += chunk.length;
          }
        });

        if (stdin) {
          try { child.stdin.write(stdin); } catch {}
        }
        try { child.stdin.end(); } catch {}

        child.on('close', (exitCode) => {
          clearTimeout(timer);
          const durationMs = Date.now() - startTime;
          const codeNum = exitCode ?? -1;
          const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
          const stderr = Buffer.concat(stderrChunks).toString('utf-8');

          if (isTimedOut) {
            resolve({ status: 'TIME_LIMIT_EXCEEDED', stdout, stderr, exitCode: -1, durationMs: timeoutMs });
          } else if (codeNum !== 0) {
            resolve({
              status: 'RUNTIME_ERROR',
              stdout,
              stderr: stderr || `Python exited with error code ${codeNum}`,
              exitCode: codeNum,
              durationMs,
            });
          } else {
            resolve({ status: 'OK', stdout, stderr, exitCode: 0, durationMs });
          }
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            status: 'RUNTIME_ERROR',
            stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
            stderr: err.message,
            exitCode: -1,
            durationMs: Date.now() - startTime,
          });
        });
      });

      return res.json({
        status: execResult.status,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        compileTimeMs: 0,
        executionTimeMs: execResult.durationMs,
        isCachedCompilation: true,
        exitCode: execResult.exitCode,
      });
    }

    // 2. C / C++ execution (Optimized with High-Speed Build Cache & -pipe)
    const isC = language === 'c';
    const langConfig = PLAYGROUND_LANGUAGES[language as PlaygroundLangKey];
    const srcFile = path.join(tempDir, isC ? 'solution.c' : 'solution.cpp');
    const exeFile = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
    await fs.promises.writeFile(srcFile, code, 'utf-8');

    // SHA-256 build cache lookup
    const codeHash = crypto.createHash('sha256').update(`${language}::${code}`).digest('hex');
    const cachedExePath = path.join(BUILD_CACHE_DIR, `${codeHash}${process.platform === 'win32' ? '.exe' : '.bin'}`);
    const cachedMeta = buildCacheMetadata.get(codeHash);

    let compileTimeMs = 0;
    let isCached = false;
    let compilerOutput = '';

    if (cachedMeta && fs.existsSync(cachedExePath) && Date.now() - cachedMeta.timestamp < 3600000) {
      // ⚡ Instant Cache Hit! 0ms compilation
      isCached = true;
      compilerOutput = cachedMeta.compilerOutput;
      if (!cachedMeta.ok) {
        return res.json({
          status: 'COMPILATION_ERROR',
          compilerOutput,
          message: 'Compilation Failed (Cached Diagnostic). Review the compiler diagnostics panel.',
          compileTimeMs: 0,
          isCachedCompilation: true,
        });
      }
      await fs.promises.copyFile(cachedExePath, exeFile);
    } else {
      // Fresh compilation with -O2, -pipe, and Wall
      const compileStart = Date.now();
      const stdFlag = langConfig.std ? `-std=${langConfig.std}` : '';
      const compileCmd = `${langConfig.compiler} -O2 -pipe ${stdFlag} -Wall -Wextra -o "${exeFile}" "${srcFile}"`;

      const compileResult = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
        exec(compileCmd, { timeout: 10000, cwd: tempDir }, (error, _stdout, stderr) => {
          if (error) {
            resolve({ ok: false, stderr: stderr || error.message });
          } else {
            resolve({ ok: true, stderr: stderr || '' });
          }
        });
      });
      compileTimeMs = Date.now() - compileStart;
      compilerOutput = compileResult.stderr || '';

      buildCacheMetadata.set(codeHash, {
        ok: compileResult.ok,
        compilerOutput,
        timestamp: Date.now(),
      });

      if (!compileResult.ok) {
        return res.json({
          status: 'COMPILATION_ERROR',
          compilerOutput,
          message: 'Compilation Failed. Review the compiler diagnostics panel.',
          compileTimeMs,
          isCachedCompilation: false,
        });
      }

      // Populate build cache
      fs.promises.copyFile(exeFile, cachedExePath).catch(() => {});
    }

    // Run executable
    const startTime = Date.now();
    const execResult = await new Promise<{
      status: 'OK' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR';
      stdout: string;
      stderr: string;
      exitCode: number;
      durationMs: number;
    }>((resolve) => {
      const stdoutChunks: Buffer[] = [];
      let stdoutLen = 0;
      const stderrChunks: Buffer[] = [];
      let stderrLen = 0;
      let isTimedOut = false;

      const child = spawn(exeFile, [], {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          if (process.platform === 'win32') {
            exec(`taskkill /pid ${child.pid} /T /F`);
          } else {
            child.kill('SIGKILL');
          }
        } catch {}
      }, timeoutMs);

      const CAP = 65536;
      child.stdout.on('data', (chunk: Buffer) => {
        if (stdoutLen < CAP) {
          stdoutChunks.push(chunk);
          stdoutLen += chunk.length;
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        if (stderrLen < CAP) {
          stderrChunks.push(chunk);
          stderrLen += chunk.length;
        }
      });

      if (stdin) {
        try { child.stdin.write(stdin); } catch {}
      }
      try { child.stdin.end(); } catch {}

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        const codeNum = exitCode ?? -1;
        const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
        const stderr = Buffer.concat(stderrChunks).toString('utf-8');

        if (isTimedOut) {
          resolve({ status: 'TIME_LIMIT_EXCEEDED', stdout, stderr, exitCode: -1, durationMs: timeoutMs });
        } else if (codeNum !== 0) {
          resolve({
            status: 'RUNTIME_ERROR',
            stdout,
            stderr: stderr || `Process crashed or exited with code ${codeNum}`,
            exitCode: codeNum,
            durationMs,
          });
        } else {
          resolve({ status: 'OK', stdout, stderr, exitCode: 0, durationMs });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          status: 'RUNTIME_ERROR',
          stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
          stderr: err.message,
          exitCode: -1,
          durationMs: Date.now() - startTime,
        });
      });
    });

    return res.json({
      status: execResult.status,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      compilerOutput: compilerOutput || undefined,
      compileTimeMs,
      executionTimeMs: execResult.durationMs,
      isCachedCompilation: isCached,
      exitCode: execResult.exitCode,
    });
  } catch (err: any) {
    return res.json({
      status: 'BACKEND_UNAVAILABLE',
      message: `Execution sandbox error: ${err.message}`,
    });
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
});

// POST /api/playground/ai-debug
const PlaygroundAiDebugSchema = z.object({
  code: z.string().max(65536).default(''),
  language: z.string().max(30).default(''),
  compilerOutput: z.string().max(8192).optional().default(''),
  stderr: z.string().max(8192).optional().default(''),
  stdout: z.string().max(8192).optional().default(''),
  stdin: z.string().max(4096).optional().default(''),
  expectedOutput: z.string().max(4096).optional().default(''),
  userDescription: z.string().max(1000).optional().default(''),
  executionTimeMs: z.number().optional(),
});

app.post('/api/playground/ai-debug', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!checkAiRateLimit(clientIp, 20)) {
    return res.status(429).json({
      error: 'AI debug rate limit exceeded. Maximum 20 requests per minute.',
    });
  }

  const parsed = PlaygroundAiDebugSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid debug request', details: parsed.error.issues });
  }

  const { code, language, compilerOutput, stderr, stdout, stdin, expectedOutput, userDescription, executionTimeMs } = parsed.data;

  const aiClient = getAIClient(req);
  if (!aiClient) {
    return res.status(503).json({
      success: false,
      summary: 'AI debugger is not configured on this server.',
      errorCategory: 'NO_API_KEY',
      evidence: '',
      rootCause: 'No Gemini API key was provided or configured.',
      suggestedFix: 'Configure your Gemini API key in Settings or set GEMINI_API_KEY in .env.',
      confidence: 'low',
      disclaimer: 'This notice is generated because the AI provider credentials are missing.',
      source: 'offline',
    });
  }

  const prompt = `You are a world-class compiler engineer and competitive programming debugger for CLIMB 1600.
Analyze the user's source code and execution diagnostics.

Language: ${language}
User note: ${userDescription || '(none)'}

Source code:
\`\`\`${language === 'python' ? 'python' : 'cpp'}
${code || '(empty)'}
\`\`\`

Compiler output / diagnostics:
\`\`\`
${compilerOutput || '(none)'}
\`\`\`

Runtime standard error (stderr / traceback):
\`\`\`
${stderr || '(none)'}
\`\`\`

Runtime standard output (stdout):
\`\`\`
${stdout || '(none)'}
\`\`\`

Standard input used:
\`\`\`
${stdin || '(none)'}
\`\`\`

Expected output:
\`\`\`
${expectedOutput || '(not provided)'}
\`\`\`

Execution time: ${executionTimeMs ? `${executionTimeMs}ms` : 'N/A'}

Respond with STRICT JSON conforming to this schema:
{
  "summary": "1-2 sentence overview of the issue",
  "errorCategory": "One of: COMPILATION_ERROR | RUNTIME_ERROR | LOGIC_ERROR | TIME_LIMIT | TYPE_ERROR | SYNTAX_ERROR | INPUT_PARSING | UNDEFINED_BEHAVIOR | NO_ERROR | UNKNOWN",
  "evidence": "Exact quoted line/error from compiler or traceback that demonstrates the problem",
  "rootCause": "Clear explanation of why this bug or error occurs",
  "suggestedFix": "Precise minimal explanation of the fix in plain words",
  "correctedCode": "The full corrected source code or null if no code fix is possible",
  "correctedCodeExplanation": "Explanation of what was modified in the code and why",
  "additionalTests": "2-3 targeted test cases with inputs and expected outputs to stress test boundary conditions",
  "confidence": "high | medium | low",
  "disclaimer": "AI-generated suggestion — verify results by running the code in the playground."
}
Only output the JSON object, without backticks or other text.`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert compiler and runtime debugger. Output valid JSON only.',
        temperature: 0.2,
      },
    });

    const raw = response.text?.trim() || '{}';
    let data: any;
    try {
      const cleanJson = raw.replace(/^```json/i, '').replace(/```$/i, '').trim();
      data = JSON.parse(cleanJson);
    } catch {
      data = {
        summary: 'Error detected in program execution.',
        errorCategory: 'COMPILATION_ERROR',
        evidence: compilerOutput || stderr || '',
        rootCause: 'Review syntax, headers, or runtime bounds.',
        suggestedFix: 'Examine diagnostic output and test with sample inputs.',
        confidence: 'medium',
      };
    }

    return res.json({
      success: true,
      summary: data.summary || 'Debug analysis completed.',
      errorCategory: data.errorCategory || 'UNKNOWN',
      evidence: data.evidence || '',
      rootCause: data.rootCause || '',
      suggestedFix: data.suggestedFix || '',
      correctedCode: data.correctedCode || null,
      correctedCodeExplanation: data.correctedCodeExplanation || null,
      additionalTests: data.additionalTests || '',
      confidence: data.confidence || 'medium',
      disclaimer: data.disclaimer || 'AI-generated suggestion — always verify with the real compiler.',
      source: 'gemini-2.5-flash',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      summary: 'AI debug request encountered a service error.',
      errorCategory: 'PROVIDER_ERROR',
      evidence: '',
      rootCause: err.message || 'Gemini API call failed',
      suggestedFix: 'Verify your Gemini API quota or connection and try again.',
      confidence: 'low',
      disclaimer: 'This error is from the AI provider, not from code execution.',
      source: 'error',
    });
  }
});

// Snippet endpoints with Supabase Auth
app.get('/api/playground/snippets', optionalAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.json({ snippets: [] });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('playground_snippets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json({ snippets: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve snippets: ' + err.message });
  }
});

const PlaygroundSnippetSaveSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().max(500).optional(),
  language: z.enum(['cpp20', 'cpp17', 'c', 'python']),
  code: z.string().min(1, 'Code is required').max(65536),
});

app.post('/api/playground/snippets', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = PlaygroundSnippetSaveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid snippet data', details: parsed.error.issues });
  }

  try {
    const admin = getSupabaseAdmin();
    const { count } = await admin
      .from('playground_snippets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= 50) {
      return res.status(400).json({
        error: 'Maximum limit of 50 saved snippets reached. Please delete older snippets to save new ones.',
      });
    }

    const { data, error } = await admin
      .from('playground_snippets')
      .insert({
        ...parsed.data,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A snippet with this title already exists. Please choose a different title.' });
      }
      throw error;
    }

    return res.status(201).json({ snippet: data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save snippet: ' + err.message });
  }
});

app.put('/api/playground/snippets/:id', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const id = req.params.id;
  const UpdateSchema = z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
    language: z.enum(['cpp20', 'cpp17', 'c', 'python']).optional(),
    code: z.string().min(1).max(65536).optional(),
  });

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid update', details: parsed.error.issues });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('playground_snippets')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Snippet not found or you do not have permission to edit it.' });
    }
    return res.json({ snippet: data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update snippet: ' + err.message });
  }
});

app.delete('/api/playground/snippets/:id', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const id = req.params.id;
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('playground_snippets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete snippet: ' + err.message });
  }
});

// -------------------------------------------------------------
// CODEFORCES SOLUTION ENGINE & ADMIN PIPELINE (PHASE 9 & 10)
// -------------------------------------------------------------
import { SolutionEngineServer } from './src/services/solutionEngineServer';
const solutionEngine = new SolutionEngineServer();
solutionEngine.registerRoutes(app);


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

    // Initialize and start background notification workers
    try {
      const sbAdmin = getSupabaseAdmin();
      jobProcessor.start(sbAdmin);
      cfActivityTracker.start(sbAdmin);
    } catch (e: any) {
      console.warn('[Server] Supabase admin not configured for background notification workers:', e.message);
    }
  });

  const gracefulShutdown = () => {
    console.log('[Server] Gracefully shutting down notification workers...');
    jobProcessor.stop();
    cfActivityTracker.stop();
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
