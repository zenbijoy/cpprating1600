import React, { useState, useEffect } from 'react';
import {
  SettingsSlidersIcon as Sliders,
  LearningRoadmapIcon as Compass,
  RunCodeIcon as Play,
  DownloadIcon as Download,
  PreferencesIcon as Smartphone,
  SuggestOptimizationIcon as Zap,
  CheckCircleIcon as CheckCircle2,
} from '../icons';
import { ApplicationPreferences } from '../../types/settings';
import { useTranslation } from '../../utils/i18n';
import { pwaInstallService } from '../../services/pwaInstallService';

interface ApplicationSettingsSectionProps {
  app: ApplicationPreferences;
  onChange: (updated: ApplicationPreferences) => void;
  onReplaySplash?: () => void;
}

export const ApplicationSettingsSection: React.FC<ApplicationSettingsSectionProps> = ({
  app,
  onChange,
  onReplaySplash,
}) => {
  const { t } = useTranslation();
  const [canInstall, setCanInstall] = useState<boolean>(() => pwaInstallService.canInstall());
  const [isStandalone, setIsStandalone] = useState<boolean>(() => pwaInstallService.isStandalone());
  const [installing, setInstalling] = useState<boolean>(false);

  useEffect(() => {
    return pwaInstallService.subscribe(() => {
      setCanInstall(pwaInstallService.canInstall());
      setIsStandalone(pwaInstallService.isStandalone());
    });
  }, []);

  const handleToggle = (key: keyof ApplicationPreferences) => {
    onChange({
      ...app,
      [key]: !app[key],
    });
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await pwaInstallService.promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Startup & Splash Screen Animation */}
      <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/30 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Startup Splash Screen & Loading Bar</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure the cinematic sci-fi intro video and dynamic progress loading bar displayed when entering the app.
            </p>
          </div>

          {onReplaySplash && (
            <button
              type="button"
              onClick={onReplaySplash}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Preview Intro Now</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-300">Splash Screen Trigger Behavior</label>
            <select
              value={app.showSplashScreenOnLaunch || 'always'}
              onChange={(e) =>
                onChange({
                  ...app,
                  showSplashScreenOnLaunch: e.target.value as 'always' | 'first_time' | 'never',
                })
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="always">Show on Every App Launch / Entry (Default)</option>
              <option value="first_time">Show Only on First Time App Download / Setup</option>
              <option value="never">Disabled (Skip directly to dashboard)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Plays the Climb 1600 animation video with dynamic engine calibration progress.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-indigo-900/40 bg-slate-950/60 flex flex-col justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Features</span>
              <p className="text-slate-300 font-semibold text-xs mt-1">Full Sound & Fast Skip Supported</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Autoplays muted for browser compliance with instant unmute control and Esc / Space skip shortcuts.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-300 font-mono mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>High Definition 1080p Video + Particle Bar</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. App Download & PWA Installation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>App Download & Device Installation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Install Climb 1600 on your desktop, Android, or mobile home screen for fast native launch and offline training.
            </p>
          </div>

          {isStandalone ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Installed (Standalone)</span>
            </span>
          ) : canInstall ? (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{installing ? 'Installing...' : 'Download / Install App'}</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Running in Web Browser</span>
          )}
        </div>
      </div>

      {/* 3. Navigation & Default Landing */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Default Starting View & Navigation</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose where CLIMB 1600 starts when you launch the application or complete authentication.
          </p>
        </div>

        <div className="space-y-1.5 text-xs max-w-md">
          <label className="font-bold text-slate-300">{t('app.landing_page')}</label>
          <select
            value={app.defaultLandingTab}
            onChange={(e) => onChange({ ...app, defaultLandingTab: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="dashboard">Mission Control (Today's Daily Plan & Streak)</option>
            <option value="workspace">Workspace IDE (C++ Problem Solving)</option>
            <option value="problems">Problem Explorer (Catalog & Rating Filters)</option>
            <option value="skilltree">Skill Tree (Algorithm Mastery Curriculum)</option>
            <option value="mistakes">Mistake Notebook (Spaced Repetition Cards)</option>
            <option value="contests">Virtual Contests (Past CF Division 2 Contests)</option>
            <option value="guardian">Study Guardian (Android Focus Monitor)</option>
          </select>
        </div>
      </div>

      {/* 4. Application Behavior & Shortcuts */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Workflow Optimization & Shortcuts</span>
        </h3>

        <div className="space-y-3">
          {/* Remember Filters */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('app.remember_filters')}</p>
              <p className="text-[11px] text-slate-400">
                Preserve your selected rating bounds and topic tags when navigating between tabs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('rememberProblemFilters')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                app.rememberProblemFilters ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  app.rememberProblemFilters ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Warn Before Leaving Unsaved */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('app.confirm_unsaved')}</p>
              <p className="text-[11px] text-slate-400">
                Prevent accidental tab closure or navigation while writing solution code or mistake logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('confirmBeforeLeavingUnsaved')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                app.confirmBeforeLeavingUnsaved ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  app.confirmBeforeLeavingUnsaved ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Refresh Data */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('app.auto_refresh')}</p>
              <p className="text-[11px] text-slate-400">
                Periodically fetch upcoming contest start times and global solved counts in the background.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoRefreshData')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                app.autoRefreshData ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  app.autoRefreshData ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('app.shortcuts')}</p>
              <p className="text-[11px] text-slate-400">
                Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Ctrl+Enter</kbd> to run test cases and <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Ctrl+K</kbd> for quick command search.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('enableKeyboardShortcuts')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                app.enableKeyboardShortcuts ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  app.enableKeyboardShortcuts ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Show Onboarding Tips */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('app.onboarding_tips')}</p>
              <p className="text-[11px] text-slate-400">
                Display guided tooltips and feature walkthroughs for first-time tools.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('showOnboardingTips')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                app.showOnboardingTips ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  app.showOnboardingTips ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
