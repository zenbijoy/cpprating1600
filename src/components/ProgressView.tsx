import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Sparkles,
  BarChart2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Calculator,
  Sliders,
  RotateCcw,
  ShieldCheck,
  Zap,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
  ReferenceLine,
  Area,
  Legend,
} from 'recharts';
import { MistakeRecord, ProblemAttempt, UserGoal, UserProfile } from '../types';
import { calculateRatingForecast } from '../utils/forecast';
import {
  calculateTheoreticalRating,
  simulateRatingProgression,
  SimulatedSolve,
  getTierColor,
} from '../utils/ratingEstimator';
import { DifficultyHeatmap } from './DifficultyHeatmap';
import { CommunityBenchmarks } from './CommunityBenchmarks';

interface ProgressViewProps {
  goal: UserGoal;
  profile: UserProfile;
  attempts: ProblemAttempt[];
  mistakes: MistakeRecord[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  goal,
  profile,
  attempts,
  mistakes,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');

  // Rating Estimator State & Simulation
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedSolves, setSimulatedSolves] = useState<SimulatedSolve[]>([
    { rating: 1000, count: 0, independent: true },
    { rating: 1200, count: 0, independent: true },
    { rating: 1300, count: 0, independent: true },
    { rating: 1400, count: 0, independent: true },
  ]);

  const ratingEstimate = useMemo(() => {
    return calculateTheoreticalRating(attempts, 800, profile.verifiedCfRating);
  }, [attempts, profile.verifiedCfRating]);

  const hasSimulationActive = simulatedSolves.some((s) => s.count > 0);
  const simulatedEstimate = useMemo(() => {
    if (!hasSimulationActive) return null;
    return simulateRatingProgression(attempts, simulatedSolves, 800, profile.verifiedCfRating);
  }, [attempts, simulatedSolves, profile.verifiedCfRating, hasSimulationActive]);

  const handleAdjustSimulation = (rating: number, delta: number) => {
    setSimulatedSolves((prev) =>
      prev.map((s) => (s.rating === rating ? { ...s, count: Math.max(0, Math.min(20, s.count + delta)) } : s))
    );
  };

  const handleResetSimulation = () => {
    setSimulatedSolves((prev) => prev.map((s) => ({ ...s, count: 0 })));
  };

  const totalAttempted = attempts.length;
  const verifiedAccepted = attempts.filter((a) => a.officialVerdict === 'OK').length;
  const solvedIndependently = attempts.filter((a) => a.outcome === 'solved_independently').length;
  const solvedWithHints = attempts.filter((a) => a.outcome === 'solved_with_hints').length;

