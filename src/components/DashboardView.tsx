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
  CodeFileIcon,
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
import { getPhaseForDay, getTopicForDay, TOPICS, CURATED_PROBLEMS_CATALOG } from '../utils/roadmap';
import { calculateTheoreticalRating } from '../utils/ratingEstimator';
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
import { JoyfulDashboardBanner } from './JoyfulDashboardBanner';
import { DashboardGameHUD } from './DashboardGameHUD';
import { PlayfulQuestMap } from './PlayfulQuestMap';
import { ProblemRouletteModal } from './ProblemRouletteModal';
import { DailyLoginRewardsModal } from './DailyLoginRewardsModal';
import { DailyFortuneModal } from './DailyFortuneModal';
import { DailyHabitAnchor } from './DailyHabitAnchor';
import { gameRewardService } from '../services/gameRewardService';
import {
  MascotClimby,
  MascotByteCat,
  MascotBigBrain,
  FunnyStickerBadge,
} from './assets/MascotAndStickers';
import {
  CodingPracticeIllustration,
  ContestArenaIllustration,
  FocusDisciplineIllustration,
  ProgressGrowthIllustration,
} from './assets/ActivityIllustrations';
import { AIAssistantCompanion } from './assets/AIAssistantCompanion';
import { FunCard } from './common/CardBackgrounds';
import { computePracticeHeatmap } from '../utils/practiceHeatmap';
import { LogSessionModal, LogSessionPayload } from './LogSessionModal';
import { ConfettiCanvas } from './common/ConfettiCanvas';

