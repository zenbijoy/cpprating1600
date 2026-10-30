import { Request, Response } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin, AuthenticatedRequest } from './authServer';
import { DEFAULT_GLOBAL_SETTINGS, mergeWithDefaultSettings } from '../utils/settingsDefaults';
import { GlobalUserSettings } from '../types/settings';

// Schema for updating settings
export const SettingsUpdateSchema = z.object({
  theme: z
    .object({
      mode: z.enum(['light', 'dark', 'multicolor', 'orange', 'purple', 'system']).optional(),
      preset: z
        .enum([
          'climb-default',
          'midnight',
          'amoled',
          'ocean',
          'forest',
          'violet',
          'warm-neutral',
          'high-contrast',
        ])
        .optional(),
      customPrimaryAccent: z.string().max(30).optional(),
      customSecondaryAccent: z.string().max(30).optional(),
      density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
      borderRadius: z.enum(['compact', 'standard', 'rounded']).optional(),
      fontSize: z.enum(['small', 'standard', 'large']).optional(),
      animationIntensity: z.enum(['full', 'reduced', 'off']).optional(),
      transparency: z.enum(['normal', 'reduced']).optional(),
    })
    .optional(),

  profile: z
    .object({
      displayName: z.string().min(1).max(100).optional(),
      avatar: z.string().max(500).optional(),
      bio: z.string().max(500).optional(),
      country: z.string().max(100).optional(),
      preferredLanguage: z.enum(['cpp20', 'cpp17', 'python']).optional(),
      experienceLevel: z.enum(['complete_beginner', 'some_experience', 'experienced_coder']).optional(),
      learningGoals: z.array(z.string().max(100)).max(20).optional(),
      preferredTopics: z.array(z.string().max(100)).max(30).optional(),
      targetRating: z.number().min(800).max(3500).optional(),
      weeklyGoalHours: z.number().min(1).max(80).optional(),
    })
    .optional(),

  privacy: z
    .object({
      profileVisibility: z.enum(['public', 'private', 'friends_only']).optional(),
      showActivityStatus: z.boolean().optional(),
      shareAchievements: z.boolean().optional(),
      personalizedRecommendations: z.boolean().optional(),
      telemetryEnabled: z.boolean().optional(),
    })
    .optional(),

  localization: z
    .object({
      language: z.enum(['en', 'bn']).optional(),
      timeZone: z.string().max(80).optional(),
      dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).optional(),
      timeFormat: z.enum(['12h', '24h']).optional(),
      weekStart: z.enum(['sunday', 'monday', 'saturday']).optional(),
    })
    .optional(),

  accessibility: z
    .object({
      fontSize: z.enum(['small', 'standard', 'large']).optional(),
      reducedMotion: z.boolean().optional(),
      highContrast: z.boolean().optional(),
      clearFocusIndicators: z.boolean().optional(),
      screenReaderLabels: z.boolean().optional(),
      density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
      sidebarBehavior: z.enum(['expanded', 'collapsed', 'auto']).optional(),
      tooltipsEnabled: z.boolean().optional(),
      confirmDestructiveActions: z.boolean().optional(),
    })
    .optional(),

  competitiveProgramming: z
    .object({
      defaultLanguage: z.enum(['cpp20', 'cpp17', 'c', 'python']).optional(),
      defaultDifficultyMin: z.number().min(800).max(3500).optional(),
      defaultDifficultyMax: z.number().min(800).max(3500).optional(),
      preferredTags: z.array(z.string().max(50)).max(30).optional(),
      dailyTargetMinutes: z.number().min(10).max(360).optional(),
      weeklyTargetProblems: z.number().min(1).max(100).optional(),
      targetRating: z.number().min(800).max(3500).optional(),
      trainingIntensity: z.enum(['casual', 'standard', 'intensive']).optional(),
      recommendationBehavior: z.enum(['adaptive', 'stretch', 'review_first']).optional(),
      defaultSort: z.enum(['rating_asc', 'rating_desc', 'contest_id', 'popularity']).optional(),
      defaultFilter: z.enum(['unsolved_only', 'all']).optional(),
      editorTheme: z.enum(['vs-dark', 'light', 'hc-black']).optional(),
      editorFontSize: z.number().min(10).max(32).optional(),
      editorTabSize: z.union([z.literal(2), z.literal(4), z.literal(8)]).optional(),
      lineNumbers: z.boolean().optional(),
      wordWrap: z.boolean().optional(),
      codeFontFamily: z
        .enum(['JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', 'Source Code Pro'])
        .optional(),
      codeTemplates: z
        .object({
          cpp20: z.string().max(10000).optional(),
          cpp17: z.string().max(10000).optional(),
          c: z.string().max(10000).optional(),
          python: z.string().max(10000).optional(),
        })
        .optional(),
    })
    .optional(),

  guardian: z
    .object({
      guardianEnabled: z.boolean().optional(),
      focusSessionDurationMinutes: z.number().min(5).max(180).optional(),
      breakDurationMinutes: z.number().min(2).max(60).optional(),
      dailyFocusMinutesGoal: z.number().min(15).max(480).optional(),
      breathingDelaySeconds: z.number().min(0).max(60).optional(),
      strictBlocking: z.boolean().optional(),
      scheduledStudyStart: z.string().max(10).optional(),
      scheduledStudyEnd: z.string().max(10).optional(),
      studyProtectionDays: z.array(z.number().min(0).max(6)).optional(),
      sessionCompletionSound: z.boolean().optional(),
      blockedPackages: z.array(z.string().max(100)).max(100).optional(),
      blockedDomains: z.array(z.string().max(100)).max(100).optional(),
    })
    .optional(),

  app: z
    .object({
      defaultLandingTab: z.string().max(50).optional(),
      rememberProblemFilters: z.boolean().optional(),
      autoRefreshData: z.boolean().optional(),
      confirmBeforeLeavingUnsaved: z.boolean().optional(),
      showOnboardingTips: z.boolean().optional(),
      enableKeyboardShortcuts: z.boolean().optional(),
      autoOpenProblemFromNotification: z.boolean().optional(),
    })
    .optional(),
});

