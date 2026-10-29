import React, { useState, useMemo } from 'react';
import {
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Target,
  ExternalLink,
  ChevronRight,
  Check,
  Calendar,
  Shield,
} from 'lucide-react';
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
import { Achievements } from './Achievements';
import { CircularProgressRing } from './CircularProgressRing';

interface DashboardViewProps {
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
}) => {
  const currentPhase = getPhaseForDay(goal.currentDay);
  const currentTopic = getTopicForDay(goal.currentDay);

  const completedTasksCount = dailyPlan.tasks.filter((t) => t.completed).length;
  const totalTasksCount = dailyPlan.tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // 30-Day Streak Analysis & Interactive Day Selection
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const streakAnalysis = useMemo(() => {
    return compute30DayStreak(recentAttempts, [dailyPlan]);
  }, [recentAttempts, dailyPlan]);

  // Daily Minutes Goal Progress based on problem attempts logged today
  const todayMinutesProgress = useMemo(() => {
    return calculateTodayMinutesProgress(recentAttempts, goal.dailyMinutes);
  }, [recentAttempts, goal.dailyMinutes]);

  const [showMinutesDetails, setShowMinutesDetails] = useState<boolean>(false);

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

  // Change mission mode (Minimum, Standard, Deep Work)
  const handleChangeMode = (mode: MissionMode) => {
    // Generate tasks corresponding to the new mode
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

  const nextRecommendedProblem: CFProblem = currentTopic.recommendedProblems[0] || {
    contestId: 4,
    index: 'A',
    name: 'Watermelon',
    rating: 800,
    tags: ['math', 'brute force'],
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner: Five Core Vitals & Goals */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Day & Phase Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>TRAINING DAY</span>
            <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 text-[10px] font-bold">
              Phase {currentPhase.phase}/7
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{goal.currentDay}</span>
            <span className="text-xs text-slate-400">/ 180 Days</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {currentPhase.name} ({currentPhase.targetRatingBand})
          </p>
        </div>

        {/* Daily Minutes Goal Card with Circular Progress Ring */}
        <div
          onClick={() => setShowMinutesDetails(true)}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 flex items-center justify-between gap-2 relative overflow-hidden group hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer shadow-lg"
          title="Click to view today's problem attempts breakdown"
        >
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                DAILY MINUTES
              </span>
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  todayMinutesProgress.isGoalMet ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {todayMinutesProgress.totalMinutes}m
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {todayMinutesProgress.goalMinutes}m
              </span>
            </div>
            <p className="text-[11px] truncate">
              {todayMinutesProgress.isGoalMet ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>
                    Goal Met! {todayMinutesProgress.excessMinutes > 0 ? `(+${todayMinutesProgress.excessMinutes}m)` : ''}
                  </span>
                </span>
              ) : (
                <span className="text-slate-400">
                  {todayMinutesProgress.remainingMinutes}m left today
                </span>
              )}
            </p>
          </div>

          {/* Circular Progress Ring */}
          <div className="shrink-0 flex items-center justify-center">
            <CircularProgressRing
              currentMinutes={todayMinutesProgress.totalMinutes}
              goalMinutes={todayMinutesProgress.goalMinutes}
              percent={todayMinutesProgress.percent}
              clampedPercent={todayMinutesProgress.clampedPercent}
              size={56}
              strokeWidth={5.5}
            />
          </div>
        </div>

        {/* Rating Gauge Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>VERIFIED CF RATING</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">
              {profile.verifiedCfRating ? profile.verifiedCfRating : 'Unrated'}
            </span>
            <span className="text-xs text-slate-400">&rarr; Target 1600</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {profile.cfHandle ? `Handle: ${profile.cfHandle}` : 'Link Codeforces in Settings'}
          </p>
        </div>

        {/* 30-Day Streak Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>30-DAY STREAK</span>
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">
              {streakAnalysis.currentStreak}
            </span>
            <span className="text-xs text-slate-400">days active</span>
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Best: {streakAnalysis.longestStreak}d • {streakAnalysis.consistencyPercentage}% consistency</span>
          </p>
        </div>

        {/* Next Contest Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>UPCOMING CONTEST</span>
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {upcomingContestTitle || 'Div.2 / Div.3 Round'}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {upcomingContestTime || 'Check official calendar in Contests tab'}
          </p>
        </div>
      </section>

      {/* 30-Day Daily Streak & Problem-Solving Consistency Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400/30" />
              </span>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                30-Day Problem-Solving Streak & Consistency
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Visual record of problem-solving momentum over the last 30 days. Truthful & non-shaming: 5-minute recovery sessions keep streaks alive.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-bold text-amber-300">
              <Flame className="w-3.5 h-3.5 fill-amber-300" />
              <span>{streakAnalysis.currentStreak} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{streakAnalysis.consistencyPercentage}% Consistency</span>
              <span className="text-[10px] text-slate-400">({streakAnalysis.activeDaysLast30}/30d)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs font-bold text-indigo-300">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>{streakAnalysis.totalSolvedLast30} Solved</span>
            </div>
          </div>
        </div>

        {/* 30-Day Grid Timeline */}
        <div className="space-y-2">
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1.5 pt-1">
            {streakAnalysis.days.map((day) => {
              const isSelected = inspectedDay.dateStr === day.dateStr;
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDayIndex(day.dayIndex)}
                  onMouseEnter={() => setSelectedDayIndex(day.dayIndex)}
                  title={day.tooltipText}
                  className={`group relative flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer min-h-[58px] ${
                    day.status === 'full_practice'
                      ? 'border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200'
                      : day.status === 'recovery'
                      ? 'border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-500'
                  } ${
                    day.isToday
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-md shadow-cyan-500/20'
                      : ''
                  } ${
                    isSelected
                      ? 'scale-105 z-10 border-white/60 brightness-110 shadow-lg'
                      : ''
                  }`}
                >
                  {/* Narrow weekday */}
                  <span className="text-[9px] uppercase tracking-wider font-mono opacity-70">
                    {day.weekday}
                  </span>

                  {/* Day number */}
                  <span className={`text-xs font-bold font-mono ${
                    day.status === 'full_practice'
                      ? 'text-white'
                      : day.status === 'recovery'
                      ? 'text-indigo-100'
                      : 'text-slate-400'
                  }`}>
                    {day.dateStr.split('-')[2]}
                  </span>

                  {/* Status Indicator Icon / Dot */}
                  <div className="w-full flex items-center justify-center pt-0.5">
                    {day.status === 'full_practice' ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    ) : day.status === 'recovery' ? (
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Inspected Day Details Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-white">
                  {inspectedDay.dayLabel}
                </span>
                {inspectedDay.isToday && (
                  <span className="ml-1.5 rounded bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 text-[10px]">
                    Today
                  </span>
                )}
                <span className="text-slate-400 ml-2">
                  —{' '}
                  {inspectedDay.status === 'full_practice' && (
                    <span className="text-emerald-300 font-semibold">
                      Full Practice: {inspectedDay.solvedCount} problem{inspectedDay.solvedCount === 1 ? '' : 's'} solved ({inspectedDay.minutes} min focused)
                    </span>
                  )}
                  {inspectedDay.status === 'recovery' && (
                    <span className="text-indigo-300 font-semibold">
                      Habit Recovery: 5+ min review session / micro-practice (streak maintained)
                    </span>
                  )}
                  {inspectedDay.status === 'rest' && (
                    <span className="text-slate-400">
                      Planned rest & consolidation day (zero guilt)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Context / Action for selected day */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {inspectedDay.isToday && inspectedDay.status === 'rest' ? (
                <button
                  type="button"
                  onClick={() => onSelectProblem(nextRecommendedProblem)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Practice Today to Keep Streak</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  {inspectedDay.status !== 'rest' ? '✓ Momentum logged' : 'Rest day'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Legend & Non-Shaming Philosophy Note */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Legend:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Full Practice (≥1 Solved)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span>Habit Recovery (15m Mode / Review)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
              <span>Rest Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded border-2 border-cyan-400" />
              <span>Today</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Streaks measure habit formation, not burnout.</span>
          </div>
        </div>
      </section>

      {/* Primary Prominent Hero: Today's Mission & One Next Action */}
      <section className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
                Today's Clear Mission
              </span>
              <span className="text-xs text-slate-400">Day {goal.currentDay} of 180</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {currentTopic.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              <strong>Why today:</strong> {currentTopic.keyIdeas[0] || currentTopic.description}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Mode:</span>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
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
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
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
              <span className="font-semibold text-slate-300">Today's Tasks Progress</span>
              <span className="font-mono text-cyan-400">{completedTasksCount} / {totalTasksCount} Done ({progressPercent}%)</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Tasks Checklist */}
            <div className="space-y-2 pt-2">
              {dailyPlan.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    task.completed
                      ? 'border-emerald-900/40 bg-emerald-950/20 text-slate-400'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      task.completed
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{task.description}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Large Start Action Card */}
          <div className="md:col-span-5 flex flex-col justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-5 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Next Action</span>
              <h3 className="text-lg font-bold text-white mt-1">
                {dailyPlan.tasks.find((t) => !t.completed)?.title || "All Mission Tasks Finished!"}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Estimated duration: ~{dailyPlan.tasks.find((t) => !t.completed)?.estimatedMinutes || 25} minutes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectProblem(nextRecommendedProblem)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-90 text-white font-bold py-3.5 px-4 text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Launch Problem Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={onOpenAntiProcrastination}
                className="text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Low Energy / 5m Start</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCurriculumTopic(currentTopic.id)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Read Lesson Details</span>
                <ChevronRight className="w-3 h-3" />
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

      {/* Secondary Cards: Recommended Problems, Weak Topic & Recent Attempts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Recommended Problems */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Recommended Practice Set</span>
            </h3>
            <span className="text-xs text-slate-400">Curated for Day {goal.currentDay}</span>
          </div>

          <div className="space-y-2">
            {currentTopic.recommendedProblems.map((prob) => (
              <div
                key={`${prob.contestId}${prob.index}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">
                      {prob.contestId}{prob.index}
                    </span>
                    <span className="text-xs font-bold text-white">{prob.name}</span>
                    <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded">
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
                  className="rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Solve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Identified Topic Weakness & Recent Solves */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Diagnostic Weakness & Progress</span>
            </h3>
            <span className="text-xs text-slate-400">Self-Correcting</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-900/30 bg-amber-950/20 space-y-1">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Identified Growth Area</span>
            </div>
            <p className="text-xs text-slate-300">
              <strong>Integer overflow on large products:</strong> When calculating sums of prefixes or products of sizes, make sure to use 64-bit integers (<code className="text-cyan-300">long long</code> in C++).
            </p>
          </div>

          {/* Recent Solves Summary */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recent Practice History
            </span>
            {recentAttempts.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 text-center rounded-xl border border-slate-800/60 bg-slate-950/30">
                No submissions recorded yet today. Click <strong>Launch Problem Workspace</strong> above to make your first verified attempt!
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentAttempts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-800 bg-slate-950/40"
                  >
                    <span className="font-semibold text-white">{a.name} ({a.problemId})</span>
                    <span
                      className={`font-mono text-[11px] ${
                        a.officialVerdict === 'OK' ? 'text-emerald-400 font-bold' : 'text-amber-400'
                      }`}
                    >
                      {a.officialVerdict || 'ATTEMPTED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Today's Daily Minutes Breakdown Modal */}
      {showMinutesDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowMinutesDetails(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Daily Minutes Goal Progress</h3>
                  <p className="text-xs text-slate-400">
                    Tracked from live problem sessions logged on {todayMinutesProgress.todayDateStr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMinutesDetails(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Circular Progress Display & Key Metrics */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="shrink-0">
                <CircularProgressRing
                  currentMinutes={todayMinutesProgress.totalMinutes}
                  goalMinutes={todayMinutesProgress.goalMinutes}
                  percent={todayMinutesProgress.percent}
                  clampedPercent={todayMinutesProgress.clampedPercent}
                  size={96}
                  strokeWidth={8}
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Goal Completion: <span className="font-mono text-white font-bold">{todayMinutesProgress.percent}%</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {todayMinutesProgress.isGoalMet ? (
                    <span className="text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Daily Target Achieved!</span>
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      {todayMinutesProgress.remainingMinutes} minutes remaining
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Target is <span className="text-slate-200 font-semibold">{todayMinutesProgress.goalMinutes} minutes</span> daily focus.
                  {todayMinutesProgress.excessMinutes > 0 && (
                    <span className="text-emerald-400 ml-1">
                      You've accumulated {todayMinutesProgress.excessMinutes}m of bonus deep work!
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Today's Problem Attempts List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>TODAY'S PROBLEM SESSIONS ({todayMinutesProgress.todayAttemptsCount})</span>
                <span className="font-mono text-slate-300">{todayMinutesProgress.totalMinutes} min total</span>
              </div>

              {todayMinutesProgress.todayAttempts.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 text-center rounded-xl border border-slate-800 bg-slate-950/40">
                  No problem attempts logged yet today. Click Launch Problem Workspace to begin your session and log focus time!
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {todayMinutesProgress.todayAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{attempt.name}</span>
                          <span className="font-mono text-indigo-400 text-[11px] font-semibold">
                            {attempt.problemId}
                          </span>
                          {attempt.rating && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40">
                              {attempt.rating}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {attempt.outcome === 'solved_independently'
                            ? 'Solved Independently'
                            : attempt.outcome === 'solved_with_hints'
                            ? 'Solved with Hints'
                            : 'Attempted'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-white">
                          {Math.round(attempt.timeSpentSeconds / 60)} min
                        </div>
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            attempt.officialVerdict === 'OK' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {attempt.officialVerdict || 'SUBMITTED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMinutesDetails(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMinutesDetails(false);
                  onSelectProblem(nextRecommendedProblem);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Launch Problem Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
