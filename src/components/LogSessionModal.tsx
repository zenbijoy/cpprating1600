import React, { useState } from 'react';
import {
  CloseIcon,
  TimerIcon,
  EditorialIcon,
  CheckCircleIcon,
  CalendarIcon,
  AddIcon,
} from './icons';

export interface LogSessionPayload {
  topic: string;
  durationMinutes: number;
  notes: string;
  outcome: 'solved_independently' | 'solved_with_hints' | 'attempted_gave_up' | 'editorial_studied';
  dateStr: string;
}

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSession: (payload: LogSessionPayload) => void;
}

const COMMON_TOPICS = [
  'Binary Search',
  'Two Pointers',
  'Dynamic Programming',
  'Greedy',
  'Graph Theory',
  'Math & Number Theory',
  'Implementation',
  'Strings',
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const LogSessionModal: React.FC<LogSessionModalProps> = ({
  isOpen,
  onClose,
  onSaveSession,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [topic, setTopic] = useState<string>('Binary Search');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [outcome, setOutcome] = useState<'solved_independently' | 'solved_with_hints' | 'attempted_gave_up' | 'editorial_studied'>('solved_independently');
  const [dateStr, setDateStr] = useState<string>(todayStr);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTopic = customTopic.trim() ? customTopic.trim() : topic;
    onSaveSession({
      topic: resolvedTopic,
      durationMinutes: Math.max(1, durationMinutes),
      notes: notes.trim() || `Practiced ${resolvedTopic}.`,
      outcome,
      dateStr: dateStr || todayStr,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-session-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <AddIcon size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 id="log-session-title" className="text-base font-bold text-slate-900 dark:text-white">
                Log Practice Session
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record your practice time to update your heatmap, goal ring, and streaks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Topic Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Skill / Topic:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTopic(t);
                    setCustomTopic('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    topic === t && !customTopic
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom topic (e.g. Disjoint Set Union)"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Duration in Minutes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TimerIcon size={14} className="text-slate-400" />
                <span>Duration:</span>
              </label>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {durationMinutes} minutes ({Math.round((durationMinutes / 60) * 10) / 10}h)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer mt-1"
            />
          </div>

          {/* Practice Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-slate-400" />
              <span>Session Date:</span>
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Outcome Status */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Outcome:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'solved_independently', label: 'Solved Solo' },
                { id: 'solved_with_hints', label: 'Solved w/ Hints' },
                { id: 'editorial_studied', label: 'Studied Editorial' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOutcome(opt.id as any)}
                  className={`py-2 px-2 rounded-xl font-medium text-center transition-all cursor-pointer ${
                    outcome === opt.id
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Notes / Reflection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <EditorialIcon size={14} className="text-slate-400" />
              <span>Notes & Takeaways:</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Practiced past tense conjugations / binary search invariants. Handled off-by-one boundary."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircleIcon size={16} />
              <span>Save Practice Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
