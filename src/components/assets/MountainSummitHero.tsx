import React from 'react';
import {
  TargetRatingIcon as Target,
  TrendUpIcon as TrendingUp,
} from '../icons';

export interface MountainSummitHeroProps {
  className?: string;
  targetRating?: number;
  currentRating?: number;
  estimatedRating?: number;
  solvedCount?: number;
  baselineRating?: number;
  cfHandle?: string;
  targetRankTitle?: string;
  showCoder?: boolean;
  compact?: boolean;
  onOpenCalibrationModal?: () => void;
}

function getRankName(rating: number): string {
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist';
  if (rating < 1900) return 'Expert';
  if (rating < 2100) return 'Candidate Master';
  if (rating < 2300) return 'Master';
  if (rating < 2400) return 'International Master';
  return 'Grandmaster';
}

export const MountainSummitHero: React.FC<MountainSummitHeroProps> = ({
  className = '',
  targetRating = 1600,
  currentRating,
  estimatedRating = 800,
  solvedCount = 0,
  baselineRating = 800,
  cfHandle,
  targetRankTitle = 'Specialist',
  compact = false,
  onOpenCalibrationModal,
}) => {
  const baseFloor = baselineRating || 800;
  const hasOfficialRating = currentRating != null && currentRating > 0;
  const displayRating = hasOfficialRating ? currentRating : (estimatedRating || baseFloor);

  // Exact progression along the 800 -> targetRating trajectory
  const totalRange = Math.max(1, targetRating - baseFloor);
  const gainedPoints = Math.max(0, displayRating - baseFloor);
  const ratingProgress = Math.min(100, Math.max(0, Math.round((gainedPoints / totalRange) * 100)));
  const ratingGap = Math.max(0, targetRating - displayRating);

  // When ratingProgress is 0 but solvedCount > 0, give a subtle 3% visual bar indicator
  const visualBarWidth = (ratingProgress === 0 && solvedCount > 0) ? 3 : ratingProgress;

  if (compact) {
    return (
      <div className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Target {targetRating} Progression
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {ratingProgress}% ({ratingGap} pts to goal)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm transition-all interactive-card ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 shadow-xs">
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Target Trajectory
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Target {targetRating} Progression
          </h2>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {ratingGap > 0 ? (
              <>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {ratingGap} pts to goal
                </span>
                {!hasOfficialRating && estimatedRating ? ` (~${estimatedRating} est.)` : ''}
              </>
            ) : (
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Target reached!</span>
            )}
            {solvedCount > 0 && (
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {' · '}{solvedCount} solved
              </span>
            )}
          </p>
        </div>

        {/* Current vs Goal Display Cards */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-center min-w-[104px] shadow-xs relative group interactive-card">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current
              </span>
              {onOpenCalibrationModal && (
                <button
                  type="button"
                  onClick={onOpenCalibrationModal}
                  title="Calibrate baseline skill rating"
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            {hasOfficialRating ? (
              <>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                  {currentRating}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-cyan-400 block truncate">
                  {getRankName(currentRating)}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">
                  Unrated
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block" title="Estimated skill from verified practice history">
                  Est. ~{estimatedRating}
                </span>
              </>
            )}
          </div>

          <div className="text-slate-300 dark:text-slate-600 font-black text-xl">/</div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700 text-center min-w-[104px] shadow-xs interactive-card">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block mb-0.5">
              Goal
            </span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono block">
              {targetRating}
            </span>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block truncate">
              {targetRankTitle || getRankName(targetRating)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Milestones */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-black text-emerald-600 dark:text-emerald-400">{ratingProgress}%</span> to target
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {targetRankTitle || getRankName(targetRating)}
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner relative">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-full rounded-full transition-all duration-800 shadow-sm relative overflow-hidden"
            style={{ width: `${visualBarWidth}%` }}
          >
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        </div>

        {/* Milestone Ticks */}
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 pt-1">
          <span className={displayRating >= 800 ? 'text-slate-900 dark:text-white font-bold' : ''}>800</span>
          <span className={displayRating >= 1000 ? 'text-slate-900 dark:text-white font-bold' : ''}>1000</span>
          <span className={displayRating >= 1200 ? 'text-slate-900 dark:text-white font-bold' : ''}>1200</span>
          <span className={displayRating >= 1400 ? 'text-slate-900 dark:text-white font-bold' : ''}>1400</span>
          <span className={displayRating >= targetRating ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-emerald-700 dark:text-emerald-400'}>
            {targetRating}
          </span>
        </div>
      </div>
    </div>
  );
};
