import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  TrophyIcon,
  StreakIcon,
  MedalIcon,
  CheckCircleIcon,
  CheckIcon,
  TargetRatingIcon,
  ShieldIcon,
  AISparkleIcon,
  TrendUpIcon,
  WarningStatusIcon,
  LockIcon,
  UnlockIcon,
  FilterIcon,
  SearchIcon,
  CloseIcon,
  ShareIcon,
  CopyIcon,
  PinIcon,
  ChevronRightIcon,
  SortIcon,
} from './icons';
import {
  AchievementBadge,
  AchievementCategory,
  AchievementTier,
  evaluateAchievements,
  getAchievementStats,
  getClaimedBadgeIds,
  claimBadgeId,
  getPinnedBadgeId,
  setPinnedBadgeId,
} from '../utils/achievements';
import { ProblemAttempt, UserProfile, MistakeRecord } from '../types';
import { StreakAnalysis } from '../utils/streak';
import { ClimbBadge, BadgeId, AchievementUnlockCelebration } from './assets';
import { soundEffects } from '../utils/soundEffects';
import { FunCard } from './common/CardBackgrounds';

export interface AchievementsProps {
  attempts: ProblemAttempt[];
  streakAnalysis?: StreakAnalysis;
  profile?: UserProfile;
  mistakes?: MistakeRecord[];
  theoreticalRating?: number;
  compact?: boolean;
  onOpenCurriculumTopic?: (topicId: string) => void;
}

// Visual theme configurations per tier supporting both Dark and Light modes
const TIER_CONFIG: Record<
  AchievementTier,
  {
    label: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    textLight: string;
    textDark: string;
    glow: string;
    accentHex: string;
    gradient: string;
    badgePill: string;
  }
