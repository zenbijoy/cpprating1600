import React, { useState } from 'react';
import {
  MascotClimby,
  MascotByteCat,
  MascotCoffeeSloth,
  MascotBigBrain,
  FunnyStickerBadge,
  FUNNY_QUOTES,
  StickerType,
} from './assets/MascotAndStickers';
import { soundEffects } from '../utils/soundEffects';
import { ThemePresetId } from '../types/settings';
import { storageService } from '../services/storage';
import { applyThemeToDom } from '../utils/themeEngine';
import { CardVariant, FunCard } from './common/CardBackgrounds';

interface JoyfulDashboardBannerProps {
  currentRating: number;
  targetRating: number;
  streakDays: number;
  totalSolved: number;
  onStartChallenge: () => void;
  onSpinSurprise: () => void;
  onOpenSettingsTheme?: () => void;
}

export const JoyfulDashboardBanner: React.FC<JoyfulDashboardBannerProps> = ({
  currentRating,
  targetRating,
  streakDays,
  totalSolved,
  onStartChallenge,
  onSpinSurprise,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeMood, setActiveMood] = useState<'beast' | 'caffeinated' | 'chill' | 'galaxy'>('beast');
  const [activeSticker, setActiveSticker] = useState<StickerType>('speedrun_1600');

  const currentQuote = FUNNY_QUOTES[quoteIndex % FUNNY_QUOTES.length];

  const handleNextJoke = () => {
    soundEffects.playDiceRoll();
    setQuoteIndex((prev) => (prev + 1) % FUNNY_QUOTES.length);
  };

  const moods: {
    id: 'beast' | 'caffeinated' | 'chill' | 'galaxy';
    label: string;
    emoji: string;
    badge: StickerType;
    cardVariant: CardVariant;
  }[] = [
    { id: 'beast', label: 'Beast Mode', emoji: '🔥', badge: '1000_iq', cardVariant: 'fire' },
    { id: 'caffeinated', label: 'Caffeinated', emoji: '☕', badge: 'coffee_power', cardVariant: 'coffee' },
    { id: 'chill', label: 'Chill & Steady', emoji: '🧋', badge: 'zero_bugs', cardVariant: 'candy' },
    { id: 'galaxy', label: '1600 Speedrun', emoji: '🚀', badge: 'speedrun_1600', cardVariant: 'cosmic' },
  ];

  const currentMoodObj = moods.find((m) => m.id === activeMood) || moods[0];

  const handleMoodSelect = (mood: typeof moods[0]) => {
    soundEffects.playPop();
    setActiveMood(mood.id);
    setActiveSticker(mood.badge);
  };

  // Quick theme swapper options
  const quickThemes: { id: ThemePresetId; label: string; emoji: string }[] = [
    { id: 'climb-default', label: 'Signature Indigo', emoji: '🏔️' },
    { id: 'cyber-matrix', label: 'Cyber 1337', emoji: '👾' },
    { id: 'candy-pop', label: 'Candy Pop', emoji: '🍭' },
    { id: 'kawaii-anime', label: 'Kawaii Neko', emoji: '🌸' },
    { id: 'retro-arcade', label: '80s Arcade', emoji: '🕹️' },
    { id: 'galaxy-space', label: 'Galaxy Space', emoji: '🚀' },
    { id: 'jungle-safari', label: 'Jungle Safari', emoji: '🌴' },
    { id: 'coffee-overdrive', label: 'Coffee Rush', emoji: '☕' },
    { id: 'dragon-fire', label: 'Dragon Slayer', emoji: '🔥' },
  ];

  const currentThemeId = storageService.getSettings()?.theme?.preset || 'climb-default';

  const handleCycleTheme = () => {
    const currentIndex = quickThemes.findIndex((t) => t.id === currentThemeId);
    const nextTheme = quickThemes[(currentIndex + 1) % quickThemes.length];
    const settings = storageService.getSettings();
    const updated = {
      ...settings,
      theme: {
        ...settings.theme,
        preset: nextTheme.id,
      },
    };
    storageService.saveSettings(updated);
    applyThemeToDom(updated.theme);
    soundEffects.playThemeJingle(nextTheme.id);
  };

  const ratingProgress = Math.min(100, Math.round((currentRating / targetRating) * 100));

  return (
    <FunCard
      variant={currentMoodObj.cardVariant}
      className="p-6 sm:p-8 shadow-xl"
    >
      {/* Top Bar: Spacious Mood Bar & One-Click Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-white/15">
        {/* Mood Selector Chips with Spacious Gaps */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300 select-none mr-0.5">
            Vibe:
          </span>
          {moods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleMoodSelect(m)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeMood === m.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                  : 'bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <span className="text-sm">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Theme Switcher Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCycleTheme}
            title="Cycle joyful themes instantly"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          >
            <span className="text-sm">🎨</span>
            <span>Switch Theme:</span>
            <span className="underline underline-offset-2">
              {quickThemes.find((t) => t.id === currentThemeId)?.label || 'Playful'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Banner Grid: Mascot (Left) + Stats & Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
        {/* LEFT: Mascot with Comic Speech Bubble */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Mascot Art based on mood */}
          <div className="shrink-0 relative">
            <div className="p-1 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/20">
              {activeMood === 'beast' && <MascotClimby size={120} />}
              {activeMood === 'caffeinated' && <MascotCoffeeSloth size={120} />}
              {activeMood === 'chill' && <MascotByteCat size={120} />}
              {activeMood === 'galaxy' && <MascotBigBrain size={120} />}
            </div>

            {/* Sticker on Mascot */}
            <div className="absolute -bottom-3 -right-3">
              <FunnyStickerBadge type={activeSticker} tilt={6} />
            </div>
          </div>

          {/* Speech Bubble with Less Text and More Visual Punch */}
          <div className="flex-1 relative bg-white/90 dark:bg-slate-800/90 border-2 border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-4 sm:p-5 shadow-md space-y-2.5">
            {/* Bubble arrow pointing to mascot */}
            <div className="hidden sm:block absolute -left-2.5 top-8 w-4 h-4 bg-white/90 dark:bg-slate-800 border-l-2 border-b-2 border-indigo-200/80 dark:border-indigo-800 transform rotate-45" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-cyan-400">
                <span className="text-base">{currentQuote.moodEmoji}</span>
                <span>{currentQuote.author}</span>
              </div>
              <button
                type="button"
                onClick={handleNextJoke}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
              >
                <span>🎲</span>
                <span>Next Joke</span>
              </button>
            </div>

            <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              &ldquo;{currentQuote.quote}&rdquo;
            </p>

            <div className="flex items-center gap-3 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black text-xs">
                🎯 {Math.max(0, targetRating - currentRating)} pts to 1600
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Punchy Visual Stats & Spacious Action Launchers */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 dark:border-slate-700/60 shadow-sm">
          {/* Quick Stat Capsules */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Rating
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {currentRating}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block mb-0.5">
                🔥 Streak
              </span>
              <span className="text-2xl font-black text-amber-500 font-mono">
                {streakDays}d
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block mb-0.5">
                Solved
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {totalSolved}
              </span>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-black text-slate-600 dark:text-slate-300">
              <span>Path to 1600 Specialist</span>
              <span className="text-indigo-600 dark:text-cyan-400 font-mono">{ratingProgress}%</span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${ratingProgress}%` }}
              />
            </div>
          </div>

          {/* Spacious Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                soundEffects.playVictory();
                onStartChallenge();
              }}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-base">⚡</span>
              <span>Daily Mission</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playDiceRoll();
                onSpinSurprise();
              }}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-base">🎡</span>
              <span>Surprise Solve</span>
            </button>
          </div>
        </div>
      </div>
    </FunCard>
  );
};
