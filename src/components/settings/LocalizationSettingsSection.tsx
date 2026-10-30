import React from 'react';
import {
  LanguageIcon as Globe,
  LanguageIcon as Languages,
  ClockStatusIcon as Clock,
  CheckIcon as Check,
} from '../icons';
import { LocalizationPreferences } from '../../types/settings';
import {
  useTranslation,
  SUPPORTED_TIMEZONES,
  formatDate,
  formatTime,
} from '../../utils/i18n';

interface LocalizationSettingsSectionProps {
  localization: LocalizationPreferences;
  onChange: (updated: LocalizationPreferences) => void;
}

export const LocalizationSettingsSection: React.FC<LocalizationSettingsSectionProps> = ({
  localization,
  onChange,
}) => {
  const { t, setLang } = useTranslation();

  const handleLanguageChange = (lang: 'en' | 'bn') => {
    setLang(lang);
    onChange({ ...localization, language: lang });
  };

  const now = new Date();
  const formattedPreviewDate = formatDate(now, localization.dateFormat);
  const formattedPreviewTime = formatTime(now, localization.timeFormat, localization.timeZone);

  return (
    <div className="space-y-6">
      {/* 1. Interface Language */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-400" />
            <span>{t('lang.interface')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose your preferred display language for the CLIMB 1600 interface and training materials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'en' as const, label: 'English (US / International)', subtext: 'Default CP terminology and standard problem names' },
            { id: 'bn' as const, label: 'বাংলা (Bengali)', subtext: 'সম্পূর্ণ বাংলা ইন্টারফেস ও নির্দেশনাবলী' },
          ].map((item) => {
            const isSelected = localization.language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLanguageChange(item.id)}
                className={`flex flex-col p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold">{item.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <span className="text-[11px] text-slate-500">{item.subtext}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Region, Timezone & Formatting */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Timezone & Temporal Formatting</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ensure your scheduled study sessions, university exam conflict warnings, and virtual contest countdowns match your local clock.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Timezone */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-bold text-slate-300">{t('lang.timezone')}</label>
            <select
              value={localization.timeZone}
              onChange={(e) => onChange({ ...localization, timeZone: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Format */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('lang.date_format')}</label>
            <select
              value={localization.dateFormat}
              onChange={(e) => onChange({ ...localization, dateFormat: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (Day/Month/Year)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (Month/Day/Year)</option>
            </select>
          </div>

          {/* Time Format */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('lang.time_format')}</label>
            <select
              value={localization.timeFormat}
              onChange={(e) => onChange({ ...localization, timeFormat: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="12h">12-Hour (AM / PM)</option>
              <option value="24h">24-Hour (Military / Railway)</option>
            </select>
          </div>

          {/* Week Start */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('lang.week_start')}</label>
            <select
              value={localization.weekStart}
              onChange={(e) => onChange({ ...localization, weekStart: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="monday">{t('lang.monday')}</option>
              <option value="sunday">{t('lang.sunday')}</option>
              <option value="saturday">{t('lang.saturday')}</option>
            </select>
          </div>

          {/* Live Preview Pill */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Live Clock Preview</label>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-300 font-mono text-xs flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formattedPreviewDate} • {formattedPreviewTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
