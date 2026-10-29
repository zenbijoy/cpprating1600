import React, { useState } from 'react';
import {
  Settings,
  User,
  Clock,
  Code,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { ProgrammingLanguage, UserGoal, UserProfile } from '../types';
import { codeforcesService } from '../services/codeforces';
import { storageService } from '../services/storage';

interface SettingsViewProps {
  goal: UserGoal;
  profile: UserProfile;
  onUpdateGoal: (goal: UserGoal) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  goal,
  profile,
  onUpdateGoal,
  onUpdateProfile,
  onResetAllData,
}) => {
  const [localGoal, setLocalGoal] = useState<UserGoal>(goal);
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);

  // CF handle verification
  const [cfInput, setCfInput] = useState<string>(profile.cfHandle || '');
  const [verifyingCf, setVerifyingCf] = useState<boolean>(false);
  const [cfMessage, setCfMessage] = useState<string | null>(null);

  // Toast
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportBox, setShowImportBox] = useState<boolean>(false);

  const handleVerifyCf = async () => {
    if (!cfInput.trim()) return;
    setVerifyingCf(true);
    setCfMessage(null);
    try {
      const user = await codeforcesService.getUserInfo(cfInput.trim());
      setLocalProfile((prev) => ({
        ...prev,
        cfHandle: user.handle,
        verifiedCfRating: user.rating,
        maxCfRating: user.maxRating,
        rank: user.rank,
        avatar: user.avatar,
      }));
      setCfMessage(`Verified: ${user.handle} (Current Rating: ${user.rating || 'Unrated'}, Max: ${user.maxRating || 'N/A'})`);
    } catch (err: any) {
      setCfMessage(`Error: ${err.message || 'Could not verify handle.'}`);
    } finally {
      setVerifyingCf(false);
    }
  };

  const handleSaveAll = () => {
    onUpdateGoal(localGoal);
    onUpdateProfile(localProfile);
    storageService.saveGoal(localGoal);
    storageService.saveProfile(localProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const data = storageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climb1600_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    if (!importJsonText.trim()) return;
    const success = storageService.importData(importJsonText.trim());
    if (success) {
      alert('Data imported successfully! Reloading...');
      window.location.reload();
    } else {
      alert('Invalid JSON format. Please verify the backup file.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Settings & Data Control</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure training preferences, sync your official Codeforces handle, and backup your private learning history.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saveSuccess ? 'Preferences Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Codeforces Account Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>Codeforces Account Integration</span>
        </h3>
        <p className="text-xs text-slate-400">
          Sync your verified handle from the official Codeforces public API. We never ask for or store passwords.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Codeforces handle (e.g. tourist, your_handle)"
            value={cfInput}
            onChange={(e) => setCfInput(e.target.value)}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleVerifyCf}
            disabled={verifyingCf || !cfInput.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{verifyingCf ? 'Verifying...' : 'Verify Handle'}</span>
          </button>
        </div>

        {cfMessage && (
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300">
            {cfMessage}
          </div>
        )}
      </div>

      {/* Practice Parameters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Daily Availability & Practice Rules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Daily Practice Budget
            </label>
            <select
              value={localGoal.dailyMinutes}
              onChange={(e) => setLocalGoal({ ...localGoal, dailyMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {[20, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} minutes per day</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Primary Language
            </label>
            <select
              value={localProfile.preferredLanguage}
              onChange={(e) => setLocalProfile({ ...localProfile, preferredLanguage: e.target.value as ProgrammingLanguage })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="cpp20">C++20 (Recommended)</option>
              <option value="cpp17">C++17</option>
              <option value="python">Python 3 / PyPy3</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Current Roadmap Day
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={localGoal.currentDay}
              onChange={(e) => setLocalGoal({ ...localGoal, currentDay: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Target Rating
            </label>
            <input
              type="number"
              value={localGoal.targetRating}
              onChange={(e) => setLocalGoal({ ...localGoal, targetRating: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Personal "Why I Started"
          </label>
          <textarea
            rows={2}
            value={localGoal.personalMotivation}
            onChange={(e) => setLocalGoal({ ...localGoal, personalMotivation: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Data Export & Backup Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Data Privacy & Portability</span>
        </h3>
        <p className="text-xs text-slate-400">
          Your practice history, mistake notebook, and drafts are stored securely on your browser. You can export a full JSON backup anytime or import previous records.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Backup</span>
          </button>
        </div>

        {showImportBox && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Paste JSON Data</label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='Paste JSON data here (e.g. {"profile": ..., "attempts": ...})'
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-slate-200"
            />
            <button
              type="button"
              onClick={handleImportData}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 text-xs cursor-pointer"
            >
              Restore Backup
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-5 space-y-3">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-slate-400">
          Reset all local training progress, attempts, drafts, and restart onboarding from scratch.
        </p>

        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-xl border border-rose-800 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
          >
            Reset All Training Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-rose-300 font-bold">Are you sure? This cannot be undone.</span>
            <button
              type="button"
              onClick={onResetAllData}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 text-xs cursor-pointer"
            >
              Yes, Reset Everything
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
