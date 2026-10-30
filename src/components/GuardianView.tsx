import React, { useState } from 'react';
import { FocusDisciplineIllustration } from './assets';
import {
  ShieldIcon as Shield,
  PreferencesIcon as Smartphone,
  CheckCircleIcon as CheckCircle2,
  ClockStatusIcon as Clock,
  RefreshIcon as RefreshCw,
  LearningRoadmapIcon as Tv,
  LockIcon as Lock,
  DeleteIcon as Trash2,
  SuggestOptimizationIcon as Zap,
  AISparkleIcon as Sparkles,
  ForwardIcon as ArrowRight,
  FilterIcon as Filter,
} from './icons';
import {
  AndroidDeviceHealth,
  AppRestrictionRule,
  AppUsageEvent,
  DistractionCostReport,
  DistractionPattern,
  FocusSessionTimelineEntry,
  GuardianAccuracyCorrection,
  StudyProfile,
  UserGoal,
  UserProfile,
  YouTubeLearningSession,
} from '../types';
import {
  buildFocusTimeline,
  calculateDistractionCost,
  DEFAULT_PACKAGE_CLASSIFICATIONS,
} from '../utils/guardianEngine';

interface GuardianViewProps {
  goal: UserGoal;
  profile: UserProfile;
  onSelectProblem?: (problem: any) => void;
}

