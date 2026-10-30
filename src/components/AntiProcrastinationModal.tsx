import React, { useState, useEffect } from 'react';
import {
  CloseIcon,
  RunCodeIcon,
  StopGenerationIcon,
  RefreshIcon,
  AISparkleIcon,
  ChevronRightIcon,
} from './icons';
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
  const [activeTab, setActiveTab] = useState<'five_min' | 'low_energy'>('five_min');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto safe-area-overlay">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <AISparkleIcon size={18} semantic="primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Anti-Procrastination & Momentum</h3>
              <p className="text-xs text-slate-500">Lower the activation energy. Commit to one small action.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('five_min')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'five_min'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            5-Minute Rule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('low_energy')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'low_energy'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low-Energy Mode
          </button>
        </div>

        {/* 1. FIVE MINUTE START */}
        {activeTab === 'five_min' && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-700">
                The 5-Minute Commitment
              </span>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Commit to just 5 minutes of focused problem analysis. If you still want to stop after 5 minutes, you may stop guilt-free. Starting breaks cognitive resistance.
              </p>
            </div>

            {/* Big Countdown Timer */}
            <div className="py-6 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-5xl md:text-6xl font-mono font-bold text-slate-900 tracking-tight">
                {formatTime(timerSeconds)}
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                {timerCompleted ? '5 minutes completed! Momentum is rolling.' : isRunning ? `Focusing on: ${currentTopicTitle}` : 'Click Start to begin your 5-minute micro-session'}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 text-sm shadow-sm transition-all cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <StopGenerationIcon size={16} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <RunCodeIcon size={16} />
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
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RefreshIcon size={16} />
              </button>
            </div>

            {timerCompleted && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span className="font-medium">Momentum active! Ready to solve the problem now?</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Enter Workspace
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. LOW-ENERGY MODE */}
        {activeTab === 'low_energy' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-700">
                What is holding you back today?
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your current mental barrier. We will generate a structured, guilt-free task that respects your bandwidth.
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
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                    selectedEnergy === item.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Tailored Recommendation Card */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">{lowEnergyRecommendation.title}</span>
                <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-semibold">
                  {lowEnergyRecommendation.durationMinutes} mins
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {lowEnergyRecommendation.description}
              </p>

              <button
                type="button"
                onClick={() => {
                  onStartTask(lowEnergyRecommendation.suggestedTask, lowEnergyRecommendation.durationMinutes);
                  onClose();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 transition-all cursor-pointer shadow-sm"
              >
                <span>Adopt This Recovery Task</span>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
