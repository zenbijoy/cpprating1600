import React, { useState, useEffect } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { ProblemArenaView } from './components/ProblemArenaView';
import { WorkspaceView } from './components/WorkspaceView';
import { SkillTreeView } from './components/SkillTreeView';
import { SubmissionAutopsyView } from './components/SubmissionAutopsyView';
import { SubmissionsView } from './components/SubmissionsView';
import { ContestsView } from './components/ContestsView';
import { AICoachView } from './components/AICoachView';
import { ProgressView } from './components/ProgressView';
import { AnalyticsView } from './components/AnalyticsView';
import { CodeforcesProfileView } from './components/CodeforcesProfileView';
import { GuardianView } from './components/GuardianView';
import { MistakeNotebookView } from './components/MistakeNotebookView';
import { SettingsView } from './components/SettingsView';
import { SolutionLibraryView } from './components/SolutionLibraryView';
import { PlaygroundView } from './components/PlaygroundView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { IconSystemView } from './components/icons/IconSystemView';
import { SocialFeedView, PostComposerPrefill } from './components/SocialFeedView';
import { CommunityHubView } from './components/CommunityHubView';
import { DirectMessagesView } from './components/DirectMessagesView';
import { UserProfileView } from './components/UserProfileView';
import { communityClient } from './services/communityClient';
import { chatClient } from './services/chatClient';
import { OnboardingModal } from './components/OnboardingModal';
import { AppSplashScreen } from './components/AppSplashScreen';
import { ProblemWorkspaceModal } from './components/ProblemWorkspaceModal';
import { AntiProcrastinationModal } from './components/AntiProcrastinationModal';
import { AuthModal } from './components/AuthModal';
import { CodeforcesVerificationModal } from './components/CodeforcesVerificationModal';
import { GuestMigrationModal } from './components/GuestMigrationModal';
import { NotificationInboxModal } from './components/NotificationInboxModal';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ToastProvider } from './components/Toast';
import { notificationClient } from './services/notificationClient';
import { authService, supabase, UserCfAccount } from './services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { storageService, cfStorageService, defaultGoal, defaultProfile } from './services/storage';
import { CFProblem, DailyPlan, DailyTask, MistakeRecord, ProblemAttempt, UserGoal, UserProfile } from './types';
import { generateDailyPlan, getTopicForDay } from './utils/roadmap';
import { applyThemeToDom } from './utils/themeEngine';
import { TranslationContext, t, LanguageCode } from './utils/i18n';

