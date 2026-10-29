import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Terminal,
  Trophy,
  Bot,
  TrendingUp,
  BookOpen,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { UserGoal, UserProfile } from '../types';

export type TabId =
  | 'dashboard'
  | 'learn'
  | 'problems'
  | 'contests'
  | 'coach'
  | 'progress'
  | 'mistakes'
  | 'settings';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  profile: UserProfile;
  goal: UserGoal;
  onOpenAntiProcrastination: () => void;
  onStartTodayMission: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  goal,
  onOpenAntiProcrastination,
  onStartTodayMission,
}) => {
  const navItems = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn' as TabId, label: 'Learn', icon: GraduationCap },
    { id: 'problems' as TabId, label: 'Problem Arena', icon: Terminal },
    { id: 'contests' as TabId, label: 'Contests', icon: Trophy },
    { id: 'coach' as TabId, label: 'AI Coach', icon: Bot },
    { id: 'progress' as TabId, label: 'Progress', icon: TrendingUp },
    { id: 'mistakes' as TabId, label: 'Mistakes', icon: BookOpen },
    { id: 'settings' as TabId, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md p-4 shrink-0 h-screen sticky top-0">
        <div className="space-y-6">
          <div className="px-2 pt-2 pb-1">
            <BrandLogo size="md" showTagline />
          </div>

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
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Start Today's Mission</span>
            </button>
            <button
              onClick={onOpenAntiProcrastination}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-violet-400" />
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Handle Info / Verification footer */}
        <div className="border-t border-slate-800/80 pt-3 px-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="font-medium text-slate-200 truncate max-w-[120px]">
                {profile.cfHandle ? profile.cfHandle : 'Guest Solver'}
              </span>
              <span className="text-[11px] text-slate-400">
                {profile.verifiedCfRating ? `CF Rating: ${profile.verifiedCfRating}` : 'Unrated Beginner'}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 rounded px-1.5 py-0.5">
                Target 1600
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAntiProcrastination}
            className="flex items-center gap-1 rounded-lg bg-violet-950/60 border border-violet-700/50 px-2.5 py-1 text-xs font-medium text-violet-300"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>5m Start</span>
          </button>
          <button
            onClick={onStartTodayMission}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm"
          >
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Today</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur-md py-2 px-1"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setActiveTab('mistakes')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            activeTab === 'mistakes' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mistakes</span>
        </button>
      </nav>
    </>
  );
};
