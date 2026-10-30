import React, { useState, useMemo } from 'react';
import {
  TimerIcon,
  CloseIcon,
  SettingsSlidersIcon,
  NeutralTrendIcon,
  AddIcon,
  CheckIcon,
  CheckCircleIcon,
  AISparkleIcon,
  InformationStatusIcon,
} from './icons';
import { CircularProgressRing } from './CircularProgressRing';
import { calculateTodayMinutesProgress } from '../utils/timeTracking';
import { ProblemAttempt, UserGoal } from '../types';

interface DailyMinutesModalProps {
  goal: UserGoal;
  attempts: ProblemAttempt[];
  onClose: () => void;
  onUpdateGoal: (newGoal: UserGoal) => void;
}

const PRESET_GOALS = [
  {
    minutes: 20,
    label: '20 min',
    subtitle: 'Minimal Streak',
    desc: 'Maintains momentum on busy days or exam periods with 1 targeted solve.',
  },
  {
    minutes: 30,
    label: '30 min',
    subtitle: 'Light Practice',
    desc: '1 standard problem or 1 deep concept review.',
  },
  {
    minutes: 45,
    label: '45 min',
    subtitle: 'Standard (Recommended)',
    desc: 'The optimal daily sweet spot for steady, compounded 180-day growth.',
    isRecommended: true,
  },
  {
    minutes: 60,
    label: '60 min',
    subtitle: 'Accelerated',
    desc: '2 problems with rigorous implementation and reflection.',
  },
  {
    minutes: 90,
    label: '90 min',
    subtitle: 'Deep Work',
    desc: 'Div.2 virtual contest session with upsolving.',
  },
  {
    minutes: 120,
    label: '120 min',
    subtitle: 'Weekend Sprint',
    desc: 'Intensive problem marathon and multi-topic upsolving.',
  },
];

export const DailyMinutesModal: React.FC<DailyMinutesModalProps> = ({
  goal,
  attempts,
  onClose,
  onUpdateGoal,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(goal.dailyMinutes || 45);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Calculate live progress against the currently selected minutes in the modal
  const liveProgress = useMemo(() => {
    return calculateTodayMinutesProgress(attempts, selectedMinutes);
  }, [attempts, selectedMinutes]);

  // Roadmap commitment projections
  const weeklyHours = ((selectedMinutes * 7) / 60).toFixed(1);
  const totalRoadmapHours = Math.round((selectedMinutes * 180) / 60);
  const estimatedSolvesCapacity = Math.round((totalRoadmapHours * 60) / 35); // ~35 mins per solve average

  const handleAdjust = (delta: number) => {
    setSelectedMinutes((prev) => Math.max(15, Math.min(240, prev + delta)));
  };

  const handleSave = () => {
    const updatedGoal: UserGoal = {
      ...goal,
      dailyMinutes: selectedMinutes,
    };
    onUpdateGoal(updatedGoal);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200 safe-area-overlay">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TimerIcon size={20} semantic="primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Set Daily Practice Goal</h3>
              <p className="text-xs text-slate-500">
                Adjust your daily minutes target dynamically without losing streak progress.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <CloseIcon size={20} />
          </button>
        </header>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Live Progress Ring Preview Card */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Live Dashboard Preview
                </span>
                {liveProgress.isGoalMet && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                    Goal Met Today!
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-black ${
                    liveProgress.isGoalMet ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                >
                  {liveProgress.totalMinutes}m
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  / {liveProgress.goalMinutes}m target
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 ml-1">
                  ({liveProgress.percent}%)
                </span>
              </div>

              <p className="text-xs text-slate-600">
                {liveProgress.isGoalMet ? (
                  <span className="text-emerald-800 font-medium">
                    ✓ You have exceeded this goal by {liveProgress.excessMinutes}m today.
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {liveProgress.remainingMinutes} minutes remaining to reach today's goal.
                  </span>
                )}
              </p>
            </div>

            {/* Circular Progress Ring */}
            <div className="shrink-0 flex items-center justify-center p-1 bg-white rounded-full border border-emerald-200 shadow-sm">
              <CircularProgressRing
                currentMinutes={liveProgress.totalMinutes}
                goalMinutes={liveProgress.goalMinutes}
                percent={liveProgress.percent}
                clampedPercent={liveProgress.clampedPercent}
                size={74}
                strokeWidth={7}
              />
            </div>
          </div>

          {/* Stepper & Slider Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <SettingsSlidersIcon size={14} semantic="primary" />
                <span>Target Daily Minutes</span>
              </label>

              {/* Stepper Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjust(-5)}
                  disabled={selectedMinutes <= 15}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center text-slate-700 shadow-sm cursor-pointer"
                  title="-5 minutes"
                >
                  <NeutralTrendIcon size={14} />
                </button>
                <div className="w-16 text-center font-mono font-bold text-slate-900 text-base">
                  {selectedMinutes}m
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjust(5)}
                  disabled={selectedMinutes >= 240}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center text-slate-700 shadow-sm cursor-pointer"
                  title="+5 minutes"
                >
                  <AddIcon size={14} />
                </button>
              </div>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min={15}
              max={180}
              step={5}
              value={selectedMinutes}
              onChange={(e) => setSelectedMinutes(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>15 min</span>
              <span>45 min (Rec)</span>
              <span>90 min</span>
              <span>180 min</span>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GOALS.map((preset) => {
                const isSelected = selectedMinutes === preset.minutes;

                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => setSelectedMinutes(preset.minutes)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {preset.isRecommended && (
                      <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white shadow-xs">
                        REC
                      </span>
                    )}
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>{preset.label}</span>
                      {isSelected && <CheckIcon size={14} semantic="success" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                      {preset.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 180-Day Impact Projection */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
              <AISparkleIcon size={14} semantic="success" />
              <span>Projected 180-Day Impact</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/80">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Weekly Pace</span>
                <span className="font-bold text-slate-900 text-xs">{weeklyHours} hrs/wk</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Total Training</span>
                <span className="font-bold text-emerald-700 text-xs">~{totalRoadmapHours} hrs</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Solves Capacity</span>
                <span className="font-bold text-emerald-800 text-xs">~{estimatedSolvesCapacity} probs</span>
              </div>
            </div>
          </div>

          {/* Non-Shaming Coaching Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600">
            <InformationStatusIcon size={16} semantic="primary" className="shrink-0 mt-0.5 text-emerald-700" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Consistency over 180 days matters far more than sporadic marathons. If you have university exams or heavy work, reduce your target to 20m without breaking your streak.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <CheckCircleIcon size={16} className="text-white" />
                <span>Saved & Synced!</span>
              </>
            ) : (
              <>
                <CheckIcon size={16} className="text-white" />
                <span>Save & Sync Goal</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
