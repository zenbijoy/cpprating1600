import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  UserIcon,
  RefreshIcon,
  CheckCircleIcon,
  WarningStatusIcon,
  ExternalLinkIcon,
  TrendUpIcon,
  TargetRatingIcon,
  WeeklyActivityIcon,
  TimerIcon,
  CalendarIcon,
  CodingBracketsIcon,
  OnlineStatusIcon,
  OfflineStatusIcon,
  EditIcon,
  CloseIcon,
  BarChartIcon,
  ProblemTagsIcon,
  WrongAnswerIcon,
  CheckCircle2Icon as CheckCircle2,
  AlertCircleIcon as AlertCircle,
  ClockIcon as Clock,
  TrendingUpIcon as TrendingUp,
  AwardIcon as Award,
  ShieldCheckIcon as ShieldCheck,
  RotateCcwIcon as RotateCcw,
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
  ReferenceLine,
} from 'recharts';
import { CFRatingChange, CFSubmissionRecord, CFUserInfo, UserProfile, MistakeRecord, CFProblem } from '../types';
import {
  codeforcesService,
  CFProblemStats,
  deriveStats,
  getSyncCooldownSeconds,
  calculateRatingDelta,
} from '../services/codeforces';
import { cfStorageService, storageService } from '../services/storage';
import { useToast } from './Toast';

interface CodeforcesProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  isCfVerified?: boolean;
  onOpenVerificationModal?: (initialHandle?: string) => void;
  targetRating?: number;
  onSelectProblem?: (prob: CFProblem) => void;
  onSaveMistake?: (mistake: MistakeRecord) => void;
}

type DateRange = '7d' | '30d' | '90d' | '180d' | 'all';

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '180 days', value: '180d' },
  { label: 'All time', value: 'all' },
];

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

