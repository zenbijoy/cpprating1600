import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  DashboardIcon,
  PracticeIcon,
  CodePlaygroundIcon,
  ProblemsIcon,
  TopicMasteryIcon,
  ContestsIcon,
  BookmarksIcon,
  SourceCodeIcon,
  DebugCodeIcon,
  LearningRoadmapIcon,
  AICoachIcon,
  AnalyticsIcon,
  ProgressIcon,
  ShieldIcon,
  SettingsIcon,
  StreakIcon,
  AISparkleIcon,
  RefreshIcon,
  AppearanceIcon,
  LanguageIcon,
  KeyboardShortcutsIcon,
  SearchIcon,
  CloseIcon,
  ChevronRightIcon,
  CodingBracketsIcon,
  CommunityIcon,
  ChatIcon,
  UserProfileIcon,
  SubmissionHistoryIcon,
  SynchronizationIcon,
} from './icons';
import { TabId } from './Navbar';
import { CFProblem } from '../types';
import { CURATED_PROBLEMS_CATALOG } from '../utils/roadmap';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  onSelectProblem: (problem: CFProblem) => void;
  onStartTodayMission: () => void;
  onOpenAntiProcrastination: () => void;
  onOpenShortcutsModal: () => void;
  onToggleLanguage?: () => void;
  onCycleTheme?: () => void;
  onSyncCfData?: () => void;
  currentDay?: number;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Views' | 'Actions' | 'Problems';
  icon: React.ComponentType<any>;
  action: () => void;
  badge?: string;
  keywords?: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectProblem,
  onStartTodayMission,
  onOpenAntiProcrastination,
  onOpenShortcutsModal,
  onToggleLanguage,
  onCycleTheme,
  onSyncCfData,
  currentDay = 1,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
          const event = new CustomEvent('climb1600:open-command-palette');
          window.dispatchEvent(event);
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Construct items
  const allItems = useMemo<CommandItem[]>(() => {
    const views: CommandItem[] = [
      {
        id: 'view-dashboard',
        title: 'Mission Control',
        subtitle: 'Daily plan, 180-day streak, target 1600 progress',
        category: 'Views',
        icon: DashboardIcon,
        action: () => { onNavigate('dashboard'); onClose(); },
        keywords: ['home', 'dashboard', 'mission', 'overview', 'main'],
      },
      {
        id: 'view-workspace',
        title: 'Workspace IDE',
        subtitle: 'C++20 fast I/O editor, local sample runner & CF sync',
        category: 'Views',
        icon: PracticeIcon,
        action: () => { onNavigate('workspace'); onClose(); },
        keywords: ['ide', 'editor', 'code', 'compile', 'solve'],
      },
      {
        id: 'view-playground',
        title: 'Code Playground',
        subtitle: 'Run C, C++, and Python with live stdin & AI Debugger',
        category: 'Views',
        icon: CodePlaygroundIcon,
        action: () => { onNavigate('playground'); onClose(); },
        keywords: ['run', 'playground', 'compiler', 'python', 'cpp', 'debug'],
      },
      {
        id: 'view-problems',
        title: 'Problem Explorer',
        subtitle: 'Browse 11,000+ official Codeforces problems with rating & tags',
        category: 'Views',
        icon: ProblemsIcon,
        action: () => { onNavigate('problems'); onClose(); },
        keywords: ['problems', 'archive', 'search', 'cf', 'rating'],
      },
      {
        id: 'view-skilltree',
        title: 'Algorithm Skill Tree',
        subtitle: '23-topic interactive prerequisite roadmap with mastery scores',
        category: 'Views',
        icon: TopicMasteryIcon,
        action: () => { onNavigate('skilltree'); onClose(); },
        keywords: ['tree', 'skills', 'topics', 'mastery', 'dag', 'roadmap'],
      },
      {
        id: 'view-contests',
        title: 'Virtual Contest Arena',
        subtitle: 'Simulated rounds, ICPC penalty timer, debrief & upsolving',
        category: 'Views',
        icon: ContestsIcon,
        action: () => { onNavigate('contests'); onClose(); },
        keywords: ['contest', 'virtual', 'round', 'div2', 'div3', 'div4', 'icpc'],
      },
      {
        id: 'view-mistakes',
        title: 'Mistake Notebook & Spaced Repetition',
        subtitle: 'Root-cause tagged cards with SM-2 flashcard recall review',
        category: 'Views',
        icon: BookmarksIcon,
        action: () => { onNavigate('mistakes'); onClose(); },
        keywords: ['mistakes', 'notebook', 'revision', 'flashcards', 'autopsy', 'sm2'],
      },
      {
        id: 'view-solutions',
        title: 'C++ Solution Library',
        subtitle: '5,000+ verified, permissively licensed modern C++ solutions',
        category: 'Views',
        icon: SourceCodeIcon,
        action: () => { onNavigate('solutions'); onClose(); },
        keywords: ['solutions', 'c++', 'reference', 'editorial'],
      },
      {
        id: 'view-autopsy',
        title: 'Submission Autopsy',
        subtitle: 'Root-cause diagnostics for WA, TLE, MLE, and Runtime Errors',
        category: 'Views',
        icon: DebugCodeIcon,
        action: () => { onNavigate('autopsy'); onClose(); },
        keywords: ['autopsy', 'wa', 'tle', 'diagnostic', 'bug', 'verdict'],
      },
      {
        id: 'view-learn',
        title: '180-Day Curriculum Plan',
        subtitle: 'Structured 7-phase algorithmic roadmap by week and day',
        category: 'Views',
        icon: LearningRoadmapIcon,
        action: () => { onNavigate('learn'); onClose(); },
        keywords: ['curriculum', 'plan', 'phases', 'study', 'roadmap'],
      },
      {
        id: 'view-coach',
        title: 'AI Socratic Coach Studio',
        subtitle: 'Socratic hint ladder, code reviews, and bilingual explanations',
        category: 'Views',
        icon: AICoachIcon,
        action: () => { onNavigate('coach'); onClose(); },
        keywords: ['ai', 'coach', 'hints', 'gemini', 'bengali', 'review'],
      },
      {
        id: 'view-analytics',
        title: '1600 Rating Analytics',
        subtitle: 'Weakness detection, rating trajectory, and topic radars',
        category: 'Views',
        icon: AnalyticsIcon,
        action: () => { onNavigate('analytics'); onClose(); },
        keywords: ['analytics', 'charts', 'radar', 'stats', 'progress'],
      },
      {
        id: 'view-progress',
        title: 'Mastery & Rating Forecast',
        subtitle: 'Theoretical rating calculation & what-if simulator',
        category: 'Views',
        icon: ProgressIcon,
        action: () => { onNavigate('progress'); onClose(); },
        keywords: ['forecast', 'theoretical', 'rating', 'simulator'],
      },
      {
        id: 'view-guardian',
        title: 'Study Guardian',
        subtitle: 'Distraction defense, focus sessions, and YouTube lecture filters',
        category: 'Views',
        icon: ShieldIcon,
        action: () => { onNavigate('guardian'); onClose(); },
        keywords: ['guardian', 'focus', 'pomodoro', 'lock', 'distraction'],
      },
      {
        id: 'view-settings',
        title: 'Settings & Profile',
        subtitle: 'Customize themes, daily minutes, CF handle, and notification rules',
        category: 'Views',
        icon: SettingsIcon,
        action: () => { onNavigate('settings'); onClose(); },
        keywords: ['settings', 'config', 'theme', 'profile', 'handle'],
      },
      {
        id: 'view-feed',
        title: 'Community Feed',
        subtitle: 'Public discussions, questions, doubt solving, editorials & milestones',
        category: 'Views',
        icon: CommunityIcon,
        action: () => { onNavigate('feed'); onClose(); },
        keywords: ['feed', 'social', 'community', 'posts', 'questions', 'blogs'],
      },
      {
        id: 'view-communities',
        title: 'Communities Hub',
        subtitle: 'Discover and join topic circles, algorithms cohorts & study groups',
        category: 'Views',
        icon: CommunityIcon,
        action: () => { onNavigate('communities'); onClose(); },
        keywords: ['communities', 'groups', 'circles', 'cohort', 'hub'],
      },
      {
        id: 'view-messages',
        title: 'Direct Messages',
        subtitle: '1-to-1 peer chat, code snippet exchange, and real-time messaging',
        category: 'Views',
        icon: ChatIcon,
        action: () => { onNavigate('messages'); onClose(); },
        keywords: ['messages', 'chat', 'dm', 'direct', 'conversation'],
      },
      {
        id: 'view-profile',
        title: 'Social Profile',
        subtitle: 'View and customize your competitive programmer profile, bio & skills',
        category: 'Views',
        icon: UserProfileIcon,
        action: () => { onNavigate('profile'); onClose(); },
        keywords: ['profile', 'user', 'account', 'bio', 'avatar'],
      },
      {
        id: 'view-submissions',
        title: 'Codeforces Submissions',
        subtitle: 'Browse your recent submissions, verdicts, language & runtimes',
        category: 'Views',
        icon: SubmissionHistoryIcon,
        action: () => { onNavigate('submissions'); onClose(); },
        keywords: ['submissions', 'verdicts', 'cf', 'history', 'passed', 'failed'],
      },
      {
        id: 'view-admin',
        title: 'Importer Admin Pipeline',
        subtitle: 'Inspect database inventory, review queue, license exclusions & telemetry',
        category: 'Views',
        icon: SynchronizationIcon,
        action: () => { onNavigate('admin'); onClose(); },
        keywords: ['admin', 'importer', 'pipeline', 'solutions', 'telemetry'],
      },
    ];

    const actions: CommandItem[] = [
      {
        id: 'action-community-discuss',
        title: 'Start Community Discussion',
        subtitle: 'Ask a doubt, share an algorithmic insight, or celebrate a milestone',
        category: 'Actions',
        icon: CommunityIcon,
        action: () => { onNavigate('feed'); onClose(); },
        keywords: ['discuss', 'ask', 'question', 'doubt', 'post', 'share'],
      },
      {
        id: 'action-open-dm',
        title: 'Open Direct Messages',
        subtitle: 'Check unread chats and message fellow competitive programmers',
        category: 'Actions',
        icon: ChatIcon,
        action: () => { onNavigate('messages'); onClose(); },
        keywords: ['chat', 'message', 'dm', 'inbox'],
      },
      {
        id: 'action-today',
        title: `Start Today's Mission (Day ${currentDay})`,
        subtitle: 'Jump straight into your scheduled practice problem',
        category: 'Actions',
        icon: StreakIcon,
        action: () => { onStartTodayMission(); onClose(); },
        badge: 'Recommended',
        keywords: ['today', 'mission', 'daily', 'start'],
      },
      {
        id: 'action-5min',
        title: 'Stuck? 5-Minute Low-Energy Start',
        subtitle: 'Micro-task to overcome procrastination without breaking momentum',
        category: 'Actions',
        icon: AISparkleIcon,
        action: () => { onOpenAntiProcrastination(); onClose(); },
        keywords: ['procrastination', '5 min', 'stuck', 'low energy'],
      },
      {
        id: 'action-random-problem',
        title: 'Surprise Me — Pick Random Problem',
        subtitle: 'Instantly launch a curated rating 800–1400 practice challenge',
        category: 'Actions',
        icon: RefreshIcon,
        action: () => {
          const randomIndex = Math.floor(Math.random() * CURATED_PROBLEMS_CATALOG.length);
          const prob = CURATED_PROBLEMS_CATALOG[randomIndex];
          if (prob) onSelectProblem(prob);
          onClose();
        },
        badge: 'Fun',
        keywords: ['random', 'surprise', 'shuffle', 'pick'],
      },
      {
        id: 'action-shortcuts',
        title: 'Keyboard Shortcuts Cheatsheet',
        subtitle: 'View all keyboard navigation and editor hotkeys (Press ?)',
        category: 'Actions',
        icon: KeyboardShortcutsIcon,
        action: () => { onOpenShortcutsModal(); onClose(); },
        badge: '?',
        keywords: ['shortcuts', 'hotkeys', 'keyboard', 'help'],
      },
    ];

    if (onSyncCfData) {
      actions.push({
        id: 'action-sync-cf',
        title: 'Sync Codeforces Submissions',
        subtitle: 'Fetch latest verdicts and ratings from Codeforces API',
        category: 'Actions',
        icon: RefreshIcon,
        action: () => { onSyncCfData(); onClose(); },
        keywords: ['sync', 'codeforces', 'refresh', 'fetch'],
      });
    }

    if (onCycleTheme) {
      actions.push({
        id: 'action-cycle-theme',
        title: 'Switch Color Theme',
        subtitle: 'Toggle next preset (Midnight Cyber, Solarized, Emerald, etc.)',
        category: 'Actions',
        icon: AppearanceIcon,
        action: () => { onCycleTheme(); onClose(); },
        keywords: ['theme', 'dark', 'light', 'color', 'palette'],
      });
    }

    if (onToggleLanguage) {
      actions.push({
        id: 'action-toggle-lang',
        title: 'Switch Language (English / বাংলা)',
        subtitle: 'Toggle explanation & interface language',
        category: 'Actions',
        icon: LanguageIcon,
        action: () => { onToggleLanguage(); onClose(); },
        keywords: ['language', 'bengali', 'english', 'bangla', 'i18n'],
      });
    }

    // Curated problem direct launches
    const problemItems: CommandItem[] = CURATED_PROBLEMS_CATALOG.slice(0, 30).map((prob) => ({
      id: `prob-${prob.contestId}${prob.index}`,
      title: `${prob.contestId}${prob.index} — ${prob.name}`,
      subtitle: `Rating ${prob.rating || 800} • ${prob.tags.slice(0, 3).join(', ')}`,
      category: 'Problems',
      icon: CodingBracketsIcon,
      badge: `${prob.rating || 800}`,
      action: () => { onSelectProblem(prob); onClose(); },
      keywords: [prob.name, `${prob.contestId}${prob.index}`, `${prob.rating}`, ...prob.tags],
    }));

    return [...actions, ...views, ...problemItems];
  }, [
    currentDay,
    onNavigate,
    onClose,
    onStartTodayMission,
    onOpenAntiProcrastination,
    onOpenShortcutsModal,
    onSelectProblem,
    onSyncCfData,
    onCycleTheme,
    onToggleLanguage,
  ]);

  // Filtered items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Default initial view: Actions first, then top Views
      return allItems.filter((i) => i.category === 'Actions' || (i.category === 'Views' && ['view-dashboard', 'view-workspace', 'view-playground', 'view-problems', 'view-contests'].includes(i.id)));
    }
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [allItems, query]);

  // Clamp selection
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Key navigation in input
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3 bg-slate-900/90">
          <SearchIcon size={20} semantic="primary" className="mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, problem (e.g. 4A), view, or concept..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mr-2 cursor-pointer"
            >
              <CloseIcon size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <SearchIcon size={32} className="mx-auto text-slate-600 mb-2 opacity-50" />
              <p>No commands or problems found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for "workspace", "4A", "tree", "virtual", or "theme"</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/15 dark:bg-indigo-600/25 border border-indigo-500/50 text-indigo-950 dark:text-white shadow-sm scale-[1.008]'
                      : 'hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-300 hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                      {item.category}
                    </span>
                    <ChevronRightIcon size={16} className={`${isSelected ? 'text-indigo-400 translate-x-0.5 transition-transform' : 'text-slate-600'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-300">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-300">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-300">esc</kbd> Close</span>
          </div>
          <span className="hidden sm:inline text-indigo-400/80 font-medium">Climb 1600 Universal Palette</span>
        </div>
      </div>
    </div>
  );
};
