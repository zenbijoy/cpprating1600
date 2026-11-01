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
  AccessibilityIcon as Type,
} from '../icons';
import {
  AppearanceMode,
  BorderRadiusOption,
  FontFamilyOption,
  FontScaleOption,
  InterfaceDensity,
  ThemeConfig,
  ThemePresetId,
  AnimeCharacterId,
} from '../../types/settings';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
  FONT_FAMILIES,
  THEME_CATEGORIES,
  THEME_METADATA,
  ThemeCategory,
  getFontFamilyStack,
  isValidHexColor,
  getContrastRatio,
  isAccessibleContrast,
  getActiveThemeColors,
  applyThemeToDom,
  getPresetPreviewColors,
} from '../../utils/themeEngine';
import { useTranslation } from '../../utils/i18n';
import { soundEffects } from '../../utils/soundEffects';
import { ANIME_CHARACTERS } from '../assets/MascotAndStickers';

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
  const [activeThemeCategory, setActiveThemeCategory] = useState<ThemeCategory>('all');
  const [themeSearch, setThemeSearch] = useState<string>('');

  const activeColors = getActiveThemeColors(config);
  const contrastRatio = getContrastRatio(activeColors.primary, activeColors.bgApp);
  const isContrastPass = isAccessibleContrast(activeColors.primary, activeColors.bgApp, 4.5);

  const handleModeChange = (mode: AppearanceMode) => {
    const updated = { ...config, mode };
    onChange(updated);
    applyThemeToDom(updated);
  };

  const handleFontFamilyChange = (fontFamily: FontFamilyOption) => {
    const updated = { ...config, fontFamily };
    onChange(updated);
    applyThemeToDom(updated);
  };

  const handlePresetChange = (preset: ThemePresetId) => {
    const updated = { ...config, preset, customPrimaryAccent: undefined, customSecondaryAccent: undefined };
    setCustomPrimary('');
    setCustomSecondary('');
    onChange(updated);
    applyThemeToDom(updated);
    soundEffects.playThemeJingle(preset);
  };

  const handleSelectCharacter = (charId: AnimeCharacterId) => {
    soundEffects.playPop();
    const updated = { ...config, selectedCharacter: charId };
    onChange(updated);
    applyThemeToDom(updated);
  };

  const handleRandomTheme = () => {
    soundEffects.playDiceRoll();
    const presetKeys = Object.keys(THEME_PRESETS) as ThemePresetId[];
    const randomPreset = presetKeys[Math.floor(Math.random() * presetKeys.length)];
    handlePresetChange(randomPreset);
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="text-xs font-bold">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
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

      {/* 2. Anime & Cartoon Hero Companion Selector */}
      <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-lg">🎎</span>
              <span>Anime &amp; Cartoon Companion Hero</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your anime coding companion! They cheer you on the dashboard, workspace, and contests!
            </p>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            12 Selectable Heroes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ANIME_CHARACTERS.map((char) => {
            const isSelected = (config.selectedCharacter || 'climby') === char.id;
            const CharComp = char.component;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleSelectCharacter(char.id)}
                className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/60 shadow-lg ring-2 ring-indigo-500/40 scale-105'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white font-black text-[9px] shadow-sm uppercase">
                    Active
                  </span>
                )}
                <div className="my-1">
                  <CharComp size={64} />
                </div>
                <span className="text-xs font-extrabold text-white mt-1 block line-clamp-1">
                  {char.avatarEmoji} {char.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-indigo-300/80 block line-clamp-1">
                  {char.animeGenre}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Theme Presets (40 Types with Scenery & Animation) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>40 Beautiful Realms &amp; Environments</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Explore mountains, beaches, railways, waterfalls, roads, villages, sci-fi starships, and fighting coliseums!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomTheme}
              className="flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>🎲</span>
              <span>Surprise Me</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('appearance.reset_theme')}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {THEME_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveThemeCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeThemeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <span>{cat.icon} {cat.label}</span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search 40 themes..."
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {themeSearch && (
              <button
                type="button"
                onClick={() => setThemeSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[640px] overflow-y-auto pr-1">
          {(Object.keys(THEME_PRESETS) as ThemePresetId[])
            .filter((presetId) => {
              const meta = THEME_METADATA[presetId];
              const preset = THEME_PRESETS[presetId];
              if (activeThemeCategory !== 'all' && meta?.category !== activeThemeCategory) {
                return false;
              }
              if (themeSearch.trim()) {
                const query = themeSearch.toLowerCase();
                const matchName = preset.name.toLowerCase().includes(query);
                const matchDesc = preset.description.toLowerCase().includes(query);
                const matchId = presetId.toLowerCase().includes(query);
                return matchName || matchDesc || matchId;
              }
              return true;
            })
            .map((presetId) => {
            const preset = THEME_PRESETS[presetId];
            const meta = THEME_METADATA[presetId];
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
                      <span className="text-xs">{meta?.icon || '▲'}</span>
                      <span className="text-[9px] font-bold" style={{ color: colors.textMain }}>
                        {preset.name.replace(/[^\w\s]/g, '').trim().slice(0, 14)}
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
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{preset.name}</span>
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('appearance.custom_accent')}</label>
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
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('appearance.custom_secondary')}</label>
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
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Used for progress bars, secondary badges, and hint highlights.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Stylish Font Family & Typography */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" />
            <span>{t('appearance.font_family')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t('appearance.font_family_desc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(FONT_FAMILIES) as FontFamilyOption[]).map((fontKey) => {
            const fontItem = FONT_FAMILIES[fontKey];
            const isSelected = (config.fontFamily || 'outfit') === fontKey;
            return (
              <button
                key={fontKey}
                type="button"
                onClick={() => handleFontFamilyChange(fontKey)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold">{fontItem.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{fontItem.description}</p>
                <div
                  className="w-full mt-auto pt-2 pb-1.5 px-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-semibold text-indigo-300 tracking-tight"
                  style={{ fontFamily: fontItem.family }}
                >
                  {fontItem.sample} • Aa Bb Gg 1600
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Layout & Typography Tokens */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Interface Geometry & Typography Scaling</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Interface Density */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('appearance.density')}</label>
            <select
              value={config.density}
              onChange={(e) => {
                const updated = { ...config, density: e.target.value as InterfaceDensity };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="compact">{t('appearance.density_compact')}</option>
              <option value="comfortable">{t('appearance.density_comfortable')}</option>
              <option value="spacious">{t('appearance.density_spacious')}</option>
            </select>
          </div>

          {/* Border Radius */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('appearance.radius')}</label>
            <select
              value={config.borderRadius}
              onChange={(e) => {
                const updated = { ...config, borderRadius: e.target.value as BorderRadiusOption };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="compact">{t('appearance.radius_compact')}</option>
              <option value="standard">{t('appearance.radius_standard')}</option>
              <option value="rounded">{t('appearance.radius_rounded')}</option>
            </select>
          </div>

          {/* Font Scale */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('appearance.font_size')}</label>
            <select
              value={config.fontSize}
              onChange={(e) => {
                const updated = { ...config, fontSize: e.target.value as FontScaleOption };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="small">{t('appearance.font_size_small')}</option>
              <option value="standard">{t('appearance.font_size_standard')}</option>
              <option value="large">{t('appearance.font_size_large')}</option>
              <option value="extra-large">{t('appearance.font_size_xlarge')}</option>
            </select>
          </div>

          {/* Animation Intensity */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('appearance.animation')}</label>
            <select
              value={config.animationIntensity}
              onChange={(e) => {
                const updated = { ...config, animationIntensity: e.target.value as any };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="full">{t('appearance.animation_full')}</option>
              <option value="reduced">{t('appearance.animation_reduced')}</option>
              <option value="off">{t('appearance.animation_off')}</option>
            </select>
          </div>

          {/* Transparency */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('appearance.transparency')}</label>
            <select
              value={config.transparency}
              onChange={(e) => {
                const updated = { ...config, transparency: e.target.value as any };
                onChange(updated);
                applyThemeToDom(updated);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="normal">{t('appearance.transparency_normal')}</option>
              <option value="reduced">{t('appearance.transparency_reduced')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. Live Theme Preview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>{t('appearance.preview_title')}</span>
        </h3>

        <div
          className="p-5 rounded-2xl border transition-all"
          style={{
            backgroundColor: activeColors.bgSurface,
            borderColor: activeColors.border,
            color: activeColors.textMain,
            fontFamily: getFontFamilyStack(config.fontFamily || 'outfit'),
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: activeColors.borderSubtle }}>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: activeColors.primary }}
              />
              <span className="font-bold text-xs">Simulated Problem Card</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                {FONT_FAMILIES[config.fontFamily || 'outfit']?.name || 'Outfit'}
              </span>
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

      {/* 7. Joyful & Playful UI Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-base">🎉</span>
            <span>Joyful &amp; Playful UI Controls</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Customize the funny themes, sound effects, mascot companions, and joyful animations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sound FX Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">🎵 Theme Sound Effects</span>
              <span className="text-[10px] text-slate-400">Playful chimes on clicks &amp; solves</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = config.funnyThemeSounds === false ? true : false;
                const updated = { ...config, funnyThemeSounds: nextVal };
                onChange(updated);
                applyThemeToDom(updated);
                if (nextVal) soundEffects.playVictory();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.funnyThemeSounds !== false ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  config.funnyThemeSounds !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Background Sparkles & Orbs */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">✨ Ambient Glow &amp; Orbs</span>
              <span className="text-[10px] text-slate-400">Floating themed background aura</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = config.backgroundSparkles === false ? true : false;
                const updated = { ...config, backgroundSparkles: nextVal };
                onChange(updated);
                applyThemeToDom(updated);
                soundEffects.playPop();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.backgroundSparkles !== false ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  config.backgroundSparkles !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mascot Companion */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">🤖 Mascot Companion</span>
              <span className="text-[10px] text-slate-400">Yeti, Cat &amp; Sloth banter quotes</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = config.playfulMascot === false ? true : false;
                const updated = { ...config, playfulMascot: nextVal };
                onChange(updated);
                applyThemeToDom(updated);
                soundEffects.playPop();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.playfulMascot !== false ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  config.playfulMascot !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
