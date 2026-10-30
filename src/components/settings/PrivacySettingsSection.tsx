import React from 'react';
import {
  LockIcon as Lock,
  AISparkleIcon as Sparkles,
} from '../icons';
import { PrivacySettings } from '../../types/settings';
import { useTranslation } from '../../utils/i18n';

interface PrivacySettingsSectionProps {
  privacy: PrivacySettings;
  onChange: (updated: PrivacySettings) => void;
}

export const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  privacy,
  onChange,
}) => {
  const { t } = useTranslation();

  const handleToggle = (key: keyof PrivacySettings) => {
    onChange({
      ...privacy,
      [key]: !privacy[key],
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Visibility & Social Sharing */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Profile Visibility & Social Sharing</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Control which parts of your training progress, streak, and badges are visible to other competitive programmers.
          </p>
        </div>

        <div className="space-y-3">
          {/* Profile Visibility */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('privacy.profile_visibility')}</p>
              <p className="text-[11px] text-slate-400">
                {privacy.profileVisibility === 'public'
                  ? 'Your solved problem counts and unlocked badges can be viewed in community benchmarks.'
                  : 'Your profile is completely hidden from public leaderboards.'}
              </p>
            </div>
            <select
              value={privacy.profileVisibility}
              onChange={(e) => onChange({ ...privacy, profileVisibility: e.target.value as any })}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="public">{t('privacy.visibility_public')}</option>
              <option value="private">{t('privacy.visibility_private')}</option>
            </select>
          </div>

          {/* Activity Status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('privacy.activity_status')}</p>
              <p className="text-[11px] text-slate-400">
                Indicate when you are actively solving problems in study groups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('showActivityStatus')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                privacy.showActivityStatus ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  privacy.showActivityStatus ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Share Achievements */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('privacy.share_achievements')}</p>
              <p className="text-[11px] text-slate-400">
                Allow milestone badges (e.g. 10-day streak, 1200 rating reached) to be shown on your profile card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('shareAchievements')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                privacy.shareAchievements ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  privacy.shareAchievements ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Personalization & Telemetry */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Personalization & Telemetry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure how your mistake notes and attempt telemetry are analyzed to tailor your curriculum.
          </p>
        </div>

        <div className="space-y-3">
          {/* Personalized Recommendations */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('privacy.recommendations')}</p>
              <p className="text-[11px] text-slate-400">
                Enable our adaptive algorithm to inspect mistake patterns and suggest problems that address your specific weaknesses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('personalizedRecommendations')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                privacy.personalizedRecommendations ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  privacy.personalizedRecommendations ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Telemetry */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-white text-xs">{t('privacy.telemetry')}</p>
              <p className="text-[11px] text-slate-400">
                Send anonymous runtime diagnostic metrics to help the CLIMB 1600 engineering team identify client-side bugs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('telemetryEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                privacy.telemetryEnabled ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  privacy.telemetryEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