> = {
  bronze: {
    label: 'Bronze',
    bgLight: 'bg-amber-500/10',
    bgDark: 'dark:bg-amber-950/40',
    borderLight: 'border-amber-300',
    borderDark: 'dark:border-amber-700/60',
    textLight: 'text-amber-800',
    textDark: 'dark:text-amber-300',
    glow: 'rgba(217, 119, 6, 0.25)',
    accentHex: '#d97706',
    gradient: 'from-amber-600 to-amber-800',
    badgePill: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  silver: {
    label: 'Silver',
    bgLight: 'bg-slate-200/60',
    bgDark: 'dark:bg-slate-800/60',
    borderLight: 'border-slate-300',
    borderDark: 'dark:border-slate-600/60',
    textLight: 'text-slate-700',
    textDark: 'dark:text-slate-200',
    glow: 'rgba(148, 163, 184, 0.25)',
    accentHex: '#94a3b8',
    gradient: 'from-slate-400 to-slate-600',
    badgePill: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700',
  },
  gold: {
    label: 'Gold',
    bgLight: 'bg-yellow-500/15',
    bgDark: 'dark:bg-yellow-950/40',
    borderLight: 'border-yellow-400',
    borderDark: 'dark:border-yellow-600/60',
    textLight: 'text-yellow-800',
    textDark: 'dark:text-yellow-300',
    glow: 'rgba(234, 179, 8, 0.3)',
    accentHex: '#eab308',
    gradient: 'from-yellow-500 to-amber-600',
    badgePill: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800',
  },
  platinum: {
    label: 'Platinum',
    bgLight: 'bg-cyan-500/15',
    bgDark: 'dark:bg-cyan-950/40',
    borderLight: 'border-cyan-400',
    borderDark: 'dark:border-cyan-500/60',
    textLight: 'text-cyan-800',
    textDark: 'dark:text-cyan-300',
    glow: 'rgba(6, 182, 212, 0.35)',
    accentHex: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-600',
    badgePill: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
  },
};

type SortOption = 'closest' | 'progress' | 'tier_desc' | 'xp_desc' | 'unlocked_first' | 'alphabetical';
type StatusFilter = 'all' | 'unlocked' | 'in_progress' | 'locked' | 'claimable';

// Lightweight Canvas Particle Confetti for Celebrations
const ConfettiCanvas: React.FC<{ active: boolean; onDone: () => void }> = ({ active, onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b', '#06b6d4', '#6366f1', '#ec4899', '#10b981', '#facc15'];
    const particles = Array.from({ length: 70 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 3 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      alpha: 1,
    }));

    let animationId: number;
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyAlive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vRot;
        if (elapsed > 1200) {
          p.alpha = Math.max(0, p.alpha - 0.03);
        }

        if (p.alpha > 0 && p.y < canvas.height + 20) {
          anyAlive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      }

      if (anyAlive && elapsed < 2500) {
        animationId = requestAnimationFrame(render);
      } else {
        onDone();
      }
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [active, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

export const Achievements: React.FC<AchievementsProps> = ({
  attempts,
  streakAnalysis,
  profile,
  mistakes = [],
  theoreticalRating,
  compact = false,
  onOpenCurriculumTopic,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<AchievementTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('closest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(compact ? 'compact' : 'grid');

  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [celebrateBadge, setCelebrateBadge] = useState<AchievementBadge | null>(null);
  const [pinnedBadgeIdState, setPinnedBadgeIdState] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize storage state
  useEffect(() => {
    setClaimedIds(getClaimedBadgeIds());
    setPinnedBadgeIdState(getPinnedBadgeId());
  }, []);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const getBadgeAssetId = (badgeId: string): BadgeId => {
    switch (badgeId) {
      case 'streak_1':
        return 'streak_7';
      case 'streak_3':
        return 'beginner';
      case 'streak_7':
        return 'streak_7';
      case 'streak_10':
        return 'consistency';
      case 'streak_30':
        return 'streak_30';
      case 'volume_1':
      case 'volume_5':
        return 'first_solve';
      case 'volume_10':
        return 'intermediate';
      case 'volume_25':
        return 'advanced';
      case 'volume_50':
        return 'rising_star';
      case 'volume_100':
        return 'master';
      case 'rating_1000':
        return 'top_10';
      case 'rating_1200':
        return 'consistency';
      case 'rating_1400':
        return 'contest_hero';
      case 'rating_1600':
        return 'master';
      case 'mastery_zero_hints':
        return 'top_10';
      case 'mastery_hard_solve':
        return 'contest_hero';
      case 'mastery_speed_demon':
        return 'rising_star';
      case 'mastery_mistakes':
        return 'consistency';
      case 'topic_math':
      case 'topic_greedy':
        return 'beginner';
      case 'topic_binary_search':
        return 'intermediate';
      case 'topic_dp':
      case 'topic_graphs':
        return 'advanced';
      default:
        return 'beginner';
    }
  };

  // Evaluate badges with real attempts & claimed IDs
  const badges = useMemo(() => {
    return evaluateAchievements({
      attempts,
      streakAnalysis,
      profile,
      mistakes,
      theoreticalRating,
      claimedIds,
    });
  }, [attempts, streakAnalysis, profile, mistakes, theoreticalRating, claimedIds]);

  // Aggregate stats
  const stats = useMemo(() => getAchievementStats(badges), [badges]);

  // Claim single achievement XP
  const handleClaimReward = useCallback(
    (badge: AchievementBadge, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!badge.unlocked || badge.claimed) return;

      const updated = claimBadgeId(badge.id);
      setClaimedIds(updated);
      setConfettiActive(true);
      soundEffects.playVictory();
      triggerToast(`🎉 +${badge.xp} XP Claimed for "${badge.title}"!`);
    },
    [triggerToast]
  );

  // Claim all eligible achievements
  const handleClaimAll = useCallback(() => {
    const claimableBadges = badges.filter((b) => b.unlocked && !b.claimed);
    if (claimableBadges.length === 0) return;

    let updated = claimedIds;
    let totalClaimedXP = 0;
    for (const b of claimableBadges) {
      updated = claimBadgeId(b.id);
      totalClaimedXP += b.xp;
    }
    setClaimedIds(updated);
    setConfettiActive(true);
    soundEffects.playVictory();
    triggerToast(`🚀 Claimed all rewards! +${totalClaimedXP} XP added to your rank!`);
  }, [badges, claimedIds, triggerToast]);

  // Toggle Pinned Target
  const handleTogglePin = useCallback(
    (badgeId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (pinnedBadgeIdState === badgeId) {
        setPinnedBadgeId(null);
        setPinnedBadgeIdState(null);
        triggerToast('Milestone unpinned from focus.');
      } else {
        setPinnedBadgeId(badgeId);
        setPinnedBadgeIdState(badgeId);
        const b = badges.find((x) => x.id === badgeId);
        triggerToast(`📌 Pinned "${b?.title || 'Milestone'}" as your active focus goal!`);
      }
    },
    [pinnedBadgeIdState, badges, triggerToast]
  );

  // Determine active spotlight milestone (pinned or closest locked)
  const spotlightBadge = useMemo(() => {
    if (pinnedBadgeIdState) {
      const pinned = badges.find((b) => b.id === pinnedBadgeIdState);
      if (pinned) return pinned;
    }
    return stats.nextClosestBadge;
  }, [pinnedBadgeIdState, badges, stats.nextClosestBadge]);

  // Filtered and Sorted list
  const filteredBadges = useMemo(() => {
    let list = badges.filter((b) => {
      // Category filter
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;

      // Tier filter
      if (selectedTier !== 'all' && b.tier !== selectedTier) return false;

      // Status filter
      if (statusFilter === 'unlocked' && !b.unlocked) return false;
      if (statusFilter === 'locked' && (b.unlocked || b.progress > 0)) return false;
      if (statusFilter === 'in_progress' && (b.unlocked || b.progress === 0)) return false;
      if (statusFilter === 'claimable' && (!b.unlocked || b.claimed)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesDesc = b.description.toLowerCase().includes(query);
        const matchesCat = b.category.toLowerCase().includes(query);
        const matchesTier = b.tier.toLowerCase().includes(query);
        const matchesHint = b.hint.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesTier && !matchesHint) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'closest':
          // Locked with progress closest to 100% first, then unlocked
          if (!a.unlocked && !b.unlocked) return b.progress - a.progress;
          if (!a.unlocked && b.unlocked) return -1;
          if (a.unlocked && !b.unlocked) return 1;
          return b.xp - a.xp;
        case 'progress':
          return b.progress - a.progress;
        case 'tier_desc': {
          const tierRank = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
          return tierRank[b.tier] - tierRank[a.tier];
        }
        case 'xp_desc':
          return b.xp - a.xp;
        case 'unlocked_first':
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return b.progress - a.progress;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return list;
  }, [badges, selectedCategory, selectedTier, statusFilter, searchQuery, sortBy]);

  // Share badge helper
  const handleShareBadge = useCallback(
    (badge: AchievementBadge) => {
      const shareText = `🏆 Unlocked "${badge.title}" (${badge.tier.toUpperCase()} Tier • +${badge.xp} XP) on Climb 1600!\n"${badge.description}" 🚀`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
        triggerToast('Copied achievement card to clipboard!');
      }
    },
    [triggerToast]
  );

  const renderBadgeIcon = (iconName: string, unlocked: boolean, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Flame':
      case 'Zap':
        return <StreakIcon size={20} semantic="warning" className={className} />;
      case 'Award':
      case 'Medal':
        return <MedalIcon size={20} semantic="primary" className={className} />;
      case 'CheckCircle2':
        return <CheckCircleIcon size={20} semantic="success" className={className} />;
      case 'Target':
        return <TargetRatingIcon size={20} semantic="warning" className={className} />;
      case 'Shield':
        return <ShieldIcon size={20} semantic="indigo" className={className} />;
      case 'Sparkles':
        return <AISparkleIcon size={20} semantic="indigo" className={className} />;
      case 'TrendingUp':
        return <TrendUpIcon size={20} semantic="success" className={className} />;
      case 'AlertTriangle':
        return <WarningStatusIcon size={20} semantic="warning" className={className} />;
      case 'Trophy':
      default:
        return <TrophyIcon size={20} semantic="warning" className={className} />;
    }
  };

  return (
    <FunCard
      variant="cosmic"
      sticker="climb_champ"
      stickerPosition="top-right"
      className="p-6 sm:p-8 space-y-6 shadow-xl border-indigo-400/30"
    >
      <ConfettiCanvas active={confettiActive} onDone={() => setConfettiActive(false)} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[110] animate-bounce-in bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-300 flex items-center gap-2 text-xs font-semibold">
          <AISparkleIcon size={16} semantic="warning" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER & GAMER RANK HUD ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/20 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-sm">
              <TrophyIcon size={24} semantic="warning" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                  Milestone Badges & Achievements
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {stats.unlockedCount} / {stats.total} Unlocked ({stats.completionPercent}%)
                </span>
                {stats.claimableCount > 0 && (
                  <span className="animate-pulse px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <AISparkleIcon size={12} semantic="success" />
                    {stats.claimableCount} Reward{stats.claimableCount > 1 ? 's' : ''} Ready!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                Earn achievement points, rank up your competitive programmer level, and master the climb to 1600.
              </p>
            </div>
          </div>
        </div>

        {/* Global Level & XP Dashboard Pill */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {stats.claimableCount > 0 && (
            <button
              type="button"
              onClick={handleClaimAll}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <CheckCircleIcon size={14} semantic="inherit" className="text-white" />
              <span>Claim All Rewards ({stats.claimableCount})</span>
            </button>
          )}

          <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 min-w-[240px] flex-1 sm:flex-initial">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  LVL {stats.level}
                </span>
                <span className="text-slate-500 dark:text-slate-400">•</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.levelTitle}</span>
              </div>
              <span className="font-mono font-bold text-amber-500 dark:text-amber-400">
                {stats.earnedXP} / {stats.totalXP} XP
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-400 transition-all duration-700 rounded-full"
                style={{ width: `${Math.round(stats.levelProgress * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{stats.xpForNextLevel > 0 ? `${stats.xpForNextLevel} XP to Level ${stats.level + 1}` : 'Max Level Reached!'}</span>
              <span>{Math.round(stats.levelProgress * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. SPOTLIGHT / ACTIVE FOCUS MILESTONE CARD ──────────────────────────── */}
      {spotlightBadge && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-slate-50/60 to-purple-50/50 dark:from-indigo-950/30 dark:via-slate-900/50 dark:to-purple-950/20 p-4 sm:p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                onClick={() => setSelectedBadge(spotlightBadge)}
                className="relative w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700/60 flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:scale-105 transition-transform"
              >
                <ClimbBadge
                  id={getBadgeAssetId(spotlightBadge.id)}
                  size={46}
                  unlocked={spotlightBadge.unlocked}
                  showGlow={spotlightBadge.unlocked}
                />
                {!spotlightBadge.unlocked && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 shadow-sm">
                    <LockIcon size={10} />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-300 dark:border-indigo-800">
                    {pinnedBadgeIdState === spotlightBadge.id ? '📌 Pinned Focus Target' : '🎯 Next In-Reach Milestone'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${TIER_CONFIG[spotlightBadge.tier].badgePill}`}>
                    {TIER_CONFIG[spotlightBadge.tier].label} Tier • +{spotlightBadge.xp} XP
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                    {Math.round(spotlightBadge.progress * 100)}% Complete
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {spotlightBadge.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {spotlightBadge.description}
                </p>
              </div>
            </div>

            {/* Spotlight CTA & Actions */}
            <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-2">
              <div className="text-left sm:text-right">
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 block">
                  {spotlightBadge.currentValue} / {spotlightBadge.targetValue} {spotlightBadge.unit}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {spotlightBadge.unlocked
                    ? 'Goal Completed!'
                    : `${Math.max(0, spotlightBadge.targetValue - spotlightBadge.currentValue)} ${spotlightBadge.unit} remaining`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleTogglePin(spotlightBadge.id, e)}
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    pinnedBadgeIdState === spotlightBadge.id
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={pinnedBadgeIdState === spotlightBadge.id ? 'Unpin focus milestone' : 'Pin as focus target'}
                >
                  <PinIcon size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBadge(spotlightBadge)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Inspect Goal</span>
                  <ChevronRightIcon size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. DYNAMIC CONTROLS & FILTER TOOLBAR ─────────────────────────────────── */}
      <div className="space-y-3">
        {/* Category Tabs - Generously Spaced */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1.5 no-scrollbar">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <span>All Milestones</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/20 font-mono">
                {badges.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('streak')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === 'streak'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <StreakIcon size={14} semantic={selectedCategory === 'streak' ? 'inherit' : 'warning'} className={selectedCategory === 'streak' ? 'text-white' : ''} />
              <span>Streak</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/20 font-mono">
                {stats.categoryCounts.streak.unlocked}/{stats.categoryCounts.streak.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('volume')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === 'volume'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <CheckCircleIcon size={14} semantic={selectedCategory === 'volume' ? 'inherit' : 'primary'} className={selectedCategory === 'volume' ? 'text-white' : ''} />
              <span>Volume</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/20 font-mono">
                {stats.categoryCounts.volume.unlocked}/{stats.categoryCounts.volume.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('rating')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === 'rating'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <TrendUpIcon size={14} semantic={selectedCategory === 'rating' ? 'inherit' : 'indigo'} className={selectedCategory === 'rating' ? 'text-white' : ''} />
              <span>Rating</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/20 font-mono">
                {stats.categoryCounts.rating.unlocked}/{stats.categoryCounts.rating.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('mastery')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === 'mastery'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <AISparkleIcon size={14} semantic={selectedCategory === 'mastery' ? 'inherit' : 'success'} className={selectedCategory === 'mastery' ? 'text-white' : ''} />
              <span>Mastery</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/20 font-mono">
                {stats.categoryCounts.mastery.unlocked}/{stats.categoryCounts.mastery.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('topics')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === 'topics'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <MedalIcon size={14} semantic={selectedCategory === 'topics' ? 'inherit' : 'primary'} className={selectedCategory === 'topics' ? 'text-white' : ''} />
              <span>Topics</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/20 font-mono">
                {stats.categoryCounts.topics.unlocked}/{stats.categoryCounts.topics.total}
              </span>
            </button>
          </div>

          {/* View toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Search, Status, Tier & Sorting Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <SearchIcon
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones by title, description, or keyword..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Selector */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Statuses ({badges.length})</option>
                <option value="unlocked">Unlocked Only ({stats.unlockedCount})</option>
                <option value="in_progress">In Progress ({badges.filter((b) => !b.unlocked && b.progress > 0).length})</option>
                <option value="locked">Not Started ({badges.filter((b) => !b.unlocked && b.progress === 0).length})</option>
                <option value="claimable">Ready to Claim ({stats.claimableCount})</option>
              </select>
              <FilterIcon
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Tier Selector */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as AchievementTier | 'all')}
                className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">🥉 Bronze ({stats.tierCounts.bronze.unlocked}/{stats.tierCounts.bronze.total})</option>
                <option value="silver">🥈 Silver ({stats.tierCounts.silver.unlocked}/{stats.tierCounts.silver.total})</option>
                <option value="gold">🥇 Gold ({stats.tierCounts.gold.unlocked}/{stats.tierCounts.gold.total})</option>
                <option value="platinum">💎 Platinum ({stats.tierCounts.platinum.unlocked}/{stats.tierCounts.platinum.total})</option>
              </select>
              <FilterIcon
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="closest">Closest to Unlock</option>
                <option value="progress">Highest Progress %</option>
                <option value="tier_desc">Highest Tier</option>
                <option value="xp_desc">Most XP Value</option>
                <option value="unlocked_first">Unlocked First</option>
                <option value="alphabetical">Title A-Z</option>
              </select>
              <SortIcon
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. BADGES GRID / LIST DISPLAY ────────────────────────────────────────── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const tier = TIER_CONFIG[badge.tier];
            const isSelected = selectedBadge?.id === badge.id;
            const isPinned = pinnedBadgeIdState === badge.id;
            const isClaimable = badge.unlocked && !badge.claimed;

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between interactive-card ${
                  badge.unlocked
                    ? `bg-white dark:bg-slate-900/90 ${tier.borderLight} ${tier.borderDark} shadow-md hover:shadow-xl shimmer-sheen`
                    : badge.progress > 0
                    ? 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-300/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs hover:shadow-md'
                    : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                style={{
                  boxShadow: badge.unlocked ? `0 4px 20px ${tier.glow}` : undefined,
                }}
              >
                <div>
                  {/* Top Row: Icon Medallion, Tier Tag, XP Pill, Pin Button */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-115 group-hover:rotate-3 shadow-sm ${
                          badge.unlocked
                            ? `${tier.bgLight} ${tier.bgDark} ${tier.borderLight} ${tier.borderDark}`
                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                        onClick={(e) => {
                          if (badge.unlocked) {
                            e.stopPropagation();
                            setCelebrateBadge(badge);
                          }
                        }}
                        title={badge.unlocked ? 'Click to celebrate!' : 'Click to inspect milestone requirements'}
                      >
                        <ClimbBadge
                          id={getBadgeAssetId(badge.id)}
                          size={44}
                          unlocked={badge.unlocked}
                          showGlow={badge.unlocked}
                        />
                      </div>

                      {/* Lock overlay icon for locked badges */}
                      {!badge.unlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 shadow-xs">
                          <LockIcon size={10} />
                        </div>
                      )}
                    </div>

                    {/* Meta tags & Pin button */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tier.badgePill}`}
                        >
                          {tier.label}
                        </span>

                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          +{badge.xp} XP
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(badge.id, e)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isPinned
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isPinned ? 'Unpin goal' : 'Pin as focus target'}
                        >
                          <PinIcon size={13} />
                        </button>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {badge.unlocked ? (
                          badge.claimed ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircleIcon size={12} semantic="success" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                              <AISparkleIcon size={12} semantic="warning" />
                              <span>Ready to Claim!</span>
                            </span>
                          )
                        ) : badge.progress > 0 ? (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {Math.round(badge.progress * 100)}% Progress
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                            <LockIcon size={11} />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 mb-3">
                    <h4
                      className={`text-sm font-extrabold tracking-tight ${
                        badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {badge.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Progress Bar & Dynamic CTA */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {badge.unlocked ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckIcon size={11} />
                          <span>Goal Achieved</span>
                        </span>
                      ) : badge.progress > 0 ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">In Progress</span>
                      ) : (
                        <span>Milestone Target</span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {badge.unlocked
                        ? `${badge.currentValue} solved`
                        : `${badge.currentValue} / ${badge.targetValue} ${badge.unit}`}
                    </span>
                  </div>

                  {/* Shimmering Animated Progress Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        badge.unlocked
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : badge.progress > 0
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${Math.round(badge.progress * 100)}%` }}
                    />
                  </div>

                  {/* Claim Reward Button or Quick Status */}
                  {isClaimable ? (
                    <button
                      type="button"
                      onClick={(e) => handleClaimReward(badge, e)}
                      className="w-full py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AISparkleIcon size={13} semantic="inherit" className="text-white" />
                      <span>Claim +{badge.xp} XP</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
          {filteredBadges.map((badge) => {
            const tier = TIER_CONFIG[badge.tier];
            const isClaimable = badge.unlocked && !badge.claimed;

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      badge.unlocked
                        ? `${tier.bgLight} ${tier.bgDark} ${tier.borderLight} ${tier.borderDark}`
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ClimbBadge
                      id={getBadgeAssetId(badge.id)}
                      size={30}
                      unlocked={badge.unlocked}
                      showGlow={badge.unlocked}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {badge.title}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${tier.badgePill}`}>
                        {tier.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-24 sm:w-32 hidden sm:block">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                      <span>{Math.round(badge.progress * 100)}%</span>
                      <span>{badge.currentValue}/{badge.targetValue}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${badge.unlocked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.round(badge.progress * 100)}%` }}
                      />
                    </div>
                  </div>

                  {isClaimable ? (
                    <button
                      type="button"
                      onClick={(e) => handleClaimReward(badge, e)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-xs"
                    >
                      Claim +{badge.xp} XP
                    </button>
                  ) : badge.unlocked ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircleIcon size={14} semantic="success" />
                      <span className="hidden sm:inline">Done</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {badge.currentValue}/{badge.targetValue}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FilterIcon size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Milestones Match Your Filters</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try resetting your category or search query to see other achievements on your journey to 1600.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedTier('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* ─── 5. DETAILED MILESTONE INSPECTION DRAWER / MODAL ──────────────────────── */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 safe-area-overlay animate-fade-in"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-md ${
                    selectedBadge.unlocked
                      ? `${TIER_CONFIG[selectedBadge.tier].bgLight} ${TIER_CONFIG[selectedBadge.tier].bgDark} ${TIER_CONFIG[selectedBadge.tier].borderLight} ${TIER_CONFIG[selectedBadge.tier].borderDark}`
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <ClimbBadge
                    id={getBadgeAssetId(selectedBadge.id)}
                    size={52}
                    unlocked={selectedBadge.unlocked}
                    showGlow={selectedBadge.unlocked}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${TIER_CONFIG[selectedBadge.tier].badgePill}`}>
                      {TIER_CONFIG[selectedBadge.tier].label} Tier
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      +{selectedBadge.xp} XP
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {selectedBadge.rarity}
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedBadge.title}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Description & Objective */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Objective
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            {/* Current Telemetry Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Current Progress:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedBadge.currentValue} / {selectedBadge.targetValue} {selectedBadge.unit} ({Math.round(selectedBadge.progress * 100)}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    selectedBadge.unlocked
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.round(selectedBadge.progress * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Status:</span>
                <span className={selectedBadge.unlocked ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-indigo-600 dark:text-indigo-400 font-semibold'}>
                  {selectedBadge.unlocked ? 'Verified & Completed' : `${Math.max(0, selectedBadge.targetValue - selectedBadge.currentValue)} ${selectedBadge.unit} remaining`}
                </span>
              </div>
            </div>

            {/* AI Coach Hint / Tip */}
            {selectedBadge.hint && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  <AISparkleIcon size={14} semantic="warning" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                    AI Coach Tip
                  </span>
                  <p className="text-xs text-amber-900 dark:text-amber-200/90 mt-0.5 leading-relaxed">
                    {selectedBadge.hint}
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={(e) => handleTogglePin(selectedBadge.id, e)}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    pinnedBadgeIdState === selectedBadge.id
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PinIcon size={13} />
                  <span>{pinnedBadgeIdState === selectedBadge.id ? 'Unpin' : 'Pin Focus'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareBadge(selectedBadge)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShareIcon size={13} />
                  <span>Share</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedBadge.unlocked && !selectedBadge.claimed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleClaimReward(selectedBadge, e);
                      setSelectedBadge({ ...selectedBadge, claimed: true });
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <AISparkleIcon size={14} semantic="inherit" className="text-white" />
                    <span>Claim +{selectedBadge.xp} XP</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 cursor-pointer transition-opacity text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. ACHIEVEMENT UNLOCK CELEBRATION MODAL ─────────────────────────────── */}
      {celebrateBadge && (
        <AchievementUnlockCelebration
          badgeId={getBadgeAssetId(celebrateBadge.id)}
          title={celebrateBadge.title}
          description={celebrateBadge.description}
          tier={TIER_CONFIG[celebrateBadge.tier].label}
          onClose={() => setCelebrateBadge(null)}
        />
      )}
    </FunCard>
  );
};
