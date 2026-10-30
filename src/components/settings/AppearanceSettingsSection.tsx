import React, { useState } from 'react';
import {
  AppearanceIcon as Palette,
  SunIcon as Sun,
  MoonIcon as Moon,
  SystemThemeIcon as Laptop,
  CheckIcon as Check,
  RetryIcon as RotateCcw,
  AISparkleIcon as Sparkles,
  SettingsSlidersIcon as Sliders,
  EyeIcon as Eye,
  WarningStatusIcon as AlertCircle,
  CheckCircleIcon as CheckCircle2,
  Flame,
  Crown,
} from '../icons';
import {
  AppearanceMode,
  BorderRadiusOption,
  FontScaleOption,
  InterfaceDensity,
  ThemeConfig,
  ThemePresetId,
} from '../../types/settings';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
  isValidHexColor,
  getContrastRatio,
  isAccessibleContrast,
  getActiveThemeColors,
  applyThemeToDom,
  getPresetPreviewColors,
} from '../../utils/themeEngine';
import { useTranslation } from '../../utils/i18n';

interface AppearanceSettingsSectionProps {
  config: ThemeConfig;
  onChange: (updated: ThemeConfig) => void;
  onReset: () => void;
}

export const AppearanceSettingsSection: React.FC<AppearanceSettingsSectionProps> = ({
  config,
  onChange,
  onReset,
}) => {
  const { t } = useTranslation();
  const [customPrimary, setCustomPrimary] = useState<string>(config.customPrimaryAccent || '');
  const [customSecondary, setCustomSecondary] = useState<string>(config.customSecondaryAccent || '');

  const activeColors = getActiveThemeColors(config);
  const contrastRatio = getContrastRatio(activeColors.primary, activeColors.bgApp);
  const isContrastPass = isAccessibleContrast(activeColors.primary, activeColors.bgApp, 4.5);

  const handleModeChange = (mode: AppearanceMode) => {
    const updated = { ...config, mode };
    onChange(updated);
    applyThemeToDom(updated);
  };

  const handlePresetChange = (preset: ThemePresetId) => {
    const updated = { ...config, preset, customPrimaryAccent: undefined, customSecondaryAccent: undefined };
    setCustomPrimary('');
    setCustomSecondary('');
    onChange(updated);
    applyThemeToDom(updated);
  };

  const handleCustomPrimaryApply = (hex: string) => {
    setCustomPrimary(hex);
    if (isValidHexColor(hex)) {
      const updated = { ...config, customPrimaryAccent: hex };
      onChange(updated);
      applyThemeToDom(updated);
    }
  };

  const handleCustomSecondaryApply = (hex: string) => {
    setCustomSecondary(hex);
    if (isValidHexColor(hex)) {
      const updated = { ...config, customSecondaryAccent: hex };
      onChange(updated);
      applyThemeToDom(updated);
    }
  };

  const appearanceModes: {
    id: AppearanceMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    badge?: string;
    colorDots: string[];
  }[] = [
    {
      id: 'light',
      label: t('appearance.mode_light'),
      icon: Sun,
      desc: 'Crisp daylight readability (Default)',
      badge: 'Default',
      colorDots: ['#f8fafc', '#4f46e5', '#0891b2'],
    },
    {
      id: 'dark',
      label: t('appearance.mode_dark'),
      icon: Moon,
      desc: 'Optimized for low-light coding',
      colorDots: ['#0b0f19', '#6366f1', '#06b6d4'],
    },
    {
      id: 'multicolor',
      label: t('appearance.mode_multicolor'),
      icon: Sparkles,
      desc: 'Vibrant rainbow prismatic styling',
      colorDots: ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b'],
    },
    {
      id: 'orange',
      label: t('appearance.mode_orange'),
      icon: Flame,
      desc: 'Warm energetic citrus & amber theme',
      colorDots: ['#150d06', '#ea580c', '#f59e0b'],
    },
    {
      id: 'purple',
      label: t('appearance.mode_purple'),
      icon: Crown,
      desc: 'Imperial amethyst & electric violet',
      colorDots: ['#0f081d', '#a855f7', '#ec4899'],
    },
    {
      id: 'system',
      label: t('appearance.mode_system'),
      icon: Laptop,
      desc: 'Matches your OS preferences',
      colorDots: ['#475569', '#94a3b8'],
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Appearance Mode */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>{t('appearance.mode')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t('appearance.mode_desc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {appearanceModes.map((item) => {
            const Icon = item.icon;
            const isSelected = config.mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleModeChange(item.id)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="text-xs font-bold">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
                <span className="text-[11px] text-slate-500 mb-2">{item.desc}</span>
                {/* Visual Palette Preview Dots */}
                <div className="flex items-center gap-1.5 mt-auto pt-1">
                  {item.colorDots.map((dotColor, idx) => (
                    <span
                      key={idx}
                      className="w-3 h-3 rounded-full border border-black/20 shadow-xs"
                      style={{ backgroundColor: dotColor }}
                      title={dotColor}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Theme Presets */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>{t('appearance.presets')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{t('appearance.presets_desc')}</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('appearance.reset_theme')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((presetId) => {
            const preset = THEME_PRESETS[presetId];
            const isSelected = config.preset === presetId;
            const colors = getPresetPreviewColors(presetId, config.mode);

            return (
              <button
                key={presetId}
                type="button"
                onClick={() => handlePresetChange(presetId)}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 bg-slate-900 shadow-md ring-1 ring-indigo-500/40'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                {/* Miniature UI Mockup matching Theme Previews board */}
                <div
                  className="w-full h-24 rounded-lg p-2 mb-2.5 border flex flex-col justify-between overflow-hidden shadow-inner"
                  style={{
                    backgroundColor: colors.bgApp,
                    borderColor: colors.border,
                  }}
                >
                  {/* Top Bar of mini UI */}
                  <div
                    className="flex items-center justify-between pb-1.5 border-b"
                    style={{ borderColor: colors.borderSubtle }}
                  >
                    <div className="flex items-center gap-1.5">
                      {/* Mini Mountain Peak */}
                      <div
                        className="w-3.5 h-3.5 rounded flex items-center justify-center p-0.5"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <div className="w-full h-full rounded-xs bg-slate-950 flex items-center justify-center">
                          <span className="text-[7px] font-black" style={{ color: colors.secondary }}>▲</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: colors.textMain }}>
                        CLIMB 1600
                      </span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                  </div>

                  {/* Mock content cards */}
                  <div className="grid grid-cols-2 gap-1.5 my-1">
                    <div
                      className="p-1.5 rounded border flex flex-col justify-center"
                      style={{
                        backgroundColor: colors.bgCard,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <div className="w-6 h-1 rounded opacity-50" style={{ backgroundColor: colors.textMuted }} />
                      <div className="w-10 h-1.5 rounded mt-1" style={{ backgroundColor: colors.primary }} />
                    </div>
                    <div
                      className="p-1.5 rounded border flex flex-col justify-center"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <div className="w-7 h-1 rounded opacity-50" style={{ backgroundColor: colors.textMuted }} />
                      <div className="w-8 h-1.5 rounded mt-1" style={{ backgroundColor: colors.secondary }} />
                    </div>
                  </div>

                  {/* Swatches Bar */}
                  <div className="flex items-center h-2 w-full rounded overflow-hidden">
                    <div className="flex-1 h-full" style={{ backgroundColor: colors.bgApp }} title="Background" />
                    <div className="flex-1 h-full" style={{ backgroundColor: colors.bgCard }} title="Surface" />
                    <div className="flex-1 h-full" style={{ backgroundColor: colors.primary }} title="Primary" />
                    <div className="flex-1 h-full" style={{ backgroundColor: colors.secondary }} title="Secondary" />
                  </div>
                </div>

                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">{preset.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Accent Colors with Contrast Protection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Accent Colors & Contrast Safeguard</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Customize primary and secondary accents. CLIMB 1600 checks WCAG 2.1 AA luminance contrast to ensure your code and ratings remain legible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Accent */}
          <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">{t('appearance.custom_accent')}</label>
              <div
                className="w-5 h-5 rounded-full border border-slate-700 shadow-sm"
                style={{ backgroundColor: activeColors.primary }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeColors.primary}
                onChange={(e) => handleCustomPrimaryApply(e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                placeholder="#6366f1"
                value={customPrimary || activeColors.primary}
                onChange={(e) => handleCustomPrimaryApply(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            {/* Contrast Badge */}
            <div
              className={`flex items-center justify-between text-[11px] p-2 rounded-lg border ${
                isContrastPass
                  ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                  : 'border-amber-800/60 bg-amber-950/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isContrastPass ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Contrast: {contrastRatio.toFixed(2)}:1</span>
              </div>
              <span className="font-bold text-[10px] uppercase">
                {isContrastPass ? 'WCAG AA Pass' : 'Low Contrast'}
              </span>
            </div>
          </div>

          {/* Secondary Highlight */}
          <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">{t('appearance.custom_secondary')}</label>
              <div
                className="w-5 h-5 rounded-full border border-slate-700 shadow-sm"
                style={{ backgroundColor: activeColors.secondary }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeColors.secondary}
                onChange={(e) => handleCustomSecondaryApply(e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                placeholder="#06b6d4"
                value={customSecondary || activeColors.secondary}
                onChange={(e) => handleCustomSecondaryApply(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Used for progress bars, secondary badges, and hint highlights.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Layout & Typography Tokens */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Interface Geometry & Typography</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Interface Density */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('appearance.density')}</label>
            <select
              value={config.density}
              onChange={(e) => {
                const updated = { ...config, density: e.target.value as InterfaceDensity };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="compact">{t('appearance.density_compact')}</option>
              <option value="comfortable">{t('appearance.density_comfortable')}</option>
              <option value="spacious">{t('appearance.density_spacious')}</option>
            </select>
          </div>

          {/* Border Radius */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('appearance.radius')}</label>
            <select
              value={config.borderRadius}
              onChange={(e) => {
                const updated = { ...config, borderRadius: e.target.value as BorderRadiusOption };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="compact">{t('appearance.radius_compact')}</option>
              <option value="standard">{t('appearance.radius_standard')}</option>
              <option value="rounded">{t('appearance.radius_rounded')}</option>
            </select>
          </div>

          {/* Font Scale */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('appearance.font_size')}</label>
            <select
              value={config.fontSize}
              onChange={(e) => {
                const updated = { ...config, fontSize: e.target.value as FontScaleOption };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="small">{t('appearance.font_size_small')}</option>
              <option value="standard">{t('appearance.font_size_standard')}</option>
              <option value="large">{t('appearance.font_size_large')}</option>
            </select>
          </div>

          {/* Animation Intensity */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('appearance.animation')}</label>
            <select
              value={config.animationIntensity}
              onChange={(e) => {
                const updated = { ...config, animationIntensity: e.target.value as any };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="full">{t('appearance.animation_full')}</option>
              <option value="reduced">{t('appearance.animation_reduced')}</option>
              <option value="off">{t('appearance.animation_off')}</option>
            </select>
          </div>

          {/* Transparency */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">{t('appearance.transparency')}</label>
            <select
              value={config.transparency}
              onChange={(e) => {
                const updated = { ...config, transparency: e.target.value as any };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="normal">{t('appearance.transparency_normal')}</option>
              <option value="reduced">{t('appearance.transparency_reduced')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Live Theme Preview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>{t('appearance.preview_title')}</span>
        </h3>

        <div
          className="p-5 rounded-2xl border transition-all"
          style={{
            backgroundColor: activeColors.bgSurface,
            borderColor: activeColors.border,
            color: activeColors.textMain,
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: activeColors.borderSubtle }}>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: activeColors.primary }}
              />
              <span className="font-bold text-xs">Simulated Problem Card</span>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
              style={{
                backgroundColor: activeColors.accentGlow,
                color: activeColors.primary,
                border: `1px solid ${activeColors.borderFocus}`,
              }}
            >
              Rating 1400 • Dynamic Programming
            </span>
          </div>

          <p className="text-xs mt-3 leading-relaxed" style={{ color: activeColors.textMuted }}>
            Find the maximum independent sum of non-adjacent elements in an array of integers with optimal \(O(N)\) time and \(O(1)\) auxiliary memory.
          </p>

          <div className="mt-3 p-2.5 rounded-xl font-mono text-[11px]" style={{ backgroundColor: activeColors.bgCard }}>
            <span style={{ color: activeColors.secondary }}>long long</span> ans = dp[n - 1]; <span style={{ color: activeColors.textSubtle }}>// Solved independently</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: activeColors.textSubtle }}>
              CLIMB 1600 Design Token System Active
            </span>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: activeColors.primary }}
            >
              Solve Problem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
