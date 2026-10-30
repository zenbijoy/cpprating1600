import React, { useState, useMemo } from 'react';
import { ProgressGrowthIllustration } from './assets';
import {
  BarChartIcon,
  TrendUpIcon,
  TargetRatingIcon,
  TargetIcon,
  StreakIcon,
  TotalSolvedIcon,
  WrongAnswerIcon,
  TimeLimitIcon,
  MedalIcon,
  WeeklyActivityIcon,
  ChevronRightIcon,
  PracticeIcon,
  ZapIcon,
  CheckCircleIcon,
} from './icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { CFProblem, CFRatingChange, CFSubmissionRecord, ProblemAttempt, UserGoal, UserProfile } from '../types';
import { cfStorageService } from '../services/storage';
import { deriveStats } from '../services/codeforces';
import { analyzeTopicFrequencies } from '../utils/topicAnalysis';
import { TOPICS } from '../utils/roadmap';

interface AnalyticsViewProps {
  profile: UserProfile;
  attempts: ProblemAttempt[];
  goal?: UserGoal;
  onSelectProblem?: (problem: CFProblem) => void;
  onOpenCurriculumTopic?: (topicId: string) => void;
}

type DateRange = '7d' | '30d' | '90d' | '180d' | 'all';

function cutoffMs(range: DateRange): number {
  const now = Date.now();
  switch (range) {
    case '7d': return now - 7 * 86400_000;
    case '30d': return now - 30 * 86400_000;
    case '90d': return now - 90 * 86400_000;
    case '180d': return now - 180 * 86400_000;
    case 'all': return 0;
  }
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  profile,
  attempts,
  goal,
  onSelectProblem,
  onOpenCurriculumTopic,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const targetRating = goal?.targetRating || 1600;

  const ratingHistory = useMemo(() => cfStorageService.getRatingHistory(), []);
  const cfSubmissions = useMemo(() => cfStorageService.getCFSubmissions(), []);

  // Topic mastery & weak area frequency analysis
  const topicAnalysis = useMemo(() => {
    return analyzeTopicFrequencies(attempts);
  }, [attempts]);

  // Merge official Codeforces submissions with local workspace attempts
  const allSubmissions = useMemo(() => {
    const existingProblemKeys = new Set(
      cfSubmissions.map((s) => `${s.contestId || ''}-${s.problem.index}`)
    );
    const convertedAttempts: CFSubmissionRecord[] = (attempts || []).map((a, idx) => {
      const isOk = a.officialVerdict === 'OK' || a.outcome === 'solved_independently' || a.outcome === 'solved_with_hints';
      const createdSec = a.startedAt ? Math.floor(new Date(a.startedAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
      return {
        id: 990000000 + idx,
        contestId: a.contestId,
        creationTimeSeconds: createdSec || Math.floor(Date.now() / 1000),
        problem: {
          contestId: a.contestId,
          index: a.index || 'A',
          name: a.name,
          rating: a.rating,
          tags: a.tags && a.tags.length > 0 ? a.tags : ['implementation'],
        },
        programmingLanguage: a.codeLanguage || 'cpp20',
        verdict: a.officialVerdict && a.officialVerdict !== 'UNSUBMITTED' ? a.officialVerdict : (isOk ? 'OK' : 'WRONG_ANSWER'),
        timeConsumedMillis: Math.min(2000, (a.timeSpentSeconds || 0) * 10),
      };
    }).filter((s) => !existingProblemKeys.has(`${s.contestId || ''}-${s.problem.index}`) || s.verdict === 'OK');

    return [...cfSubmissions, ...convertedAttempts];
  }, [cfSubmissions, attempts]);

  const cutoff = cutoffMs(dateRange);

  const filteredRating = ratingHistory.filter((r) => r.ratingUpdateTimeSeconds * 1000 >= cutoff);
  const filteredSubs = allSubmissions.filter((s) => s.creationTimeSeconds * 1000 >= cutoff);
  const stats = filteredSubs.length > 0 ? deriveStats(filteredSubs) : null;

  // Rating chart
  const ratingChartData = filteredRating.map((r) => ({
    date: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    rating: r.newRating,
    change: r.newRating - r.oldRating,
    contest: r.contestName,
  }));

  const currentRating = profile.verifiedCfRating ?? 0;
  const maxRating = profile.maxCfRating ?? currentRating;
  const ratingGap = targetRating - currentRating;
  const progressPct = Math.min(100, Math.round((currentRating / targetRating) * 100));

  // Tag radar
  const topTags = stats
    ? Object.entries(stats.byTag)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, solved]) => ({ tag, solved, fullMark: Math.max(...Object.values(stats.byTag)) }))
    : [];

  // Rating bucket chart
  const ratingBuckets = stats
    ? Object.entries(stats.byRating)
        .map(([r, c]) => ({ rating: r, count: c }))
        .sort((a, b) => Number(a.rating) - Number(b.rating))
    : [];

  // Activity chart (last 30 days)
  const activityData = useMemo(() => {
    const map: Record<string, number> = {};
    const days = 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().split('T')[0];
      map[d] = 0;
    }
    for (const sub of allSubmissions) {
      const d = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
      if (d in map) map[d]++;
    }
    return Object.entries(map).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [allSubmissions]);

  // Handle Practice Weakness action
  const handlePracticeTag = (tag: string) => {
    const matchedCurriculum = TOPICS.find((t) =>
      t.recommendedProblems.some((p) => p.tags.some((pt) => pt.toLowerCase().includes(tag.toLowerCase())))
    );
    if (matchedCurriculum && onSelectProblem) {
      const prob = matchedCurriculum.recommendedProblems.find((p) =>
        p.tags.some((pt) => pt.toLowerCase().includes(tag.toLowerCase()))
      ) || matchedCurriculum.recommendedProblems[0];
      onSelectProblem(prob);
    } else if (onOpenCurriculumTopic && matchedCurriculum) {
      onOpenCurriculumTopic(matchedCurriculum.id);
    }
  };

  const StatCard = ({ icon: Icon, label, value, sub, color = 'text-indigo-400' }: {
    icon: any; label: string; value: string | number; sub?: string; color?: string;
  }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChartIcon size={22} semantic="primary" />
            Topic Mastery & Rating Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Diagnostic performance telemetry, algorithmic weakness detection, and rating trajectory toward {targetRating}.
          </p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 flex-nowrap">
          {(['7d', '30d', '90d', '180d', 'all'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                dateRange === r
                  ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {r === 'all' ? 'All time' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Target Rating Progress Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TargetRatingIcon size={20} semantic="warning" />
              Target Goal: {targetRating} Rating
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {currentRating > 0
                ? `${ratingGap > 0 ? `${ratingGap} rating points to goal` : '🎉 Target milestone achieved!'}`
                : 'Connect your Codeforces account to verify your official rating'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block w-36 h-22 rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-950/40 p-0.5 shrink-0">
              <ProgressGrowthIllustration width="100%" height="100%" />
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{currentRating || '—'}</p>
              <p className="text-xs text-slate-400">Current rating</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentRating} ({progressPct}%)</span>
            <span className="font-bold text-slate-900 dark:text-white">{targetRating}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{currentRating}</p>
            <p className="text-xs text-slate-400">Current</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{maxRating}</p>
            <p className="text-xs text-slate-400">Peak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{ratingHistory.length}</p>
            <p className="text-xs text-slate-400">Contests</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats?.totalSolved ?? 0}</p>
            <p className="text-xs text-slate-400">Problems AC</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOPIC MASTERY & WEAK-AREA DETECTION ENGINE (Feature 2)
          ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PracticeIcon size={20} semantic="primary" />
              Algorithmic Weak-Area Detection & Mastery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifies practice deficits across foundational, algorithmic, and contest patterns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Benchmark Coverage: <strong className="text-emerald-600 dark:text-emerald-400">{topicAnalysis.overallCoveragePercent}%</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Unique Solved: <strong className="text-slate-900 dark:text-white">{topicAnalysis.totalUniqueTagsSolved}</strong> tags
            </div>
          </div>
        </div>

        {/* Top Identified Deficits Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Priority Growth Areas (Highest Practice Deficits)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topicAnalysis.topDeficitTags.slice(0, 3).map((item) => (
              <div
                key={item.tag}
                className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.displayName}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}>
                      {item.status} deficit
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Solved / Target</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {item.solvedCount} / {item.targetSolves} AC
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((item.solvedCount / Math.max(1, item.targetSolves)) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Target ~Rating {item.recommendedRating}
                    </span>

                    <button
                      type="button"
                      onClick={() => handlePracticeTag(item.tag)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
                    >
                      <ZapIcon className="w-3.5 h-3.5 text-amber-300" />
                      <span>Practice</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Strengths Grid */}
        {topicAnalysis.topStrengths.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Demonstrated Strengths
            </span>
            <div className="flex flex-wrap gap-2">
              {topicAnalysis.topStrengths.map((s) => (
                <div
                  key={s.tag}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-800 dark:text-emerald-300 font-semibold"
                >
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{s.displayName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({s.solvedCount} solves)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={TotalSolvedIcon as any} label="Problems Solved" value={stats?.totalSolved ?? 0} sub="unique accepted" color="text-emerald-600" />
        <StatCard icon={TargetIcon as any} label="Accuracy" value={stats ? `${stats.accuracy}%` : '—'} sub="AC / attempted" color="text-cyan-600" />
        <StatCard icon={WrongAnswerIcon as any} label="Wrong Answers" value={stats?.verdictCounts['WRONG_ANSWER'] ?? 0} sub="WA submissions" color="text-red-500" />
        <StatCard icon={TimeLimitIcon as any} label="TLE Count" value={stats?.verdictCounts['TIME_LIMIT_EXCEEDED'] ?? 0} sub="time limit exceeded" color="text-amber-500" />
      </div>

      {/* Rating History Chart */}
      {ratingChartData.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendUpIcon size={16} semantic="primary" />
            Rating History
            <span className="text-xs font-normal text-slate-400">({ratingChartData.length} official rounds)</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ratingChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="analyticsRatingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number, _: string, p: any) => [
                  `${val} (${p.payload.change >= 0 ? '+' : ''}${p.payload.change})`,
                  'Rating',
                ]}
                labelFormatter={(_: string, p: any) => p?.[0]?.payload?.contest ?? _}
              />
              <Area type="monotone" dataKey="rating" stroke="#059669" strokeWidth={2.5} fill="url(#analyticsRatingGrad)" dot={{ fill: '#059669', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2 shadow-sm">
          <TrendUpIcon size={36} className="text-slate-300 mx-auto" />
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">No rating history recorded yet.</p>
          <p className="text-slate-400 text-xs">Connect your Codeforces handle in Settings to sync your official contest rating chart.</p>
        </div>
      )}

      {/* Two charts side by side */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Solved by Rating */}
          {ratingBuckets.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Solved by Rating Tier</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ratingBuckets} margin={{ left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ratingBuckets.map((entry, index) => {
                      const r = Number(entry.rating);
                      const color = r <= 1000 ? '#10b981' : r <= 1200 ? '#06b6d4' : r <= 1400 ? '#6366f1' : r <= 1600 ? '#a855f7' : '#f97316';
                      return <Cell key={index} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tag radar */}
          {topTags.length >= 3 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Solved by Tag (Top 8)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={topTags} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="tag" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 8 }} />
                  <Radar dataKey="solved" stroke="#059669" fill="#10b981" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
