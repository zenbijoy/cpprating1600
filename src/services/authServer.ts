import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { z } from 'zod';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error('Supabase environment configuration (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) is missing.');
    }
    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

// 1. JWT Authentication Middleware
export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected Bearer token.',
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty Bearer token provided.',
    });
  }

  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Invalid or expired authentication session token.',
      });
    }

    (req as AuthenticatedRequest).user = data.user;
    next();
  } catch (err: any) {
    return res.status(500).json({
      error: 'AuthVerificationError',
      message: err.message || 'Internal error verifying authentication token.',
    });
  }
}

// 2. Optional Auth Middleware (for routes accessible by guests or users)
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as AuthenticatedRequest).user = undefined;
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    (req as AuthenticatedRequest).user = undefined;
    return next();
  }

  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.auth.getUser(token);
    (req as AuthenticatedRequest).user = data?.user || undefined;
  } catch {
    (req as AuthenticatedRequest).user = undefined;
  }
  next();
}

// Schema for updating profile
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  preferredLanguage: z.enum(['cpp20', 'cpp17', 'python']).optional(),
  theme: z.enum(['dark', 'light']).optional(),
  onboardingCompleted: z.boolean().optional(),
  dailyMinutes: z.number().min(10).max(360).optional(),
  targetRating: z.number().min(800).max(3500).optional(),
  currentDay: z.number().min(1).max(180).optional(),
  currentPhase: z.number().min(1).max(7).optional(),
  privacySettings: z.record(z.string(), z.any()).optional(),
  notificationPreferences: z.record(z.string(), z.any()).optional(),
});