  const totalPracticeSeconds = attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);
  const totalPracticeHours = (totalPracticeSeconds / 3600).toFixed(1);

  const avgMinutesPerAttempt = totalAttempted > 0
    ? Math.round(totalPracticeSeconds / totalAttempted / 60)
    : 0;

  // Rating difficulty distribution
  const ratingBuckets: Record<string, number> = {
    '800': 0,
    '900': 0,
    '1000': 0,
    '1100': 0,
    '1200': 0,
    '1300': 0,
    '1400+': 0,
  };

  attempts.forEach((a) => {
    if (!a.rating) return;
    if (a.rating <= 800) ratingBuckets['800']++;
    else if (a.rating <= 900) ratingBuckets['900']++;
    else if (a.rating <= 1000) ratingBuckets['1000']++;
    else if (a.rating <= 1100) ratingBuckets['1100']++;
    else if (a.rating <= 1200) ratingBuckets['1200']++;
    else if (a.rating <= 1300) ratingBuckets['1300']++;
    else ratingBuckets['1400+']++;
  });

  const chartRatingData = Object.entries(ratingBuckets).map(([rating, count]) => ({
    rating,
    count,
  }));

  // Hint dependence pie data
  const hintPieData = [
    { name: 'Independent (0 hints)', value: solvedIndependently || (totalAttempted === 0 ? 1 : 0), color: '#10B981' },
    { name: 'With Socratic Hints', value: solvedWithHints, color: '#6366F1' },
    { name: 'Editorial Studied', value: attempts.filter((a) => a.outcome === 'editorial_studied').length, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

  // 180-Day Rating Projection Model
  const forecast = calculateRatingForecast(
    goal.currentDay,
    verifiedAccepted || totalAttempted,
    profile.verifiedCfRating,
    goal.targetRating,
    goal.totalDays
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Truthful Analytics & Mastery</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real data from your deliberate practice. Activity is separated from true independent mastery.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase transition-all cursor-pointer ${
                timeRange === r ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'all' ? 'Entire 180d' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>TOTAL PRACTICE TIME</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalPracticeHours} hrs</div>
          <p className="text-[11px] text-slate-400">Avg {avgMinutesPerAttempt} mins per problem</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>VERIFIED ACCEPTED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{verifiedAccepted}</div>
          <p className="text-[11px] text-slate-400">Out of {totalAttempted} attempted</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>INDEPENDENT RATIO</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {totalAttempted > 0 ? `${Math.round((solvedIndependently / totalAttempted) * 100)}%` : '0%'}
          </div>
          <p className="text-[11px] text-slate-400">Solved without hints</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>MISTAKES LOGGED</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{mistakes.length}</div>
          <p className="text-[11px] text-slate-400">Active spaced repetition queue</p>
        </div>
      </div>

      {/* Theoretical Rating Estimator Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Calculator className="w-4 h-4" />
              </span>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Theoretical Codeforces Rating Estimator
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Calculates your estimated Codeforces contest capability based on the quantity, difficulty distribution, and hint independence of verified solves.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showSimulator || hasSimulationActive
                  ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showSimulator ? 'Close Simulator' : 'What-If Simulator'}</span>
              {hasSimulationActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Main Estimator Display */}
        {(() => {
          const activeResult = simulatedEstimate || ratingEstimate;
          const isSimulated = hasSimulationActive;

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Card: Big Gauge, Range & Target Gap */}
                <div className="lg:col-span-6 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isSimulated ? 'Projected Simulated Rating' : 'Estimated Current Rating'}
                      </span>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-4xl font-black text-cyan-400 tracking-tight">
                          {activeResult.estimatedRating}
                        </span>
                        {isSimulated && (
                          <span className="text-sm font-bold text-emerald-400 flex items-center">
                            (+{activeResult.estimatedRating - ratingEstimate.estimatedRating} pts gain)
                          </span>
                        )}
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${getTierColor(activeResult.estimatedRating)}20`,
                            color: getTierColor(activeResult.estimatedRating),
                            border: `1px solid ${getTierColor(activeResult.estimatedRating)}50`,
                          }}
                        >
                          {activeResult.tierName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Confidence
                      </span>
                      <div className="text-xs font-semibold text-slate-300 capitalize mt-0.5">
                        {activeResult.confidenceLevel} (±{activeResult.confidenceMargin} pts)
                      </div>
                    </div>
                  </div>

                  {/* Rating Range Chip */}
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-800 bg-slate-900/50">
                    <span className="text-slate-400">Theoretical Performance Range:</span>
                    <span className="font-mono font-bold text-white">
                      [{activeResult.ratingRange[0]} — {activeResult.ratingRange[1]}]
                    </span>
                  </div>

                  {/* Progress Bar to 1600 Target */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        Progress to 1600 Specialist: {activeResult.percentTowardsTarget}%
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        +{activeResult.pointsTo1600} pts needed
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${activeResult.percentTowardsTarget}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestone Tier Ladder */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Codeforces Tier Ladder
                    </span>
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                      {[
                        { label: 'Newbie', band: '800-999', min: 800 },
                        { label: 'Adv. Newbie', band: '1000-1199', min: 1000 },
                        { label: 'Pupil', band: '1200-1399', min: 1200 },
                        { label: 'Candidate', band: '1400-1599', min: 1400 },
                        { label: 'Specialist', band: '1600+', min: 1600 },
                      ].map((step) => {
                        const isReached = activeResult.estimatedRating >= step.min;
                        const isCurrent =
                          activeResult.estimatedRating >= step.min &&
                          (step.min === 1600 || activeResult.estimatedRating < step.min + 200);

                        return (
                          <div
                            key={step.label}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCurrent
                                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold ring-1 ring-cyan-400'
                                : isReached
                                ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300'
                                : 'border-slate-800 bg-slate-950/40 text-slate-500'
                            }`}
                          >
                            <div className="font-bold truncate">{step.label}</div>
                            <div className="text-[9px] opacity-70 truncate">{step.band}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Card: Component Factors & Recommended Target */}
                <div className="lg:col-span-6 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Mathematical Estimation Components
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Component 1: Top Solves Anchor */}
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Top Solves Difficulty Anchor
                        </span>
                        <div className="text-base font-bold text-white">
                          ~{activeResult.breakdown.topProblemsAnchor} pts
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          Avg of top {Math.min(12, activeResult.totalQualifiedSolves || 1)} hardest solves
                        </p>
                      </div>

                      {/* Component 2: Volume Calibration */}
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Volume Calibration Factor
                        </span>
                        <div className="text-base font-bold text-indigo-300">
                          {activeResult.totalQualifiedSolves} / 20 solves
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {Math.round(activeResult.breakdown.volumeMultiplier * 100)}% anchor confidence
                        </p>
                      </div>

                      {/* Component 3: Independence Ratio */}
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Hint Independence Ratio
                        </span>
                        <div className="text-base font-bold text-emerald-400">
                          {activeResult.independenceRatio}%
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          Zero-hint unassisted weight
                        </p>
                      </div>

                      {/* Component 4: Depth Bonus */}
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium block">
                          High-Tier Depth Bonus
                        </span>
                        <div className="text-base font-bold text-amber-300">
                          +{activeResult.breakdown.depthBonus} pts
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          Clusters at ≥1200 / ≥1300
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Next Practice Target */}
                  <div className="p-3.5 rounded-xl border border-indigo-900/40 bg-indigo-950/20 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span>
                        Recommended Practice Target: Solve {activeResult.recommendedNextTarget.recommendedQuantity} problems at Rating {activeResult.recommendedNextTarget.suggestedRating}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {activeResult.recommendedNextTarget.rationale}
                    </p>
                  </div>
                </div>
              </div>

              {/* What-If Simulator Tray */}
              {showSimulator && (
                <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/30 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>What-If Rating Simulation Playground</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Adjust simulated problem solves to project how mastering higher difficulties impacts your rating estimate:
                      </p>
                    </div>

                    {hasSimulationActive && (
                      <button
                        type="button"
                        onClick={handleResetSimulation}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer border border-slate-800"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Simulation</span>
                      </button>
                    )}
                  </div>

                  {/* Stepper Controls per difficulty tier */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {simulatedSolves.map((s) => (
                      <div
                        key={s.rating}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Rating {s.rating}</span>
                          <span className="text-[10px] text-slate-400">
                            {s.rating === 1000
                              ? 'Greedy/Strings'
                              : s.rating === 1200
                              ? '2-Pointers/Sorting'
                              : s.rating === 1300
                              ? 'Number Theory'
                              : 'Graphs/DP'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustSimulation(s.rating, -1)}
                            disabled={s.count === 0}
                            className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center text-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="font-mono font-bold text-white text-sm">
                            +{s.count}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAdjustSimulation(s.rating, 1)}
                            className="w-7 h-7 rounded-lg border border-indigo-700 bg-indigo-900/40 hover:bg-indigo-800/60 flex items-center justify-center text-indigo-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="font-semibold text-slate-400">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedSolves([
                          { rating: 1000, count: 4, independent: true },
                          { rating: 1200, count: 4, independent: true },
                          { rating: 1300, count: 0, independent: true },
                          { rating: 1400, count: 0, independent: true },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      +4 @ 1000 & +4 @ 1200
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedSolves([
                          { rating: 1000, count: 0, independent: true },
                          { rating: 1200, count: 5, independent: true },
                          { rating: 1300, count: 5, independent: true },
                          { rating: 1400, count: 0, independent: true },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      Pupil Pack (+5 @ 1200, +5 @ 1300)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedSolves([
                          { rating: 1000, count: 0, independent: true },
                          { rating: 1200, count: 2, independent: true },
                          { rating: 1300, count: 5, independent: true },
                          { rating: 1400, count: 5, independent: true },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      Specialist Push (+5 @ 1300, +5 @ 1400)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Visual Rating Forecast Graph (Recharts) */}
      <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900/80 p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base md:text-lg font-bold text-white">
                180-Day Rating Forecast & Trajectory
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mathematical projection towards Codeforces 1600 (Specialist) modeled on your solved problem volume and pace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                forecast.paceStatus === 'ahead'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                  : forecast.paceStatus === 'on_track'
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-800/60'
                  : 'bg-amber-950 text-amber-300 border-amber-800/60'
              }`}
            >
              {forecast.paceStatus === 'ahead'
                ? 'Pace: Ahead of Goal'
                : forecast.paceStatus === 'on_track'
                ? 'Pace: On Track for 1600'
                : 'Pace: Needs Acceleration'}
            </span>
          </div>
        </div>

        {/* Forecast Velocity Stats Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Velocity</span>
            <div className="text-base font-black text-white">~{forecast.currentVelocityProblemsPerWeek} probs/wk</div>
            <p className="text-[10px] text-slate-500">Based on recent activity</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projected Day 180 Rating</span>
            <div className="text-base font-black text-cyan-400">~{forecast.projectedFinalRating}</div>
            <p className="text-[10px] text-slate-500">Target benchmark: 1600</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projected Day to 1600</span>
            <div className="text-base font-black text-indigo-300">
              {forecast.projectedDayTo1600 ? `Day ${forecast.projectedDayTo1600}` : 'Day 180'}
            </div>
            <p className="text-[10px] text-slate-500">At current solving rate</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Rating Tier</span>
            <div className="text-base font-black text-amber-300">1600 Specialist</div>
            <p className="text-[10px] text-slate-500">Div.2 A, B, C fluency</p>
          </div>
        </div>

        {/* Recharts Composed Forecast Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast.points} margin={{ top: 20, right: 20, bottom: 5, left: -10 }}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[750, 1750]} stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(value: any, name: any) => {
                  if (value === null || value === undefined) return ['--', name];
                  return [`${value} pts`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <ReferenceLine
                y={1600}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                label={{
                  value: 'Target: 1600 (Specialist)',
                  fill: '#38bdf8',
                  fontSize: 11,
                  position: 'top',
                }}
              />
              {/* Uncertainty Corridor Area */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="rgba(99, 102, 241, 0.1)"
                name="Confidence Range"
              />
              {/* Ideal Target Benchmark Curve */}
              <Line
                type="monotone"
                dataKey="targetBenchmark"
                stroke="#475569"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
                name="180-Day Benchmark Curve"
              />
              {/* Projected Rating Line (Dashed) */}
              <Line
                type="monotone"
                dataKey="projectedRating"
                stroke="#818cf8"
                strokeDasharray="5 5"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#818cf8' }}
                name="Projected Trajectory"
              />
              {/* Actual Tracked Rating Line (Solid) */}
              <Line
                type="monotone"
                dataKey="actualRating"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 4.5, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 1.5 }}
                connectNulls={false}
                name="Actual / Verified Pace"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Honest Coaching Insights & Scientific Disclaimer */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5 text-xs">
          <p className="text-slate-200 leading-relaxed">
            <strong className="text-indigo-300">Coaching Analysis:</strong> {forecast.insights}
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            Disclaimer: A 1600 rating is an ambitious learning goal, not a guaranteed mechanical outcome. Progress varies with problem difficulty, contest consistency, and independent upsolving without premature editorials.
          </p>
        </div>
      </div>

      {/* Community Cohort Benchmarks Section */}
      <CommunityBenchmarks attempts={attempts} goal={goal} profile={profile} />

      {/* Visual Difficulty Distribution Heatmap & Plateau Diagnostic */}
      <DifficultyHeatmap attempts={attempts} />

      {/* Visual Charts: Solved by Difficulty & Hint Dependence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rating Breakdown Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>Problems Attempted by Rating</span>
            </h3>
            <span className="text-[11px] text-slate-400">800 to 1400+ Band</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRatingData}>
                <XAxis dataKey="rating" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hint Dependence Pie Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Hint Independence</span>
            </h3>
            <span className="text-[11px] text-slate-400">Learning Metric</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hintPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {hintPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {hintPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300">{d.name}</span>
                </div>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Coach Report Section */}
      <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-br from-indigo-950/30 to-slate-950 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Weekly Coach Report</h3>
          </div>
          <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-xs font-bold">
            Day {goal.currentDay} / 180
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Achievements */}
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 space-y-2">
            <span className="font-bold text-emerald-400 uppercase tracking-wider block">
              3 Concrete Achievements
            </span>
            <ul className="text-slate-200 space-y-1.5 list-disc list-inside">
              <li>Active on {Math.min(goal.currentDay, 7)} out of 7 days</li>
              <li>Consistently writing approaches before typing code</li>
              <li>{mistakes.length} mistake patterns captured in notebook</li>
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 space-y-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider block">
              Top Identified Weakness
            </span>
            <p className="text-slate-300 leading-relaxed">
              <strong>Integer overflow on product calculations:</strong> Avoid 32-bit integer truncation when accumulating arrays with sizes up to $10^5$.
            </p>
          </div>

          {/* Recommended Adjustment */}
          <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4 space-y-2">
            <span className="font-bold text-cyan-400 uppercase tracking-wider block">
              Next Week's Adjustment
            </span>
            <p className="text-slate-300 leading-relaxed">
              Spend at least 20 minutes attempting problem B and C difficulty before looking at Hint 1. Give your brain space to synthesize the observation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
