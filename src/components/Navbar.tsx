import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { UserGoal, UserProfile } from '../types';
import { syncService, SyncStatus } from '../services/syncService';
import { pwaInstallService } from '../services/pwaInstallService';
import { useTranslation } from '../utils/i18n';
import {
  DashboardIcon,
  CodePlaygroundIcon,
  CodingBracketsIcon,
  CodeFileIcon,
  TopicMasteryIcon,
  DebugCodeIcon,
  ContestsIcon,
  BookmarksIcon,
  ProblemsIcon,
  SubmissionHistoryIcon,
  SynchronizationIcon,
  AnalyticsIcon,
  ProgressIcon,
  FocusModeIcon,
  LearningRoadmapIcon,
  AICoachIcon,
  SettingsIcon,
  NotificationBellIcon,
  NotificationUnreadIcon,
  SuggestOptimizationIcon,
  AISparkleIcon,
  SyncingStatusIcon,
  SyncCompleteStatusIcon,
  OfflineStatusIcon,
  DownloadIcon,
  GoogleIntegrationIcon,
  LogOutIcon,
  SecurityIcon,
  MoreHorizontalIcon,
  CloseIcon,
  TargetRatingIcon,
  SearchIcon,
  KeyboardIcon,
  ChatIcon,
  CommunityIcon,
  UserProfileIcon,
} from './icons';

