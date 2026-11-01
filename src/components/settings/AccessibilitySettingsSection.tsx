import React from 'react';
import {
  EyeIcon as Eye,
  AccessibilityIcon as Type,
} from '../icons';
import { AccessibilitySettings, FontScaleOption, InterfaceDensity } from '../../types/settings';
import { useTranslation } from '../../utils/i18n';

interface AccessibilitySettingsSectionProps {
  accessibility: AccessibilitySettings;
  onChange: (updated: AccessibilitySettings) => void;
}

export const AccessibilitySettingsSection: React.FC<AccessibilitySettingsSectionProps> = ({
  accessibility,
  onChange,
}) => {
  const { t } = useTranslation();

  const handleToggle = (key: keyof AccessibilitySettings) => {
    onChange({
      ...accessibility,
      [key]: !accessibility[key],
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Visual & Contrast Settings */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Visual Ergonomics & High Contrast</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Optimize readability, outline boundaries, and eliminate visual clutter during prolonged practice sessions.
          </p>
        </div>

        <div className="space-y-3">
          {/* High Contrast Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('a11y.high_contrast')}</p>
              <p className="text-[11px] text-slate-400">
                Enhance edge borders and boost text-to-background contrast to 7:1 (WCAG AAA standard).
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('highContrast')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                accessibility.highContrast ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  accessibility.highContrast ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Clear Focus Indicators */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('a11y.focus_rings')}</p>
              <p className="text-[11px] text-slate-400">
                Display high-visibility 2px glowing rings around active inputs and buttons for keyboard navigators.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('clearFocusIndicators')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                accessibility.clearFocusIndicators ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  accessibility.clearFocusIndicators ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('a11y.reduced_motion')}</p>
              <p className="text-[11px] text-slate-400">
                Disable transition animations, modal bounce effects, and progress ring pulses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('reducedMotion')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                accessibility.reducedMotion ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  accessibility.reducedMotion ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sizing, Density & Screen Readers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" />
          <span>Sizing, Layout Density & Screen Reader Support</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Font Scale */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Base Font Scale</label>
            <select
              value={accessibility.fontSize}
              onChange={(e) => onChange({ ...accessibility, fontSize: e.target.value as FontScaleOption })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="small">Small (15px base - compact & high information density)</option>
              <option value="standard">Standard (17px base - comfortable & readable default)</option>
              <option value="large">Large (19px base - high legibility)</option>
              <option value="extra-large">Extra Large (21px base - maximum legibility)</option>
            </select>
          </div>

          {/* Density */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Layout Spacing Density</label>
            <select
              value={accessibility.density}
              onChange={(e) => onChange({ ...accessibility, density: e.target.value as InterfaceDensity })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="compact">Compact (Tighter lists, fewer scrolls)</option>
              <option value="comfortable">Comfortable (Standard spacing)</option>
              <option value="spacious">Spacious (Generous padding & gaps)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          {/* Screen Reader Optimized */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('a11y.screen_reader')}</p>
              <p className="text-[11px] text-slate-400">
                Embed explicit ARIA live regions and detailed audio descriptions for math symbols and code diffs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('screenReaderLabels')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                accessibility.screenReaderLabels ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  accessibility.screenReaderLabels ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Tooltips */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('a11y.tooltips')}</p>
              <p className="text-[11px] text-slate-400">
                Display explanatory hover tooltips explaining algorithm terms, rating calculations, and icons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('tooltipsEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                accessibility.tooltipsEnabled ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  accessibility.tooltipsEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Confirm Destructive */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('a11y.confirm_destructive')}</p>
              <p className="text-[11px] text-slate-400">
                Prompt an explicit confirmation modal before deleting mistake cards, code drafts, or resets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('confirmDestructiveActions')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                accessibility.confirmDestructiveActions ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  accessibility.confirmDestructiveActions ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