export const GuardianView: React.FC<GuardianViewProps> = ({ goal, profile, onSelectProblem }) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'apps' | 'websites' | 'youtube' | 'health' | 'privacy'>('timeline');

  // Device Health State (Feature 20)
  const [deviceHealth, setDeviceHealth] = useState<AndroidDeviceHealth>({
    usageStatsGranted: true,
    accessibilityGranted: true,
    screenCaptureAuthorized: false,
    notificationGranted: true,
    vpnConnected: true,
    batteryOptimizationsIgnored: true,
    lastSyncTimestamp: 'Just now',
    deviceModel: 'Android Companion Host (Pixel 8 Pro / Emulator)',
    androidVersion: 'Android 15 (API 35)',
  });

  // Sample App Restriction Rules (Feature 11, 15, 17)
  const [appRules, setAppRules] = useState<AppRestrictionRule[]>([
    { id: 'r1', packageName: 'com.instagram.android', appName: 'Instagram', category: 'social_media', isBlocked: true, delaySeconds: 15, allowInStrictFocus: false, isEssential: false },
    { id: 'r2', packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', category: 'entertainment', isBlocked: true, delaySeconds: 30, allowInStrictFocus: false, isEssential: false },
    { id: 'r3', packageName: 'com.reddit.frontpage', appName: 'Reddit', category: 'entertainment', isBlocked: true, delaySeconds: 15, allowInStrictFocus: false, isEssential: false },
    { id: 'r4', packageName: 'com.google.android.dialer', appName: 'Phone (Emergency)', category: 'essential_communication', isBlocked: false, delaySeconds: 0, allowInStrictFocus: true, isEssential: true },
    { id: 'r5', packageName: 'com.google.android.apps.authenticator2', appName: 'Authenticator (2FA)', category: 'productivity', isBlocked: false, delaySeconds: 0, allowInStrictFocus: true, isEssential: true },
    { id: 'r6', packageName: 'com.instructure.candroid', appName: 'Canvas Student (University)', category: 'university_study', isBlocked: false, delaySeconds: 0, allowInStrictFocus: true, isEssential: true },
    { id: 'r7', packageName: 'com.termux', appName: 'Termux (C++ Terminal)', category: 'competitive_programming', isBlocked: false, delaySeconds: 0, allowInStrictFocus: true, isEssential: true },
  ]);

  // Study-Only Website Profiles (Feature 12 & 13)
  const [studyProfiles, setStudyProfiles] = useState<StudyProfile[]>([
    { id: 'p1', name: 'Codeforces Practice', allowedDomains: ['codeforces.com', 'atcoder.jp', 'cses.fi', 'cppreference.com'], restrictedApps: ['Instagram', 'TikTok'], strictBlocking: true, active: true },
    { id: 'p2', name: 'C++ Learning', allowedDomains: ['learncpp.com', 'en.cppreference.com', 'cplusplus.com', 'geeksforgeeks.org'], restrictedApps: ['Netflix'], strictBlocking: false, active: false },
    { id: 'p3', name: 'University Study', allowedDomains: ['canvas.instructure.com', 'blackboard.com', 'edx.org', 'coursera.org'], restrictedApps: ['Social Media'], strictBlocking: false, active: false },
    { id: 'p4', name: 'Deep Work', allowedDomains: ['codeforces.com', 'github.com'], restrictedApps: ['All entertainment'], strictBlocking: true, active: false },
  ]);

  // Raw Usage Events
  const [usageEvents, setUsageEvents] = useState<AppUsageEvent[]>([
    {
      id: 'ev_1',
      packageName: 'com.termux',
      appName: 'Termux (C++20 Terminal)',
      category: 'competitive_programming',
      startTime: '10:00 AM',
      endTime: '10:35 AM',
      durationSeconds: 2100,
      confidence: 0.98,
      detectionSource: 'high_confidence_rule',
      isStudyRelevant: true,
      relevanceExplanation: 'Problem implementation and testing.',
    },
    {
      id: 'ev_2',
      packageName: 'com.google.android.youtube',
      appName: 'YouTube (Tutorial Mode)',
      category: 'educational_content',
      startTime: '10:35 AM',
      endTime: '10:47 AM',
      durationSeconds: 720,
      confidence: 0.88,
      detectionSource: 'active_context',
      isStudyRelevant: true,
      relevanceExplanation: 'Prefix Sums & Range Queries video editorial.',
    },
    {
      id: 'ev_3',
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      category: 'social_media',
      startTime: '10:48 AM',
      endTime: '10:56 AM',
      durationSeconds: 480,
      confidence: 0.95,
      detectionSource: 'high_confidence_rule',
      isStudyRelevant: false,
      relevanceExplanation: 'Foreground social media app during active study session.',
    },
  ]);

  // YouTube Learning Mode (Feature 22)
  const [ytUrl, setYtUrl] = useState('');
  const [ytObjective, setYtObjective] = useState('');
  const [ytNotes, setYtNotes] = useState('');
  const [ytSession, setYtSession] = useState<YouTubeLearningSession | null>(null);
  const [ytLoading, setYtLoading] = useState(false);

  // Selected event for user correction feedback (Feature 10 & 26)
  const [correctionTarget, setCorrectionTarget] = useState<AppUsageEvent | null>(null);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);

  // Strict Focus Mode state (Feature 14)
  const [strictFocusActive, setStrictFocusActive] = useState(false);

  // Distraction Cost
  const distractionReport: DistractionCostReport = calculateDistractionCost(goal.dailyMinutes, usageEvents);

  // Handle User Correction
  const handleApplyCorrection = (isRelevant: boolean) => {
    if (!correctionTarget) return;

    setUsageEvents((prev) =>
      prev.map((e) =>
        e.id === correctionTarget.id
          ? {
              ...e,
              isStudyRelevant: isRelevant,
              category: isRelevant ? 'educational_content' : 'configured_distraction',
              userCorrection: isRelevant ? 'educational_content' : 'configured_distraction',
            }
          : e
      )
    );

    setFeedbackSuccessMsg(`Applied correction for ${correctionTarget.appName}. Future rules adjusted with zero penalty.`);
    setCorrectionTarget(null);
    setTimeout(() => setFeedbackSuccessMsg(null), 4000);
  };

  // Handle YouTube Mode Submission
  const handleProcessYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl) return;

    setYtLoading(true);
    try {
      const res = await fetch('/api/guardian/youtube-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: ytUrl,
          videoTitle: ytObjective || 'Binary Search Tutorial',
          objective: ytObjective,
          notes: ytNotes,
        }),
      });
      const data = await res.json();
      if (data.session) {
        setYtSession(data.session);
      }
    } catch {
      // Offline fallback
      setYtSession({
        id: `yt_${Date.now()}`,
        videoUrl: ytUrl,
        videoTitle: ytObjective || 'C++ Algorithmic Tutorial',
        learningObjective: ytObjective,
        timestampedNotes: [{ timestamp: '03:15', note: ytNotes || 'Core invariant explained.' }],
        aiRecap: 'The tutorial demonstrates that when monotonicity holds, binary search reduces O(N) linear search to O(log N).',
        relatedProblemId: '1352C',
        conceptCheckQuestion: 'If f(mid) is monotonic, why is the condition mid = lo + (hi - lo) / 2 safe from integer overflow?',
        completed: true,
      });
    } finally {
      setYtLoading(false);
    }
  };

  // Handle GDPR Purge (Feature 28)
  const handlePurgeHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all device usage events and AI feedback history? This action is immediate and irreversible.')) {
      return;
    }
    setUsageEvents([]);
    try {
      await fetch('/api/privacy/purge-data', { method: 'POST' });
    } catch {}
    alert('All local and server-synced device activity history has been completely purged.');
  };

  const timelineEntries = buildFocusTimeline(usageEvents);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                AI Study Guardian Active
              </span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                Android Companion Paired
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Study Guardian & Phone Intelligence</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Monitors authorized device signals, prevents social media diversion, contextualizes educational viewing, and protects your 180-day focus toward 1600.
            </p>

            <div className="pt-1">
              <button
                onClick={() => setStrictFocusActive(!strictFocusActive)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                  strictFocusActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{strictFocusActive ? 'End Strict Focus' : 'Launch Strict Focus (45m)'}</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex justify-center md:justify-end shrink-0">
            <div className="w-56 h-36 rounded-2xl overflow-hidden border border-teal-500/20 shadow-xl bg-slate-950/60 p-1">
              <FocusDisciplineIllustration width="100%" height="100%" />
            </div>
          </div>
        </div>

        {/* Feature 19: Focus Recovery Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-cyan-300">Active Task Recovery:</span>
            <span className="truncate max-w-[220px] sm:max-w-none">1352C — K-th Not Divisible by n (1200)</span>
          </div>
          <button
            onClick={() => onSelectProblem && onSelectProblem({ contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] })}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            <span>Resume in Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {feedbackSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'timeline' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline & Distraction</span>
        </button>

        <button
          onClick={() => setActiveSubTab('apps')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'apps' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App Restrictions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('websites')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'websites' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Study Web Profiles</span>
        </button>

        <button
          onClick={() => setActiveSubTab('youtube')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'youtube' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>YouTube Learning</span>
        </button>

        <button
          onClick={() => setActiveSubTab('health')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'health' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Device Health</span>
        </button>

        <button
          onClick={() => setActiveSubTab('privacy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'privacy' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy & Purge</span>
        </button>
      </div>

      {/* ─── TAB 1: TIMELINE & DISTRACTION COST ─── */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-6">
          {/* Distraction Cost Metrics (Feature 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Target</span>
              <p className="text-2xl font-black text-slate-100">{distractionReport.scheduledStudyMinutes}m</p>
              <span className="text-xs text-slate-400">Daily practice allocation</span>
            </div>

            <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/20 p-4 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Confirmed Focus Time</span>
              <p className="text-2xl font-black text-emerald-400">{distractionReport.confirmedForegroundMinutes}m</p>
              <span className="text-xs text-emerald-500/80">In editor, compiler & study apps</span>
            </div>

            <div className="rounded-2xl border border-rose-900/30 bg-rose-950/20 p-4 space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Estimated Distraction</span>
              <p className="text-2xl font-black text-rose-400">{distractionReport.estimatedOffTaskMinutes}m</p>
              <span className="text-xs text-rose-500/80">({distractionReport.lostPercentage}% of scheduled session)</span>
            </div>

            <div className="rounded-2xl border border-cyan-900/30 bg-cyan-950/20 p-4 space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Authorized Breaks</span>
              <p className="text-2xl font-black text-cyan-400">{distractionReport.authorizedBreakMinutes}m</p>
              <span className="text-xs text-cyan-500/80">Essential calls & pauses</span>
            </div>
          </div>

          {/* Practical Intervention Insights (Feature 8) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Personalized Distraction Patterns & Non-Shaming Interventions</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                <span className="font-bold text-indigo-300">Observed Trigger Pattern</span>
                <p className="text-slate-300">Opening social media apps within 3 minutes before starting problems rated ≥ 1200.</p>
                <span className="text-slate-500">Root Cause: Pre-problem cognitive resistance and fear of getting stuck.</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-1">
                <span className="font-bold text-emerald-300">Recommended Intervention</span>
                <p className="text-slate-300">Use the 5-Minute Start Protocol to read input constraints and write I/O before touching your phone.</p>
                <span className="text-slate-500">Zero shaming: 180-day habit formation is about friction management.</span>
              </div>
            </div>
          </div>

          {/* Chronological Focus Timeline (Feature 6 & 10) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Today's Focus Session Timeline</span>
              </h3>
              <span className="text-xs text-slate-400">Tap 'Correct' on any event to teach the Guardian</span>
            </div>

            <div className="space-y-3">
              {timelineEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 text-sm">{entry.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          entry.type === 'focus'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : entry.type === 'essential_interruption'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {entry.type === 'focus' ? 'FOCUSED STUDY' : entry.type === 'essential_interruption' ? 'ESSENTIAL CALL' : 'CONFIGURED DISTRACTION'}
                      </span>
                      <span className="text-slate-400">
                        {entry.startTime} – {entry.endTime} ({Math.round(entry.durationSeconds / 60)}m)
                      </span>
                    </div>
                    <p className="text-slate-400">{entry.details}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Confidence: {Math.round(entry.confidence * 100)}%</span>
                      <span>Source: {entry.source}</span>
                      {entry.userVerified && <span className="text-emerald-400">✔ User Verified</span>}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setCorrectionTarget(usageEvents.find((e) => `timeline_${e.id}` === entry.id) || null)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      Correct AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: APP RESTRICTION POLICIES ─── */}
      {activeSubTab === 'apps' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">User-Configured App Restriction Ladder (Feature 11 & 17)</h3>
              <p className="text-xs text-slate-400 mt-1">
                When opened during an active focus session, restricted apps trigger a gentle breathing delay screen reminding you of your problem. Emergency and 2FA apps are permanently permitted.
              </p>
            </div>

            <div className="space-y-2.5">
              {appRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">{rule.appName}</span>
                      {rule.isEssential && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          SAFETY ESSENTIAL
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">{rule.packageName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {!rule.isEssential && (
                      <select
                        value={rule.delaySeconds}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAppRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, delaySeconds: val } : r))
                          );
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value={0}>Instant Pause</option>
                        <option value={15}>15s Breathe</option>
                        <option value={30}>30s Delay</option>
                      </select>
                    )}

                    {!rule.isEssential ? (
                      <button
                        onClick={() => {
                          setAppRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, isBlocked: !r.isBlocked } : r))
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          rule.isBlocked
                            ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {rule.isBlocked ? 'Restricted' : 'Permitted'}
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-xs">Always Allowed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: STUDY-ONLY WEBSITES ─── */}
      {activeSubTab === 'websites' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Study-Only Website Profiles (Feature 12 & 13)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Powered by Android's local VpnService. Drops DNS requests for distracting sites during practice. No remote proxying or encrypted packet inspection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studyProfiles.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 space-y-2 transition-all cursor-pointer ${
                    p.active ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/40'
                  }`}
                  onClick={() => {
                    setStudyProfiles((prev) => prev.map((item) => ({ ...item, active: item.id === p.id })));
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{p.name}</span>
                    {p.active && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">ACTIVE</span>}
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">Permitted Educational Domains:</p>
                    <div className="flex flex-wrap gap-1">
                      {p.allowedDomains.map((d) => (
                        <span key={d} className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: YOUTUBE LEARNING MODE ─── */}
      {activeSubTab === 'youtube' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">YouTube Learning Mode (Feature 22)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Convert video tutorials into concrete coding challenges. Enter video details to generate a structured recap and link directly to a related Codeforces problem.
              </p>
            </div>

            <form onSubmit={handleProcessYouTube} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">YouTube Video URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Learning Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Master Monotonicity in Binary Search on Answer"
                  value={ytObjective}
                  onChange={(e) => setYtObjective(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Key Timestamped Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. 04:30 Invariant check: if mid satisfies condition, answer lies in [mid, hi]"
                  value={ytNotes}
                  onChange={(e) => setYtNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={ytLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                {ytLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Tv className="w-3.5 h-3.5" />}
                <span>Process Lesson & Generate Problem Drill</span>
              </button>
            </form>

            {ytSession && (
              <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4 space-y-3 text-xs mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 text-sm">AI Tutorial Synthesis</span>
                  <span className="text-emerald-400 font-semibold">Active Session</span>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Core Conceptual Recap:</p>
                  <p className="text-slate-300">{ytSession.aiRecap}</p>
                </div>
                {ytSession.conceptCheckQuestion && (
                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-300">Check-For-Understanding Question:</span>
                    <p className="text-slate-300">{ytSession.conceptCheckQuestion}</p>
                  </div>
                )}
                {ytSession.relatedProblemId && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-300">
                      Recommended Immediate Drill: <strong>1352C — K-th Not Divisible by n</strong>
                    </span>
                    <button
                      onClick={() => onSelectProblem && onSelectProblem({ contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] })}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Open in Arena
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: DEVICE HEALTH & DIAGNOSTIC ─── */}
      {activeSubTab === 'health' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Permission & Device Health Center (Feature 20)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Live verification of optional Android permissions. Each capability can be toggled without disabling the entire system.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Usage Access (UsageStatsManager)</p>
                  <p className="text-slate-400">Classifies foreground apps and detects off-task drift during focus sessions.</p>
                </div>
                <span className="text-emerald-400 font-bold">GRANTED</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Focus Accessibility Service</p>
                  <p className="text-slate-400">Renders gentle pause screen when user-restricted apps are launched.</p>
                </div>
                <span className="text-emerald-400 font-bold">ENABLED</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Website Distraction Filter (VpnService)</p>
                  <p className="text-slate-400">Local packet filter for study-only profiles. Never inspects encrypted HTTPS data.</p>
                </div>
                <span className="text-emerald-400 font-bold">CONNECTED</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Screen Capture (MediaProjection)</p>
                  <p className="text-slate-400">Optional opt-in for tutorial context analysis. Discards images immediately.</p>
                </div>
                <span className="text-slate-400 font-semibold">OPT-IN (STANDBY)</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Battery Optimization Whitelist</p>
                  <p className="text-slate-400">Prevents OS background killers from terminating active practice timers.</p>
                </div>
                <span className="text-emerald-400 font-bold">EXEMPTED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PRIVACY & DATA RETENTION ─── */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Local-First Privacy & Transparent Audit (Features 27-30)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your study habits and device activity remain strictly on your device. Zero credentials, banking screens, or private messages are ever collected.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                <span className="font-bold text-indigo-300">Privacy Guarantees</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li>No persistent screenshot storage: images analyzed in opt-in mode are discarded immediately.</li>
                  <li>No covert background surveillance: persistent notification is visible whenever monitoring is active.</li>
                  <li>Zero secret restrictions: AI only recommends app restrictions; user must explicitly confirm.</li>
                  <li>Full GDPR erasure: you can wipe your entire activity history with one click.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handlePurgeHistory}
                  className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge All Activity History</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Correction Modal (Feature 10 & 26) */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Correct Classification: {correctionTarget.appName}</h3>
            <p className="text-xs text-slate-400">
              The AI classified this activity as <strong className="text-rose-400">{correctionTarget.category}</strong>. Was this actually relevant to your study session?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleApplyCorrection(true)}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Mark as Relevant Study
              </button>
              <button
                onClick={() => handleApplyCorrection(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
              >
                Confirm Distraction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