function formatTs(seconds: number): string {
  return new Date(seconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelative(seconds: number): string {
  const diff = Math.floor((Date.now() - seconds * 1000) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const VERDICT_LABELS: Record<string, string> = {
  OK: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
  PRESENTATION_ERROR: 'Presentation Error',
  SKIPPED: 'Skipped',
  PARTIAL: 'Partial',
  HACKED: 'Hacked',
};

function verdictBg(v: string | undefined): string {
  if (!v) return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400';
  if (v === 'OK') return 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/40';
  if (v === 'WRONG_ANSWER') return 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/40';
  if (v === 'TIME_LIMIT_EXCEEDED') return 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/40';
  if (v === 'MEMORY_LIMIT_EXCEEDED') return 'bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700/40';
  if (v === 'RUNTIME_ERROR') return 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700/40';
  if (v === 'COMPILATION_ERROR') return 'bg-pink-50 text-pink-800 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-700/40';
  return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/40';
}

export const CodeforcesProfileView: React.FC<CodeforcesProfileViewProps> = ({
  profile,
  onUpdateProfile,
  isCfVerified = false,
  onOpenVerificationModal,
  targetRating = 1600,
  onSelectProblem,
  onSaveMistake,
}) => {
  const { success, error: toastError, info: toastInfo } = useToast();

  const [handle, setHandle] = useState(profile.cfHandle ?? '');
  const [inputHandle, setInputHandle] = useState('');
  const [isEditing, setIsEditing] = useState(!profile.cfHandle);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'cached' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState<CFUserInfo | null>(() => cfStorageService.getCFUserInfo());
  const [ratingHistory, setRatingHistory] = useState<CFRatingChange[]>(() => cfStorageService.getRatingHistory());
  const [submissions, setSubmissions] = useState<CFSubmissionRecord[]>(() => cfStorageService.getCFSubmissions());
  const [stats, setStats] = useState<CFProblemStats | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [lastSync, setLastSync] = useState<string | null>(() => {
    const s = cfStorageService.getSyncState();
    return s?.lastUserInfoSync ?? null;
  });

  // 30-Second Refresh Cooldown Tracker
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(() => {
    return getSyncCooldownSeconds(cfStorageService.getSyncState()?.lastUserInfoSync, 30);
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Compute stats when submissions change
  useEffect(() => {
    if (submissions.length > 0) setStats(deriveStats(submissions));
  }, [submissions]);

  // Rating trajectory metrics
  const ratingDelta = useMemo(() => {
    return calculateRatingDelta(ratingHistory);
  }, [ratingHistory]);

  // ── Sync with Codeforces ───────────────────────────────────────────────────
  const syncAll = useCallback(async (h: string, isManual = false) => {
    if (isManual && cooldownSeconds > 0) {
      toastInfo(`Please wait ${cooldownSeconds}s before refreshing again to prevent Codeforces rate limiting.`, 'Refresh Throttled');
      return;
    }

    setSyncStatus('syncing');
    setLoading(true);
    setErrorMsg(null);

    try {
      const [info, rating, subs] = await Promise.all([
        codeforcesService.getUserInfo(h),
        codeforcesService.getUserRating(h),
        codeforcesService.getUserSubmissions(h, 500),
      ]);

      cfStorageService.saveCFUserInfo(info);
      cfStorageService.saveRatingHistory(rating);
      cfStorageService.saveCFSubmissions(subs as CFSubmissionRecord[]);

      const now = new Date().toISOString();
      cfStorageService.saveSyncState({
        handle: h,
        lastUserInfoSync: now,
        lastRatingSync: now,
        lastSubmissionsSync: now,
        status: 'ok',
        errorMessage: null,
      });

      setUserInfo(info);
      setRatingHistory(rating);
      setSubmissions(subs as CFSubmissionRecord[]);
      setLastSync(now);
      setSyncStatus('ok');
      setCooldownSeconds(30);

      // Update global profile with live CF telemetry
      onUpdateProfile({
        ...profile,
        cfHandle: h,
        verifiedCfRating: info.rating,
        maxCfRating: info.maxRating,
        rank: info.rank,
        avatar: info.avatar,
      });

      success(`Successfully synced telemetry for ${h}!`, 'Codeforces Synced');
    } catch (err: any) {
      const msg = err.message ?? 'Failed to reach Codeforces API';
      setErrorMsg(msg);

      // Check if we have cached data to fall back on smoothly
      const cachedInfo = cfStorageService.getCFUserInfo();
      if (cachedInfo) {
        setSyncStatus('cached');
        toastInfo(`Codeforces API temporarily busy. Displaying cached profile data from previous sync.`, 'Cached Mode');
      } else {
        setSyncStatus('error');
      }

      cfStorageService.saveSyncState({
        handle: h,
        lastUserInfoSync: cfStorageService.getSyncState()?.lastUserInfoSync || null,
        lastRatingSync: cfStorageService.getSyncState()?.lastRatingSync || null,
        lastSubmissionsSync: cfStorageService.getSyncState()?.lastSubmissionsSync || null,
        status: 'error',
        errorMessage: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [profile, onUpdateProfile, cooldownSeconds, success, toastInfo]);

  const handleConnect = async () => {
    const h = inputHandle.trim();
    if (!h) return;
    setHandle(h);
    setIsEditing(false);
    await syncAll(h);
  };

  const handleRefresh = () => {
    if (handle) syncAll(handle, true);
  };

  // Quick Autopsy Logger for failed submissions
  const handleQuickAutopsy = (sub: CFSubmissionRecord) => {
    const pid = `${sub.contestId ?? sub.problem.contestId ?? ''}${sub.problem.index}`;
    const newMistake: MistakeRecord = {
      id: `m_cf_${sub.id}_${Date.now()}`,
      problemId: pid,
      problemName: sub.problem.name,
      problemUrl: `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problem.index}`,
      rating: sub.problem.rating || 1200,
      tags: sub.problem.tags || [],
      category: sub.verdict === 'TIME_LIMIT_EXCEEDED' ? 'wrong_complexity' : 'boundary_case',
      originalApproach: `Attempted submission #${sub.id} in ${sub.programmingLanguage}.`,
      whyItFailed: `Failed on test with verdict ${sub.verdict || 'WA'}. Time consumed: ${sub.timeConsumedMillis || 0}ms.`,
      correctObservation: '',
      correctApproach: '',
      personalLesson: '',
      codeSnippet: `// Submission #${sub.id} (${sub.programmingLanguage})\n// Verdict: ${sub.verdict}`,
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
      easeFactor: 2.5,
      consecutiveSuccesses: 0,
    };

    if (onSaveMistake) {
      onSaveMistake(newMistake);
    } else {
      storageService.saveMistake(newMistake);
    }
    success(`Autopsy record created for ${pid} and scheduled for tomorrow's SM-2 review!`, 'Saved to Mistake Notebook');
  };

  // Filtered views
  const filteredRating = ratingHistory.filter(
    (r) => r.ratingUpdateTimeSeconds * 1000 >= cutoffMs(dateRange)
  );

  const filteredSubmissions = submissions.filter(
    (s) => s.creationTimeSeconds * 1000 >= cutoffMs(dateRange)
  );

  const filteredStats = filteredSubmissions.length > 0 ? deriveStats(filteredSubmissions) : stats;

  // Chart data
  const ratingChartData = filteredRating.map((r) => ({
    date: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    rating: r.newRating,
    change: r.newRating - r.oldRating,
    contest: r.contestName,
  }));

  const verdictChartData = filteredStats
    ? Object.entries(filteredStats.verdictCounts)
        .map(([k, v]) => ({ name: VERDICT_LABELS[k] ?? k, value: Number(v), key: k }))
        .sort((a, b) => Number(b.value) - Number(a.value))
    : [];

  const ratingBucketData = filteredStats
    ? Object.entries(filteredStats.byRating)
        .map(([rating, count]) => ({ rating: `${rating}`, count }))
        .sort((a, b) => Number(a.rating) - Number(b.rating))
    : [];

  const VERDICT_CHART_COLORS: Record<string, string> = {
    OK: '#059669',
    WRONG_ANSWER: '#e11d48',
    TIME_LIMIT_EXCEEDED: '#d97706',
    MEMORY_LIMIT_EXCEEDED: '#ea580c',
    RUNTIME_ERROR: '#9333ea',
    COMPILATION_ERROR: '#db2777',
  };

  // Current distance to 1600 target rating
  const currentRatingValue = userInfo?.rating || profile.verifiedCfRating || 0;
  const ratingDeficit = Math.max(0, targetRating - currentRatingValue);
  const ratingProgressPct = Math.min(100, Math.round((currentRatingValue / targetRating) * 100));

  // ── No Handle / Editing Handle State ───────────────────────────────────────
  if (isEditing || !handle) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 text-slate-900 dark:text-slate-100 font-sans">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <WeeklyActivityIcon size={32} semantic="primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Connect Codeforces Account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Link your public Codeforces handle to synchronize official contest ratings, problem verdicts, and submission analytics into CLIMB 1600.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Codeforces Handle
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="e.g. tourist or your_handle"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (onOpenVerificationModal) {
                    onOpenVerificationModal(inputHandle.trim());
                  } else {
                    handleConnect();
                  }
                }}
                disabled={loading || !inputHandle.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshIcon size={16} className="animate-spin" /> : <CheckCircleIcon size={16} />}
                <span>Verify & Connect</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300">
              <WarningStatusIcon size={16} semantic="error" className="shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-slate-900 dark:text-slate-200">What data is synchronized:</p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Public rating trajectory and official contest rank history</li>
              <li>Solved problems count and tag difficulty breakdown</li>
              <li>Submission verdicts for automated autopsy discovery</li>
            </ul>
            <p className="text-[11px] text-slate-400 pt-1">
              Zero sensitive data or credentials are required. All queries utilize public Codeforces REST APIs.
            </p>
          </div>
        </div>

        {handle && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 underline cursor-pointer"
            >
              Cancel and return to {handle}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Loading Skeleton ───────────────────────────────────────────────────────
  if (loading && !userInfo) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-2xl mx-auto shadow-sm font-sans">
        <RefreshIcon size={36} semantic="primary" className="animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Synchronizing with Codeforces...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Fetching official rating history, contest rank updates, and submission logs with rate limit protection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* =========================================================================
          TOP HEADER & TELEMETRY TOOLBAR
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <WeeklyActivityIcon size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Codeforces Telemetry & Sync
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Real-time competitive programming profile, rating milestones, and contest performance history.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Status Badge */}
            <div
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold ${
                syncStatus === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
                  : syncStatus === 'cached'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-300'
                  : syncStatus === 'syncing'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              {syncStatus === 'ok' ? (
                <OnlineStatusIcon size={12} />
              ) : syncStatus === 'syncing' ? (
                <RefreshIcon size={12} className="animate-spin" />
              ) : (
                <Clock size={12} />
              )}
              <span>
                {syncStatus === 'ok'
                  ? 'Synced'
                  : syncStatus === 'cached'
                  ? 'Cached'
                  : syncStatus === 'syncing'
                  ? 'Syncing…'
                  : 'Connected'}
              </span>
            </div>

            {lastSync && (
              <span className="text-[11px] text-slate-400 font-medium">
                {formatRelative(Math.floor(new Date(lastSync).getTime() / 1000))}
              </span>
            )}

            {/* Refresh Button with 30s Cooldown Throttling */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || cooldownSeconds > 0}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title={cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s before refreshing` : 'Fetch latest submissions and rating'}
            >
              <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
              <span>{cooldownSeconds > 0 ? `Cooldown (${cooldownSeconds}s)` : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputHandle(handle);
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer"
            >
              <EditIcon size={14} />
              <span>Change Handle</span>
            </button>
          </div>
        </div>

        {/* Informational Cached Alert Banner if live network failed */}
        {syncStatus === 'cached' && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
            <AlertCircle size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <p>
              Operating in <strong>Cached Mode</strong>: displaying previously synchronized Codeforces profile data from {lastSync ? formatTs(Math.floor(new Date(lastSync).getTime() / 1000)) : 'local storage'}. Live servers were temporarily busy.
            </p>
          </div>
        )}

        {/* =========================================================================
            PROFILE HERO CARD
            ========================================================================= */}
        {userInfo && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-6 flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={userInfo.titlePhoto || userInfo.avatar}
                alt={`${userInfo.handle} avatar`}
                className="w-20 h-20 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover bg-slate-100 dark:bg-slate-800 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${userInfo.handle}&background=059669&color=ffffff`;
                }}
              />
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {userInfo.handle}
                  </h2>

                  {isCfVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                      <ShieldCheck size={12} /> Verified Owner
                    </span>
                  ) : onOpenVerificationModal ? (
                    <button
                      type="button"
                      onClick={() => onOpenVerificationModal(userInfo.handle)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <ShieldCheck size={12} /> Verify Ownership
                    </button>
                  ) : null}

                  <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-md ${codeforcesService.getRankBg(userInfo.rank)} ${codeforcesService.getRankColor(userInfo.rank)}`}>
                    {userInfo.rank || 'Unrated'}
                  </span>

                  <a
                    href={`https://codeforces.com/profile/${userInfo.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="View official Codeforces profile"
                  >
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {userInfo.country && <span>📍 {userInfo.country}{userInfo.city ? `, ${userInfo.city}` : ''}</span>}
                  {userInfo.organization && <span>🏢 {userInfo.organization}</span>}
                  <span>👥 {userInfo.friendOfCount} friends</span>
                  <span>⭐ Contribution: {userInfo.contribution > 0 ? `+${userInfo.contribution}` : userInfo.contribution}</span>
                  <span>📅 Registered {formatTs(userInfo.registrationTimeSeconds)}</span>
                  <span>🕐 Last online {formatRelative(userInfo.lastOnlineTimeSeconds)}</span>
                </div>

                {/* Rating Goal Progress Bar */}
                <div className="pt-2 max-w-md space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Progress toward {targetRating} Specialist:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {currentRatingValue} / {targetRating} ({ratingProgressPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${ratingProgressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-right">
                    {ratingDeficit > 0 ? `${ratingDeficit} rating points remaining` : 'Target rating achieved! 🚀'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Metric Blocks */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Rating
                </span>
                <span className={`text-3xl font-black ${codeforcesService.getRankColor(userInfo.rank)}`}>
                  {userInfo.rating ?? 'Unrated'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Peak Rating
                </span>
                <span className={`text-xl font-bold ${codeforcesService.getRankColor(userInfo.maxRank)}`}>
                  {userInfo.maxRating ?? '—'}
                </span>
                {userInfo.maxRank && (
                  <span className={`block text-[11px] capitalize ${codeforcesService.getRankColor(userInfo.maxRank)}`}>
                    Peak: {userInfo.maxRank}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TRAJECTORY & STATS SUMMARY CARDS
            ========================================================================= */}
        {filteredStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Problems Solved
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {filteredStats.totalSolved}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">unique ACs</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} /> Accepted on Codeforces
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Accuracy Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {filteredStats.accuracy}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  of {filteredStats.totalAttempted} attempted
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <TrendingUp size={12} /> Solved / Attempted
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Contests
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {ratingHistory.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">rounds</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <Award size={12} /> Net Change: {ratingDelta.totalChange >= 0 ? `+${ratingDelta.totalChange}` : ratingDelta.totalChange}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Wrong Answers
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {filteredStats.verdictCounts['WRONG_ANSWER'] ?? 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">WA verdicts</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <RotateCcw size={12} /> Prime autopsy candidates
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          DATE RANGE SELECTOR
          ========================================================================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-xs mr-1">Period:</span>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                dateRange === opt.value
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredSubmissions.length} submissions & {filteredRating.length} contests
        </span>
      </div>

      {/* =========================================================================
          RATING HISTORY CHART WITH TARGET REFERENCE LINE
          ========================================================================= */}
      {ratingChartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendUpIcon size={18} semantic="primary" />
              <span>Official Contest Rating Progression</span>
              <span className="text-xs font-normal text-slate-400">({ratingChartData.length} contests)</span>
            </h2>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-3 h-0.5 bg-emerald-600 rounded"></span>
              <span className="text-slate-500 dark:text-slate-400">Target {targetRating}</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={ratingChartData} margin={{ top: 10, right: 15, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="ratingSaaSGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={45} domain={['dataMin - 100', 'dataMax + 100']} />
              <ReferenceLine y={targetRating} stroke="#059669" strokeDasharray="4 4" label={{ value: `Goal: ${targetRating}`, fill: '#059669', fontSize: 11, position: 'right' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: number, _: string, p: any) => [
                  <span key="rating-val">
                    <strong>{val}</strong>
                    <span className={`ml-2 font-bold ${p.payload.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {p.payload.change >= 0 ? `+${p.payload.change}` : p.payload.change}
                    </span>
                  </span>,
                  'Rating',
                ]}
                labelFormatter={(l: string, p: any) => p?.[0]?.payload?.contest ?? l}
              />
              <Area
                type="monotone"
                dataKey="rating"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#ratingSaaSGrad)"
                dot={{ fill: '#059669', r: 3 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* =========================================================================
          ANALYTICS GRIDS: VERDICTS & SOLVED BY RATING
          ========================================================================= */}
      {filteredStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verdict Distribution */}
          {verdictChartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChartIcon size={18} semantic="primary" />
                <span>Verdict Distribution</span>
              </h2>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={verdictChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {verdictChartData.map((entry) => (
                      <Cell key={entry.key} fill={VERDICT_CHART_COLORS[entry.key] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Solved by Rating Buckets */}
          {ratingBucketData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ProblemTagsIcon size={18} semantic="primary" />
                <span>Solved Problems by Rating Level</span>
              </h2>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingBucketData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
                  <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ratingBucketData.map((b) => {
                      const r = parseInt(b.rating, 10);
                      const isTarget = r >= 1200 && r <= 1600;
                      return <Cell key={b.rating} fill={isTarget ? '#059669' : '#64748b'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          RECENT SUBMISSIONS TABLE (WITH INSTANT AUTOPSY BUTTON)
          ========================================================================= */}
      {filteredSubmissions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TimerIcon size={18} semantic="primary" />
              <span>Recent Submissions Stream</span>
              <span className="text-xs font-normal text-slate-400">({filteredSubmissions.length} in period)</span>
            </h2>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[650px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="text-left py-2.5 px-3 font-semibold">Problem</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Verdict</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Language</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Time</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Memory</th>
                  <th className="text-right py-2.5 px-3 font-semibold">When</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubmissions.slice(0, 30).map((sub) => {
                  const pid = `${sub.contestId ?? sub.problem.contestId ?? ''}${sub.problem.index}`;
                  const cfUrl = sub.contestId
                    ? `https://codeforces.com/contest/${sub.contestId}/submission/${sub.id}`
                    : `https://codeforces.com/problemset/submission/${sub.problem.contestId}/${sub.id}`;
                  const probUrl = sub.problem.contestId
                    ? `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`
                    : '#';
                  const isSuccess = sub.verdict === 'OK';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <a
                          href={probUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[220px] block"
                        >
                          {pid} — {sub.problem.name}
                        </a>
                        {sub.problem.rating && (
                          <span className="text-[10px] text-slate-400 font-medium">★ {sub.problem.rating}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${verdictBg(sub.verdict)}`}>
                          {VERDICT_LABELS[sub.verdict ?? ''] ?? sub.verdict ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {sub.programmingLanguage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {sub.timeConsumedMillis != null ? `${sub.timeConsumedMillis}ms` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {sub.memoryConsumedBytes != null ? `${Math.round(sub.memoryConsumedBytes / 1024)}KB` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={cfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="View on Codeforces"
                        >
                          {formatRelative(sub.creationTimeSeconds)}
                          <ExternalLinkIcon size={10} className="inline ml-1 opacity-60" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!isSuccess ? (
                          <button
                            type="button"
                            onClick={() => handleQuickAutopsy(sub)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 font-semibold text-[10px] transition-colors cursor-pointer"
                            title="Log root-cause autopsy in Mistake Notebook"
                          >
                            Log Autopsy
                          </button>
                        ) : onSelectProblem ? (
                          <button
                            type="button"
                            onClick={() => onSelectProblem({
                              contestId: sub.contestId || sub.problem.contestId || 1,
                              index: sub.problem.index,
                              name: sub.problem.name,
                              rating: sub.problem.rating,
                              tags: sub.problem.tags,
                            })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] transition-colors cursor-pointer"
                          >
                            Practice
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredSubmissions.length > 30 && (
            <p className="text-[11px] text-slate-400 text-center pt-2">
              Showing recent 30 of {filteredSubmissions.length} submissions. Narrow with date filters.
            </p>
          )}
        </div>
      )}

      {/* =========================================================================
          OFFICIAL CONTEST HISTORY TABLE
          ========================================================================= */}
      {ratingHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon size={18} semantic="primary" />
              <span>Official Contest History</span>
              <span className="text-xs font-normal text-slate-400">({filteredRating.length} contests)</span>
            </h2>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[550px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="text-left py-2.5 px-3 font-semibold">Contest</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Rank</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Before</th>
                  <th className="text-right py-2.5 px-3 font-semibold">After</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Change</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...filteredRating].reverse().slice(0, 30).map((r) => {
                  const change = r.newRating - r.oldRating;
                  return (
                    <tr key={r.contestId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <a
                          href={`https://codeforces.com/contest/${r.contestId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[280px] block"
                        >
                          {r.contestName}
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 font-semibold">
                        #{r.rank}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">{r.oldRating}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {r.newRating}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {change >= 0 ? `+${change}` : change}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {formatTs(r.ratingUpdateTimeSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
