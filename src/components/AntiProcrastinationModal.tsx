import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  BatteryLow,
  Target,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { EnergyState, getLowEnergyTask } from '../utils/antiProcrastination';
import { DailyTask } from '../types';

interface AntiProcrastinationModalProps {
  onClose: () => void;
  currentTopicTitle: string;
  onStartTask: (task: DailyTask, durationMinutes: number) => void;
}

export const AntiProcrastinationModal: React.FC<AntiProcrastinationModalProps> = ({
  onClose,
  currentTopicTitle,
  onStartTask,
}) => {
  const [activeTab, setActiveTab] = useState<'five_min' | 'low_energy' | 'focus_mode'>('five_min');

  // 5-minute timer
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 mins
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);

  // Low energy state
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyState>('tired');

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isRunning) {
      setIsRunning(false);
      setTimerCompleted(true);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerSeconds]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const lowEnergyRecommendation = getLowEnergyTask(selectedEnergy, currentTopicTitle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Anti-Procrastination & Recovery</h3>
              <p className="text-xs text-slate-400">Lower the barrier to entry. Just take the first micro-step.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('five_min')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'five_min'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5-Minute Start
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('low_energy')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'low_energy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Low-Energy Mode
          </button>
        </div>

        {/* 1. FIVE MINUTE START */}
        {activeTab === 'five_min' && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                Rule of 5 Minutes
              </span>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Commit to just 5 minutes. If you still want to stop after 5 minutes, you have permission to stop. 80% of the time, getting started is the only hurdle.
              </p>
            </div>

            {/* Big Countdown Timer */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="text-5xl md:text-6xl font-mono font-black text-white tracking-tight">
                {formatTime(timerSeconds)}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {timerCompleted ? 'Great job! 5 minutes completed.' : isRunning ? 'Focus on today’s concept...' : 'Ready when you are'}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start 5 Minutes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setTimerSeconds(300);
                  setTimerCompleted(false);
                }}
                className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white bg-slate-950 cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {timerCompleted && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
                <span>Momentum unlocked! Feel ready to attempt a real problem?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg"
                >
                  Continue Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. LOW-ENERGY MODE */}
        {activeTab === 'low_energy' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-violet-400">
                How do you feel right now?
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your current mental barrier. We'll generate a realistic, guilt-free task that fits your energy.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'tired' as EnergyState, label: 'Exhausted / Tired' },
                { id: 'overwhelmed' as EnergyState, label: 'Overwhelmed' },
                { id: 'distracted' as EnergyState, label: 'Distracted' },
                { id: 'afraid_of_difficult' as EnergyState, label: 'Afraid to fail' },
                { id: 'behind_schedule' as EnergyState, label: 'Behind schedule' },
                { id: 'very_busy' as EnergyState, label: 'Exam / Busy' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedEnergy(item.id)}
                  className={`p-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                    selectedEnergy === item.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-white font-semibold ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Tailored Recommendation Card */}
            <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/30 to-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">{lowEnergyRecommendation.title}</span>
                <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 font-mono text-[10px]">
                  {lowEnergyRecommendation.durationMinutes} mins
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lowEnergyRecommendation.description}
              </p>

              <button
                type="button"
                onClick={() => {
                  onStartTask(lowEnergyRecommendation.suggestedTask, lowEnergyRecommendation.durationMinutes);
                  onClose();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 transition-all cursor-pointer shadow-sm"
              >
                <span>Adopt This Recovery Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
