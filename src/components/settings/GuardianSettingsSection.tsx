import React, { useState } from 'react';
import {
  ShieldIcon as Shield,
  RefreshIcon as RefreshCw,
  CheckCircleIcon as CheckCircle2,
  PreferencesIcon as Smartphone,
  WeeklyActivityIcon as Activity,
  ChevronUpIcon as ChevronUp,
  ChevronDownIcon as ChevronDown,
} from '../icons';
import { GuardianPreferences } from '../../types/settings';
import { useTranslation } from '../../utils/i18n';

interface GuardianSettingsSectionProps {
  guardian: GuardianPreferences;
  onChange: (updated: GuardianPreferences) => void;
  isAuthenticated?: boolean;
}

const DEFAULT_APPS = [
  { pkg: 'com.instagram.android', name: 'Instagram', category: 'Social Media', defaultBlocked: true },
  { pkg: 'com.zhiliaoapp.musically', name: 'TikTok', category: 'Entertainment', defaultBlocked: true },
  { pkg: 'com.facebook.katana', name: 'Facebook', category: 'Social Media', defaultBlocked: true },
  { pkg: 'com.twitter.android', name: 'X / Twitter', category: 'Social Media', defaultBlocked: true },
  { pkg: 'com.netflix.mediaclient', name: 'Netflix', category: 'Streaming', defaultBlocked: true },
  { pkg: 'com.reddit.frontpage', name: 'Reddit', category: 'Forums', defaultBlocked: true },
  { pkg: 'com.google.android.youtube', name: 'YouTube', category: 'Video (Study-Allowed)', defaultBlocked: false },
  { pkg: 'com.google.android.dialer', name: 'Phone (Emergency)', category: 'Essential (Unblockable)', defaultBlocked: false, unblockable: true },
  { pkg: 'com.google.android.apps.authenticator2', name: 'Google Authenticator (2FA)', category: 'Productivity', defaultBlocked: false, unblockable: true },
  { pkg: 'com.instructure.candroid', name: 'Canvas Student (University)', category: 'Education', defaultBlocked: false, unblockable: true },
];

export const GuardianSettingsSection: React.FC<GuardianSettingsSectionProps> = ({
  guardian,
  onChange,
  isAuthenticated = false,
}) => {
  const { t } = useTranslation();
  const [showPermissionGuide, setShowPermissionGuide] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const togglePackage = (pkg: string) => {
    const current = guardian.blockedPackages || [];
    const exists = current.includes(pkg);
    const updated = exists ? current.filter((p) => p !== pkg) : [...current, pkg];
    onChange({ ...guardian, blockedPackages: updated });
  };

  const handleSyncToCompanion = async () => {
    setSyncStatus('Syncing preferences to cloud for Android Companion...');
    try {
      const res = await fetch('/api/guardian/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardian),
      });
      if (res.ok) {
        setSyncStatus('Synced! Android Companion will fetch updated focus rules.');
      } else {
        setSyncStatus('Saved locally. Connect your Google account to sync across devices.');
      }
    } catch {
      setSyncStatus('Saved locally. Connect your Google account to sync across devices.');
    }
    setTimeout(() => setSyncStatus(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Android Guardian Master Toggle & Session Durations */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{t('guardian.title')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Synchronize anti-distraction rules with the native Kotlin Android Guardian companion app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...guardian, guardianEnabled: !guardian.guardianEnabled })}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              guardian.guardianEnabled ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                guardian.guardianEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Focus Duration */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('guardian.focus_duration')}</label>
            <select
              value={guardian.focusSessionDurationMinutes}
              onChange={(e) => onChange({ ...guardian, focusSessionDurationMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {[25, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>

          {/* Break Duration */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('guardian.break_duration')}</label>
            <select
              value={guardian.breakDurationMinutes}
              onChange={(e) => onChange({ ...guardian, breakDurationMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {[5, 10, 15, 20].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>

          {/* Daily Goal */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('guardian.daily_goal')}</label>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={guardian.dailyFocusMinutesGoal}
              onChange={(e) => onChange({ ...guardian, dailyFocusMinutesGoal: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Breathing Delay */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('guardian.breathing_delay')}</label>
            <select
              value={guardian.breathingDelaySeconds}
              onChange={(e) => onChange({ ...guardian, breathingDelaySeconds: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={0}>Instant Block (0s)</option>
              <option value={5}>5 seconds delay</option>
              <option value={15}>15 seconds breathing delay</option>
              <option value={30}>30 seconds conscious delay</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...guardian, strictBlocking: !guardian.strictBlocking })}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                guardian.strictBlocking ? 'bg-rose-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-1 ${
                  guardian.strictBlocking ? 'left-5' : 'left-1'
                }`}
              />
            </button>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t('guardian.strict_mode')}</span>
          </div>

          <button
            type="button"
            onClick={handleSyncToCompanion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync to Android Device</span>
          </button>
        </div>

        {syncStatus && (
          <div className="p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Blocked App Package Policies */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>App Restriction Policies (Android Companion)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose which mobile applications trigger blocking overlays or gentle breathing delays during active CP focus sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {DEFAULT_APPS.map((app) => {
            const isBlocked = (guardian.blockedPackages || []).includes(app.pkg);
            return (
              <div
                key={app.pkg}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  app.unblockable
                    ? 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                    : isBlocked
                    ? 'border-rose-900/60 bg-rose-950/20 text-rose-200'
                    : 'border-slate-800 bg-slate-950 text-slate-300'
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{app.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{app.pkg}</p>
                </div>
                {app.unblockable ? (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Emergency</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => togglePackage(app.pkg)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isBlocked
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'border border-slate-700 bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {isBlocked ? 'Blocked' : 'Allowed'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Permission Health & Diagnostics Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <button
          type="button"
          onClick={() => setShowPermissionGuide(!showPermissionGuide)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('guardian.permission_guide')}</h3>
          </div>
          {showPermissionGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showPermissionGuide && (
          <div className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800">
            <p className="text-slate-400">
              Web settings alone cannot grant system privileges on Android. For full anti-distraction enforcement, open the <strong>CLIMB 1600 Companion</strong> app on your Android phone and grant:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Usage Access (UsageStatsManager):</strong> Required to detect foreground app switches in under 500ms without draining battery.
              </li>
              <li>
                <strong>Accessibility Service (GuardianAccessibilityService):</strong> Enables seamless full-screen breathing delay overlay without root.
              </li>
              <li>
                <strong>Battery Optimization Exclusion:</strong> Prevents Android Doze mode from killing foreground focus timers.
              </li>
              <li>
                <strong>Device Administrator (Optional):</strong> Prevents uninstalling the app during high-stakes contest modes.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