// 1. GET /api/settings: Fetch all user settings
export async function getSettingsHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sb = getSupabaseAdmin();

    // Query user_settings
    const { data: rawSettings } = await sb
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Query profiles
    const { data: profile } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Query CF account
    const { data: cfAccount } = await sb
      .from('user_cf_accounts')
      .select('cf_handle, verification_status, cf_rating, cf_max_rating, cf_rank, last_synced_at')
      .eq('user_id', user.id)
      .maybeSingle();

    let merged = mergeWithDefaultSettings(rawSettings ? {
      theme: rawSettings.theme_config,
      competitiveProgramming: rawSettings.learning_preferences,
      privacy: rawSettings.privacy_settings,
      localization: rawSettings.localization_preferences,
      accessibility: rawSettings.accessibility_settings,
      guardian: rawSettings.guardian_preferences,
      app: rawSettings.app_preferences,
      lastUpdated: rawSettings.updated_at,
    } : null);

    // Merge in profile fields
    if (profile) {
      merged.profile = {
        ...merged.profile,
        displayName: profile.display_name || merged.profile.displayName,
        avatar: profile.avatar_url || merged.profile.avatar,
        bio: profile.bio || merged.profile.bio,
        country: profile.country || merged.profile.country,
        preferredLanguage: profile.preferred_language || merged.profile.preferredLanguage,
        experienceLevel: profile.experience_level || merged.profile.experienceLevel,
        learningGoals: profile.learning_goals || merged.profile.learningGoals,
        preferredTopics: profile.preferred_topics || merged.profile.preferredTopics,
        targetRating: profile.target_rating || merged.profile.targetRating,
        weeklyGoalHours: profile.weekly_goal_hours || merged.profile.weeklyGoalHours,
      };
    }

    return res.json({
      status: 'OK',
      settings: merged,
      profile: profile || null,
      cfAccount: cfAccount || null,
    });
  } catch (err: any) {
    console.error('[Settings API] getSettingsHandler error:', err);
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}

