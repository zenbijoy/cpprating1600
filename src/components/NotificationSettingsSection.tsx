import React, { useState, useEffect } from 'react';
import {
  NotificationBellIcon as Bell,
  ClockStatusIcon as Clock,
  MoonIcon as Moon,
  PreferencesIcon as Smartphone,
  LanguageIcon as Globe,
  FeedbackIcon as Mail,
  SendMessageIcon as Send,
  CheckCircleIcon as CheckCircle2,
  WarningStatusIcon as AlertCircle,
  RefreshIcon as RefreshCw,
  TrophyIcon as Trophy,
  MedalIcon as Award,
  ShieldIcon as Shield,
  LearningRoadmapIcon as GraduationCap,
  AISparkleIcon as Sparkles,
} from './icons';
import { UserNotificationPreferences, NotificationCategory } from '../services/notifications/types';
import { notificationClient } from '../services/notificationClient';
import { webPushService } from '../services/webPushService';

const TIMEZONE_OPTIONS = [
  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  { label: 'Asia/Kolkata (IST +5:30)', value: 'Asia/Kolkata' },
  { label: 'Asia/Dhaka (BST +6:00)', value: 'Asia/Dhaka' },
  { label: 'Asia/Shanghai (CST +8:00)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (JST +9:00)', value: 'Asia/Tokyo' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (MSK +3:00)', value: 'Europe/Moscow' },
];

export const NotificationSettingsSection: React.FC = () => {
  const [prefs, setPrefs] = useState<UserNotificationPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Web Push permission state
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [enablingPush, setEnablingPush] = useState<boolean>(false);
  const [testSending, setTestSending] = useState<boolean>(false);

  useEffect(() => {
    setPushSupported(webPushService.isSupported());
    setPushPermission(webPushService.getPermissionState());

    notificationClient
      .getPreferences()
      .then((p) => {
        if (p) setPrefs(p);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (updated: Partial<UserNotificationPreferences>) => {
    if (!prefs) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const saved = await notificationClient.updatePreferences(updated);
      if (saved) {
        setPrefs(saved);
        setSuccessMsg('Preferences successfully updated.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (category: NotificationCategory) => {
    if (!prefs) return;
    const current = prefs.categories_enabled[category] ?? true;
    const updatedCategories = {
      ...prefs.categories_enabled,
      [category]: !current,
    };
    handleSave({ categories_enabled: updatedCategories });
  };

  const handleToggleWebPush = async () => {
    if (prefs?.web_push_enabled) {
      // Disable
      handleSave({ web_push_enabled: false });
    } else {
      // Enable & Request browser permission
      setEnablingPush(true);
      setErrorMsg(null);
      try {
        const result = await webPushService.subscribeUser();
        setPushPermission(webPushService.getPermissionState());
        if (result.success) {
          handleSave({ web_push_enabled: true });
          setSuccessMsg('Browser Web Push successfully activated.');
        } else {
          setErrorMsg(result.error || 'Could not subscribe to Web Push.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Web push subscription error.');
      } finally {
        setEnablingPush(false);
      }
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await notificationClient.sendTestNotification();
      setSuccessMsg('Test notification dispatched to your enabled channels!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send test notification.');
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-sm">Loading notification preferences...</span>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400">
        <p className="text-sm">Sign in to customize notification rules, quiet hours, and alerts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Delivery Channels Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Delivery Channels
            </h3>
            <p className="text-xs text-slate-400">Select where you want to receive reminders and contest updates</p>
          </div>
          <button
            onClick={handleSendTest}
            disabled={testSending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send Test</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* In-App */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">In-App Inbox</p>
                <p className="text-[11px] text-slate-400">Notification badge & center in navigation</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.in_app_enabled}
                onChange={(e) => handleSave({ in_app_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Web Push */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Browser Push</p>
                <p className="text-[11px] text-slate-400">
                  {pushPermission === 'denied'
                    ? 'Blocked by browser permissions'
                    : 'System notifications when tab is in background'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleWebPush}
              disabled={enablingPush || pushPermission === 'denied'}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                prefs.web_push_enabled
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {enablingPush ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : prefs.web_push_enabled ? (
                'Active'
              ) : (
                'Enable'
              )}
            </button>
          </div>

          {/* Mobile Companion Push */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Android Guardian Companion</p>
                <p className="text-[11px] text-slate-400">Push directly to connected Android devices</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.mobile_push_enabled}
                onChange={(e) => handleSave({ mobile_push_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Email Digest */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Email Digest</p>
                <p className="text-[11px] text-slate-400">Weekly contest schedule & coach report</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.email_enabled}
                onChange={(e) => handleSave({ email_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Practice Timing & Quiet Hours Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Practice Timing & Quiet Hours
          </h3>
          <p className="text-xs text-slate-400">Prevent late-night disturbances and align reminders with your schedule</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Preferred Timezone */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Local Time Zone</label>
            <select
              value={prefs.timezone}
              onChange={(e) => handleSave({ timezone: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Practice Hour */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Preferred Practice Time</label>
            <input
              type="time"
              value={prefs.preferred_practice_time}
              onChange={(e) => handleSave({ preferred_practice_time: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quiet Hours Window */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Quiet Hours
              </label>
              <input
                type="checkbox"
                checked={prefs.quiet_hours_enabled}
                onChange={(e) => handleSave({ quiet_hours_enabled: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={prefs.quiet_hours_start}
                disabled={!prefs.quiet_hours_enabled}
                onChange={(e) => handleSave({ quiet_hours_start: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 disabled:opacity-50 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="time"
                value={prefs.quiet_hours_end}
                disabled={!prefs.quiet_hours_enabled}
                onChange={(e) => handleSave({ quiet_hours_end: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 disabled:opacity-50 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Notification Categories Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Category Subscriptions
          </h3>
          <p className="text-xs text-slate-400">Toggle individual reminder types on or off</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Submission sync */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Codeforces Submissions</p>
                <p className="text-[11px] text-slate-400">Accepted solutions & verdict transitions</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.categories_enabled.submission ?? true}
              onChange={() => handleCategoryToggle('submission')}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Contests */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Upcoming Contests</p>
                <p className="text-[11px] text-slate-400">24h, 1h, and 15m advance round alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.categories_enabled.contest ?? true}
              onChange={() => handleCategoryToggle('contest')}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Daily Practice & Incomplete Goals */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Daily Practice & Goals</p>
                <p className="text-[11px] text-slate-400">Target reminders & spaced repetition due</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.categories_enabled.practice ?? true}
              onChange={() => handleCategoryToggle('practice')}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Streak Protection */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-violet-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Streak Milestones & Warnings</p>
                <p className="text-[11px] text-slate-400">Alerts when streak is at risk of expiring</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.categories_enabled.streak ?? true}
              onChange={() => handleCategoryToggle('streak')}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Guardian Focus */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Guardian Focus Sessions</p>
                <p className="text-[11px] text-slate-400">Session start, completion recaps & stats</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.categories_enabled.guardian ?? true}
              onChange={() => handleCategoryToggle('guardian')}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* System Announcements */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Platform Announcements</p>
                <p className="text-[11px] text-slate-400">Major release notes and feature rollouts</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.categories_enabled.system ?? true}
              onChange={() => handleCategoryToggle('system')}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