export default function App() {
  // Check URL query parameters (e.g. ?autostart=1 to skip onboarding for verification)
  const urlParams = new URLSearchParams(window.location.search);
  const autostart = urlParams.get('autostart') === '1';
  const initialTab = (urlParams.get('tab') as TabId) || 'dashboard';

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [goal, setGoal] = useState<UserGoal>(() => storageService.getGoal());
  const [attempts, setAttempts] = useState<ProblemAttempt[]>(() => storageService.getAttempts());
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => storageService.getMistakes());
  const [lang, setLang] = useState<LanguageCode>(() => {
    return storageService.getSettings().localization.language || 'en';
  });

  useEffect(() => {
    // Bootstrap active theme tokens on root document element
    const currentSettings = storageService.getSettings();
    applyThemeToDom(currentSettings.theme);
  }, []);

  // Active Daily Plan
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>(() => {
    const plans = storageService.getDailyPlans();
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = plans.find((p) => p.date === todayStr);
    if (existing) return existing;
    const newPlan = generateDailyPlan(storageService.getGoal().currentDay, 'standard', storageService.getGoal().dailyMinutes);
    storageService.saveDailyPlan(newPlan);
    return newPlan;
  });

  // Modals state
  const forceSplash = urlParams.get('splash') === '1' || urlParams.get('splash') === 'force';
  const forceFirstTimeSplash = urlParams.get('splash') === 'first';
  const disableSplash = urlParams.get('splash') === '0' || autostart;

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (disableSplash) return false;
    if (forceSplash || forceFirstTimeSplash) return true;

    const currentSettings = storageService.getSettings();
    const splashMode = currentSettings.app?.showSplashScreenOnLaunch || 'always';
    if (splashMode === 'never') return false;

    const hasLaunched = localStorage.getItem('climb1600_has_launched');
    const justDownloaded = localStorage.getItem('climb1600_just_downloaded') === 'true';

    if (splashMode === 'first_time') {
      return !hasLaunched || justDownloaded;
    }

    // Default 'always': Show when entering app
    return true;
  });

  const [isFirstTimeDownload, setIsFirstTimeDownload] = useState<boolean>(() => {
    if (forceFirstTimeSplash) return true;
    const hasLaunched = localStorage.getItem('climb1600_has_launched');
    const justDownloaded = localStorage.getItem('climb1600_just_downloaded') === 'true';
    return !hasLaunched || justDownloaded;
  });

  // Listen for PWA app downloaded event
  useEffect(() => {
    const handleAppDownloaded = () => {
      setIsFirstTimeDownload(true);
      setShowSplash(true);
    };
    window.addEventListener('climb1600:app-downloaded', handleAppDownloaded);
    return () => window.removeEventListener('climb1600:app-downloaded', handleAppDownloaded);
  }, []);

  const handleSplashFinish = () => {
    try {
      localStorage.setItem('climb1600_has_launched', 'true');
      localStorage.removeItem('climb1600_just_downloaded');
      sessionStorage.setItem('climb1600_splash_shown_this_session', 'true');
    } catch {
      // ignore
    }
    setShowSplash(false);
  };

  const handleReplaySplash = (asFirstTime = false) => {
    setIsFirstTimeDownload(asFirstTime);
    setShowSplash(true);
  };

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (autostart) return false;
    return !storageService.getProfile().onboardingCompleted;
  });

  const [activeProblem, setActiveProblem] = useState<CFProblem | null>(null);
  const [workspaceInitialCode, setWorkspaceInitialCode] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [showAntiProcrastination, setShowAntiProcrastination] = useState<boolean>(false);
  const [curriculumSelectedTopicId, setCurriculumSelectedTopicId] = useState<string | undefined>(undefined);

  // Supabase Auth and Codeforces State
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [cfAccount, setCfAccount] = useState<UserCfAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [showGuestMigrationModal, setShowGuestMigrationModal] = useState<boolean>(false);
  const [verificationInitialHandle, setVerificationInitialHandle] = useState<string>('');
  const [showNotificationInbox, setShowNotificationInbox] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [feedCommunitySlug, setFeedCommunitySlug] = useState<string | undefined>(undefined);
  const [dmTargetUserId, setDmTargetUserId] = useState<string | undefined>(undefined);
  const [feedComposerPrefill, setFeedComposerPrefill] = useState<PostComposerPrefill | null>(null);

  const refreshNotificationCount = async () => {
    try {
      const res = await notificationClient.getNotifications({ limit: 1 });
      setUnreadNotificationCount(res.unreadCount);
    } catch {
      // Ignore if not logged in
    }
  };

  const refreshUnreadMessageCount = async () => {
    try {
      const convs = await chatClient.listConversations();
      const total = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadMessageCount(total);
    } catch {
      // Ignore if not logged in
    }
  };

  const loadUserProfile = async () => {
    try {
      const data = await authService.getMyProfile();
      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          id: data.profile.id,
          name: data.profile.display_name || prev.name,
          email: data.profile.email || prev.email,
          avatar: data.profile.avatar_url || prev.avatar,
          preferredLanguage: data.profile.preferred_language || prev.preferredLanguage,
          theme: data.profile.theme || prev.theme,
          onboardingCompleted: data.profile.onboarding_completed ?? prev.onboardingCompleted,
        }));
        if (data.profile.target_rating) {
          setGoal((prev) => ({
            ...prev,
            targetRating: data.profile.target_rating,
            dailyMinutes: data.profile.daily_minutes || prev.dailyMinutes,
            currentDay: data.profile.current_day || prev.currentDay,
            currentPhase: data.profile.current_phase || prev.currentPhase,
          }));
        }
      }

      // Auto-provision membership in default communities idempotently
      communityClient.provisionDefaults().catch(() => {});

      if (data.cfAccount) {
        setCfAccount(data.cfAccount);
        if (data.cfAccount.cf_handle) {
          setProfile((prev) => ({
            ...prev,
            cfHandle: data.cfAccount?.cf_handle,
            verifiedCfRating: data.cfAccount?.cf_rating || undefined,
            maxCfRating: data.cfAccount?.cf_max_rating || undefined,
            rank: data.cfAccount?.cf_rank || undefined,
            avatar: data.cfAccount?.cf_avatar || prev.avatar,
          }));
        }
      }

      // Check for unmigrated guest practice records
      const localAttempts = storageService.getAttempts();
      const localMistakes = storageService.getMistakes();
      if (localAttempts.length > 0 || localMistakes.length > 0) {
        const migrationKey = `climb1600_migrated_${data.user.id}`;
        if (!localStorage.getItem(migrationKey)) {
          setShowGuestMigrationModal(true);
        }
      }

      await refreshNotificationCount();
      await refreshUnreadMessageCount();
    } catch (e) {
      console.error('[App] Failed to load authenticated user profile:', e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthUser(s?.user || null);
      if (s?.user) {
        loadUserProfile();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setAuthUser(s?.user || null);
      if (s?.user) {
        await loadUserProfile();
      } else {
        setCfAccount(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setSession(null);
    setAuthUser(null);
    setCfAccount(null);
    setProfile(defaultProfile);
    setGoal(defaultGoal);
    setActiveTab('dashboard');
  };

  const handleSyncCfData = async () => {
    try {
      const synced = await authService.syncCfData();
      setProfile((prev) => ({
        ...prev,
        cfHandle: synced.handle,
        verifiedCfRating: synced.rating,
        maxCfRating: synced.maxRating,
        rank: synced.rank,
      }));
      setCfAccount((prev) => (prev ? { ...prev, last_synced_at: synced.lastSyncedAt } : null));
    } catch (err: any) {
      alert(`Sync notice: ${err.message}`);
    }
  };

  const handleUnlinkCfAccount = async () => {
    try {
      await authService.unlinkCfAccount();
      setCfAccount(null);
      setProfile((prev) => ({
        ...prev,
        cfHandle: undefined,
        verifiedCfRating: undefined,
        maxCfRating: undefined,
        rank: undefined,
      }));
    } catch (err: any) {
      alert(`Unlink notice: ${err.message}`);
    }
  };

  const handleOpenVerification = (initialH?: string) => {
    setVerificationInitialHandle(initialH || profile.cfHandle || '');
    setShowVerificationModal(true);
  };

  // Sync state to storage
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    storageService.saveProfile(updated);
  };

  const handleUpdateGoal = (updated: UserGoal) => {
    setGoal(updated);
    storageService.saveGoal(updated);
  };

  const handleUpdateDailyPlan = (updated: DailyPlan) => {
    setDailyPlan(updated);
    storageService.saveDailyPlan(updated);
  };

  const handleAttemptLogged = (attempt: ProblemAttempt) => {
    setAttempts(storageService.getAttempts());
  };

  const handleSaveMistake = (mistake: MistakeRecord) => {
    storageService.saveMistake(mistake);
    setMistakes(storageService.getMistakes());
  };

  const handleDeleteMistake = (id: string) => {
    storageService.deleteMistake(id);
    setMistakes(storageService.getMistakes());
  };

  const handleResetAllData = () => {
    storageService.resetAll();
    setProfile(defaultProfile);
    setGoal(defaultGoal);
    setAttempts([]);
    setMistakes([]);
    setShowOnboarding(true);
    setActiveTab('dashboard');
  };

  // Listen for global keyboard shortcuts (Command palette, cheatsheet, quick tabs)
  useEffect(() => {
    let lastKey = '';
    let lastTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      const now = Date.now();
      if (lastKey === 'g' && now - lastTime < 1000) {
        const k = e.key.toLowerCase();
        if (k === 'd') { setActiveTab('dashboard'); }
        else if (k === 'p') { setActiveTab('problems'); }
        else if (k === 'w') { setActiveTab('workspace'); }
        else if (k === 'c') { setActiveTab('contests'); }
        else if (k === 'm') { setActiveTab('mistakes'); }
        else if (k === 's') { setActiveTab('skilltree'); }
        else if (k === 'a') { setActiveTab('coach'); }
        else if (k === 'l') { setActiveTab('solutions'); }
        else if (k === 'f') { setActiveTab('feed'); }
        else if (k === 'h') { setActiveTab('communities'); }
        else if (k === 'r') { setActiveTab('messages'); }
        else if (k === 'u') { setActiveTab('profile'); }
        lastKey = '';
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        lastKey = 'g';
        lastTime = now;
      } else {
        lastKey = '';
      }
    };

    const handleOpenPaletteEvent = () => setIsCommandPaletteOpen(true);

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('climb1600:open-command-palette', handleOpenPaletteEvent);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('climb1600:open-command-palette', handleOpenPaletteEvent);
    };
  }, []);

  const handleOpenWorkspaceWithCode = (code: string, problemNameOrId?: string) => {
    let matchedProb: CFProblem = {
      contestId: 1352,
      index: 'A',
      name: problemNameOrId || 'Imported Solution Practice',
      rating: 1000,
      tags: ['implementation'],
    };
    if (problemNameOrId) {
      const match = problemNameOrId.match(/^(\d+)([A-Za-z]\d?)$/);
      if (match) {
        matchedProb.contestId = parseInt(match[1], 10);
        matchedProb.index = match[2].toUpperCase();
        matchedProb.name = `Problem ${problemNameOrId}`;
      } else {
        matchedProb.name = problemNameOrId;
      }
    }
    const pid = `${matchedProb.contestId}${matchedProb.index}`;
    cfStorageService.saveDraft({
      problemId: pid,
      language: 'cpp20',
      code,
      updatedAt: new Date().toISOString(),
    });
    setWorkspaceInitialCode(code);
    setActiveProblem(matchedProb);
  };

  const handleAskCommunity = (
    code: string,
    probOrName: CFProblem | string,
    options?: { problemUrl?: string; verdict?: string; tags?: string[]; summary?: string }
  ) => {
    setActiveProblem(null);
    let title = '';
    let problemUrl: string | undefined = options?.problemUrl;
    let tags: string[] = options?.tags || ['question'];

    if (typeof probOrName === 'string') {
      title = options?.verdict
        ? `[${options.verdict}] Need help with ${probOrName}`
        : `Need help with ${probOrName}`;
    } else {
      title = options?.verdict
        ? `[${options.verdict}] Help on ${probOrName.name} (${probOrName.contestId || ''}${probOrName.index})`
        : `Help on ${probOrName.name} (${probOrName.contestId || ''}${probOrName.index})`;
      if (probOrName.contestId) {
        problemUrl = `https://codeforces.com/problemset/problem/${probOrName.contestId}/${probOrName.index}`;
      }
      if (probOrName.tags && probOrName.tags.length > 0) {
        tags = probOrName.tags;
      }
    }

    setFeedComposerPrefill({
      title,
      content: options?.summary
        ? `> ${options.summary}\n\nI got stuck on this problem. Could anyone review my approach or point out the bug?`
        : 'I got stuck on this problem. Could anyone review my approach or point out the bug?',
      codeSnippet: code || undefined,
      problemUrl,
      contentType: 'question',
      tags,
    });
    setActiveTab('feed');
  };

  const handleShareToCommunity = (code: string, titleOrName?: string, problemUrl?: string) => {
    setActiveProblem(null);
    setFeedComposerPrefill({
      title: titleOrName ? `Discussion: ${titleOrName}` : 'Shared Code Snippet',
      content: 'Sharing this code snippet with the community for discussion and benchmarking.',
      codeSnippet: code,
      problemUrl,
      contentType: 'general',
      tags: ['algorithms', 'code-review'],
    });
    setActiveTab('feed');
  };

  // Start today's mission directly from navbar or button
  const handleStartTodayMission = () => {
    const currentTopic = getTopicForDay(goal.currentDay);
    const prob = currentTopic.recommendedProblems[0];
    if (prob) {
      setActiveProblem(prob);
    } else {
      setActiveTab('learn');
    }
  };

  const handleStartRecoveryTask = (task: DailyTask, durationMinutes: number) => {
    const updatedPlan: DailyPlan = {
      ...dailyPlan,
      mode: 'minimum',
      targetMinutes: durationMinutes,
      tasks: [task, ...dailyPlan.tasks],
    };
    handleUpdateDailyPlan(updatedPlan);
  };

  const handleOpenCurriculumTopic = (topicId: string) => {
    setCurriculumSelectedTopicId(topicId);
    setActiveTab('learn');
  };

  const handleNotificationNavigation = (actionUrl: string) => {
    if (actionUrl.startsWith('/problems')) {
      setActiveTab('problems');
    } else if (actionUrl.startsWith('/contests')) {
      setActiveTab('contests');
    } else if (actionUrl.startsWith('/mistakes')) {
      setActiveTab('mistakes');
    } else if (actionUrl.startsWith('/analytics')) {
      setActiveTab('analytics');
    } else if (actionUrl.startsWith('/submissions')) {
      setActiveTab('submissions');
    } else if (actionUrl.startsWith('/guardian')) {
      setActiveTab('guardian');
    } else if (actionUrl.startsWith('/settings')) {
      setActiveTab('settings');
    } else if (actionUrl.startsWith('/learn')) {
      setActiveTab('learn');
    } else if (actionUrl.startsWith('/coach')) {
      setActiveTab('coach');
    } else if (actionUrl.startsWith('/playground')) {
      setActiveTab('playground');
    } else if (actionUrl.startsWith('/solutions')) {
      setActiveTab('solutions');
    } else if (actionUrl.startsWith('/skilltree')) {
      setActiveTab('skilltree');
    } else if (actionUrl.startsWith('/autopsy')) {
      setActiveTab('autopsy');
    } else if (actionUrl.startsWith('/feed')) {
      setActiveTab('feed');
    } else if (actionUrl.startsWith('/communities')) {
      const match = actionUrl.match(/\/communities\/([a-zA-Z0-9_-]+)/);
      if (match) {
        setFeedCommunitySlug(match[1]);
      }
      setActiveTab('communities');
    } else if (actionUrl.startsWith('/messages')) {
      const match = actionUrl.match(/\/messages\/([a-zA-Z0-9_-]+)/);
      if (match) {
        setDmTargetUserId(match[1]);
      }
      setActiveTab('messages');
    } else if (actionUrl.startsWith('/profile')) {
      setActiveTab('profile');
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t: (k) => t(k, lang) }}>
      <ToastProvider>
        <div className="min-h-screen bg-[var(--climb-bg-app,#0b0f19)] text-[var(--climb-text-main,#f1f5f9)] flex flex-col lg:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
          {/* Navigation */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            profile={profile}
            goal={goal}
            onOpenAntiProcrastination={() => setShowAntiProcrastination(true)}
            onStartTodayMission={handleStartTodayMission}
            isAuthenticated={!!authUser}
            userEmail={authUser?.email}
            isCfVerified={cfAccount?.verification_status === 'verified'}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenVerificationModal={() => handleOpenVerification()}
            onSignOut={handleSignOut}
            unreadNotificationCount={unreadNotificationCount}
            unreadMessageCount={unreadMessageCount}
            onOpenNotifications={() => setShowNotificationInbox(true)}
            onReplaySplash={() => handleReplaySplash(false)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
          />

      {/* Main Content Area */}
      <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-28 lg:pb-8 overflow-y-auto max-w-7xl mx-auto w-full safe-area-overlay">
        {activeTab === 'dashboard' && (
          <DashboardView
            goal={goal}
            profile={profile}
            dailyPlan={dailyPlan}
            onUpdateDailyPlan={handleUpdateDailyPlan}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onOpenAntiProcrastination={() => setShowAntiProcrastination(true)}
            onOpenCurriculumTopic={handleOpenCurriculumTopic}
            recentAttempts={attempts}
            mistakes={mistakes}
            onUpdateGoal={handleUpdateGoal}
            isAuthenticated={!!authUser}
            isCfVerified={cfAccount?.verification_status === 'verified'}
            cfAccount={cfAccount}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenVerificationModal={() => handleOpenVerification()}
            onSyncCfData={handleSyncCfData}
            onAttemptLogged={handleAttemptLogged}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'guardian' && (
          <GuardianView
            goal={goal}
            profile={profile}
            onSelectProblem={(prob) => setActiveProblem(prob)}
          />
        )}

        {activeTab === 'problems' && (
          <ProblemArenaView
            onSelectProblem={(prob) => setActiveProblem(prob)}
            attempts={attempts}
            currentRating={profile.verifiedCfRating}
          />
        )}

        {activeTab === 'playground' && (
          <PlaygroundView
            isAuthenticated={!!authUser}
            preferredLanguage={profile.preferredLanguage}
            onShareToCommunity={(code, lang) => handleShareToCommunity(code, `Playground Snippet (${lang})`)}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspaceView
            profile={profile}
            attempts={attempts}
            onAttemptLogged={handleAttemptLogged}
            onSaveMistake={handleSaveMistake}
            activeProblem={activeProblem}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onAskCommunity={(code, prob) => handleAskCommunity(code, prob)}
          />
        )}

        {activeTab === 'solutions' && (
          <SolutionLibraryView
            onOpenWorkspaceWithCode={handleOpenWorkspaceWithCode}
            onShareToCommunity={(code, name, url) => handleShareToCommunity(code, name, url)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardView />
        )}

        {activeTab === 'skilltree' && (
          <SkillTreeView
            attempts={attempts}
            mistakes={mistakes}
            userRating={profile.verifiedCfRating}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onOpenWorkspace={(prob) => setActiveProblem(prob)}
          />
        )}

        {activeTab === 'autopsy' && (
          <SubmissionAutopsyView
            cfHandle={profile.cfHandle}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onOpenWorkspace={(prob, code) => handleOpenWorkspaceWithCode(code || '', prob.name)}
            onSaveMistake={handleSaveMistake}
            onAskCommunity={(code, name, verdict, summary) =>
              handleAskCommunity(code, name, { verdict, summary })
            }
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsView
            cfHandle={profile.cfHandle}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onSaveMistake={handleSaveMistake}
          />
        )}

        {activeTab === 'contests' && (
          <ContestsView
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onOpenWorkspace={(prob) => setActiveProblem(prob)}
            mistakes={mistakes}
            userRating={profile.verifiedCfRating || 1000}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakeNotebookView
            mistakes={mistakes}
            onSaveMistake={handleSaveMistake}
            onDeleteMistake={handleDeleteMistake}
            onOpenWorkspaceWithCode={(code, name) => {
              handleOpenWorkspaceWithCode(code, name);
              setActiveTab('workspace');
            }}
            onAskCommunity={(code, name, why) => handleAskCommunity(code, name, { summary: why })}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            profile={profile}
            attempts={attempts}
          />
        )}

        {activeTab === 'cf-profile' && (
          <CodeforcesProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            isCfVerified={cfAccount?.verification_status === 'verified'}
            onOpenVerificationModal={(h) => handleOpenVerification(h)}
            targetRating={goal?.targetRating || 1600}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            onSaveMistake={handleSaveMistake}
          />
        )}

        {activeTab === 'learn' && (
          <CurriculumView
            currentDay={goal.currentDay}
            onSelectProblem={(prob) => setActiveProblem(prob)}
            selectedTopicId={curriculumSelectedTopicId}
            attempts={attempts}
          />
        )}

        {activeTab === 'coach' && (
          <AICoachView
            goal={goal}
            profile={profile}
            mistakes={mistakes}
            recentAttempts={attempts}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            goal={goal}
            profile={profile}
            attempts={attempts}
            mistakes={mistakes}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            goal={goal}
            profile={profile}
            onUpdateGoal={handleUpdateGoal}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
            isAuthenticated={!!authUser}
            userEmail={authUser?.email}
            isCfVerified={cfAccount?.verification_status === 'verified'}
            cfAccount={cfAccount}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenVerificationModal={() => handleOpenVerification()}
            onUnlinkCfAccount={handleUnlinkCfAccount}
            onSyncCfData={handleSyncCfData}
            onSignOut={handleSignOut}
            onReplaySplash={() => handleReplaySplash(false)}
          />
        )}

        {activeTab === 'icons' && (
          <IconSystemView />
        )}

        {activeTab === 'feed' && (
          <SocialFeedView
            currentUserId={authUser?.id}
            onOpenDirectMessage={(uid) => {
              setDmTargetUserId(uid);
              setActiveTab('messages');
            }}
            onNavigateToCommunities={() => setActiveTab('communities')}
            onOpenWorkspaceWithCode={(code, problemName) => {
              handleOpenWorkspaceWithCode(code, problemName);
              setActiveTab('workspace');
            }}
            initialCommunitySlug={feedCommunitySlug}
            initialComposerPrefill={feedComposerPrefill}
            onClearComposerPrefill={() => setFeedComposerPrefill(null)}
          />
        )}

        {activeTab === 'communities' && (
          <CommunityHubView
            currentUserId={authUser?.id}
            onSelectCommunityFeed={(slug) => {
              setFeedCommunitySlug(slug);
              setActiveTab('feed');
            }}
            onOpenDirectMessage={(uid) => {
              setDmTargetUserId(uid);
              setActiveTab('messages');
            }}
            onOpenWorkspaceWithCode={(code, problemName) => {
              handleOpenWorkspaceWithCode(code, problemName);
              setActiveTab('workspace');
            }}
          />
        )}

        {activeTab === 'messages' && (
          <DirectMessagesView
            currentUserId={authUser?.id}
            initialTargetUserId={dmTargetUserId}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenWorkspaceWithCode={(code, problemName) => {
              handleOpenWorkspaceWithCode(code, problemName);
              setActiveTab('workspace');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            currentProfile={profile}
            onUpdateProfile={handleUpdateProfile}
            onOpenDirectMessage={(uid) => {
              setDmTargetUserId(uid);
              setActiveTab('messages');
            }}
            isAuthenticated={!!authUser}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* App Entry & First-Time Download Splash Screen with Loading Bar */}
      {showSplash && (
        <AppSplashScreen
          onFinish={handleSplashFinish}
          isFirstTimeDownload={isFirstTimeDownload}
          canSkip={true}
        />
      )}

      {/* Onboarding Wizard Modal */}
      {!showSplash && showOnboarding && (
        <OnboardingModal
          initialGoal={goal}
          initialProfile={profile}
          onComplete={(newGoal, newProfile) => {
            handleUpdateGoal(newGoal);
            handleUpdateProfile(newProfile);
            setShowOnboarding(false);
          }}
          onSkip={() => {
            handleUpdateProfile({ ...profile, onboardingCompleted: true });
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Problem Solving Workspace Modal */}
      {activeProblem && (
        <ProblemWorkspaceModal
          problem={activeProblem}
          onClose={() => {
            setActiveProblem(null);
            setWorkspaceInitialCode(undefined);
          }}
          onAttemptLogged={handleAttemptLogged}
          preferredLanguage={profile.preferredLanguage}
          cfHandle={profile.cfHandle}
          onSaveMistake={handleSaveMistake}
          initialCode={workspaceInitialCode}
          onSelectProblem={(prob) => setActiveProblem(prob)}
          onAskCommunity={(code, prob) => handleAskCommunity(code, prob)}
          onAutopsyRequested={() => {
            setActiveProblem(null);
            setWorkspaceInitialCode(undefined);
            setActiveTab('autopsy');
          }}
        />
      )}

      {/* Anti-Procrastination Modal */}
      {showAntiProcrastination && (
        <AntiProcrastinationModal
          onClose={() => setShowAntiProcrastination(false)}
          currentTopicTitle={getTopicForDay(goal.currentDay).title}
          onStartTask={handleStartRecoveryTask}
        />
      )}

      {/* Auth Modal for Google Sign-In & Guest Exploration */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onContinueAsGuest={() => setShowAuthModal(false)}
        guestAttemptCount={attempts.length}
      />

      {/* Codeforces Ownership Challenge Verification Modal */}
      <CodeforcesVerificationModal
        isOpen={showVerificationModal}
        initialHandle={verificationInitialHandle}
        onClose={() => setShowVerificationModal(false)}
        onVerified={(verifiedAcc) => {
          setCfAccount((prev) => (prev ? { ...prev, ...verifiedAcc } : (verifiedAcc as UserCfAccount)));
          setProfile((prev) => ({
            ...prev,
            cfHandle: verifiedAcc.cf_handle || prev.cfHandle,
            verifiedCfRating: verifiedAcc.cf_rating ?? prev.verifiedCfRating,
            rank: verifiedAcc.cf_rank ?? prev.rank,
            avatar: verifiedAcc.cf_avatar ?? prev.avatar,
          }));
        }}
        onSkip={() => setShowVerificationModal(false)}
      />

      {/* Guest Progress Migration Modal */}
      <GuestMigrationModal
        isOpen={showGuestMigrationModal}
        onClose={() => {
          if (authUser) {
            localStorage.setItem(`climb1600_migrated_${authUser.id}`, 'skipped');
          }
          setShowGuestMigrationModal(false);
        }}
        onMigrated={() => {
          if (authUser) {
            localStorage.setItem(`climb1600_migrated_${authUser.id}`, 'migrated');
          }
        }}
        attemptsCount={attempts.length}
        mistakesCount={mistakes.length}
      />
      {/* Notification Center Inbox Modal */}
      <NotificationInboxModal
        isOpen={showNotificationInbox}
        onClose={() => setShowNotificationInbox(false)}
        onNavigate={handleNotificationNavigation}
        onUnreadCountChange={(cnt) => setUnreadNotificationCount(cnt)}
      />

      {/* Universal Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onSelectProblem={(prob) => {
          setActiveProblem(prob);
        }}
        onStartTodayMission={handleStartTodayMission}
        onOpenAntiProcrastination={() => setShowAntiProcrastination(true)}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onToggleLanguage={() => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))}
        onSyncCfData={handleSyncCfData}
        currentDay={goal.currentDay}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
    </ToastProvider>
  </TranslationContext.Provider>
  );
}