// 2. PUT /api/settings: Save settings & profile updates
export async function updateSettingsHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = SettingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid settings data', details: parsed.error.issues });
  }

  try {
    const sb = getSupabaseAdmin();
    const body = parsed.data;
    const now = new Date().toISOString();

    // Fetch existing settings to merge deep objects
    const { data: existing } = await sb
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentTheme = existing?.theme_config || DEFAULT_GLOBAL_SETTINGS.theme;
    const currentCP = existing?.learning_preferences || DEFAULT_GLOBAL_SETTINGS.competitiveProgramming;
    const currentPrivacy = existing?.privacy_settings || DEFAULT_GLOBAL_SETTINGS.privacy;
    const currentLoc = existing?.localization_preferences || DEFAULT_GLOBAL_SETTINGS.localization;
    const currentA11y = existing?.accessibility_settings || DEFAULT_GLOBAL_SETTINGS.accessibility;
    const currentGuardian = existing?.guardian_preferences || DEFAULT_GLOBAL_SETTINGS.guardian;
    const currentApp = existing?.app_preferences || DEFAULT_GLOBAL_SETTINGS.app;

    const updatedTheme = body.theme ? { ...currentTheme, ...body.theme } : currentTheme;
    const updatedCP = body.competitiveProgramming
      ? {
          ...currentCP,
          ...body.competitiveProgramming,
          codeTemplates: {
            ...currentCP.codeTemplates,
            ...(body.competitiveProgramming.codeTemplates || {}),
          },
        }
      : currentCP;
    const updatedPrivacy = body.privacy ? { ...currentPrivacy, ...body.privacy } : currentPrivacy;
    const updatedLoc = body.localization ? { ...currentLoc, ...body.localization } : currentLoc;
    const updatedA11y = body.accessibility ? { ...currentA11y, ...body.accessibility } : currentA11y;
    const updatedGuardian = body.guardian ? { ...currentGuardian, ...body.guardian } : currentGuardian;
    const updatedApp = body.app ? { ...currentApp, ...body.app } : currentApp;

    // Upsert into user_settings
    await sb
      .from('user_settings')
      .upsert({
        user_id: user.id,
        theme_config: updatedTheme,
        learning_preferences: updatedCP,
        privacy_settings: updatedPrivacy,
        localization_preferences: updatedLoc,
        accessibility_settings: updatedA11y,
        guardian_preferences: updatedGuardian,
        app_preferences: updatedApp,
        updated_at: now,
      });

    // Update profile table if profile fields provided
    if (body.profile) {
      const p = body.profile;
      const profileUpdates: Record<string, any> = { updated_at: now };
      if (p.displayName !== undefined) profileUpdates.display_name = p.displayName;
      if (p.avatar !== undefined) profileUpdates.avatar_url = p.avatar;
      if (p.bio !== undefined) profileUpdates.bio = p.bio;
      if (p.country !== undefined) profileUpdates.country = p.country;
      if (p.preferredLanguage !== undefined) profileUpdates.preferred_language = p.preferredLanguage;
      if (p.experienceLevel !== undefined) profileUpdates.experience_level = p.experienceLevel;
      if (p.learningGoals !== undefined) profileUpdates.learning_goals = p.learningGoals;
      if (p.preferredTopics !== undefined) profileUpdates.preferred_topics = p.preferredTopics;
      if (p.targetRating !== undefined) profileUpdates.target_rating = p.targetRating;
      if (p.weeklyGoalHours !== undefined) profileUpdates.weekly_goal_hours = p.weeklyGoalHours;

      await sb.from('profiles').update(profileUpdates).eq('id', user.id);
    }

    return res.json({
      status: 'OK',
      message: 'Settings updated successfully.',
      updatedAt: now,
    });
  } catch (err: any) {
    console.error('[Settings API] updateSettingsHandler error:', err);
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}

