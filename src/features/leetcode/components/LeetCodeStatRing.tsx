import React from 'react';

interface LeetCodeStatRingProps {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  targetCount?: number;
}

export const LeetCodeStatRing: React.FC<LeetCodeStatRingProps> = ({
  totalSolved,
  easySolved,
  mediumSolved,
  hardSolved,
  targetCount = 100,
}) => {
  const percentage = Math.min(100, Math.round((totalSolved / targetCount) * 100));

  // Stroke math for SVG circle ring
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-sm">
      {/* Circular Progress Ring */}
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-indigo-500 transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-100 font-mono">{totalSolved}</span>
          <span className="text-[11px] text-slate-400 font-medium">Solved</span>
          <span className="text-[10px] text-indigo-400 font-mono mt-0.5">{percentage}% Goal</span>
        </div>
      </div>

      {/* Breakdown Breakdown details */}
      <div className="flex-1 w-full flex flex-col justify-center gap-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>Difficulty Distribution</span>
          <span className="text-slate-400">Target: {targetCount} problems</span>
        </div>

        {/* Easy */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 font-medium">Easy</span>
            <span className="font-mono text-slate-200">{easySolved}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (easySolved / Math.max(1, totalSolved)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Medium */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-amber-400 font-medium">Medium</span>
            <span className="font-mono text-slate-200">{mediumSolved}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (mediumSolved / Math.max(1, totalSolved)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Hard */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-rose-400 font-medium">Hard</span>
            <span className="font-mono text-slate-200">{hardSolved}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (hardSolved / Math.max(1, totalSolved)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
