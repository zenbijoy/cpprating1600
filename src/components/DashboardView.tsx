import React, { useState, useMemo, useEffect } from 'react';
import {
  StreakIcon,
  RatingGoalIcon,
  TargetRatingIcon,
  ThinkingIcon,
  TrophyIcon,
  TimeSpentIcon,
  RetryIcon,
  SuggestOptimizationIcon,
  AISparkleIcon,
  CalendarIcon,
  CodeforcesIntegrationIcon,
  RefreshIcon,
  TrendUpIcon,
  TrendDownIcon,
  NeutralTrendIcon,
  ConsistencyIcon,
  TotalSolvedIcon,
  PracticeIcon,
  TopicMasteryIcon,
  AddIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CheckIcon,
  WarningStatusIcon,
  TimerIcon,
  CommunityIcon,
  ChatIcon,
} from './icons';
import { TabId } from './Navbar';
import {
  CFProblem,
  DailyPlan,
  DailyTask,
  MissionMode,
  MistakeRecord,
  ProblemAttempt,
  UserGoal,
  UserProfile,
} from '../types';
import { getPhaseForDay, getTopicForDay } from '../utils/roadmap';
import { compute30DayStreak } from '../utils/streak';
import { calculateTodayMinutesProgress } from '../utils/timeTracking';
import {
  calculateMilestone,
  evaluateDifficultyTrajectory,
  generatePersonalizedMission,
  rescheduleMission,
  generateWeeklyCoachReport,
  MissionDurationMode,
  WeeklyCoachReport,
} from '../utils/missionControl';
import {
  generateEnergyAdaptedPlan,
  generateFiveMinuteStartTask,
  calculateGoalControlCenter,
} from '../utils/habitEngine';
import { EnergyLevel, FiveMinuteStartTask } from '../types';
import { Achievements } from './Achievements';
import { CircularProgressRing } from './CircularProgressRing';
import { DailyMinutesModal } from './DailyMinutesModal';
import { WeeklyCoachReportModal } from './WeeklyCoachReportModal';
import { CFContest, codeforcesService } from '../services/codeforces';
import { cfStorageService, storageService } from '../services/storage';
import { useToast } from './Toast';
import { MountainSummitHero } from './assets';
import { computePracticeHeatmap } from '../utils/practiceHeatmap';
import { LogSessionModal, LogSessionPayload } from './LogSessionModal';

