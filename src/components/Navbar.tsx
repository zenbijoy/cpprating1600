import React, { useState, useEffect, useRef } from 'react';
import { BrandLogo } from './BrandLogo';
import { UserGoal, UserProfile } from '../types';
import { syncService, SyncStatus } from '../services/syncService';
import { pwaInstallService } from '../services/pwaInstallService';
import { useTranslation } from '../utils/i18n';
import { soundEffects } from '../utils/soundEffects';
import { storageService } from '../services/storage';
import { gameRewardService } from '../services/gameRewardService';
import { ANIME_CHARACTERS } from './assets/MascotAndStickers';
import { THEME_METADATA } from '../utils/themeEngine';
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
  SidebarControlIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DropdownIcon,
} from './icons';

export type TabId =
  | 'dashboard'
  | 'games'
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

export interface NavbarProps {
  children?: React.ReactNode;
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
  onOpenDailyRewards?: () => void;
  onOpenDailyFortune?: () => void;
  onOpenProblemSpinner?: () => void;
  onReplaySplash?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  children,
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
  onOpenDailyRewards,
  onOpenDailyFortune,
  onOpenProblemSpinner,
  onReplaySplash,
  onOpenCommandPalette,
  onOpenShortcutsModal,
}) => {
  const { t } = useTranslation();
  const [showMobileMore, setShowMobileMore] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncService.getStatus());
  const [canInstall, setCanInstall] = useState<boolean>(() => pwaInstallService.canInstall());
  const [coins, setCoins] = useState(() => gameRewardService.getCoins());
  const [hasUnclaimedDaily, setHasUnclaimedDaily] = useState(() => !gameRewardService.hasClaimedDailyToday());
  const [fortune, setFortune] = useState(() => gameRewardService.getDailyFortune());
  const [isSoundMuted, setIsSoundMuted] = useState(() => soundEffects.isMuted());

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setCoins(gameRewardService.getCoins());
      setHasUnclaimedDaily(!gameRewardService.hasClaimedDailyToday());
      setFortune(gameRewardService.getDailyFortune());
    });
  }, []);

  // Interactive Hideable & Collapsible Sidebar state
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('climb1600_sidebar_hidden') === 'true';
    } catch {
      return false;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('climb1600_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Top Navbar auto-hide on down-scroll and reveal with animation on up-scroll
  const [isNavbarVisible, setIsNavbarVisible] = useState<boolean>(true);
  const lastScrollYRef = useRef<number>(0);

  // Initialize and keep top navbar visible whenever active tab changes
  useEffect(() => {
    setIsNavbarVisible(true);
    lastScrollYRef.current = typeof window !== 'undefined' ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;
  }, [activeTab]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = (e?: Event) => {
      // Ignore scroll events originating from nested modals, code editors, or internal dropdown lists
      if (e && e.target && e.target !== document && e.target !== window) {
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
          const scrollDelta = currentScrollY - lastScrollYRef.current;

          // Keep navbar visible if dropdown menus or mobile drawers are open
          if (showProfileDropdown || showMobileMore) {
            setIsNavbarVisible(true);
            lastScrollYRef.current = currentScrollY;
            ticking = false;
            return;
          }

          // Near top of page, always show navbar
          if (currentScrollY <= 15) {
            setIsNavbarVisible(true);
            lastScrollYRef.current = currentScrollY;
          } else {
            // Threshold-based direction detection with accumulation
            if (scrollDelta > 6 && currentScrollY > 60) {
              // Scrolling down: vanish
              setIsNavbarVisible(false);
              lastScrollYRef.current = currentScrollY;
            } else if (scrollDelta < -6) {
              // Scrolling up: animate back in
              setIsNavbarVisible(true);
              lastScrollYRef.current = currentScrollY;
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [showProfileDropdown, showMobileMore]);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sync services subscription
  useEffect(() => {
    const unsubSync = syncService.subscribe((status) => setSyncStatus(status));
    const unsubPwa = pwaInstallService.subscribe(() => setCanInstall(pwaInstallService.canInstall()));
    return () => {
      unsubSync();
      unsubPwa();
    };
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar, and Escape to dismiss popups
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileDropdown(false);
        setShowMobileMore(false);
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.monaco-editor'))
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dismiss profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const toggleSidebar = () => {
    soundEffects.playPop();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowMobileMore((prev) => !prev);
      return;
    }

    // If sidebar is hidden OR collapsed (rail mode without text):
    // Open and expand it to full width WITH text!
    if (isSidebarHidden || isSidebarCollapsed) {
      setIsSidebarHidden(false);
      setIsSidebarCollapsed(false);
      try {
        localStorage.setItem('climb1600_sidebar_hidden', 'false');
        localStorage.setItem('climb1600_sidebar_collapsed', 'false');
      } catch {}
    } else {
      // Sidebar is fully open with text: hide it
      setIsSidebarHidden(true);
      try {
        localStorage.setItem('climb1600_sidebar_hidden', 'true');
      } catch {}
    }
  };

  const toggleSidebarCollapsed = () => {
    soundEffects.playPop();
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('climb1600_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleSelectTab = (tab: TabId) => {
    soundEffects.playPop();
    setActiveTab(tab);
    setShowMobileMore(false);
    setShowProfileDropdown(false);
  };

  const navSections = [
    {
      title: 'Core Practice',
      colorDot: 'bg-emerald-500',
      items: [
        { id: 'dashboard' as TabId, label: 'Mission Control', icon: DashboardIcon, color: 'text-emerald-500 dark:text-emerald-400' },
        { id: 'learn' as TabId, label: '180D Curriculum', icon: LearningRoadmapIcon, color: 'text-cyan-500 dark:text-cyan-400' },
        { id: 'problems' as TabId, label: 'Problem Arena', icon: ProblemsIcon, color: 'text-blue-500 dark:text-blue-400' },
        { id: 'workspace' as TabId, label: 'Workspace IDE', icon: CodingBracketsIcon, color: 'text-indigo-500 dark:text-indigo-400' },
        { id: 'solutions' as TabId, label: 'C++ Solutions', icon: CodeFileIcon, color: 'text-teal-500 dark:text-teal-400' },
      ],
    },
    {
      title: 'Contests & Diagnostics',
      colorDot: 'bg-amber-400',
      items: [
        { id: 'contests' as TabId, label: 'Virtual Contests', icon: ContestsIcon, color: 'text-amber-500 dark:text-amber-400' },
        { id: 'mistakes' as TabId, label: 'Mistake Notebook', icon: BookmarksIcon, color: 'text-rose-500 dark:text-rose-400' },
        { id: 'autopsy' as TabId, label: 'Submission Autopsy', icon: DebugCodeIcon, color: 'text-orange-500 dark:text-orange-400' },
        { id: 'skilltree' as TabId, label: 'Skill Tree DAG', icon: TopicMasteryIcon, color: 'text-emerald-500 dark:text-emerald-400' },
        { id: 'submissions' as TabId, label: 'Submissions History', icon: SubmissionHistoryIcon, color: 'text-slate-500 dark:text-slate-400' },
      ],
    },
    {
      title: 'AI Coach & Growth',
      colorDot: 'bg-cyan-400',
      items: [
        { id: 'coach' as TabId, label: 'AI Socratic Coach', icon: AICoachIcon, color: 'text-purple-500 dark:text-purple-400' },
        { id: 'games' as TabId, label: '🎮 3 Logic Games', icon: CodePlaygroundIcon, color: 'text-amber-500 dark:text-amber-400', badge: 'Play' },
        { id: 'analytics' as TabId, label: '1600 Analytics', icon: AnalyticsIcon, color: 'text-cyan-500 dark:text-cyan-400' },
        { id: 'progress' as TabId, label: 'Mastery & Forecast', icon: ProgressIcon, color: 'text-blue-500 dark:text-blue-400' },
        { id: 'guardian' as TabId, label: t('nav.guardian'), icon: FocusModeIcon, color: 'text-teal-500 dark:text-teal-400' },
        { id: 'playground' as TabId, label: 'Code Playground', icon: CodePlaygroundIcon, color: 'text-amber-500 dark:text-amber-400' },
      ],
    },
    {
      title: 'Community & App',
      colorDot: 'bg-purple-400',
      items: [
        { id: 'feed' as TabId, label: 'Community Feed', icon: CommunityIcon, color: 'text-indigo-500 dark:text-indigo-400' },
        { id: 'communities' as TabId, label: 'Communities Hub', icon: TargetRatingIcon, color: 'text-cyan-500 dark:text-cyan-400' },
        { id: 'messages' as TabId, label: 'Direct Messages', icon: ChatIcon, color: 'text-purple-500 dark:text-purple-400', badge: unreadMessageCount },
        { id: 'profile' as TabId, label: 'Social Profile', icon: UserProfileIcon, color: 'text-blue-500 dark:text-blue-400' },
        { id: 'settings' as TabId, label: t('settings.title'), icon: SettingsIcon, color: 'text-slate-500 dark:text-slate-400' },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      {/* =========================================================================
          TOP NAVBAR: Always at top with Brand, Sidebar Toggle, Mission, Search,
          and on the RIGHT SIDE: Notification, Settings, and Login / User Profile.
          Disappears on downward scrolling and animates smoothly back in on upward scroll.
         ========================================================================= */}
      <header
        onFocus={() => setIsNavbarVisible(true)}
        className={`sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 sm:px-5 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top,0px))] flex items-center justify-between gap-3 shadow-md transition-all duration-300 ease-in-out transform will-change-transform ${
          isNavbarVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Left Side: Sidebar Toggle + Brand Logo + Mission Pill + Search */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Interactive Sidebar Toggle / Hide Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarHidden || isSidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs interactive-button group ${
              !isSidebarHidden && !isSidebarCollapsed
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 hover:bg-indigo-500 ring-1 ring-indigo-400/40'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50'
            }`}
            title={
              !isSidebarHidden && !isSidebarCollapsed
                ? 'Hide navigation sidebar (Ctrl+B)'
                : 'Show navigation sidebar with menu (Ctrl+B)'
            }
          >
            <SidebarControlIcon
              size={19}
              className={`transition-transform duration-200 ${
                !isSidebarHidden && !isSidebarCollapsed
                  ? 'text-white'
                  : 'text-slate-700 dark:text-slate-200 group-hover:scale-110 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}
            />
          </button>

          {/* Brand Logo */}
          <div
            onClick={() => handleSelectTab('dashboard')}
            className="cursor-pointer transition-transform hover:scale-[1.02] shrink-0"
            title="Go to Mission Control"
          >
            <BrandLogo size="sm" showTagline={false} />
          </div>

          {/* Day & Target Badge (Quick Mission pill) */}
          <button
            onClick={onStartTodayMission}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-500/40 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300 hover:border-indigo-400 hover:brightness-110 transition-all cursor-pointer shadow-xs shimmer-sheen"
            title="Start Today's Mission"
          >
            <SuggestOptimizationIcon size={14} semantic="warning" className="animate-bounce-subtle" />
            <span className="font-mono">Day {goal.currentDay}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-mono">1600 Target</span>
          </button>

          {/* Universal Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-xs group"
              title="Search anything (Ctrl+K or Cmd+K)"
            >
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-transform group-hover:scale-110" />
              <span className="truncate max-w-[140px] xl:max-w-[200px]">Search or jump to...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 group-hover:text-slate-300 shrink-0">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Right Side: Notifications + Settings + Login / Profile (Spacious & Comfortable) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Mobile Search Button */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              aria-label="Search"
              className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer"
              title="Search or jump to... (Ctrl+K)"
            >
              <SearchIcon className="w-4 h-4 text-slate-300" />
            </button>
          )}

          {/* Cloud Sync Status Indicator */}
          <button
            onClick={() => syncService.syncPendingQueue()}
            title={
              !syncStatus.isOnline
                ? 'Working Offline. Click to attempt sync.'
                : syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} local changes pending sync. Click to sync now.`
                : 'All changes synchronized to cloud.'
            }
            className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
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
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
              {!syncStatus.isOnline
                ? 'Offline'
                : syncStatus.isSyncing
                ? 'Syncing'
                : syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} pend`
                : 'Synced'}
            </span>
          </button>

          {/* Wheel of Destiny Spinner Trigger */}
          {onOpenProblemSpinner && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpenProblemSpinner();
              }}
              aria-label="Spin Problem Wheel"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 dark:bg-pink-500/20 dark:hover:bg-pink-500/35 border border-pink-300 dark:border-pink-400/30 text-xs font-black text-pink-800 dark:text-pink-300 transition-all cursor-pointer shadow-xs interactive-button"
              title="Spin Problem Wheel for Rewards and Mystery Gifts"
            >
              <span className="text-sm">🎡</span>
              <span className="hidden xl:inline">Spinner</span>
            </button>
          )}

          {/* Daily Login Rewards Trigger */}
          {onOpenDailyRewards && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpenDailyRewards();
              }}
              aria-label="Everyday Login Rewards"
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs interactive-button ${
                hasUnclaimedDaily
                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/25 dark:hover:bg-amber-500/40 border border-amber-300 dark:border-amber-400 text-amber-800 dark:text-amber-300 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Everyday Login Rewards & Lore"
            >
              <span className="text-sm">🎁</span>
              <span className="hidden xl:inline">Daily Gifts</span>
              {hasUnclaimedDaily && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

          {/* Daily Code Fortune & Prophecy */}
          {onOpenDailyFortune && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playSparkle();
                onOpenDailyFortune();
              }}
              aria-label="Daily Code Fortune"
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs interactive-button ${
                !fortune.cracked
                  ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/25 dark:hover:bg-purple-500/40 border border-purple-300 dark:border-purple-400 text-purple-800 dark:text-purple-300 animate-pulse'
                  : 'bg-purple-50 dark:bg-slate-900/80 hover:bg-purple-100 dark:hover:bg-slate-800 border border-purple-200 dark:border-slate-800 text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white'
              }`}
              title="Today's Algorithmic Fortune & Power Buff"
            >
              <span className="text-sm">🥠</span>
              <span className="hidden xl:inline">Fortune</span>
              {!fortune.cracked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              )}
            </button>
          )}

          {/* Sound FX Toggle with Audio Feedback */}
          <button
            type="button"
            onClick={() => {
              const muted = soundEffects.toggleMute();
              setIsSoundMuted(muted);
            }}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all shadow-xs interactive-button ${
              isSoundMuted
                ? 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                : 'bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-300'
            }`}
            title={isSoundMuted ? 'Sound FX Muted (Click to turn sound on)' : 'Sound FX Active (Click to mute)'}
          >
            <span>{isSoundMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Coin Pouch Indicator */}
          <button
            type="button"
            onClick={() => handleSelectTab('games')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-black transition-all cursor-pointer shadow-xs"
            title="Coin Pouch: Click to play 3 Logic Games!"
          >
            <span>🪙</span>
            <span className="font-mono">{coins.toLocaleString()}</span>
          </button>

          {/* Direct Messages Quick Action */}
          <button
            type="button"
            onClick={() => handleSelectTab('messages')}
            aria-label="Direct Messages"
            className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-xs interactive-button ${
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Direct Messages"
          >
            <ChatIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center animate-pop-spring shadow-xs">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </button>

          {/* Notification Bell (Explicitly requested in top right) */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpenNotifications();
              }}
              aria-label="Open notifications"
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs interactive-button group"
              title={`Notifications${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}`}
            >
              {unreadNotificationCount > 0 ? (
                <NotificationUnreadIcon size={18} semantic="error" className="animate-jiggle" />
              ) : (
                <NotificationBellIcon size={18} className="group-hover:scale-110 transition-transform" />
              )}
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pop-spring shadow-xs">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Active Anime Hero Companion Indicator */}
          {(() => {
            const currentSettings = storageService.getSettings();
            const charId = currentSettings?.theme?.selectedCharacter || 'climby';
            const presetId = currentSettings?.theme?.preset || 'climb-default';
            const charMeta = ANIME_CHARACTERS.find((c) => c.id === charId) || ANIME_CHARACTERS[0];
            const themeMeta = THEME_METADATA[presetId] || { icon: '🏔️' };
            return (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playPop();
                  handleSelectTab('settings');
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-800 dark:text-amber-300 transition-all cursor-pointer shadow-xs interactive-button group"
                title={`Active Hero: ${charMeta.name} | Realm: ${presetId} (Click to change in Settings)`}
              >
                <span className="text-sm group-hover:scale-125 transition-transform">{charMeta.avatarEmoji}</span>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 hidden md:inline">{charMeta.name.split(' ')[0]}</span>
                <span className="text-xs opacity-75">{themeMeta.icon}</span>
              </button>
            );
          })()}

          {/* Settings Button (Explicitly requested in top right) */}
          <button
            type="button"
            onClick={() => handleSelectTab('settings')}
            aria-label="Open settings"
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs interactive-button group ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Settings & Goals"
          >
            <SettingsIcon size={18} className="transition-transform group-hover:rotate-45" />
          </button>

          {/* Login / User Profile (Explicitly requested in top right) */}
          <div className="relative" ref={profileMenuRef}>
            {isAuthenticated ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playPop();
                    setShowProfileDropdown((v) => !v);
                  }}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition-all cursor-pointer shadow-xs group"
                  aria-label="User profile menu"
                  title={profile.name || userEmail || 'User Profile'}
                >
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="avatar"
                      className="w-7 h-7 rounded-full border border-slate-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
                      {(profile.name || userEmail || 'U')[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="hidden md:flex flex-col text-left min-w-0 max-w-[110px]">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                      {profile.name || userEmail?.split('@')[0] || 'Coder'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate leading-tight">
                      {profile.cfHandle || (profile.verifiedCfRating ? `${profile.verifiedCfRating}` : '1600 Quest')}
                    </span>
                  </div>

                  <DropdownIcon size={14} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform" />
                </button>

                {/* Profile Dropdown Card */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/90 shadow-2xl p-3 space-y-3 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Summary Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-indigo-500/40 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-sm font-bold text-white shadow-md">
                          {(profile.name || userEmail || 'U')[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile.name || 'Competitive Programmer'}</h4>
                        <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                      </div>
                    </div>

                    {/* Codeforces status badge */}
                    <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-medium text-slate-200 truncate">
                          {profile.cfHandle || 'No CF Handle'}
                        </span>
                        {profile.cfHandle && isCfVerified ? (
                          <span className="rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 uppercase">
                            Verified
                          </span>
                        ) : profile.cfHandle ? (
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              onOpenVerificationModal?.();
                            }}
                            className="rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 uppercase cursor-pointer"
                          >
                            Verify
                          </button>
                        ) : null}
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {profile.verifiedCfRating ? `${profile.verifiedCfRating}` : 'Unrated'}
                      </span>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSelectTab('profile')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                      >
                        <UserProfileIcon size={16} className="text-indigo-400" />
                        <span>Social Profile & Portfolio</span>
                      </button>

                      <button
                        onClick={() => handleSelectTab('messages')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ChatIcon className="w-4 h-4 text-purple-400" />
                          <span>Direct Messages</span>
                        </div>
                        {unreadMessageCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                            {unreadMessageCount}
                          </span>
                        )}
                      </button>

                      {onOpenVerificationModal && (
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onOpenVerificationModal();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                        >
                          <SecurityIcon size={16} className="text-cyan-400" />
                          <span>{profile.cfHandle ? 'Verify / Sync Codeforces' : 'Link Codeforces Account'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSelectTab('settings')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                      >
                        <SettingsIcon size={16} className="text-slate-400" />
                        <span>Settings & Goal Preferences</span>
                      </button>

                      {onOpenShortcutsModal && (
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onOpenShortcutsModal();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <KeyboardIcon className="w-4 h-4 text-slate-400" />
                            <span>Shortcuts Cheatsheet</span>
                          </div>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">?</kbd>
                        </button>
                      )}
                    </div>

                    {/* Sign Out Option */}
                    {onSignOut && (
                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onSignOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all text-left cursor-pointer"
                        >
                          <LogOutIcon size={16} semantic="error" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated / Guest State */
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Guest</span>
                </span>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playPop();
                      onOpenAuthModal();
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer shimmer-sheen"
                  >
                    <GoogleIntegrationIcon size={14} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          BODY AREA: Collapsible & Interactive Sidebar + Main Content Slot
         ========================================================================= */}
      <div className="flex flex-1 w-full min-h-0 relative">
        {/* Desktop Left Sidebar: Can be hidden completely, or collapsed to compact rail */}
        {!isSidebarHidden && (
          <aside
            className={`hidden lg:flex flex-col justify-between border-r border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/70 backdrop-blur-md shrink-0 sticky overflow-y-auto transition-all duration-300 ease-in-out pl-[max(0.75rem,env(safe-area-inset-left,0px))] animate-in fade-in slide-in-from-left-4 ${
              isSidebarCollapsed ? 'w-20 p-2 items-center' : 'w-64 p-3.5'
            } ${
              isNavbarVisible ? 'top-14 h-[calc(100vh-3.5rem)]' : 'top-0 h-screen'
            }`}
          >
            <div className="space-y-4 w-full">
              {/* Quick Start Card (Full vs Mini) */}
              {isSidebarCollapsed ? (
                <div className="flex flex-col items-center gap-1 pt-1 pb-2">
                  <button
                    onClick={onStartTodayMission}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-600 border border-indigo-400/40 flex flex-col items-center justify-center text-white shadow-md shadow-indigo-600/30 hover:brightness-110 transition-all cursor-pointer group relative"
                    title={`Day ${goal.currentDay} / 180 - Click to start today's mission`}
                  >
                    <span className="text-[10px] font-black uppercase text-indigo-200">D{goal.currentDay}</span>
                    <SuggestOptimizationIcon size={14} semantic="warning" className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-indigo-900/40 bg-gradient-to-b from-indigo-950/40 to-slate-900/60 p-3 space-y-2 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300">Day {goal.currentDay} / 180</span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 animate-pulse-subtle">
                      Phase {goal.currentPhase}
                    </span>
                  </div>
                  <button
                    onClick={onStartTodayMission}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white font-medium py-2 px-3 text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer shimmer-sheen interactive-button"
                  >
                    <SuggestOptimizationIcon size={16} semantic="warning" className="animate-bounce-subtle" />
                    <span>Start Today's Mission</span>
                  </button>
                  <button
                    onClick={onOpenAntiProcrastination}
                    className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-0.5 cursor-pointer hover:underline"
                  >
                    <AISparkleIcon size={14} semantic="indigo" className="animate-spin-slow" />
                    <span>Stuck? 5-Minute Start</span>
                  </button>
                </div>
              )}

              {/* Categorized Navigation */}
              <nav className="space-y-4 pt-1 w-full" aria-label="Main Navigation">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1 w-full">
                    {/* Section Header */}
                    {isSidebarCollapsed ? (
                      <div className="flex items-center justify-center py-1">
                        <span className={`w-2 h-2 rounded-full ${section.colorDot} opacity-70`} title={section.title} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <span className={`w-2 h-2 rounded-full ${section.colorDot} shrink-0`} />
                        <span>{section.title}</span>
                      </div>
                    )}

                    {/* Navigation Items */}
                    <div className="space-y-0.5 w-full">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        if (isSidebarCollapsed) {
                          return (
                            <div key={item.id} className="relative group w-full flex justify-center py-0.5">
                              <button
                                onClick={() => handleSelectTab(item.id)}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative active:scale-95 ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/35 ring-1 ring-white/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850'
                                }`}
                                aria-label={item.label}
                              >
                                <Icon size={19} className={isActive ? 'text-white' : item.color} />
                                {!!(item.badge && item.badge > 0) && (
                                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-[9px] font-black text-white flex items-center justify-center">
                                    {item.badge > 9 ? '9+' : item.badge}
                                  </span>
                                )}
                              </button>

                              {/* Hover Tooltip when collapsed */}
                              <div className="hidden group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-white shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                                <span>{item.label}</span>
                                {!!(item.badge && item.badge > 0) && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] text-white">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer group hover:translate-x-1 active:scale-[0.98] ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/35 ring-1 ring-white/20'
                                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <div
                              className={`p-1 rounded-lg shrink-0 transition-transform duration-200 ${
                                isActive ? 'text-white' : `${item.color} group-hover:scale-125 group-hover:rotate-6`
                              }`}
                            >
                              <Icon size={17} />
                            </div>
                            <span className="truncate flex-1">{item.label}</span>
                            {!!(item.badge && item.badge > 0) && (
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                                  isActive ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white animate-pulse'
                                }`}
                              >
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Sidebar Bottom Controls: Collapse Toggle + PWA + Shortcuts */}
            <div className="w-full pt-3 border-t border-slate-800/80 space-y-1.5">
              {/* Collapse/Expand Rail Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className={`w-full flex items-center rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:border-slate-700 hover:bg-slate-850 transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
                }`}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar into compact rail'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRightIcon size={16} />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <ChevronLeftIcon size={16} />
                      <span className="text-[11px] font-medium">Collapse Rail</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-mono text-slate-500">
                      ⌘B
                    </kbd>
                  </>
                )}
              </button>

              {/* Optional App Download Action */}
              {canInstall && (
                <button
                  onClick={() => pwaInstallService.promptInstall()}
                  className={`w-full flex items-center rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 hover:border-emerald-400 transition-colors cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
                  }`}
                  title="Download App (PWA)"
                >
                  <DownloadIcon size={15} semantic="success" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="font-semibold text-[11px]">Download App</span>
                      <span className="text-[9px] bg-emerald-500/20 px-1 rounded text-emerald-300 font-mono">PWA</span>
                    </>
                  )}
                </button>
              )}

              {/* Replay Intro Animation */}
              {onReplaySplash && !isSidebarCollapsed && (
                <button
                  onClick={onReplaySplash}
                  title="Replay startup animation and loading bar"
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
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
                  className={`w-full flex items-center rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <KeyboardIcon className="w-3.5 h-3.5 text-slate-400" />
                    {!isSidebarCollapsed && <span>Shortcuts</span>}
                  </div>
                  {!isSidebarCollapsed && <span className="text-[10px] text-slate-500 font-mono">?</span>}
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Main Content Area Slot */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative w-full">
          {children}
        </div>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION: Safe area padded quick bar on mobile
         ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] px-1 shadow-lg"
      >
        {[
          { id: 'dashboard' as TabId, label: 'Mission', icon: DashboardIcon, color: 'text-emerald-500' },
          { id: 'problems' as TabId, label: 'Problems', icon: ProblemsIcon, color: 'text-blue-500' },
          { id: 'learn' as TabId, label: 'Roadmap', icon: LearningRoadmapIcon, color: 'text-cyan-500' },
          { id: 'workspace' as TabId, label: 'Code', icon: CodingBracketsIcon, color: 'text-indigo-500' },
          { id: 'mistakes' as TabId, label: 'Mistakes', icon: BookmarksIcon, color: 'text-rose-500' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-90 ${
                isActive
                  ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'text-white scale-110' : item.color}`} />
              </div>
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile More Button (Opens full hub drawer) */}
        <button
          onClick={() => setShowMobileMore((v) => !v)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            showMobileMore ||
            ['contests', 'analytics', 'progress', 'guardian', 'coach', 'feed', 'communities', 'messages', 'settings', 'solutions', 'playground'].includes(activeTab)
              ? 'text-white bg-slate-800 dark:bg-slate-700 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MoreHorizontalIcon size={18} />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* =========================================================================
          MOBILE DRAWER / APP HUB: Complete module matrix on mobile screens
         ========================================================================= */}
      {showMobileMore && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 safe-area-overlay">
          <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
            {/* Drawer Drag Bar */}
            <div className="flex flex-col items-center gap-1.5 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-800 shrink-0" />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <TargetRatingIcon size={18} semantic="indigo" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">CLIMB 1600 Hub</h3>
                  <p className="text-[11px] text-slate-400">Explore all training modules & tools</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMore(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close hub"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Quick Hero Banner inside Mobile Drawer */}
            <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900 p-3.5 flex items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Day {goal.currentDay} / 180</span>
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.2 text-[9px] font-bold text-indigo-300">
                    Phase {goal.currentPhase}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">Specialist Rating 1600 Trajectory</p>
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
                        onClick={() => handleSelectTab(item.id)}
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
                        onClick={() => handleSelectTab(item.id)}
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
                        onClick={() => handleSelectTab(item.id)}
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
                    { id: 'feed' as TabId, label: 'Community Feed', icon: CommunityIcon, badge: 'Public' },
                    { id: 'communities' as TabId, label: 'Community Hub', icon: TargetRatingIcon, badge: 'Groups' },
                    { id: 'messages' as TabId, label: 'Direct Messages', icon: ChatIcon, badge: unreadMessageCount > 0 ? `${unreadMessageCount} new` : '1-on-1' },
                    { id: 'profile' as TabId, label: 'Social Profile', icon: UserProfileIcon, badge: 'Account' },
                    { id: 'settings' as TabId, label: 'Settings & Goals', icon: SettingsIcon, badge: 'Configs' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
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
    </div>
  );
};
