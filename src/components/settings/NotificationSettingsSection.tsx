import React, { useState } from 'react';
import {
  NotificationBellIcon as Bell,
  MoonIcon as Moon,
} from '../icons';
import { useTranslation } from '../../utils/i18n';

export const NotificationSettingsSection: React.FC = () => {
  const { t } = useTranslation();
  const [inApp, setInApp] = useState<boolean>(true);
  const [webPush, setWebPush] = useState<boolean>(false);
  const [mobilePush, setMobilePush] = useState<boolean>(true);
  const [quietHours, setQuietHours] = useState<boolean>(true);
  const [quietStart, setQuietStart] = useState<string>('22:00');
  const [quietEnd, setQuietEnd] = useState<string>('08:00');
  const [practiceTime, setPracticeTime] = useState<string>('19:30');
  const [contestAlerts, setContestAlerts] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      {/* 1. Notification Channels */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Delivery Channels & Notification Types</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose how you receive contest reminders, streak alerts, and due review notifications.
          </p>
        </div>

        <div className="space-y-3">
          {/* In-App Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">In-App Notification Inbox</p>
              <p className="text-[11px] text-slate-400">
                Display badge counter and bell alerts directly in the top navigation bar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInApp(!inApp)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                inApp ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  inApp ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Android Companion Push */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">Android Guardian Mobile Push</p>
              <p className="text-[11px] text-slate-400">
                Send focus session prompts and daily streak reminders to your Android smartphone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobilePush(!mobilePush)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                mobilePush ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  mobilePush ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Web Push API */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">Browser Desktop Push Notifications</p>
              <p className="text-[11px] text-slate-400">
                W3C standard push notifications when Codeforces contests are 15 minutes away.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWebPush(!webPush)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                webPush ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  webPush ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quiet Hours & Schedule */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-cyan-400" />
          <span>Quiet Hours & Study Routine</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">Enable Nighttime Quiet Hours</p>
              <p className="text-[11px] text-slate-400">
                Mute all non-urgent push notifications while you sleep or attend university lectures.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQuietHours(!quietHours)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                quietHours ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  quietHours ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {quietHours && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Quiet Hours Start</label>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Quiet Hours End</label>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            {/* Preferred Daily Reminder */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Daily Practice Reminder Time</label>
              <input
                type="time"
                value={practiceTime}
                onChange={(e) => setPracticeTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Contest Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
              <div>
                <p className="font-semibold text-white text-xs">Upcoming Div.2 Contest Alerts</p>
                <p className="text-[11px] text-slate-400">1 day, 1 hour, and 15 minutes before round</p>
              </div>
              <button
                type="button"
                onClick={() => setContestAlerts(!contestAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  contestAlerts ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    contestAlerts ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