// 3. Get Current User Profile & Linked Codeforces Account
export async function getProfileHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSupabaseAdmin();

  try {
    // 1. Fetch profile
    let { data: profile, error: profErr } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profErr) {
      console.error('[Auth API] Profile fetch error:', profErr);
    }

    // Lazy create if not created by DB trigger yet
    if (!profile) {
      const meta = user.user_metadata || {};
      const { data: newProfile, error: insertErr } = await sb
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          display_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Competitive Programmer',
          avatar_url: meta.avatar_url || meta.picture || null,
          preferred_language: 'cpp20',
          theme: 'dark',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error('[Auth API] Profile creation error:', insertErr);
      } else {
        profile = newProfile;
      }
    }

    // 2. Fetch linked Codeforces account
    const { data: cfAccount, error: cfErr } = await sb
      .from('user_cf_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cfErr) {
      console.error('[Auth API] CF account fetch error:', cfErr);
    }

    return res.json({
      status: 'OK',
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
      cfAccount: cfAccount || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}

// 4. Update Profile Handler
export async function updateProfileHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid profile data', details: parsed.error.issues });
  }

  const sb = getSupabaseAdmin();
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  const d = parsed.data;
  if (d.displayName !== undefined) updateData.display_name = d.displayName;
  if (d.username !== undefined) {
    if (d.username) {
      // Validate unique username
      const normalizedUsername = d.username.toLowerCase();
      const { data: existingUser } = await sb
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .neq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ error: 'UsernameTaken', message: 'This username is already taken. Please choose another.' });
      }
      updateData.username = normalizedUsername;
    } else {
      updateData.username = null;
    }
  }
  if (d.bio !== undefined) updateData.bio = d.bio;
  if (d.skills !== undefined) updateData.skills = d.skills;
  if (d.interests !== undefined) updateData.interests = d.interests;
  if (d.avatarUrl !== undefined) updateData.avatar_url = d.avatarUrl;
  if (d.privacySettings !== undefined) updateData.privacy_settings = d.privacySettings;
  if (d.notificationPreferences !== undefined) updateData.notification_preferences = d.notificationPreferences;
  if (d.preferredLanguage !== undefined) updateData.preferred_language = d.preferredLanguage;
  if (d.theme !== undefined) updateData.theme = d.theme;
  if (d.onboardingCompleted !== undefined) updateData.onboarding_completed = d.onboardingCompleted;
  if (d.dailyMinutes !== undefined) updateData.daily_minutes = d.dailyMinutes;
  if (d.targetRating !== undefined) updateData.target_rating = d.targetRating;
  if (d.currentDay !== undefined) updateData.current_day = d.currentDay;
  if (d.currentPhase !== undefined) updateData.current_phase = d.currentPhase;

  try {
    const { data: updated, error } = await sb
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile', message: error.message });
    }

    return res.json({ status: 'OK', profile: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}

// 5. Guest Practice Data Migration Handler
const GuestMigrateSchema = z.object({
  attempts: z.array(
    z.object({
      id: z.string(),
      problemId: z.string(),
      contestId: z.number().optional(),
      index: z.string(),
      name: z.string(),
      rating: z.number().optional(),
      tags: z.array(z.string()).optional(),
      url: z.string().optional(),
      startedAt: z.string(),
      endedAt: z.string().optional(),
      durationSeconds: z.number().optional(),
      verdict: z.string().optional(),
      hintsUsed: z.number().optional(),
      notes: z.string().optional(),
      code: z.string().optional(),
    })
  ).optional().default([]),
  mistakes: z.array(
    z.object({
      id: z.string(),
      problemId: z.string(),
      problemName: z.string(),
      problemUrl: z.string().optional(),
      rating: z.number().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string(),
      originalApproach: z.string().optional(),
      whyItFailed: z.string().optional(),
      correctObservation: z.string().optional(),
      correctApproach: z.string().optional(),
      personalLesson: z.string().optional(),
      intervalDays: z.number().optional(),
      reviewCount: z.number().optional(),
      status: z.string().optional(),
      nextReviewDate: z.string().optional(),
    })
  ).optional().default([]),
  goal: z.object({
    dailyMinutes: z.number().optional(),
    targetRating: z.number().optional(),
    currentDay: z.number().optional(),
  }).optional(),
});

export async function migrateGuestHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = GuestMigrateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid migration payload', details: parsed.error.issues });
  }

  const { attempts, mistakes, goal } = parsed.data;
  const sb = getSupabaseAdmin();

  let importedAttempts = 0;
  let importedMistakes = 0;

  try {
    // 1. Insert practice attempts (deduplicated by id / problem)
    if (attempts.length > 0) {
      const records = attempts.map((a) => ({
        id: a.id,
        user_id: user.id,
        problem_id: a.problemId,
        contest_id: a.contestId ?? null,
        problem_index: a.index,
        problem_name: a.name,
        rating: a.rating ?? null,
        tags: a.tags ?? [],
        url: a.url ?? null,
        started_at: a.startedAt,
        ended_at: a.endedAt ?? null,
        duration_seconds: a.durationSeconds ?? null,
        verdict: a.verdict ?? 'ATTEMPTED',
        hints_used: a.hintsUsed ?? 0,
        notes: a.notes ?? null,
        code: a.code ?? null,
      }));

      // Upsert ignoring conflicts on id
      const { error: attErr, data: insertedAtts } = await sb
        .from('user_practice_attempts')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: true })
        .select('id');

      if (!attErr && insertedAtts) {
        importedAttempts = insertedAtts.length;
      }
    }

    // 2. Insert mistakes (deduplicated by id)
    if (mistakes.length > 0) {
      const records = mistakes.map((m) => ({
        id: m.id,
        user_id: user.id,
        problem_id: m.problemId,
        problem_name: m.problemName,
        problem_url: m.problemUrl ?? null,
        rating: m.rating ?? null,
        tags: m.tags ?? [],
        category: m.category,
        original_approach: m.originalApproach ?? null,
        why_it_failed: m.whyItFailed ?? null,
        correct_observation: m.correctObservation ?? null,
        correct_approach: m.correctApproach ?? null,
        personal_lesson: m.personalLesson ?? null,
        interval_days: m.intervalDays ?? 1,
        review_count: m.reviewCount ?? 0,
        status: m.status ?? 'due',
        next_review_date: m.nextReviewDate || new Date().toISOString().split('T')[0],
      }));

      const { error: misErr, data: insertedMis } = await sb
        .from('user_mistakes')
        .upsert(records, { onConflict: 'id', ignoreDuplicates: true })
        .select('id');

      if (!misErr && insertedMis) {
        importedMistakes = insertedMis.length;
      }
    }

    // 3. Update profile goal if provided
    if (goal) {
      const goalUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (goal.dailyMinutes) goalUpdates.daily_minutes = goal.dailyMinutes;
      if (goal.targetRating) goalUpdates.target_rating = goal.targetRating;
      if (goal.currentDay) goalUpdates.current_day = goal.currentDay;

      await sb.from('profiles').update(goalUpdates).eq('id', user.id);
    }

    return res.json({
      status: 'OK',
      success: true,
      importedAttempts,
      importedMistakes,
      message: `Successfully migrated ${importedAttempts} practice attempt(s) and ${importedMistakes} mistake notebook record(s) to your cloud profile.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'MigrationFailed', message: err.message });
  }
}
