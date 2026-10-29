import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  calculateCommunityBenchmarks,
  CommunityBenchmarkComparison,
} from '../utils/communityBenchmarks';
import { ProblemAttempt, UserGoal, UserProfile } from '../types';

interface CommunityBenchmarksProps {
  attempts: ProblemAttempt[];
  goal: UserGoal;
  profile?: UserProfile;
}

type ComparisonMetric = 'rating' | 'solves';

export const CommunityBenchmarks: React.FC<CommunityBenchmarksProps> = ({
  attempts,
  goal,
  profile,
}) => {
  const [metric, setMetric] = useState<ComparisonMetric>('rating');

  const comparison: CommunityBenchmarkComparison = useMemo(() => {
    return calculateCommunityBenchmarks(attempts, goal, profile);
  }, [attempts, goal, profile]);

  const getPaceBadge = (status: CommunityBenchmarkComparison['paceStatus']) => {
    switch (status) {
      case 'ahead':
        return {
          label: 'Ahead of Average Cohort',
          bg: 'bg-emerald-950/40 border-emerald-800/60',
          text: 'text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'on_pace':
        return {
          label: 'Tracking Community Average',
          bg: 'bg-indigo-950/40 border-indigo-800/60',
          text: 'text-indigo-300',
          icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />,
        };
      case 'behind':
      default:
        return {
          label: 'Trailing Average Cohort',
          bg: 'bg-amber-950/40 border-amber-800/60',
          text: 'text-amber-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
    }
  };

  const paceBadge = getPaceBadge(comparison.paceStatus);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-6">
      {/* Header & Metric View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                <span>Community Cohort Benchmarks</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Target 1600 Cohort
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Benchmark your trajectory and problem volume against competitive programmers pursuing a 1600 rating.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Switcher Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMetric('rating')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              metric === 'rating'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rating Trajectory
          </button>
          <button
            type="button"
            onClick={() => setMetric('solves')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              metric === 'solves'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cumulative Solves
          </button>
        </div>
      </div>

      {/* Cohort Comparison Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Percentile Rank Card */}
        <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Cohort Percentile
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-white">
              {comparison.cohortPercentile}
              <span className="text-xs text-indigo-300">th</span>
            </span>
            <span className="text-[10px] text-slate-400">percentile</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Top {100 - comparison.cohortPercentile}% of active learners
          </p>
        </div>

        {/* Pace Status Card */}
        <div className={`rounded-xl border p-3.5 space-y-1 ${paceBadge.bg}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Cohort Pace
          </span>
          <div className="flex items-center gap-1.5">
            {paceBadge.icon}
            <span className={`text-sm md:text-base font-bold ${paceBadge.text} truncate`}>
              {comparison.paceStatus === 'ahead'
                ? 'Ahead of Cohort'
                : comparison.paceStatus === 'on_pace'
                ? 'On Cohort Pace'
                : 'Trailing Cohort'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Day {comparison.currentDay} of 180
          </p>
        </div>

        {/* Solves vs Cohort Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Solves vs Cohort Avg
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-cyan-400">
              {comparison.userSolvedCount}
            </span>
            <span className="text-xs text-slate-400">vs {comparison.communityAvgSolves} avg</span>
          </div>
          <p className={`text-[10px] font-mono ${comparison.solvesDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {comparison.solvesDelta >= 0 ? `+${comparison.solvesDelta}` : `${comparison.solvesDelta}`} problems delta
          </p>
        </div>

        {/* Weekly Velocity Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Weekly Velocity
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-amber-300">
              {comparison.userWeeklyVelocity}
            </span>
            <span className="text-xs text-slate-400">/ wk</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Cohort median: ~5.0 probs/wk
          </p>
        </div>
      </div>

      {/* Comparative Recharts Graph */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {metric === 'rating'
                ? 'Codeforces Rating Trajectory (User vs Cohort)'
                : 'Cumulative Solves Progression (User vs Cohort)'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">0 to 180 Days</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono font-semibold">
            {metric === 'rating' ? 'Target: 1600 Specialist' : 'Target: ~240 Solves'}
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={comparison.points}
              margin={{ top: 20, right: 20, bottom: 5, left: -10 }}
            >
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                domain={metric === 'rating' ? [750, 1750] : [0, 320]}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(val: any, name: any) => {
                  if (val === null || val === undefined) return ['--', name];
                  const unit = metric === 'rating' ? 'pts' : 'solves';
                  return [`${val} ${unit}`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

              {/* Reference line for 1600 rating if rating mode */}
              {metric === 'rating' && (
                <ReferenceLine
                  y={1600}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{
                    value: '1600 Target',
                    fill: '#38bdf8',
                    fontSize: 11,
                    position: 'top',
                  }}
                />
              )}

              {/* Top Quartile Corridor / Area */}
              <Area
                type="monotone"
                dataKey={metric === 'rating' ? 'topQuartileRating' : 'topQuartileSolves'}
                stroke="none"
                fill="rgba(99, 102, 241, 0.12)"
                name="Top 25% Cohort Band"
              />

              {/* Community Average Curve */}
              <Line
                type="monotone"
                dataKey={metric === 'rating' ? 'communityAverageRating' : 'communityAverageSolves'}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                name="Community Average (50th %ile)"
              />

              {/* Top Quartile Line */}
              <Line
                type="monotone"
                dataKey={metric === 'rating' ? 'topQuartileRating' : 'topQuartileSolves'}
                stroke="#a855f7"
                strokeDasharray="2 2"
                strokeWidth={1.5}
                dot={false}
                name="Top 25% Fast-Track"
              />

              {/* User Trajectory Curve */}
              <Line
                type="monotone"
                dataKey={metric === 'rating' ? 'userRating' : 'userCumulativeSolves'}
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 1.5 }}
                name="Your Trajectory"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cohort Coaching Analysis & Insights */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Cohort Progress Analysis
          </h4>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {comparison.insights}
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-800/60 pt-2">
          Cohort data is synthesized from historical Codeforces trainee trajectories (starting unrated and progressing toward Div.2 Specialist). Rating gains accelerate during Phases 3 and 4 as pattern recognition solidifies.
        </p>
      </div>
    </div>
  );
};