export interface DashboardViewProps {
  goal: UserGoal;
  profile: UserProfile;
  dailyPlan: DailyPlan;
  onUpdateDailyPlan: (plan: DailyPlan) => void;
  onSelectProblem: (problem: CFProblem) => void;
  onViewSolution?: (problem: CFProblem) => void;
  onOpenAntiProcrastination: () => void;
  onOpenCurriculumTopic: (topicId: string) => void;
  recentAttempts: ProblemAttempt[];
  upcomingContestTitle?: string;
  upcomingContestTime?: string;
  mistakes?: MistakeRecord[];
  onUpdateGoal?: (goal: UserGoal) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  isAuthenticated?: boolean;
  isCfVerified?: boolean;
  cfAccount?: any;
  onOpenAuthModal?: () => void;
  onOpenVerificationModal?: () => void;
  onSyncCfData?: () => Promise<void> | void;
  onAttemptLogged?: (attempt: ProblemAttempt) => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  goal,
  profile,
  dailyPlan,
  onUpdateDailyPlan,
  onSelectProblem,
  onViewSolution,
  onOpenAntiProcrastination,
  onOpenCurriculumTopic,
  recentAttempts,
  upcomingContestTitle,
  upcomingContestTime,
  mistakes = [],
  onUpdateGoal,
  onUpdateProfile,
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
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [showRouletteModal, setShowRouletteModal] = useState<boolean>(false);
  const [showDailyRewardsModal, setShowDailyRewardsModal] = useState<boolean>(false);
  const [showFortuneModal, setShowFortuneModal] = useState<boolean>(false);
  const [isSyncingCf, setIsSyncingCf] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const solvedProblemIds = useMemo(() => {
    return new Set(
      recentAttempts
        .filter((a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently')
        .map((a) => `${a.contestId}${a.index}`)
    );
  }, [recentAttempts]);

  // Theoretical Rating Estimate & Verified Solves Telemetry
  const ratingEstimate = useMemo(() => {
    return calculateTheoreticalRating(recentAttempts, profile.baselineRating || 800, profile.verifiedCfRating);
  }, [recentAttempts, profile.baselineRating, profile.verifiedCfRating]);

  const verifiedSolvesCount = useMemo(() => {
    return recentAttempts.filter(
      (a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently'
    ).length;
  }, [recentAttempts]);

  const maxSolvedRating = useMemo(() => {
    const solved = recentAttempts.filter(
      (a) => (a.officialVerdict === 'OK' || a.outcome === 'solved_independently') && a.rating
    );
    if (solved.length === 0) return 800;
    return Math.max(...solved.map((a) => a.rating!));
  }, [recentAttempts]);

  const effectiveRating = useMemo(() => {
    if (profile.verifiedCfRating && profile.verifiedCfRating > 0) return profile.verifiedCfRating;
    if (profile.baselineRating && profile.baselineRating > 0) return profile.baselineRating;
    return ratingEstimate.estimatedRating || 800;
  }, [profile.verifiedCfRating, profile.baselineRating, ratingEstimate.estimatedRating]);

  const handleSaveCalibratedRating = (val: number) => {
    const updated = {
      ...profile,
      baselineRating: val > 0 ? val : undefined,
    };
    onUpdateProfile?.(updated);
    storageService.saveProfile(updated);
    toast.show(
      val > 0
        ? `Baseline skill rating calibrated to ${val}!`
        : `Baseline skill rating set to auto-calculated (~${ratingEstimate.estimatedRating})!`,
      'success'
    );
  };

  const handleTriggerSync = async () => {
    if (isSyncingCf) return;
    setIsSyncingCf(true);
    try {
      if (onSyncCfData) {
        await onSyncCfData();
        toast.show(
          `Codeforces data refreshed! Verified ${recentAttempts.length} submissions (${verifiedSolvesCount} solved).`,
          'success'
        );
      }
    } catch (err: any) {
      toast.show(err?.message || 'Failed to sync Codeforces data', 'error');
    } finally {
      setIsSyncingCf(false);
    }
  };

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

  // Today's total practice minutes
  const todayPracticeMinutes = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttempts = recentAttempts.filter(
      (a) => (a.endedAt || a.startedAt || '').split('T')[0] === todayStr
    );
    return todayAttempts.reduce((sum, a) => sum + Math.round((a.timeSpentSeconds || 0) / 60), 0);
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
        description: `Great recent accuracy across ${recentAttempts.length} submissions! Continue solving problems at rating ${Math.min(goal.targetRating || 1600, effectiveRating + 100)} to stretch problem-solving intuition.`,
        category: 'Consistent Progress',
      };
    }

    return {
      title: 'Initial Diagnostic Baseline',
      description: 'Connect your Codeforces handle or solve your first practice problem to generate personalized telemetry diagnostics.',
      category: 'Diagnostic Ready',
    };
  }, [mistakes, recentAttempts, effectiveRating, goal.targetRating]);

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
    setShowConfetti(true);
    toast.show(`Practice session logged (${payload.durationMinutes} min on ${payload.topic})!`, 'success');
  };

  // 30-Day Streak Analysis
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const streakAnalysis = useMemo(() => {
    return compute30DayStreak(recentAttempts, [dailyPlan]);
  }, [recentAttempts, dailyPlan]);

  // Milestone and Difficulty Trajectory Telemetry
  const milestone = useMemo(() => {
    return calculateMilestone(effectiveRating, goal.targetRating || 1600);
  }, [effectiveRating, goal.targetRating]);

  const diffEvaluation = useMemo(() => {
    return evaluateDifficultyTrajectory(recentAttempts, effectiveRating);
  }, [recentAttempts, effectiveRating]);

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
    if (allDone && !dailyPlan.tasks.every((t) => t.completed)) {
      setShowConfetti(true);
      toast.show(`Day ${goal.currentDay} Mission Accomplished! All daily tasks complete.`, 'success');
    }
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

  const isCurrentTopicCompleted = useMemo(() => {
    return currentTopic.recommendedProblems.every((p) => {
      const key1 = `${p.contestId || ''}-${p.index}`;
      const key2 = `${p.contestId || ''}${p.index}`;
      return solvedProblemKeys.has(key1) || solvedProblemKeys.has(key2) || solvedProblemKeys.has(p.name);
    });
  }, [currentTopic, solvedProblemKeys]);

  const nextRecommendedProblem: CFProblem = useMemo(() => {
    // 1. Look for unsolved problem in current topic
    const unsolvedInTopic = currentTopic.recommendedProblems.find((p) => {
      const key1 = `${p.contestId || ''}-${p.index}`;
      const key2 = `${p.contestId || ''}${p.index}`;
      return !solvedProblemKeys.has(key1) && !solvedProblemKeys.has(key2) && !solvedProblemKeys.has(p.name);
    });
    if (unsolvedInTopic) return unsolvedInTopic;

    // 2. If current topic is mastered, search future topics in curriculum
    for (const topic of TOPICS) {
      const unsolved = topic.recommendedProblems.find((p) => {
        const key1 = `${p.contestId || ''}-${p.index}`;
        const key2 = `${p.contestId || ''}${p.index}`;
        return !solvedProblemKeys.has(key1) && !solvedProblemKeys.has(key2) && !solvedProblemKeys.has(p.name);
      });
      if (unsolved) return unsolved;
    }

    // 3. Fallback to unsolved problem from curated catalog nearest to effective rating
    const targetDifficulty = effectiveRating ? Math.min(1600, effectiveRating + 100) : 900;
    const unsolvedCatalog = CURATED_PROBLEMS_CATALOG.filter((p) => {
      const key1 = `${p.contestId || ''}-${p.index}`;
      const key2 = `${p.contestId || ''}${p.index}`;
      return !solvedProblemKeys.has(key1) && !solvedProblemKeys.has(key2) && !solvedProblemKeys.has(p.name);
    });
    if (unsolvedCatalog.length > 0) {
      unsolvedCatalog.sort((a, b) => Math.abs((a.rating || 800) - targetDifficulty) - Math.abs((b.rating || 800) - targetDifficulty));
      return unsolvedCatalog[0];
    }

    return {
      contestId: 405,
      index: 'A',
      name: 'Gravity Flip',
      rating: 900,
      tags: ['greedy', 'sortings'],
    };
  }, [currentTopic, solvedProblemKeys, effectiveRating]);

  const handleChangeMode = (mode: MissionMode) => {
    let targetMinutes = 45;
    if (mode === 'minimum') targetMinutes = 15;
    if (mode === 'deep_work') targetMinutes = 90;

    const baseTask = nextRecommendedProblem || currentTopic?.recommendedProblems?.[0] || {
      contestId: 405,
      index: 'A',
      name: 'Gravity Flip',
      rating: 900,
      tags: ['greedy', 'sortings'],
    };
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



  const mostPracticedTopic = heatmapAnalysis.topTopics[0] || {
    topic: 'Competitive Programming',
    totalHours: '0.0h',
    streakDays: 0,
  };

  const visibleSessions = showAllRecentSessions
    ? heatmapAnalysis.recentSessions
    : heatmapAnalysis.recentSessions.slice(0, 3);

  return (
    <div className="space-y-7 sm:space-y-8 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* =========================================================================
          DAILY HABIT ADDICTION HUB (Today's 3-Step Habit Loop, Streak Shield, Quests, Fortune)
          ========================================================================= */}
      <DailyHabitAnchor
        currentRating={effectiveRating || 800}
        targetRating={goal.targetRating || 1600}
        streakDays={heatmapAnalysis.currentStreakDays}
        todayMinutes={todayPracticeMinutes}
        dailyGoalMinutes={goal.dailyMinutes || 45}
        solvedCountToday={verifiedSolvesCount > 0 ? 1 : 0}
        mistakesDueCount={dueMistakes.length}
        onOpen5MinWarmup={onOpenAntiProcrastination}
        onSelectProblem={() => onSelectProblem(nextRecommendedProblem)}
        onOpenMistakeReview={() => onNavigateTab && onNavigateTab('mistakes')}
        onOpenDailyLogin={() => setShowDailyRewardsModal(true)}
        onOpenFortuneModal={() => setShowFortuneModal(true)}
        onOpenRoulette={() => setShowRouletteModal(true)}
        onOpenArcade={() => onNavigateTab && onNavigateTab('games')}
        onTriggerConfetti={() => setShowConfetti(true)}
      />

      {/* =========================================================================
          ANIME & RPG GAME HUD (Status Bar, Hero Sprite, Daily Quests, 40 Realms)
          ========================================================================= */}
      <DashboardGameHUD
        currentRating={effectiveRating || 800}
        targetRating={goal.targetRating || 1600}
        streakDays={heatmapAnalysis.currentStreakDays}
        totalSolved={verifiedSolvesCount}
        todayMinutes={todayPracticeMinutes}
        dailyGoalMinutes={goal.dailyMinutes || 45}
        mistakesCount={mistakes.length}
        onSelectProblem={() => onSelectProblem(nextRecommendedProblem)}
        onOpenRoulette={() => setShowRouletteModal(true)}
        onOpenDailyLogin={() => setShowDailyRewardsModal(true)}
        onOpenArcade={() => onNavigateTab && onNavigateTab('games')}
        onTriggerConfetti={() => setShowConfetti(true)}
      />

      {/* =========================================================================
          JOYFUL HERO BANNER (Mascot, Comic Quips, Vibe Selector & Theme Switcher)
          ========================================================================= */}
      <JoyfulDashboardBanner
        currentRating={effectiveRating || 800}
        targetRating={goal.targetRating || 1600}
        streakDays={heatmapAnalysis.currentStreakDays}
        totalSolved={verifiedSolvesCount}
        onStartChallenge={() => onSelectProblem(nextRecommendedProblem)}
        onSpinSurprise={() => setShowRouletteModal(true)}
        onOpenSettingsTheme={() => onNavigateTab && onNavigateTab('settings')}
      />

      {/* =========================================================================
          3 HILARIOUS LOGIC GAMES & PROBLEM WHEEL BOUNTY ARCADE BANNER
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900 border-2 border-indigo-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl shadow-lg shrink-0 animate-bounce-subtle">
            🕹️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                3 FUNNY CODING GAMES
              </span>
              <h3 className="font-black text-white text-base sm:text-lg">
                Grow Logic & Problem-Solving Mindset
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Write code to project star matrix shields, solve real-life city dispatch crises, and cast counter-spells against quirky bug monsters!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowRouletteModal(true)}
            className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/40 text-pink-200 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            🎡 Spin Wheel (+Coins & Gifts)
          </button>
          <button
            type="button"
            onClick={() => setShowDailyRewardsModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            🎁 Daily Gifts & Lore
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('games')}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-black shadow-md shadow-indigo-500/30 transition-all cursor-pointer active:scale-95"
          >
            Play 3 Games →
          </button>
        </div>
      </div>

      {/* =========================================================================
          1600 QUEST ADVENTURE MAP (Curved Milestone Roadmap)
          ========================================================================= */}
      <PlayfulQuestMap
        currentRating={effectiveRating || 800}
        onSelectTier={(rating) => {
          const matchProb =
            CURATED_PROBLEMS_CATALOG.find(
              (p) =>
                (p.rating || 800) === rating &&
                !solvedProblemKeys.has(`${p.contestId}${p.index}`)
            ) ||
            CURATED_PROBLEMS_CATALOG.find((p) => (p.rating || 800) === rating) ||
            nextRecommendedProblem;
          onSelectProblem(matchProb);
        }}
      />

      {/* =========================================================================
          SKILLTRACK CENTERPIECE DASHBOARD (Directly matches Reference Image 2)
          ========================================================================= */}
      <FunCard
        variant="emerald"
        className="p-6 sm:p-8 space-y-7 sm:space-y-8 shadow-xl border-emerald-300/50 dark:border-emerald-800/50"
      >
        {/* Top Header Row: SkillTrack Branding, + Log Session, User Avatar */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <TopicMasteryIcon size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight">
                  SkillTrack
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 uppercase">
                  Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Real-time competitive practice metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowLogSessionModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer interactive-button"
            >
              <AddIcon size={16} />
              <span>Log Session</span>
            </button>

            <div
              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-sm select-none shadow-inner border border-white/40"
              title={profile.name || 'Competitive Programmer'}
            >
              {userInitials}
            </div>
          </div>
        </div>

        {/* Greeting Banner with Punchy Visual Status Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Good {timeOfDay}, {profile.name?.trim() ? profile.name.split(' ')[0] : (profile.cfHandle || 'Climber')}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium flex-wrap pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                🎯 {practicedSkillsTodayCount > 0 ? `${practicedSkillsTodayCount} skills trained` : 'Ready to train'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                🔥 {heatmapAnalysis.currentStreakDays}d streak
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-300 dark:border-indigo-700">
                🏆 Goal: {goal.targetRating}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center shrink-0">
            <MascotClimby size={68} className="drop-shadow-sm" />
          </div>
        </div>

        {/* Main Grid: Left Card (Most Practiced) + Right Content (Top 3 Cards & 18-Week Heatmap) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 lg:gap-8 items-stretch">
          {/* LEFT CARD: Most Practiced Skill with Large Circular Progress Ring */}
          <FunCard
            variant="emerald"
            sticker="level_up"
            stickerPosition="top-right"
            className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between shadow-lg border-emerald-300/60 dark:border-emerald-700/60"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                ⭐ MOST PRACTICED
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                {mostPracticedTopic.topic}
              </h2>
            </div>

            {/* Circular Progress Ring matching Reference Image 2: "75% of weekly goal" */}
            <div className="py-6 flex items-center justify-center">
              <div
                className="relative inline-flex items-center justify-center select-none"
                style={{ width: 146, height: 146 }}
                role="progressbar"
                aria-valuenow={heatmapAnalysis.weeklyGoalPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <svg
                  width={146}
                  height={146}
                  viewBox="0 0 146 146"
                  className="transform -rotate-90 origin-center"
                >
                  {/* Track */}
                  <circle
                    cx={73}
                    cy={73}
                    r={60}
                    strokeWidth={11}
                    className="stroke-slate-200/70 dark:stroke-slate-800 fill-transparent"
                  />
                  {/* Progress arc */}
                  <circle
                    cx={73}
                    cy={73}
                    r={60}
                    strokeWidth={11}
                    stroke="#059669"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={
                      2 * Math.PI * 60 - (Math.min(100, Math.max(0, heatmapAnalysis.weeklyGoalPercent)) / 100) * (2 * Math.PI * 60)
                    }
                    className="fill-transparent transition-all duration-800 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                    {heatmapAnalysis.weeklyGoalPercent}%
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    of weekly goal
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Metrics: Total Hours | Day Streak */}
            <div className="space-y-4 pt-3 border-t border-emerald-200/50 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-emerald-200/50 dark:border-slate-800 shadow-xs">
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {heatmapAnalysis.totalHours}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total hours</div>
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-emerald-200/50 dark:border-slate-800 shadow-xs">
                  <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1 font-mono">
                    <span className="text-amber-500 animate-flame">🔥</span>
                    <span>{heatmapAnalysis.currentStreakDays}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Day streak</div>
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Last session:</span>
                <strong className="text-slate-700 dark:text-slate-300">{heatmapAnalysis.lastSessionText}</strong>
              </div>
            </div>
          </FunCard>

          {/* RIGHT COLUMN: Top 3 Topic Cards + 18-Week Practice Activity Heatmap */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6 sm:space-y-7 lg:space-y-8">
            {/* Top 3 Horizontal Topic Cards with Fun Varied Backgrounds */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {heatmapAnalysis.topTopics.slice(0, 3).map((item, idx) => {
                const variants: ('emerald' | 'cosmic' | 'coffee')[] = ['emerald', 'cosmic', 'coffee'];
                const cardVar = variants[idx % variants.length];

                return (
                  <FunCard
                    key={item.topic}
                    variant={cardVar}
                    onClick={() => onOpenCurriculumTopic(item.topic.toLowerCase())}
                    className="p-5 space-y-2.5 transition-all cursor-pointer shadow-md interactive-card select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: item.colorDot }}
                      />
                      <span className="text-xs font-extrabold truncate">
                        {item.topic}
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono">
                      {item.totalHours}
                    </div>

                    <div className="text-xs font-semibold opacity-85 flex items-center gap-1.5">
                      {item.streakDays > 0 ? (
                        <>
                          <span className="animate-flame">🔥</span>
                          <span>{item.streakDays}-day streak</span>
                        </>
                      ) : (
                        <span>✨ Active topic</span>
                      )}
                    </div>
                  </FunCard>
                );
              })}
            </div>

            {/* Central Card: Practice Activity / Last 18 weeks */}
            <FunCard
              variant="matrix"
              className="p-5 sm:p-6 space-y-4 shadow-lg flex-1 flex flex-col justify-between border-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Practice Activity
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">Last 18 weeks</span>
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
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 rounded-[4px] transition-all duration-150 hover:scale-135 hover:z-10 hover:shadow-md cursor-pointer ${
                            day.intensity === 0
                              ? 'bg-slate-800/80 border border-slate-700/50'
                              : day.intensity === 1
                              ? 'bg-emerald-950/90 border border-emerald-800/60'
                              : day.intensity === 2
                              ? 'bg-emerald-700'
                              : day.intensity === 3
                              ? 'bg-emerald-500'
                              : 'bg-emerald-400'
                          } ${day.isToday ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Right Legend: Less [ ][ ][ ][ ] More */}
              <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-300/80 pt-1 font-bold">
                <span className="text-[11px]">Less</span>
                <span className="w-3.5 h-3.5 rounded-[3px] bg-slate-800 border border-slate-700 inline-block" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-950 border border-emerald-800 inline-block" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-700 inline-block" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-500 inline-block" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-400 inline-block" />
                <span className="text-[11px]">More</span>
              </div>
            </FunCard>
          </div>
        </div>

        {/* BOTTOM CARD: Recent Sessions Table */}
        <FunCard
          variant="clean"
          className="p-5 sm:p-6 space-y-4 shadow-sm border-slate-200/80 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⏱️</span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Recent Practice Sessions
              </h3>
            </div>
            {heatmapAnalysis.recentSessions.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllRecentSessions(!showAllRecentSessions)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {showAllRecentSessions ? 'Show less' : 'View all'}
              </button>
            )}
          </div>

          {heatmapAnalysis.recentSessions.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <span className="text-2xl">🌱</span>
              <p>No recent practice sessions recorded yet. Tap <strong>+ Log Session</strong> above to start your log!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[160px] shrink-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: session.statusDot }}
                    />
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {session.topic}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 flex-1 truncate sm:whitespace-normal font-medium">
                    {session.notes}
                  </p>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 font-mono">
                      {session.durationMinutes} min
                    </span>
                    <span className="text-slate-400 min-w-[65px] text-right font-medium">
                      {session.relativeDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FunCard>
      </FunCard>

      {/* =========================================================================
          COMPETITIVE PROGRAMMING MISSION & ROADMAP (Rating 1600 Engine)
          ========================================================================= */}
      {/* Mountain Summit Hero with Dynamic Rating Telemetry */}
      <MountainSummitHero
        targetRating={goal.targetRating || 1600}
        currentRating={profile.verifiedCfRating}
        estimatedRating={profile.baselineRating || ratingEstimate.estimatedRating}
        solvedCount={verifiedSolvesCount}
        baselineRating={800}
        cfHandle={profile.cfHandle}
        targetRankTitle="Specialist"
        onOpenCalibrationModal={() => setShowCalibrationModal(true)}
      />

      {/* Rating Mission Control Telemetry */}
      <FunCard
        variant="cosmic"
        sticker="1000_iq"
        stickerPosition="top-right"
        className="p-6 sm:p-7 shadow-xl border-indigo-400/30"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-7 lg:gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <RatingGoalIcon size={28} semantic="primary" className="text-cyan-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Rating {goal.targetRating || 1600} Mission Control
                </span>
                <span className="rounded-full bg-cyan-400/20 text-cyan-700 dark:text-cyan-300 px-2.5 py-0.5 text-xs font-black border border-cyan-400/30 font-mono">
                  {milestone.title} ({milestone.progressPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-700 dark:text-indigo-200/80 flex-wrap">
                <span className="flex items-center gap-1 font-bold">
                  <span>Target:</span>
                  <strong className="text-slate-900 dark:text-white">{goal.targetRating || 1600} Specialist</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">+{milestone.ratingGap} pts</span> to goal
                </span>
                <span>•</span>
                <span className="text-indigo-700/80 dark:text-indigo-300/70 font-mono">
                  {profile.verifiedCfRating ? `CF: ${profile.verifiedCfRating}` : `Est: ~${profile.baselineRating || ratingEstimate.estimatedRating}`}
                </span>
              </div>
            </div>
          </div>

          {/* Spacious Action Buttons - Generous Gaps & Comfortable Targets */}
          <div className="flex items-center gap-3.5 sm:gap-4 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={handleLaunchFiveMinProtocol}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer interactive-button"
            >
              <SuggestOptimizationIcon size={16} semantic="warning" className="animate-bounce-subtle" />
              <span>5-Min Start</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWeeklyReport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer interactive-button"
            >
              <ThinkingIcon size={16} semantic="indigo" />
              <span>AI Coach</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRescheduleModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-200/60 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <CalendarIcon size={15} />
              <span>Reschedule</span>
            </button>
          </div>
        </div>
      </FunCard>

      {/* Codeforces Account Verification & Linking Banner */}
      {!isCfVerified ? (
        <FunCard
          variant="arcade"
          className="p-6 sm:p-7 shadow-lg border-purple-500/30"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0 p-1 rounded-2xl bg-slate-200/50 dark:bg-white/10 border border-slate-300 dark:border-white/20">
                <MascotClimby size={75} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Connect Your Codeforces Account
                  </h4>
                  <span className="text-[10px] font-black text-pink-700 dark:text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-400/30 uppercase">
                    Sync Live
                  </span>
                </div>
                <p className="text-xs text-purple-900 dark:text-purple-200/90 font-medium">
                  Sync live rating graph, submission telemetry & personalized daily missions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {onOpenVerificationModal && (
                <button
                  type="button"
                  onClick={onOpenVerificationModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                >
                  <span>Connect Handle</span>
                  <ChevronRightIcon size={16} />
                </button>
              )}
            </div>
          </div>
        </FunCard>
      ) : (
        <FunCard
          variant="matrix"
          className="p-5 sm:p-6 shadow-md border-emerald-500/30"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.cfHandle || 'Avatar'}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400/50 shrink-0 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircleIcon size={24} semantic="success" />
                </div>
              )}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    Verified Handle:{' '}
                    <a
                      href={`https://codeforces.com/profile/${profile.cfHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-700 dark:text-cyan-300 font-mono font-black hover:underline"
                    >
                      {profile.cfHandle}
                    </a>
                  </span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-black border border-emerald-400/40 uppercase">
                    Verified ✓
                  </span>
                </div>
                <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200/80 text-xs flex-wrap font-medium">
                  <span>
                    Rating:{' '}
                    <strong className="text-slate-900 dark:text-white font-mono font-bold">
                      {profile.verifiedCfRating ? `${profile.verifiedCfRating} (${profile.rank || 'Ranked'})` : 'Unrated'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Solved:{' '}
                    <strong className="text-emerald-400 font-mono font-bold">
                      {verifiedSolvesCount}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Skill:{' '}
                    <strong className="text-cyan-300 font-mono font-bold">
                      ~{profile.baselineRating || ratingEstimate.estimatedRating}
                    </strong>
                  </span>
                  {cfAccount?.last_synced_at && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] opacity-75 font-mono">
                        Synced {new Date(cfAccount.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {onSyncCfData && (
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncingCf}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm ${
                  isSyncingCf
                    ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-400/30 text-emerald-300'
                }`}
              >
                <RefreshIcon size={14} semantic="primary" className={isSyncingCf ? 'animate-spin text-emerald-400' : ''} />
                <span>{isSyncingCf ? 'Syncing...' : 'Refresh CF Data'}</span>
              </button>
            )}
          </div>
        </FunCard>
      )}

      {/* Energy-Aware Scheduling Bar - Spacious Layout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-extrabold text-xs sm:text-sm shrink-0">
          <span className="text-base">⚡</span>
          <span>Energy State:</span>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {(
            [
              { key: 'normal', label: '⚡ Normal', desc: 'Standard practice' },
              { key: 'low', label: '☕ Low Energy', desc: '20m gentle warmup' },
              { key: 'limited_time', label: '⏱️ Sprint (15m)', desc: '15m micro sprint' },
              { key: 'exam_pressure', label: '📚 Exam Week', desc: 'Academics protected' },
              { key: 'high', label: '🔥 Deep Focus', desc: 'Deep work challenge' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleSelectEnergy(item.key)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                energyLevel === item.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700'
              }`}
              title={item.desc}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Hero: Today's Mission & One Next Action */}
      <FunCard
        variant="clean"
        className="p-6 md:p-8 space-y-6 sm:space-y-7 shadow-lg border-slate-200/80 dark:border-slate-800"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-0.5 text-xs font-black border border-emerald-300 dark:border-emerald-700">
                🎯 Today's Mission
              </span>
              <span className="text-xs text-slate-400 font-bold">Day {goal.currentDay} of 180</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {currentTopic.title}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Core Focus:</span>
              <span>{currentTopic.keyIdeas[0] || currentTopic.description}</span>
            </div>
          </div>

          {/* Mode Switcher with Spacious Buttons */}
          <div className="flex items-center gap-2.5">
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950 p-1.5 border border-slate-200 dark:border-slate-800 gap-1.5">
              {[
                { id: 'minimum' as MissionMode, label: '⚡ 15m' },
                { id: 'standard' as MissionMode, label: '⏱️ 45m' },
                { id: 'deep_work' as MissionMode, label: '🔥 90m' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleChangeMode(m.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    dailyPlan.mode === m.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-stretch">
          <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Today's Tasks Progress</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                  {completedTasksCount} / {totalTasksCount} Done ({progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Tasks Checklist */}
            <div className="space-y-2.5 pt-1 flex-1">
              {progressPercent === 100 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 font-bold">
                  <CheckCircleIcon size={18} semantic="success" className="shrink-0" />
                  <span>
                    Day {goal.currentDay} Mission Accomplished! Keep your momentum going!
                  </span>
                </div>
              )}
              {dailyPlan.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer interactive-card ${
                    task.completed
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-400 opacity-80'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 hover:translate-x-1'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 transition-transform duration-200 ${
                      task.completed
                        ? 'border-emerald-500 bg-emerald-600 text-white scale-110 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:scale-110'
                    }`}
                  >
                    {task.completed && <CheckIcon size={13} strokeWidth={3} className="animate-pop-spring" />}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className={`font-bold transition-colors ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Large Start Action Card with Fun Flame Background & Spacious Buttons */}
          <FunCard
            variant="fire"
            sticker="speedrun_1600"
            stickerPosition="top-right"
            className="md:col-span-5 p-6 sm:p-7 space-y-5 shadow-xl border-amber-400/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  ⚡ Next Action
                </span>
                {isCurrentTopicCompleted && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30">
                    Cleared ✓
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                {dailyPlan.tasks.find((t) => !t.completed)?.title || `Challenge: ${nextRecommendedProblem.name} (${nextRecommendedProblem.rating || 800})`}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                Target: ~{dailyPlan.tasks.find((t) => !t.completed)?.estimatedMinutes || 25} minutes of focused problem solving.
              </p>
            </div>

            {/* Spacious Buttons Area */}
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => onSelectProblem(nextRecommendedProblem)}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white font-black py-4 px-6 text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all cursor-pointer active:scale-98"
              >
                <StreakIcon size={18} semantic="warning" />
                <span>Launch Problem Workspace</span>
                <ChevronRightIcon size={18} />
              </button>

              <div className="flex items-center gap-3">
                {onViewSolution && (
                  <button
                    type="button"
                    onClick={() => onViewSolution(nextRecommendedProblem)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <CodeFileIcon size={15} semantic="primary" />
                    <span>View Solution</span>
                  </button>
                )}

                {recentResumeProblem && recentResumeProblem.contestId !== nextRecommendedProblem.contestId && (
                  <button
                    type="button"
                    onClick={() => onSelectProblem(recentResumeProblem)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshIcon size={14} semantic="primary" />
                    <span>Resume {recentResumeProblem.contestId}{recentResumeProblem.index}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Helper Links with Comfortable Breathing Room */}
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200/60 dark:border-slate-800/60 font-semibold">
              <button
                type="button"
                onClick={onOpenAntiProcrastination}
                className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <AISparkleIcon size={14} semantic="warning" />
                <span>Low Energy / 5m Start</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCurriculumTopic(currentTopic.id)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Curriculum Details</span>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </FunCard>
        </div>
      </FunCard>

      {/* Milestone Badges & Achievements Section */}
      <section>
        <Achievements
          attempts={recentAttempts}
          streakAnalysis={streakAnalysis}
          profile={profile}
          mistakes={mistakes}
          onOpenCurriculumTopic={onOpenCurriculumTopic}
        />
      </section>

      {/* Recommended Practice Set & Identified Topic Weakness */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-8 items-stretch">
        {/* Next Recommended Problems */}
        <FunCard
          variant="frost"
          className="p-6 space-y-5 shadow-lg border-cyan-300/50 dark:border-cyan-800/50 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-cyan-200/40 dark:border-cyan-900/40">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                <PracticeIcon size={18} semantic="primary" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Recommended Practice Set
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Hand-curated for Day {goal.currentDay}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30 font-mono">
              Rating 800-1100
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {currentTopic.recommendedProblems.map((prob) => (
              <div
                key={`${prob.contestId}${prob.index}`}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-cyan-400/60 transition-all interactive-card shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono">
                      {prob.contestId}{prob.index}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {prob.name}
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 font-mono">
                      {prob.rating} pts
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {prob.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-slate-400 font-medium">#{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {onViewSolution && (
                    <button
                      type="button"
                      onClick={() => onViewSolution(prob)}
                      title="View Codeforces Solution"
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CodeFileIcon size={14} semantic="primary" />
                      <span className="hidden sm:inline">Code</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectProblem(prob)}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Solve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </FunCard>

        {/* Identified Topic Weakness */}
        <FunCard
          variant="coffee"
          className="p-6 space-y-5 shadow-lg border-amber-300/50 dark:border-amber-800/50 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/40 dark:border-amber-900/40">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                <TrendUpIcon size={18} semantic="primary" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Growth & Diagnostic Lab
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Self-correcting AI analysis
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 uppercase">
              {diagnosticWeakness.category}
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-amber-300/50 dark:border-amber-700/50 bg-white/70 dark:bg-slate-900/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300">
              <WarningStatusIcon size={16} semantic="warning" />
              <span>{diagnosticWeakness.title}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {diagnosticWeakness.description}
            </p>
          </div>

          {/* Quick links to review spaced mistakes */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                Revision Tasks Due Today
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">{dueMistakes.length} due</span>
            </div>
            {dueMistakes.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 font-medium">
                ✨ Spaced repetition queue is clear! Mistake journal is fully up to date.
              </div>
            ) : (
              <div className="space-y-2">
                {dueMistakes.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-white/80 dark:bg-slate-900/80 shadow-xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{m.problemName}</span>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      {m.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FunCard>
      </section>

      {/* Community & Peer Collaboration Hub */}
      {onNavigateTab && (
        <FunCard
          variant="candy"
          className="p-6 sm:p-8 space-y-6 sm:space-y-7 shadow-xl border-pink-200/70 dark:border-pink-800/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                <CommunityIcon size={24} semantic="indigo" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Peer & Community Circles
                  </h3>
                  <span className="text-[10px] font-black bg-pink-500/20 text-pink-700 dark:text-pink-300 px-2.5 py-0.5 rounded-full border border-pink-400/30 uppercase">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Connect with fellow climbers, discuss contest problems & review code together.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigateTab('feed')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <ChatIcon className="w-4 h-4" />
                <span>Ask Community</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('communities')}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
              >
                <span>Browse Hub</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('feed')}
              className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 text-left transition-all cursor-pointer group shadow-xs hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <span>💬</span>
                  <span>Community Feed</span>
                </span>
                <ChevronRightIcon size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                Live discussions, test case doubts & editorial insights.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('communities')}
              className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 text-left transition-all cursor-pointer group shadow-xs hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Study Circles</span>
                </span>
                <ChevronRightIcon size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                Join 1600 Climbers & topic-specific problem cohorts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 text-left transition-all cursor-pointer group shadow-xs hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <span>✉️</span>
                  <span>Direct Messages</span>
                </span>
                <ChevronRightIcon size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                1-on-1 code peer reviews & real-time messaging.
              </p>
            </button>
          </div>
        </FunCard>
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

      {/* Baseline Rating Calibration Modal */}
      {showCalibrationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setShowCalibrationModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <RatingGoalIcon size={18} semantic="primary" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rating Telemetry Calibration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalibrationModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Codeforces official contest rating for <strong className="text-indigo-600 dark:text-cyan-400">{profile.cfHandle || 'your account'}</strong> is currently <strong>{profile.verifiedCfRating ? `${profile.verifiedCfRating}` : 'Unrated'}</strong> {profile.verifiedCfRating ? '' : '(no official rated contests participated yet)'}.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Algorithmic Skill Analysis
                </span>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>Auto-Calculated Skill:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                    ~{ratingEstimate.estimatedRating}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Based on {verifiedSolvesCount} verified solves ({ratingEstimate.confidenceLevel} statistical confidence).
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 block">
                  Calibrate Baseline Skill Rating:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: `Auto (~${ratingEstimate.estimatedRating})`, value: 0 },
                    { label: '800 (Newbie)', value: 800 },
                    { label: '900 (Basic)', value: 900 },
                    { label: '1000 (Math)', value: 1000 },
                    { label: '1100 (Greedy)', value: 1100 },
                    { label: '1200 (Pupil)', value: 1200 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSaveCalibratedRating(option.value)}
                      className={`p-2 rounded-xl text-center font-semibold text-xs border transition-all cursor-pointer ${
                        (option.value === 0 && !profile.baselineRating) || profile.baselineRating === option.value
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCalibrationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mystery Challenge / Problem Roulette Modal */}
      <ProblemRouletteModal
        isOpen={showRouletteModal}
        onClose={() => setShowRouletteModal(false)}
        onSelectProblem={(prob) => onSelectProblem(prob)}
        userRating={effectiveRating || 800}
        solvedProblemIds={solvedProblemIds}
      />

      {/* Everyday Login Rewards & Interesting Lore Modal */}
      <DailyLoginRewardsModal
        isOpen={showDailyRewardsModal}
        onClose={() => setShowDailyRewardsModal(false)}
        onTriggerConfetti={() => setShowConfetti(true)}
      />

      {/* Daily Fortune Cookie & Code Prophecy Modal */}
      <DailyFortuneModal
        isOpen={showFortuneModal}
        onClose={() => setShowFortuneModal(false)}
        onTriggerConfetti={() => setShowConfetti(true)}
        onPracticeConcept={() => {
          onSelectProblem(nextRecommendedProblem);
        }}
      />

      {/* Celebratory Canvas Confetti Burst */}
      <ConfettiCanvas active={showConfetti} onDone={() => setShowConfetti(false)} />
    </div>
  );
};
