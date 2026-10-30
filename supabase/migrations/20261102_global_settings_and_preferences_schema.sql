-- =========================================================================
-- CLIMB 1600 — GLOBAL SETTINGS & PERSONALIZATION SCHEMA MIGRATION
-- Migration: 20261102_global_settings_and_preferences_schema.sql
-- Description: Creates persistent user settings, theme customizations,
--              learning preferences, accessibility, guardian sync options,
--              and strict Row Level Security (RLS) policies.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. EXTEND USER PROFILES TABLE WITH PERSONALIZATION ATTRIBUTES
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'some_experience',
    ADD COLUMN IF NOT EXISTS learning_goals TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS preferred_topics TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS weekly_goal_hours NUMERIC DEFAULT 10;

-- 2. GLOBAL USER SETTINGS TABLE (One-to-one with authenticated user)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Theme & Appearance configuration
    theme_config JSONB NOT NULL DEFAULT '{
        "mode": "dark",
        "preset": "climb-default",
        "density": "comfortable",
        "borderRadius": "standard",
        "fontSize": "standard",
        "animationIntensity": "full",
        "transparency": "normal"
    }'::jsonb,

    -- Competitive Programming & learning preferences
    learning_preferences JSONB NOT NULL DEFAULT '{
        "defaultLanguage": "cpp20",
        "defaultDifficultyMin": 800,
        "defaultDifficultyMax": 1600,
        "preferredTags": ["implementation", "math", "greedy", "dp", "binary search"],
        "dailyTargetMinutes": 45,
        "weeklyTargetProblems": 15,
        "targetRating": 1600,
        "trainingIntensity": "standard",
        "recommendationBehavior": "adaptive",
        "defaultSort": "rating_asc",
        "defaultFilter": "unsolved_only",
        "editorTheme": "vs-dark",
        "editorFontSize": 14,
        "editorTabSize": 4,
        "lineNumbers": true,
        "wordWrap": false,
        "codeFontFamily": "JetBrains Mono"
    }'::jsonb,

    -- Privacy & Security settings
    privacy_settings JSONB NOT NULL DEFAULT '{
        "profileVisibility": "public",
        "showActivityStatus": true,
        "shareAchievements": true,
        "personalizedRecommendations": true,
        "telemetryEnabled": false
    }'::jsonb,

    -- Localization preferences
    localization_preferences JSONB NOT NULL DEFAULT '{
        "language": "en",
        "timeZone": "UTC",
        "dateFormat": "YYYY-MM-DD",
        "timeFormat": "12h",
        "weekStart": "monday"
    }'::jsonb,

    -- Accessibility options
    accessibility_settings JSONB NOT NULL DEFAULT '{
        "fontSize": "standard",
        "reducedMotion": false,
        "highContrast": false,
        "clearFocusIndicators": true,
        "screenReaderLabels": true,
        "density": "comfortable",
        "sidebarBehavior": "expanded",
        "tooltipsEnabled": true,
        "confirmDestructiveActions": true
    }'::jsonb,

    -- Android Guardian companion preferences
    guardian_preferences JSONB NOT NULL DEFAULT '{
        "guardianEnabled": true,
        "focusSessionDurationMinutes": 45,
        "breakDurationMinutes": 10,
        "dailyFocusMinutesGoal": 90,
        "breathingDelaySeconds": 15,
        "strictBlocking": false,
        "scheduledStudyStart": "19:00",
        "scheduledStudyEnd": "21:00",
        "studyProtectionDays": [1, 2, 3, 4, 5],
        "sessionCompletionSound": true,
        "blockedPackages": [
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.facebook.katana",
            "com.twitter.android",
            "com.netflix.mediaclient"
        ],
        "blockedDomains": [
            "instagram.com",
            "tiktok.com",
            "facebook.com",
            "twitter.com",
            "netflix.com",
            "reddit.com"
        ]
    }'::jsonb,

    -- General application behavior preferences
    app_preferences JSONB NOT NULL DEFAULT '{
        "defaultLandingTab": "dashboard",
        "rememberProblemFilters": true,
        "autoRefreshData": true,
        "confirmBeforeLeavingUnsaved": true,
        "showOnboardingTips": true,
        "enableKeyboardShortcuts": true,
        "autoOpenProblemFromNotification": true
    }'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings (user_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Select policy: Authenticated users can only read their own settings
CREATE POLICY "Users can view their own settings"
    ON public.user_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Insert policy: Users can insert their own settings row
CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Update policy: Users can update only their own settings row
CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Delete policy: Users can delete only their own settings row
CREATE POLICY "Users can delete their own settings"
    ON public.user_settings
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. AUTO-INITIALIZATION TRIGGER
-- When a new profile is created for a user, automatically ensure a default user_settings row exists.
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_init_settings ON public.profiles;
CREATE TRIGGER on_profile_created_init_settings
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_settings();