export interface DashboardViewProps {
  goal: UserGoal;
  profile: UserProfile;
  dailyPlan: DailyPlan;
  onUpdateDailyPlan: (plan: DailyPlan) => void;
  onSelectProblem: (problem: CFProblem) => void;
  onOpenAntiProcrastination: () => void;
  onOpenCurriculumTopic: (topicId: string) => void;
  recentAttempts: ProblemAttempt[];
  upcomingContestTitle?: string;
  upcomingContestTime?: string;
  mistakes?: MistakeRecord[];
  onUpdateGoal?: (goal: UserGoal) => void;
  isAuthenticated?: boolean;
  isCfVerified?: boolean;
  cfAccount?: any;
  onOpenAuthModal?: () => void;
  onOpenVerificationModal?: () => void;
  onSyncCfData?: () => void;
  onAttemptLogged?: (attempt: ProblemAttempt) => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  goal,
  profile,
  dailyPlan,
  onUpdateDailyPlan,
  onSelectProblem,
  onOpenAntiProcrastination,
  onOpenCurriculumTopic,
  recentAttempts,
  upcomingContestTitle,
  upcomingContestTime,
  mistakes = [],
  onUpdateGoal,
  isAuthenticated = false,
  isCfVerified = false,
  cfAccount,
  onOpenAuthModal,
  onOpenVerificationModal,
  onSyncCfData,
  onAttemptLogged,
  onNavigateTab,
}) => {
  const toast = useToast();
  const currentTopic = getTopicForDay(goal.currentDay);

  const completedTasksCount = dailyPlan.tasks.filter((t) => t.completed).length;
  const totalTasksCount = dailyPlan.tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Log Session Modal State
  const [showLogSessionModal, setShowLogSessionModal] = useState<boolean>(false);
  const [showAllRecentSessions, setShowAllRecentSessions] = useState<boolean>(false);

  // SkillTrack Heatmap & Goal Progress Engine (Reference Image 2)
  const heatmapAnalysis = useMemo(() => {
    return computePracticeHeatmap(recentAttempts, [dailyPlan], goal.dailyMinutes * 7);
  }, [recentAttempts, dailyPlan, goal.dailyMinutes]);

  // Greeting Time of Day
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }, []);

  // Practiced topics count today
  const practicedSkillsTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttempts = recentAttempts.filter(
      (a) => (a.endedAt || a.startedAt || '').split('T')[0] === todayStr
    );
    if (todayAttempts.length === 0) return 0;
    const uniqueTags = new Set(
      todayAttempts.flatMap((a) => (a.tags && a.tags.length > 0 ? a.tags : ['Practice']))
    );
    return uniqueTags.size;
  }, [recentAttempts]);

  // Dynamic diagnostic growth area based on authentic attempts & mistakes telemetry
  const diagnosticWeakness = useMemo(() => {
    if (mistakes && mistakes.length > 0) {
      const latest = mistakes[0];
      return {
        title: `Spaced Review: ${latest.problemName || 'Logged Mistake'}`,
        description: latest.whyItFailed || latest.personalLesson || `Category: ${latest.category.replace(/_/g, ' ')}. Review logic and boundary edge cases before re-attempting.`,
        category: latest.category.replace(/_/g, ' '),
      };
    }

    const failedAttempts = recentAttempts.filter(
      (a) => a.officialVerdict && a.officialVerdict !== 'OK' && a.officialVerdict !== 'UNSUBMITTED'
    );
    if (failedAttempts.length > 0) {
      const latestFail = failedAttempts[0];
      const verdict = latestFail.officialVerdict;
      let advice = 'Review edge cases and test inputs where constraints reach extreme upper or lower bounds.';
      if (verdict === 'TIME_LIMIT_EXCEEDED') {
        advice = 'Look for algorithmic efficiency bottlenecks. Avoid nested loops when N > 10^5; aim for O(N log N) or O(N).';
      } else if (verdict === 'MEMORY_LIMIT_EXCEEDED') {
        advice = 'Optimize data structure allocations. Consider reusable buffers or bitsets instead of heavy nested structures.';
      } else if (verdict === 'WRONG_ANSWER') {
        advice = `Analyze submission on ${latestFail.name || latestFail.problemId}. Check 64-bit integers (long long) for products/sums and 1-based indexing offsets.`;
      }
      return {
        title: `Recent Verdict Notice: ${verdict} on ${latestFail.name || latestFail.problemId}`,
        description: advice,
        category: verdict || 'Growth Area',
      };
    }

    if (recentAttempts.length > 0) {
      return {
        title: 'Maintaining Precision & Rating Momentum',
        description: `Great recent accuracy across ${recentAttempts.length} submissions! Continue solving problems at rating ${Math.min(1600, (profile.verifiedCfRating || 800) + 100)} to stretch problem-solving intuition.`,
        category: 'Consistent Progress',
      };
    }

    return {
      title: 'Initial Diagnostic Baseline',
      description: 'Connect your Codeforces handle or solve your first practice problem to generate personalized telemetry diagnostics.',
      category: 'Diagnostic Ready',
    };
  }, [mistakes, recentAttempts, profile.verifiedCfRating]);

  // User Initials for Avatar
  const userInitials = useMemo(() => {
    if (!profile.name) return 'CP';
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [profile.name]);

  // Handle "+ Log Session" saving
  const handleSaveSession = (payload: LogSessionPayload) => {
    const newAttempt: ProblemAttempt = {
      id: `session_${Date.now()}`,
      problemId: `custom_${payload.topic.toLowerCase().replace(/\s+/g, '_')}`,
      index: '1',
      url: `https://codeforces.com/problemset/custom/${payload.topic.toLowerCase().replace(/\s+/g, '_')}`,
      name: `${payload.topic} Practice`,
      tags: [payload.topic.toLowerCase()],
      startedAt: `${payload.dateStr}T10:00:00.000Z`,
      endedAt: `${payload.dateStr}T10:${String(payload.durationMinutes).padStart(2, '0')}:00.000Z`,
      timeSpentSeconds: payload.durationMinutes * 60,
      hintsUsedCount: payload.outcome === 'solved_with_hints' ? 1 : 0,
      highestHintLevel: payload.outcome === 'solved_with_hints' ? 2 : 0,
      officialVerdict: payload.outcome === 'solved_independently' || payload.outcome === 'solved_with_hints' ? 'OK' : 'UNSUBMITTED',
      outcome: payload.outcome,
      selfReported: true,
      approachNotes: payload.notes,
    };

    storageService.saveAttempt(newAttempt);
    onAttemptLogged?.(newAttempt);
    toast.show(`Practice session logged (${payload.durationMinutes} min on ${payload.topic})!`, 'success');
  };

  // 30-Day Streak Analysis
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const streakAnalysis = useMemo(() => {
    return compute30DayStreak(recentAttempts, [dailyPlan]);
  }, [recentAttempts, dailyPlan]);

  // Milestone and Difficulty Trajectory Telemetry
  const milestone = useMemo(() => {
    return calculateMilestone(profile.verifiedCfRating || 800, 1600);
  }, [profile.verifiedCfRating]);

  const diffEvaluation = useMemo(() => {
    return evaluateDifficultyTrajectory(recentAttempts, profile.verifiedCfRating || 800);
  }, [recentAttempts, profile.verifiedCfRating]);

  const dueMistakes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return mistakes.filter((m) => m.status === 'due' || m.nextReviewDate <= today);
  }, [mistakes]);

  // Weekly AI Coach Report Modal state
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState<boolean>(false);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyCoachReport | null>(null);

  // Reschedule Modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [rescheduleReason, setRescheduleReason] = useState<string>('Academic exams / high workload');

  // Mission Duration Mode
  const [durationMode, setDurationMode] = useState<MissionDurationMode>('60min');
  const [customMinutes, setCustomMinutes] = useState<number>(45);

  // Daily Minutes Goal Progress based on problem attempts logged today
  const todayMinutesProgress = useMemo(() => {
    return calculateTodayMinutesProgress(recentAttempts, goal.dailyMinutes);
  }, [recentAttempts, goal.dailyMinutes]);

  const [showMinutesDetails, setShowMinutesDetails] = useState<boolean>(false);
  const [showDailyMinutesModal, setShowDailyMinutesModal] = useState<boolean>(false);

  // Energy-Aware Scheduling & 5-Minute Start Protocol
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('normal');
  const [activeFiveMinTask, setActiveFiveMinTask] = useState<FiveMinuteStartTask | null>(null);

  // Quick Resume problem detection
  const recentResumeProblem = useMemo<CFProblem | null>(() => {
    try {
      const drafts = cfStorageService.getAllDrafts();
      if (drafts.length > 0) {
        const latestDraft = drafts[0];
        const match = latestDraft.problemId.match(/^(\d+)([A-Za-z]\w*)$/);
        if (match) {
          const contestId = parseInt(match[1], 10);
          const index = match[2];
          const matchingAttempt = recentAttempts.find((a) => a.contestId === contestId && a.index === index);
          if (matchingAttempt) {
            return {
              contestId,
              index,
              name: matchingAttempt.name,
              rating: matchingAttempt.rating,
              tags: matchingAttempt.tags || [],
            };
          }
          return {
            contestId,
            index,
            name: `Problem ${contestId}${index}`,
            rating: 1000,
            tags: ['practice'],
          };
        }
      }
      const unsolvedAttempt = recentAttempts.find(
        (a) => a.officialVerdict !== 'OK' && a.outcome !== 'solved_independently' && a.outcome !== 'solved_with_hints'
      );
      if (unsolvedAttempt && unsolvedAttempt.contestId) {
        return {
          contestId: unsolvedAttempt.contestId,
          index: unsolvedAttempt.index || 'A',
          name: unsolvedAttempt.name,
          rating: unsolvedAttempt.rating,
          tags: unsolvedAttempt.tags || [],
        };
      }
    } catch {
      // safe fallback
    }
    return null;
  }, [recentAttempts]);

  const handleSelectEnergy = (lvl: EnergyLevel) => {
    setEnergyLevel(lvl);
    const adapted = generateEnergyAdaptedPlan(goal.currentDay, goal.dailyMinutes, lvl);
    onUpdateDailyPlan(adapted);
    toast.show(`Mission adapted to ${lvl.replace('_', ' ')} energy mode`, 'info');
  };

  const handleLaunchFiveMinProtocol = () => {
    const task = generateFiveMinuteStartTask(goal.currentDay);
    setActiveFiveMinTask(task);
    toast.show('5-Minute Start Protocol active! Overcome starting inertia.', 'info');
  };

  const inspectedDay = selectedDayIndex !== null
    ? streakAnalysis.days[selectedDayIndex]
    : streakAnalysis.days[streakAnalysis.days.length - 1];

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = dailyPlan.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    const allDone = updatedTasks.every((t) => t.completed);
    onUpdateDailyPlan({
      ...dailyPlan,
      tasks: updatedTasks,
      status: allDone ? 'completed' : 'in_progress',
    });
  };

  const handleRegenerateMission = (mode: MissionDurationMode = durationMode, mins: number = customMinutes) => {
    setDurationMode(mode);
    const newPlan = generatePersonalizedMission({
      userProfile: profile,
      userGoal: goal,
      recentAttempts,
      mistakesDue: dueMistakes,
      weakestTopic: { id: currentTopic.id, name: currentTopic.title },
      durationMode: mode,
      customMinutes: mins,
    });
    onUpdateDailyPlan(newPlan);
    toast.show('Mission updated with personalized problems & review schedule!', 'success');
  };

  const handleConfirmReschedule = () => {
    const rescheduled = rescheduleMission(dailyPlan, rescheduleDate, rescheduleReason);
    onUpdateDailyPlan(rescheduled);
    setShowRescheduleModal(false);
    toast.show(`Mission rescheduled to ${rescheduleDate} without penalty!`, 'success');
  };

  const handleOpenWeeklyReport = () => {
    const currentWeek = Math.max(1, Math.ceil(goal.currentDay / 7));
    const rep = generateWeeklyCoachReport(recentAttempts, mistakes, currentWeek);
    setWeeklyReport(rep);
    setShowWeeklyReportModal(true);
  };

  const handleChangeMode = (mode: MissionMode) => {
    let targetMinutes = 45;
    if (mode === 'minimum') targetMinutes = 15;
    if (mode === 'deep_work') targetMinutes = 90;

    const baseTask = currentTopic.recommendedProblems[0];
    let tasks: DailyTask[] = [];

    if (mode === 'minimum') {
      tasks = [
        {
          id: `task_min_${Date.now()}`,
          title: `5-Min Micro-Review: ${currentTopic.title}`,
          description: `Read the core invariant: "${currentTopic.keyIdeas[0] || 'Understand basics'}".`,
          category: 'recovery',
          estimatedMinutes: 15,
          completed: false,
          topicId: currentTopic.id,
        },
      ];
    } else if (mode === 'deep_work') {
      tasks = [
        {
          id: `task_dw_warmup_${Date.now()}`,
          title: 'Speed Warmup Problem (Rating 800)',
          description: 'Solve 1 fast problem without hesitating.',
          category: 'warmup',
          estimatedMinutes: 10,
          completed: false,
        },
        {
          id: `task_dw_concept_${Date.now()}`,
          title: `Deep Study: ${currentTopic.title}`,
          description: currentTopic.description,
          category: 'concept',
          estimatedMinutes: 20,
          completed: false,
          topicId: currentTopic.id,
        },
        {
          id: `task_dw_prob1_${Date.now()}`,
          title: `Primary Challenge: ${baseTask.name}`,
          description: `Rating ${baseTask.rating}. Solve independently without hints for 20m.`,
          category: 'problem',
          estimatedMinutes: 30,
          completed: false,
          problemId: `${baseTask.contestId}${baseTask.index}`,
        },
        {
          id: `task_dw_reflection_${Date.now()}`,
          title: 'Mistake Journal & Code Review',
          description: 'Document any missed edge cases or integer overflows in your notebook.',
          category: 'reflection',
          estimatedMinutes: 15,
          completed: false,
        },
      ];
    } else {
      tasks = [
        {
          id: `task_std_concept_${Date.now()}`,
          title: `Core Concept: ${currentTopic.title}`,
          description: currentTopic.keyIdeas[0],
          category: 'concept',
          estimatedMinutes: 10,
          completed: false,
          topicId: currentTopic.id,
        },
        {
          id: `task_std_prob_${Date.now()}`,
          title: `Today's Problem: ${baseTask.name}`,
          description: `Rating ${baseTask.rating}. Follow the 10-step problem solving method.`,
          category: 'problem',
          estimatedMinutes: 25,
          completed: false,
          problemId: `${baseTask.contestId}${baseTask.index}`,
        },
        {
          id: `task_std_reflect_${Date.now()}`,
          title: 'Session Log & Reflection',
          description: 'Record your result on Codeforces and note what held you back.',
          category: 'reflection',
          estimatedMinutes: 10,
          completed: false,
        },
      ];
    }

    onUpdateDailyPlan({
      ...dailyPlan,
      mode,
      targetMinutes,
      tasks,
    });
  };

  const [liveContest, setLiveContest] = useState<CFContest | null>(null);

  useEffect(() => {
    let isMounted = true;
    codeforcesService.getUpcomingContests().then((list) => {
      if (isMounted && list && list.length > 0) {
        setLiveContest(list[0]);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const solvedProblemKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const a of recentAttempts) {
      if (a.officialVerdict === 'OK' || a.outcome === 'solved_independently' || a.outcome === 'solved_with_hints') {
        keys.add(`${a.contestId || ''}-${a.index}`);
        keys.add(`${a.contestId || ''}${a.index}`);
        keys.add(a.problemId);
        keys.add(a.name);
      }
    }
    return keys;
  }, [recentAttempts]);

  const nextRecommendedProblem: CFProblem = useMemo(() => {
    const unsolvedInTopic = currentTopic.recommendedProblems.find((p) => {
      const key1 = `${p.contestId}-${p.index}`;
      const key2 = `${p.contestId}${p.index}`;
      return !solvedProblemKeys.has(key1) && !solvedProblemKeys.has(key2) && !solvedProblemKeys.has(p.name);
    });
    if (unsolvedInTopic) return unsolvedInTopic;
    return currentTopic.recommendedProblems[0] || {
      contestId: 4,
      index: 'A',
      name: 'Watermelon',
      rating: 800,
      tags: ['math', 'brute force'],
    };
  }, [currentTopic, solvedProblemKeys]);

  const mostPracticedTopic = heatmapAnalysis.topTopics[0] || {
    topic: 'Competitive Programming',
    totalHours: '0.0h',
    streakDays: 0,
  };

  const visibleSessions = showAllRecentSessions
    ? heatmapAnalysis.recentSessions
    : heatmapAnalysis.recentSessions.slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* =========================================================================
          SKILLTRACK CENTERPIECE DASHBOARD (Directly matches Reference Image 2)
          ========================================================================= */}
      <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Top Header Row: SkillTrack Branding, + Log Session, User Avatar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <TopicMasteryIcon size={20} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              SkillTrack
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLogSessionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <AddIcon size={16} />
              <span>Log Session</span>
            </button>

            <div
              className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs select-none shadow-inner"
              title={profile.name || 'Competitive Programmer'}
            >
              {userInitials}
            </div>
          </div>
        </div>

        {/* Greeting Banner */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Good {timeOfDay}, {profile.name?.trim() ? profile.name.split(' ')[0] : (profile.cfHandle || 'Climber')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {practicedSkillsTodayCount > 0
              ? `You've practiced ${practicedSkillsTodayCount} skill${practicedSkillsTodayCount === 1 ? '' : 's'} today. Keep it up!`
              : `Ready for today's training? Let's make progress toward ${goal.targetRating} rating!`}
          </p>
        </div>

        {/* Main Grid: Left Card (Most Practiced) + Right Content (Top 3 Cards & 18-Week Heatmap) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT CARD: Most Practiced Skill with Large Circular Progress Ring */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                MOST PRACTICED
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                {mostPracticedTopic.topic}
              </h2>
            </div>

            {/* Circular Progress Ring matching Reference Image 2: "75% of weekly goal" */}
            <div className="py-6 flex items-center justify-center">
              <div
                className="relative inline-flex items-center justify-center select-none"
                style={{ width: 140, height: 140 }}
                role="progressbar"
                aria-valuenow={heatmapAnalysis.weeklyGoalPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <svg
                  width={140}
                  height={140}
                  viewBox="0 0 140 140"
                  className="transform -rotate-90 origin-center"
                >
                  {/* Track */}
                  <circle
                    cx={70}
                    cy={70}
                    r={58}
                    strokeWidth={10}
                    className="stroke-slate-100 dark:stroke-slate-800 fill-transparent"
                  />
                  {/* Progress arc */}
                  <circle
                    cx={70}
                    cy={70}
                    r={58}
                    strokeWidth={10}
                    stroke="#059669"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={
                      2 * Math.PI * 58 - (Math.min(100, Math.max(0, heatmapAnalysis.weeklyGoalPercent)) / 100) * (2 * Math.PI * 58)
                    }
                    className="fill-transparent transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {heatmapAnalysis.weeklyGoalPercent}%
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    of weekly goal
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Metrics: Total Hours | Day Streak */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {heatmapAnalysis.totalHours}
                  </div>
                  <div className="text-xs text-slate-400">Total hours</div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span role="img" aria-label="flame">🔥</span>
                    <span>{heatmapAnalysis.currentStreakDays}</span>
                  </div>
                  <div className="text-xs text-slate-400">Day streak</div>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Last session: {heatmapAnalysis.lastSessionText}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Top 3 Topic Cards + 18-Week Practice Activity Heatmap */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            {/* Top 3 Horizontal Topic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heatmapAnalysis.topTopics.slice(0, 3).map((item, idx) => (
                <div
                  key={item.topic}
                  onClick={() => onOpenCurriculumTopic(item.topic.toLowerCase())}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.colorDot }}
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {item.topic}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {item.totalHours}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {item.streakDays > 0 ? (
                      <>
                        <span role="img" aria-label="flame">🔥</span>
                        <span>{item.streakDays}-day streak</span>
                      </>
                    ) : (
                      <span>Active practice</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Central Card: Practice Activity / Last 18 weeks (7 rows × 18 columns) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-sm flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Practice Activity
                </h3>
                <span className="text-xs text-slate-400">Last 18 weeks</span>
              </div>

              {/* 18-Week Heatmap Grid */}
              <div className="overflow-x-auto pb-2 pt-1">
                <div className="inline-flex gap-1.5 sm:gap-2">
                  {heatmapAnalysis.weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1.5 sm:gap-2">
                      {week.map((day) => (
                        <div
                          key={day.dateStr}
                          title={day.tooltip}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${
                            day.intensity === 0
                              ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/40'
                              : day.intensity === 1
                              ? 'bg-emerald-100 dark:bg-emerald-950/60'
                              : day.intensity === 2
                              ? 'bg-emerald-300 dark:bg-emerald-800/80'
                              : day.intensity === 3
                              ? 'bg-emerald-500 dark:bg-emerald-600'
                              : 'bg-emerald-700 dark:bg-emerald-500'
                          } ${day.isToday ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Right Legend: Less [ ][ ][ ][ ] More */}
              <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 pt-1">
                <span className="text-[11px]">Less</span>
                <span className="w-3 h-3 rounded-[2px] bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 inline-block" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-100 dark:bg-emerald-950 inline-block" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-300 dark:bg-emerald-800 inline-block" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-500 inline-block" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-700 inline-block" />
                <span className="text-[11px]">More</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CARD: Recent Sessions Table with Status Dot, Topic, Notes, Duration, Date */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Recent Sessions
            </h3>
            {heatmapAnalysis.recentSessions.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllRecentSessions(!showAllRecentSessions)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {showAllRecentSessions ? 'Show less' : 'View all'}
              </button>
            )}
          </div>

          {heatmapAnalysis.recentSessions.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No recent practice sessions recorded. Click <strong>+ Log Session</strong> above or start solving problems to see your history!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-[150px] shrink-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: session.statusDot }}
                    />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {session.topic}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 flex-1 truncate sm:whitespace-normal">
                    {session.notes}
                  </p>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {session.durationMinutes} min
                    </span>
                    <span className="text-slate-400 min-w-[60px] text-right">
                      {session.relativeDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          COMPETITIVE PROGRAMMING MISSION & ROADMAP (Rating 1600 Engine)
          ========================================================================= */}
      {/* Mountain Summit Hero with 1600 Milestone Flag */}
      <MountainSummitHero
        targetRating={1600}
        currentRating={profile.verifiedCfRating || 800}
      />

      {/* Rating 1600 Mission Control Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <RatingGoalIcon size={20} semantic="primary" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Rating 1600 Mission Control
              </span>
              <span className="rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold">
                {milestone.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target: <strong>1600 Specialist</strong> • Rating Gap: <span className="text-emerald-600 dark:text-cyan-400 font-mono font-bold">+{milestone.ratingGap} pts</span> to goal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleLaunchFiveMinProtocol}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <SuggestOptimizationIcon size={14} semantic="warning" />
            <span>5-Min Start</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWeeklyReport}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <ThinkingIcon size={14} semantic="indigo" />
            <span>AI Coach Report</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRescheduleModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer"
          >
            <CalendarIcon size={14} />
            <span>Reschedule</span>
          </button>
        </div>
      </div>

      {/* Codeforces Account Verification & Linking Banner */}
      {!isCfVerified ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/30">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <CodeforcesIntegrationIcon size={20} />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Connect & Verify Your Codeforces Account</span>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800/40">
                  Unlinked
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Verify genuine handle ownership to unlock real-time rating tracking, submission telemetry, and personalized 1600 practice missions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenVerificationModal && (
              <button
                type="button"
                onClick={onOpenVerificationModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>Connect Handle</span>
                <ChevronRightIcon size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircleIcon size={16} semantic="success" />
            </span>
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Verified Codeforces Handle: <span className="text-indigo-600 dark:text-cyan-400 font-mono">{profile.cfHandle}</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-2">
                Rating: <strong className="text-slate-900 dark:text-white font-mono">{profile.verifiedCfRating || 'Unrated'}</strong>
                {cfAccount?.last_synced_at && (
                  <span className="text-[11px] text-slate-400 ml-2">
                    (Synced {new Date(cfAccount.last_synced_at).toLocaleTimeString()})
                  </span>
                )}
              </span>
            </div>
          </div>
          {onSyncCfData && (
            <button
              type="button"
              onClick={onSyncCfData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer self-start sm:self-auto"
            >
              <RefreshIcon size={14} semantic="primary" />
              <span>Refresh Codeforces Data</span>
            </button>
          )}
        </div>
      )}

      {/* Energy-Aware Scheduling Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold shrink-0">
          <AISparkleIcon size={14} semantic="indigo" />
          <span>Energy State:</span>
        </div>
        <div className="flex items-center gap-2">
          {(
            [
              { key: 'normal', label: '⚡ Normal', desc: 'Standard practice' },
              { key: 'low', label: '☕ Low Energy', desc: '20m gentle warmup' },
              { key: 'limited_time', label: '⏱ Limited Time', desc: '15m micro sprint' },
              { key: 'exam_pressure', label: '📚 Exam Week', desc: 'Academics protected' },
              { key: 'high', label: '🔥 High Focus', desc: 'Deep work challenge' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleSelectEnergy(item.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                energyLevel === item.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={item.desc}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Hero: Today's Mission & One Next Action */}
      <section className="rounded-2xl border border-slate-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-xs font-bold">
                Today's Clear Mission
              </span>
              <span className="text-xs text-slate-400">Day {goal.currentDay} of 180</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {currentTopic.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              <strong>Why today:</strong> {currentTopic.keyIdeas[0] || currentTopic.description}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Mode:</span>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
              {[
                { id: 'minimum' as MissionMode, label: 'Minimum (15m)' },
                { id: 'standard' as MissionMode, label: 'Standard (45m)' },
                { id: 'deep_work' as MissionMode, label: 'Deep Work (90m)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleChangeMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    dailyPlan.mode === m.id
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls & Large Start Button */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Today's Tasks Progress</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{completedTasksCount} / {totalTasksCount} Done ({progressPercent}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Tasks Checklist */}
            <div className="space-y-2 pt-2">
              {progressPercent === 100 && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircleIcon size={16} semantic="success" className="shrink-0" />
                  <span>
                    <strong>Day {goal.currentDay} Mission Accomplished!</strong> All tasks completed. Keep your momentum going!
                  </span>
                </div>
              )}
              {dailyPlan.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    task.completed
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      task.completed
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {task.completed && <CheckIcon size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Large Start Action Card */}
          <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-slate-950 p-5 space-y-4 shadow-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Next Action</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {dailyPlan.tasks.find((t) => !t.completed)?.title || "All Mission Tasks Finished!"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                Estimated duration: ~{dailyPlan.tasks.find((t) => !t.completed)?.estimatedMinutes || 25} minutes.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onSelectProblem(nextRecommendedProblem)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <StreakIcon size={16} semantic="warning" />
                <span>Launch Problem Workspace</span>
                <ChevronRightIcon size={16} />
              </button>

              {recentResumeProblem && recentResumeProblem.contestId !== nextRecommendedProblem.contestId && (
                <button
                  type="button"
                  onClick={() => onSelectProblem(recentResumeProblem)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-cyan-300 font-semibold py-2 px-3 text-xs transition-all cursor-pointer hover:bg-slate-50"
                >
                  <RefreshIcon size={14} semantic="primary" />
                  <span>Resume Problem {recentResumeProblem.contestId}{recentResumeProblem.index}: {recentResumeProblem.name}</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={onOpenAntiProcrastination}
                className="text-indigo-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <AISparkleIcon size={14} semantic="warning" />
                <span>Low Energy / 5m Start</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCurriculumTopic(currentTopic.id)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Read Lesson Details</span>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Milestone Badges & Achievements Section */}
      <section>
        <Achievements
          attempts={recentAttempts}
          streakAnalysis={streakAnalysis}
          profile={profile}
          mistakes={mistakes}
        />
      </section>

      {/* Recommended Practice Set & Identified Topic Weakness */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Recommended Problems */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <PracticeIcon size={16} semantic="primary" />
              <span>Recommended Practice Set</span>
            </h3>
            <span className="text-xs text-slate-400">Curated for Day {goal.currentDay}</span>
          </div>

          <div className="space-y-2">
            {currentTopic.recommendedProblems.map((prob) => (
              <div
                key={`${prob.contestId}${prob.index}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-indigo-400">
                      {prob.contestId}{prob.index}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{prob.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-cyan-400 bg-emerald-100 dark:bg-cyan-950/60 px-1.5 py-0.2 rounded">
                      Rating {prob.rating}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {prob.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-slate-400">#{t}</span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProblem(prob)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Solve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Identified Topic Weakness */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <TrendUpIcon size={16} semantic="primary" />
              <span>Diagnostic Weakness & Growth</span>
            </h3>
            <span className="text-xs text-slate-400">Self-Correcting</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/20 space-y-1">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <WarningStatusIcon size={14} semantic="warning" />
                <span>{diagnosticWeakness.title}</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {diagnosticWeakness.category}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {diagnosticWeakness.description}
            </p>
          </div>

          {/* Quick links to review spaced mistakes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Revision Tasks Due Today
              </span>
              <span className="text-emerald-600 font-bold">{dueMistakes.length} due</span>
            </div>
            {dueMistakes.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                Spaced repetition backlog is clear! Great job maintaining your mistake journal.
              </div>
            ) : (
              <div className="space-y-1.5">
                {dueMistakes.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{m.problemName}</span>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {m.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Community & Peer Collaboration Hub */}
      {onNavigateTab && (
        <section className="rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CommunityIcon size={18} semantic="indigo" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Community & Peer Collaboration
                </h3>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                You don't have to climb to 1600 alone. Ask questions, discuss contest problems, and exchange C++ solutions with active cohorts.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('feed')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChatIcon className="w-3.5 h-3.5" />
                <span>Ask Community</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('communities')}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Browse Circles</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('feed')}
              className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>Community Feed & Doubts</span>
                <ChevronRightIcon size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Browse recent questions, accepted solutions, editorial blogs & milestones.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('communities')}
              className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>Study Circles & Hub</span>
                <ChevronRightIcon size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Join 1600 Climbers, Div.2 Contenders, and topic-specific cohorts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 text-left transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>Direct Peer Messages</span>
                <ChevronRightIcon size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Chat 1-to-1, exchange code snippets, and review test case failures together.
              </p>
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* Log Session Modal */}
      <LogSessionModal
        isOpen={showLogSessionModal}
        onClose={() => setShowLogSessionModal(false)}
        onSaveSession={handleSaveSession}
      />

      {/* Today's Daily Minutes Breakdown Modal */}
      {showMinutesDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowMinutesDetails(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TimeSpentIcon size={18} semantic="primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Minutes Goal Progress</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tracked from live problem sessions logged on {todayMinutesProgress.todayDateStr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMinutesDetails(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <CircularProgressRing
                currentMinutes={todayMinutesProgress.totalMinutes}
                goalMinutes={todayMinutesProgress.goalMinutes}
                percent={todayMinutesProgress.percent}
                clampedPercent={todayMinutesProgress.clampedPercent}
                size={84}
                strokeWidth={7}
              />
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Goal Completion: <span className="font-mono text-slate-900 dark:text-white font-bold">{todayMinutesProgress.percent}%</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {todayMinutesProgress.isGoalMet ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircleIcon size={16} semantic="success" />
                      <span>Daily Target Achieved!</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      {todayMinutesProgress.remainingMinutes} minutes remaining
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMinutesDetails(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Mission Modal */}
      {showRescheduleModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowRescheduleModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <CalendarIcon size={16} />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reschedule Training Mission</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Academic or personal commitments? Rescheduling is completely non-punitive. It does not reset your streak or diminish your consistency record.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Target Date:</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Reason for Adjustment:</label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Academic exams / university midterms">Academic exams / university midterms</option>
                  <option value="Personal / family commitments">Personal / family commitments</option>
                  <option value="Travel / offline without stable internet">Travel / offline without stable internet</option>
                  <option value="High fatigue / mental reset day">High fatigue / mental reset day</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly AI Coach Report Modal */}
      {showWeeklyReportModal && weeklyReport && (
        <WeeklyCoachReportModal
          report={weeklyReport}
          onClose={() => setShowWeeklyReportModal(false)}
        />
      )}

      {/* Five-Minute Start Protocol Modal */}
      {activeFiveMinTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <StreakIcon size={20} semantic="warning" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">5-Minute Start Protocol</h3>
                  <span className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold uppercase tracking-wider">Zero-Friction Starter</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFiveMinTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When feeling inertia or cognitive resistance, commit to only 5 minutes. No full solution required. Just get fingers moving.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Today's Micro Task:</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activeFiveMinTask.prompt}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <TimerIcon size={14} />
                <span>Timer Budget: 5 minutes (300 seconds)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveFiveMinTask(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFiveMinTask(null);
                  if (activeFiveMinTask.targetId) {
                    onSelectProblem({
                      contestId: 1352,
                      index: 'C',
                      name: 'K-th Not Divisible by n',
                      rating: 1200,
                      tags: ['binary search', 'math'],
                    });
                  } else {
                    onOpenCurriculumTopic(currentTopic.id);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch Micro Action</span>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