export type TabId =
  | 'dashboard'
  | 'feed'
  | 'communities'
  | 'messages'
  | 'profile'
  | 'playground'
  | 'workspace'
  | 'solutions'
  | 'admin'
  | 'skilltree'
  | 'autopsy'
  | 'contests'
  | 'problems'
  | 'submissions'
  | 'mistakes'
  | 'analytics'
  | 'cf-profile'
  | 'learn'
  | 'coach'
  | 'guardian'
  | 'progress'
  | 'settings'
  | 'icons';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  profile: UserProfile;
  goal: UserGoal;
  onOpenAntiProcrastination: () => void;
  onStartTodayMission: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  isCfVerified?: boolean;
  onOpenAuthModal?: () => void;
  onOpenVerificationModal?: () => void;
  onSignOut?: () => void;
  unreadNotificationCount?: number;
  unreadMessageCount?: number;
  onOpenNotifications?: () => void;
  onReplaySplash?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  goal,
  onOpenAntiProcrastination,
  onStartTodayMission,
  isAuthenticated = false,
  userEmail,
  isCfVerified = false,
  onOpenAuthModal,
  onOpenVerificationModal,
  onSignOut,
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
  onOpenNotifications,
  onReplaySplash,
  onOpenCommandPalette,
  onOpenShortcutsModal,
}) => {
  const { t } = useTranslation();
  const [showMobileMore, setShowMobileMore] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncService.getStatus());
  const [canInstall, setCanInstall] = useState<boolean>(() => pwaInstallService.canInstall());

  useEffect(() => {
    const unsubSync = syncService.subscribe((status) => setSyncStatus(status));
    const unsubPwa = pwaInstallService.subscribe(() => setCanInstall(pwaInstallService.canInstall()));
    return () => {
      unsubSync();
      unsubPwa();
    };
  }, []);

  const navItems = [
    { id: 'dashboard' as TabId, label: 'Mission Control', icon: DashboardIcon },
    { id: 'feed' as TabId, label: 'Community Feed', icon: CommunityIcon },
    { id: 'communities' as TabId, label: 'Communities Hub', icon: TargetRatingIcon },
    { id: 'messages' as TabId, label: 'Direct Messages', icon: ChatIcon },
    { id: 'profile' as TabId, label: 'Social Profile', icon: UserProfileIcon },
    { id: 'playground' as TabId, label: 'Playground', icon: CodePlaygroundIcon },
    { id: 'workspace' as TabId, label: 'Workspace IDE', icon: CodingBracketsIcon },
    { id: 'solutions' as TabId, label: 'C++ Solution Library', icon: CodeFileIcon },
    { id: 'coach' as TabId, label: 'AI Socratic Coach', icon: AICoachIcon },
    { id: 'skilltree' as TabId, label: 'Skill Tree', icon: TopicMasteryIcon },
    { id: 'autopsy' as TabId, label: 'Submission Autopsy', icon: DebugCodeIcon },
    { id: 'contests' as TabId, label: 'Virtual Contests', icon: ContestsIcon },
    { id: 'mistakes' as TabId, label: 'Mistake Notebook', icon: BookmarksIcon },
    { id: 'problems' as TabId, label: 'Problem Explorer', icon: ProblemsIcon },
    { id: 'submissions' as TabId, label: 'Submissions', icon: SubmissionHistoryIcon },
    { id: 'admin' as TabId, label: 'Importer Admin', icon: SynchronizationIcon },
    { id: 'analytics' as TabId, label: '1600 Analytics', icon: AnalyticsIcon },
    { id: 'progress' as TabId, label: 'Mastery & Forecast', icon: ProgressIcon },
    { id: 'guardian' as TabId, label: t('nav.guardian'), icon: FocusModeIcon },
    { id: 'learn' as TabId, label: 'Training Plan', icon: LearningRoadmapIcon },
    { id: 'settings' as TabId, label: t('settings.title'), icon: SettingsIcon },
    { id: 'icons' as TabId, label: 'Icon System', icon: TopicMasteryIcon },
  ];

  const moreItems = [
    { id: 'feed' as TabId, label: 'Community Feed', icon: FocusModeIcon, desc: 'Public feed, questions, blogs, code & milestones' },
    { id: 'communities' as TabId, label: 'Communities Hub', icon: TargetRatingIcon, desc: 'Discover and join competitive programming groups' },
    { id: 'messages' as TabId, label: 'Direct Messages', icon: AISparkleIcon, desc: '1-to-1 real-time chat, code snippets & questions' },
    { id: 'profile' as TabId, label: 'Social Profile', icon: SecurityIcon, desc: 'Username, bio, rating, skills & published posts' },
    { id: 'playground' as TabId, label: 'Code Playground', icon: CodePlaygroundIcon, desc: 'Real compiler & runner for C, C++ & Python with AI debugging' },
    { id: 'solutions' as TabId, label: 'C++ Solution Library', icon: CodeFileIcon, desc: '5,000+ verified, permissively licensed solutions' },
    { id: 'admin' as TabId, label: 'Importer Admin', icon: SynchronizationIcon, desc: 'Pipeline telemetry, review queue & Supabase sync' },
    { id: 'skilltree' as TabId, label: 'Algorithm Skill Tree', icon: TopicMasteryIcon, desc: 'Interactive 23-topic prerequisite DAG map' },
    { id: 'autopsy' as TabId, label: 'Submission Autopsy', icon: DebugCodeIcon, desc: 'Root-cause analysis for WA/TLE/MLE/RE' },
    { id: 'contests' as TabId, label: 'Virtual Contest Arena', icon: ContestsIcon, desc: 'Past CF rounds simulation & strategy coach' },
    { id: 'analytics' as TabId, label: '1600 Analytics', icon: AnalyticsIcon, desc: 'Rating progress & topic radar' },
    { id: 'progress' as TabId, label: 'Mastery & Forecast', icon: ProgressIcon, desc: 'Theoretical rating & what-if simulator' },
    { id: 'guardian' as TabId, label: 'Study Guardian', icon: FocusModeIcon, desc: 'Distraction lock & focus session' },
    { id: 'learn' as TabId, label: 'Training Plan', icon: LearningRoadmapIcon, desc: '180-day structured roadmap' },
    { id: 'coach' as TabId, label: 'AI Socratic Coach', icon: AICoachIcon, desc: 'Adaptive coaching & hints' },
    { id: 'settings' as TabId, label: 'Settings & Goals', icon: SettingsIcon, desc: 'Preferences, time & handle' },
    { id: 'icons' as TabId, label: 'Icon System Specs', icon: TopicMasteryIcon, desc: 'Explore all 190+ design token icons' },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md p-4 shrink-0 h-screen sticky top-0 overflow-y-auto pt-[max(1rem,env(safe-area-inset-top,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]">
        <div className="space-y-5">
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <BrandLogo size="md" showTagline />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                aria-label="Direct Messages"
                className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  activeTab === 'messages'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Direct Messages"
              >
                <ChatIcon className="w-4 h-4" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </button>

              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  aria-label="Open notifications"
                  className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Notifications"
                >
                  {unreadNotificationCount > 0 ? (
                    <NotificationUnreadIcon size={18} semantic="error" />
                  ) : (
                    <NotificationBellIcon size={18} />
                  )}
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Universal Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-sm group"
              title="Search anything (Ctrl+K or Cmd+K)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <SearchIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">Search or jump to...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 group-hover:text-slate-300 shrink-0">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Start Card */}
          <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-b from-indigo-950/40 to-slate-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300">Day {goal.currentDay} / 180</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                Phase {goal.currentPhase}
              </span>
            </div>
            <button
              onClick={onStartTodayMission}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-3 text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <SuggestOptimizationIcon size={16} semantic="warning" />
              <span>Start Today's Mission</span>
            </button>
            <button
              onClick={onOpenAntiProcrastination}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <AISparkleIcon size={14} semantic="indigo" />
              <span>Stuck? 5-Minute Start</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon size={18} semantic={isActive ? 'indigo' : 'inherit'} />
                  <span>{item.label}</span>
                  {item.id === 'icons' && (
                    <span className="ml-auto text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded">NEW</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync & Connectivity Indicator */}
        <div className="px-2 pt-2">
          <button
            onClick={() => syncService.syncPendingQueue()}
            title={
              !syncStatus.isOnline
                ? 'Working Offline. Changes will sync automatically when reconnected.'
                : syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} local changes pending sync. Click to sync now.`
                : 'All local changes synchronized.'
            }
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  !syncStatus.isOnline
                    ? 'bg-amber-400'
                    : syncStatus.isSyncing
                    ? 'bg-indigo-400 animate-spin'
                    : syncStatus.pendingCount > 0
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-300 font-mono text-[10px]">
                {!syncStatus.isOnline
                  ? 'Offline Mode'
                  : syncStatus.isSyncing
                  ? 'Syncing...'
                  : syncStatus.pendingCount > 0
                  ? `${syncStatus.pendingCount} pending`
                  : 'Cloud Synced'}
              </span>
            </div>
            {syncStatus.isSyncing ? (
              <SyncingStatusIcon size={14} semantic="indigo" />
            ) : !syncStatus.isOnline ? (
              <OfflineStatusIcon size={14} semantic="warning" />
            ) : (
              <SyncCompleteStatusIcon size={14} semantic="success" />
            )}
          </button>

          {/* Optional App Download Action */}
          {canInstall && (
            <button
              onClick={() => pwaInstallService.promptInstall()}
              className="mt-2 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 hover:border-emerald-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <DownloadIcon size={14} semantic="success" />
                <span className="font-semibold">Download App</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-1 rounded text-emerald-300 font-mono">PWA</span>
            </button>
          )}

          {/* Replay Intro Animation */}
          {onReplaySplash && (
            <button
              onClick={onReplaySplash}
              title="Replay startup animation and loading bar"
              className="mt-1.5 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <AISparkleIcon size={14} semantic="info" />
                <span>Intro Animation</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">1600</span>
            </button>
          )}

          {/* Keyboard Shortcuts Trigger */}
          {onOpenShortcutsModal && (
            <button
              onClick={onOpenShortcutsModal}
              title="Keyboard Shortcuts Cheatsheet (Press ?)"
              className="mt-1.5 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <KeyboardIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Shortcuts</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">?</span>
            </button>
          )}
        </div>

        {/* User Handle Info / Verification footer */}
        <div className="border-t border-slate-800/80 pt-3 px-2 mt-4 space-y-2">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                      {(profile.name || userEmail || 'U')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-white truncate text-[11px]">{profile.name || 'User'}</span>
                    <span className="text-[10px] text-slate-400 truncate">{userEmail}</span>
                  </div>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <LogOutIcon size={16} semantic="error" />
                  </button>
                )}
              </div>

              {/* Codeforces handle badge */}
              <div className="flex items-center justify-between text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                {profile.cfHandle ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono font-medium text-slate-200 truncate">{profile.cfHandle}</span>
                    {isCfVerified ? (
                      <span className="rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1 py-0.2 uppercase">
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={onOpenVerificationModal}
                        className="rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[9px] font-bold px-1 py-0.2 uppercase cursor-pointer"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onOpenVerificationModal}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    <SecurityIcon size={14} semantic="success" />
                    <span>Link CF Handle</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  {profile.verifiedCfRating ? `${profile.verifiedCfRating}` : 'Unrated'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1 text-[11px]">
                  <span>Guest Practice</span>
                </span>
                <span className="text-[10px] text-slate-500">Local Only</span>
              </div>
              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <GoogleIntegrationIcon size={14} />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3.5 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pl-[max(0.875rem,env(safe-area-inset-left,0px))] pr-[max(0.875rem,env(safe-area-inset-right,0px))] shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo size="sm" />
          {/* Compact Sync Status Dot */}
          <button
            onClick={() => syncService.syncPendingQueue()}
            title={!syncStatus.isOnline ? 'Offline mode' : syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} pending sync` : 'Cloud synchronized'}
            className="flex items-center p-1 rounded-full hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Cloud sync status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !syncStatus.isOnline
                  ? 'bg-amber-400'
                  : syncStatus.isSyncing
                  ? 'bg-indigo-400 animate-spin'
                  : syncStatus.pendingCount > 0
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
          </button>
        </div>

        {/* Right Header Actions: Day Pill, Search, Notifications, Profile/Auth */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Day & Target Badge */}
          <button
            onClick={onStartTodayMission}
            className="flex items-center gap-1 bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-500/40 px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-300 hover:border-indigo-400 transition-all cursor-pointer shadow-xs"
            title="Start Today's Mission"
          >
            <SuggestOptimizationIcon size={13} semantic="warning" />
            <span className="font-mono">D{goal.currentDay}</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-mono">1600</span>
          </button>

          {/* Search / Command Palette */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer"
              title="Search or jump to... (Ctrl+K)"
              aria-label="Search"
            >
              <SearchIcon className="w-4 h-4 text-slate-300" />
            </button>
          )}

          {/* Notifications Bell */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open notifications"
              className="relative p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer"
              title="Notifications"
            >
              {unreadNotificationCount > 0 ? (
                <NotificationUnreadIcon size={17} semantic="error" />
              ) : (
                <NotificationBellIcon size={17} />
              )}
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Avatar / Auth */}
          {isAuthenticated ? (
            <button
              onClick={() => setActiveTab('profile')}
              className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-[10px] font-bold text-indigo-300 overflow-hidden cursor-pointer shadow-xs"
              title={profile.name || userEmail || 'Profile'}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(profile.name || userEmail || 'U')[0]?.toUpperCase()}</span>
              )}
            </button>
          ) : onOpenAuthModal ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2 py-1 text-[11px] font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <GoogleIntegrationIcon size={13} />
              <span>Login</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Mobile Bottom Navigation with Safe Area Padding */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] px-1"
      >
        {[
          { id: 'dashboard' as TabId, label: 'Dash', icon: DashboardIcon },
          { id: 'feed' as TabId, label: 'Feed', icon: CommunityIcon },
          { id: 'problems' as TabId, label: 'Problems', icon: ProblemsIcon },
          { id: 'workspace' as TabId, label: 'Code', icon: CodingBracketsIcon },
          { id: 'messages' as TabId, label: 'Chat', icon: ChatIcon, badge: unreadMessageCount },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setShowMobileMore(false);
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400 font-bold bg-indigo-950/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={18} semantic={isActive ? 'indigo' : 'inherit'} />
                {!!(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Mobile More Button */}
        <button
          onClick={() => setShowMobileMore((v) => !v)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            showMobileMore || ['contests', 'analytics', 'progress', 'guardian', 'learn', 'coach', 'mistakes', 'settings'].includes(activeTab)
              ? 'text-cyan-400 font-bold bg-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontalIcon size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Sheet / App Hub Drawer */}
      {showMobileMore && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 safe-area-overlay">
          <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
            {/* Drawer Drag Bar & Header */}
            <div className="flex flex-col items-center gap-1.5 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-800 shrink-0" />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <TargetRatingIcon size={18} semantic="indigo" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">CLIMB 1600 Hub</h3>
                  <p className="text-[11px] text-slate-400">Explore all training modules & tools</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMore(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close hub"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Quick Hero Banner inside Mobile Drawer */}
            <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900 p-3.5 flex items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Day {goal.currentDay} / 180</span>
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.2 text-[9px] font-bold text-indigo-300">
                    Phase {goal.currentPhase}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">Specialist Rating 1600 Trajectory</p>
              </div>

              <button
                onClick={() => {
                  onOpenAntiProcrastination();
                  setShowMobileMore(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
              >
                <AISparkleIcon size={14} semantic="warning" />
                <span>5-Min Start</span>
              </button>
            </div>

            {/* Categorized Visual Grid */}
            <div className="space-y-4">
              {/* Category 1: Core Practice */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Core Practice & Curriculum
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dashboard' as TabId, label: 'Mission Control', icon: DashboardIcon, badge: 'Home' },
                    { id: 'problems' as TabId, label: 'Problem Arena', icon: ProblemsIcon, badge: 'Archive' },
                    { id: 'learn' as TabId, label: '180D Curriculum', icon: LearningRoadmapIcon, badge: 'Roadmap' },
                    { id: 'workspace' as TabId, label: 'Workspace IDE', icon: CodingBracketsIcon, badge: 'Code' },
                    { id: 'solutions' as TabId, label: 'C++ Solutions', icon: CodeFileIcon, badge: '5,000+' },
                    { id: 'playground' as TabId, label: 'Code Playground', icon: CodePlaygroundIcon, badge: 'Run' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMore(false);
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold shadow-xs'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{item.label}</p>
                          <span className="text-[9px] text-slate-400 block truncate">{item.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Contests & Mastery */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Contests & Diagnostics
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'contests' as TabId, label: 'Virtual Contests', icon: ContestsIcon, badge: 'Rounds' },
                    { id: 'mistakes' as TabId, label: 'Mistake Notebook', icon: BookmarksIcon, badge: 'SM-2 Recall' },
                    { id: 'autopsy' as TabId, label: 'Submission Autopsy', icon: DebugCodeIcon, badge: 'Bug Fix' },
                    { id: 'skilltree' as TabId, label: 'Skill Tree DAG', icon: TopicMasteryIcon, badge: '23 Topics' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMore(false);
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-xs'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{item.label}</p>
                          <span className="text-[9px] text-slate-400 block truncate">{item.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: Analytics, Coach & Focus */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Growth & Coaching
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'coach' as TabId, label: 'AI Socratic Coach', icon: AICoachIcon, badge: 'Hints' },
                    { id: 'analytics' as TabId, label: '1600 Analytics', icon: AnalyticsIcon, badge: 'Stats' },
                    { id: 'progress' as TabId, label: 'Mastery Forecast', icon: ProgressIcon, badge: 'Trajectory' },
                    { id: 'guardian' as TabId, label: 'Study Guardian', icon: FocusModeIcon, badge: 'Focus Lock' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMore(false);
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 font-bold shadow-xs'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{item.label}</p>
                          <span className="text-[9px] text-slate-400 block truncate">{item.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 4: Community & Settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Community & App
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'communities' as TabId, label: 'Community Hub', icon: TargetRatingIcon, badge: 'Groups' },
                    { id: 'profile' as TabId, label: 'Social Profile', icon: UserProfileIcon, badge: 'Account' },
                    { id: 'settings' as TabId, label: 'Settings & Goals', icon: SettingsIcon, badge: 'Configs' },
                    { id: 'icons' as TabId, label: 'Icon System', icon: TopicMasteryIcon, badge: '190+ Icons' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMore(false);
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold shadow-xs'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{item.label}</p>
                          <span className="text-[9px] text-slate-400 block truncate">{item.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile App Install & Intro Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              {canInstall && (
                <button
                  onClick={() => {
                    pwaInstallService.promptInstall();
                    setShowMobileMore(false);
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  <DownloadIcon size={16} semantic="success" />
                  <span>Download PWA</span>
                </button>
              )}
              {onReplaySplash && (
                <button
                  onClick={() => {
                    onReplaySplash();
                    setShowMobileMore(false);
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-semibold text-xs hover:border-cyan-500/50 transition-all cursor-pointer ${
                    !canInstall ? 'col-span-2' : ''
                  }`}
                >
                  <AISparkleIcon size={16} semantic="info" />
                  <span>Replay Intro</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
