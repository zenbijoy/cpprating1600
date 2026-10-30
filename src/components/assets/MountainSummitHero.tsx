import React from 'react';
import {
  TargetRatingIcon as Target,
  TrendUpIcon as TrendingUp,
  MedalIcon as Award,
  CheckCircleIcon as CheckCircle2,
} from '../icons';

export interface MountainSummitHeroProps {
  className?: string;
  targetRating?: number;
  currentRating?: number;
  showCoder?: boolean;
  compact?: boolean;
}

export const MountainSummitHero: React.FC<MountainSummitHeroProps> = ({
  className = '',
  targetRating = 1600,
  currentRating = 800,
  compact = false,
}) => {
  const ratingProgress = Math.min(100, Math.max(0, Math.round((currentRating / targetRating) * 100)));
  const ratingGap = Math.max(0, targetRating - currentRating);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              Target Trajectory
            </span>
            <span className="text-xs text-slate-500 font-medium">180-Day Structured Roadmap</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Target {targetRating} Rating Progression
          </h2>
          <p className="text-sm text-slate-600 max-w-xl">
            Compounding independent problem-solving skills to reach Codeforces Specialist. {ratingGap > 0 ? `${ratingGap} rating points to goal.` : 'Target reached!'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[90px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Current</span>
            <span className="text-xl font-bold text-slate-900">{currentRating}</span>
          </div>
          <div className="text-slate-300 font-light">/</div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center min-w-[90px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Goal</span>
            <span className="text-xl font-bold text-emerald-700">{targetRating}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Milestones */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            {ratingProgress}% toward Target Rating
          </span>
          <span className="text-slate-500">
            Specialist (Div.2 A, B & C)
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${ratingProgress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
          <span>800 (Newbie)</span>
          <span>1000 (Basic Math)</span>
          <span>1200 (Pupil)</span>
          <span>1400 (Div.2 B)</span>
          <span className="font-semibold text-emerald-700">1600 (Specialist)</span>
        </div>
      </div>
    </div>
  );
};