// 3. POST /api/settings/reset: Reset section or all settings
export async function resetSettingsHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { section } = req.body || {};

  try {
    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (!section || section === 'all') {
      await sb
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme_config: DEFAULT_GLOBAL_SETTINGS.theme,
          learning_preferences: DEFAULT_GLOBAL_SETTINGS.competitiveProgramming,
          privacy_settings: DEFAULT_GLOBAL_SETTINGS.privacy,
          localization_preferences: DEFAULT_GLOBAL_SETTINGS.localization,
          accessibility_settings: DEFAULT_GLOBAL_SETTINGS.accessibility,
          guardian_preferences: DEFAULT_GLOBAL_SETTINGS.guardian,
          app_preferences: DEFAULT_GLOBAL_SETTINGS.app,
          updated_at: now,
        });
    } else {
      const updates: Record<string, any> = { updated_at: now };
      if (section === 'theme') updates.theme_config = DEFAULT_GLOBAL_SETTINGS.theme;
      if (section === 'competitiveProgramming') updates.learning_preferences = DEFAULT_GLOBAL_SETTINGS.competitiveProgramming;
      if (section === 'privacy') updates.privacy_settings = DEFAULT_GLOBAL_SETTINGS.privacy;
      if (section === 'localization') updates.localization_preferences = DEFAULT_GLOBAL_SETTINGS.localization;
      if (section === 'accessibility') updates.accessibility_settings = DEFAULT_GLOBAL_SETTINGS.accessibility;
      if (section === 'guardian') updates.guardian_preferences = DEFAULT_GLOBAL_SETTINGS.guardian;
      if (section === 'app') updates.app_preferences = DEFAULT_GLOBAL_SETTINGS.app;

      await sb.from('user_settings').update(updates).eq('user_id', user.id);
    }

    return res.json({
      status: 'OK',
      message: `Settings for "${section || 'all'}" reset to defaults successfully.`,
      updatedAt: now,
    });
  } catch (err: any) {
    console.error('[Settings API] resetSettingsHandler error:', err);
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}

// 4. POST /api/settings/export: Export personal data
export async function exportUserDataHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sb = getSupabaseAdmin();

    const [profRes, setRes, cfRes, attRes, misRes, plansRes, notifRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      sb.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      sb.from('user_cf_accounts').select('cf_handle, verification_status, cf_rating, cf_max_rating, cf_rank, last_synced_at').eq('user_id', user.id).maybeSingle(),
      sb.from('user_practice_attempts').select('*').eq('user_id', user.id),
      sb.from('user_mistakes').select('*').eq('user_id', user.id),
      sb.from('user_daily_plans').select('*').eq('user_id', user.id),
      sb.from('user_notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profRes.data || null,
      settings: setRes.data || null,
      codeforcesAccount: cfRes.data || null,
      attempts: attRes.data || [],
      mistakes: misRes.data || [],
      dailyPlans: plansRes.data || [],
      notificationPreferences: notifRes.data || null,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="climb1600_export_${user.id.substring(0, 8)}.json"`);
    return res.json(exportPayload);
  } catch (err: any) {
    console.error('[Settings API] exportUserDataHandler error:', err);
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}

// 5. POST /api/account/delete: Permanent account deletion workflow
export async function deleteAccountHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { confirmation } = req.body || {};
  if (confirmation !== 'DELETE_MY_ACCOUNT') {
    return res.status(400).json({
      error: 'InvalidConfirmation',
      message: 'Account deletion requires explicit confirmation: "DELETE_MY_ACCOUNT".',
    });
  }

  try {
    const sb = getSupabaseAdmin();

    // 1. Delete user-owned database records (cascading cleanup)
    await Promise.all([
      sb.from('user_settings').delete().eq('user_id', user.id),
      sb.from('user_cf_accounts').delete().eq('user_id', user.id),
      sb.from('cf_verification_challenges').delete().eq('user_id', user.id),
      sb.from('user_practice_attempts').delete().eq('user_id', user.id),
      sb.from('user_mistakes').delete().eq('user_id', user.id),
      sb.from('user_daily_plans').delete().eq('user_id', user.id),
      sb.from('notifications').delete().eq('user_id', user.id),
      sb.from('user_notification_preferences').delete().eq('user_id', user.id),
      sb.from('profiles').delete().eq('id', user.id),
    ]);

    // 2. Delete Supabase Auth user via admin API
    try {
      await sb.auth.admin.deleteUser(user.id);
    } catch (authDeleteErr) {
      console.warn('[Settings API] Warning deleting Supabase auth user:', authDeleteErr);
    }

    return res.json({
      status: 'OK',
      message: 'Account and associated learning records deleted successfully.',
    });
  } catch (err: any) {
    console.error('[Settings API] deleteAccountHandler error:', err);
    return res.status(500).json({ error: 'InternalError', message: err.message });
  }
}
