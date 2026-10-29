import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  CheckCircle2,
  Target,
  Shield,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lock,
  Unlock,
  Medal,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  AchievementBadge,
  AchievementCategory,
  AchievementTier,
  evaluateAchievements,
  getAchievementStats,
} from '../utils/achievements';
import { ProblemAttempt, UserProfile, MistakeRecord } from '../types';
import { StreakAnalysis } from '../utils/streak';

interface AchievementsProps {
  attempts: ProblemAttempt[];
  streakAnalysis?: StreakAnalysis;
  profile?: UserProfile;
  mistakes?: MistakeRecord[];
  theoreticalRating?: number;
  compact?: boolean;
}

const TIER_CONFIG: Record<
  AchievementTier,
  { label: string; bg: string; text: string; border: string; glow: string }
> = {
  bronze: {
    label: 'Bronze',
    bg: 'bg-amber-900/20',
    text: 'text-amber-400',
    border: 'border-amber-800/40',
    glow: 'rgba(217, 119, 6, 0.15)',
  },
  silver: {
    label: 'Silver',
    bg: 'bg-slate-300/10',
    text: 'text-slate-200',
    border: 'border-slate-400/40',
    glow: 'rgba(203, 213, 225, 0.15)',
  },
  gold: {
    label: 'Gold',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    glow: 'rgba(234, 179, 8, 0.2)',
  },
  platinum: {
    label: 'Platinum',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-400/40',
    glow: 'rgba(6, 182, 212, 0.25)',
  },
};

export const Achievements: React.FC<AchievementsProps> = ({
  attempts,
  streakAnalysis,
  profile,
  mistakes = [],
  theoreticalRating,
  compact = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  // Evaluate badges
  const badges = useMemo(() => {
    return evaluateAchievements({
      attempts,
      streakAnalysis,
      profile,
      mistakes,
      theoreticalRating,
    });
  }, [attempts, streakAnalysis, profile, mistakes, theoreticalRating]);

  // Aggregate stats
  const stats = useMemo(() => getAchievementStats(badges), [badges]);

  // Filtered list
  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (filterUnlockedOnly && !b.unlocked) return false;
      return true;
    });
  }, [badges, selectedCategory, filterUnlockedOnly]);

  const renderBadgeIcon = (iconName: string, unlocked: boolean, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'AlertTriangle':
        return <AlertTriangle className={className} />;
      case 'Trophy':
      default:
        return <Trophy className={className} />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-6">
      {/* Header & Overall Milestone Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                <span>Milestone Badges & Achievements</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {stats.unlockedCount} / {stats.total} Unlocked
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proof of consistency, mastery, and rating growth on the road to 1600.
              </p>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="sm:w-64 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-400">Total Completion</span>
            <span className="font-mono font-bold text-amber-400">{stats.completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Closest Milestone Callout Banner (if available) */}
      {stats.nextClosestBadge && (
        <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/30 via-slate-900/50 to-slate-900/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              {renderBadgeIcon(stats.nextClosestBadge.icon, false, 'w-5 h-5')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Next Milestone in Reach
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold text-slate-300 bg-slate-800">
                  {Math.round(stats.nextClosestBadge.progress * 100)}% Complete
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {stats.nextClosestBadge.title}
              </h4>
              <p className="text-xs text-slate-400">
                {stats.nextClosestBadge.description}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-indigo-300 block">
                {stats.nextClosestBadge.currentValue} / {stats.nextClosestBadge.targetValue} {stats.nextClosestBadge.unit}
              </span>
              <span className="text-[11px] text-slate-400">
                {Math.max(0, stats.nextClosestBadge.targetValue - stats.nextClosestBadge.currentValue)} {stats.nextClosestBadge.unit} left to unlock
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs & Quick Toggle Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('streak')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'streak'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Streak</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('volume')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'volume'
                ? 'bg-cyan-600/90 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Volume</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('rating')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'rating'
                ? 'bg-purple-600/90 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Rating</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('mastery')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'mastery'
                ? 'bg-emerald-600/90 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mastery</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFilterUnlockedOnly(!filterUnlockedOnly)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
            filterUnlockedOnly
              ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>{filterUnlockedOnly ? 'Showing Unlocked Only' : 'Show All Statuses'}</span>
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBadges.map((badge) => {
          const tier = TIER_CONFIG[badge.tier];
          const isSelected = selectedBadge?.id === badge.id;

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(isSelected ? null : badge)}
              className={`relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                badge.unlocked
                  ? `bg-slate-950/70 ${tier.border} shadow-lg hover:border-slate-500`
                  : 'bg-slate-950/30 border-slate-800/70 hover:border-slate-700 opacity-80 hover:opacity-100'
              } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              style={{
                boxShadow: badge.unlocked ? `0 0 15px ${tier.glow}` : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                {/* Icon Container */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    badge.unlocked
                      ? `${tier.bg} ${tier.border} ${tier.text}`
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {renderBadgeIcon(badge.icon, badge.unlocked, 'w-5 h-5')}
                </div>

                {/* Status & Tier Badge */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tier.bg} ${tier.text} ${tier.border}`}
                  >
                    {tier.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {badge.unlocked ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mb-3">
                <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-white' : 'text-slate-300'}`}>
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress Bar & Numerical Target */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-400">
                    {badge.unlocked ? (
                      <span className="text-emerald-400 font-bold">Goal Achieved</span>
                    ) : (
                      <span>Progress</span>
                    )}
                  </span>
                  <span className="font-mono font-semibold text-slate-300">
                    {badge.currentValue} / {badge.targetValue} {badge.unit}
                  </span>
                </div>

                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      badge.unlocked
                        ? 'bg-emerald-400'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.round(badge.progress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800">
          No badges match the selected filters.
        </div>
      )}

      {/* Selected Badge Detail Modal / Drawer */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    selectedBadge.unlocked
                      ? `${TIER_CONFIG[selectedBadge.tier].bg} ${TIER_CONFIG[selectedBadge.tier].border} ${TIER_CONFIG[selectedBadge.tier].text}`
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {renderBadgeIcon(selectedBadge.icon, selectedBadge.unlocked, 'w-6 h-6')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedBadge.title}</h4>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${TIER_CONFIG[selectedBadge.tier].text}`}>
                    {TIER_CONFIG[selectedBadge.tier].label} Tier Milestone
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Progress:</span>
                <span className="font-mono font-bold text-white">
                  {selectedBadge.currentValue} / {selectedBadge.targetValue} {selectedBadge.unit}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${selectedBadge.unlocked ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.round(selectedBadge.progress * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Status:</span>
                <span className={selectedBadge.unlocked ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                  {selectedBadge.unlocked ? 'Unlocked & Verified' : `${Math.round(selectedBadge.progress * 100)}% Completed`}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
