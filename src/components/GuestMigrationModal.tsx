import React, { useState } from 'react';
import {
  CloseIcon,
  ImportIcon,
  WarningStatusIcon,
  CheckCircleIcon,
  AISparkleIcon,
} from './icons';
import { authService } from '../services/supabase';
import { storageService } from '../services/storage';

interface GuestMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrated: () => void;
  attemptsCount: number;
  mistakesCount: number;
}

export const GuestMigrationModal: React.FC<GuestMigrationModalProps> = ({
  isOpen,
  onClose,
  onMigrated,
  attemptsCount,
  mistakesCount,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const attempts = storageService.getAttempts();
      const mistakes = storageService.getMistakes();
      const goal = storageService.getGoal();

      const res = await authService.migrateGuestData({
        attempts,
        mistakes,
        goal: {
          dailyMinutes: goal.dailyMinutes,
          targetRating: goal.targetRating,
          currentDay: goal.currentDay,
        },
      });

      setSuccess(res.message || 'Practice data successfully synchronized!');
      setTimeout(() => {
        onMigrated();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to migrate guest practice data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 safe-area-overlay">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <CloseIcon size={20} />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/70 border border-indigo-700/60 flex items-center justify-center mx-auto text-indigo-400 mb-2">
            <ImportIcon size={28} />
          </div>
          <h3 className="text-xl font-bold text-white">Import Guest Practice Data?</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            We discovered unassociated local practice progress in this browser. Would you like to link it to your Google account?
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
            <WarningStatusIcon size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs">
            <CheckCircleIcon size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Summary card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-center">
          <div>
            <span className="text-xl font-mono font-bold text-cyan-400">{attemptsCount}</span>
            <p className="text-[11px] text-slate-400">Problem Attempts</p>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-amber-400">{mistakesCount}</span>
            <p className="text-[11px] text-slate-400">Mistake Notebooks</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !!success}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Synchronizing to Cloud...
              </span>
            ) : (
              <>
                <AISparkleIcon size={16} semantic="warning" />
                <span>Import and Preserve Progress</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
          >
            Start Fresh (Keep Guest Data Local)
          </button>
        </div>
      </div>
    </div>
  );
};
