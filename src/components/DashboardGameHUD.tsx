import React, { useState, useMemo, useEffect } from 'react';
import {
  AnimeCharacterId,
  ThemePresetId,
} from '../types/settings';
import { storageService } from '../services/storage';
import { gameRewardService } from '../services/gameRewardService';
import { applyThemeToDom, THEME_METADATA, THEME_PRESETS } from '../utils/themeEngine';
import {
  AnimeCharacterSprite,
  ANIME_CHARACTERS,
  FunnyStickerBadge,
} from './assets/MascotAndStickers';
import { CuteCharactersModal } from './CuteCharactersModal';
import { AnimatedThemeShowcaseModal } from './AnimatedThemeShowcaseModal';
import { soundEffects } from '../utils/soundEffects';
import { FunCard } from './common/CardBackgrounds';

interface DailyQuest {
  id: string;
  icon: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  rewardXp: number;
  rewardCoins: number;
  claimed: boolean;
}

interface DashboardGameHUDProps {
  currentRating: number;
  targetRating: number;
  streakDays: number;
  totalSolved: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  mistakesCount: number;
  onSelectProblem?: () => void;
  onOpenRoulette?: () => void;
  onOpenDailyLogin?: () => void;
  onOpenArcade?: () => void;
  onTriggerConfetti?: () => void;
}

export const DashboardGameHUD: React.FC<DashboardGameHUDProps> = ({
  currentRating,
  targetRating,
  streakDays,
  totalSolved,
  todayMinutes,
  dailyGoalMinutes,
  mistakesCount,
  onSelectProblem,
  onOpenRoulette,
  onOpenDailyLogin,
  onOpenArcade,
  onTriggerConfetti,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<AnimeCharacterId>(() => {
    return storageService.getSettings()?.theme?.selectedCharacter || 'climby';
  });

  const [activeTheme, setActiveTheme] = useState<ThemePresetId>(() => {
    return storageService.getSettings()?.theme?.preset || 'climb-default';
  });

  const [showCharacterModal, setShowCharacterModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [coins, setCoins] = useState<number>(() => gameRewardService.getCoins());
  const [hasUnclaimedDaily, setHasUnclaimedDaily] = useState<boolean>(() => !gameRewardService.hasClaimedDailyToday());

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setCoins(gameRewardService.getCoins());
      setHasUnclaimedDaily(!gameRewardService.hasClaimedDailyToday());
    });
  }, []);

  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`climb1600_quests_${today}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate RPG Level & Class
  const playerLevel = Math.max(1, Math.floor((currentRating - 600) / 50) + 1);
  const levelProgress = Math.min(100, Math.max(0, ((currentRating % 50) / 50) * 100));

  const playerClass = useMemo(() => {
    if (currentRating >= 1600) return '👑 Grandmaster Specialist';
    if (currentRating >= 1400) return '⚔️ Candidate Specialist';
    if (currentRating >= 1200) return '🏔️ Pupil Spellblade';
    if (currentRating >= 1000) return '🏝️ Modulo Adventurer';
    return '🍉 Novice Code Warrior';
  }, [currentRating]);

  // Daily RPG Quests
  const quests: DailyQuest[] = [
    {
      id: 'quest_grind',
      icon: '⏱️',
      title: 'Daily Stamina Workout',
      target: dailyGoalMinutes,
      current: Math.min(todayMinutes, dailyGoalMinutes),
      unit: 'min',
      rewardXp: 80,
      rewardCoins: 50,
      claimed: !!claimedQuests['quest_grind'],
    },
    {
      id: 'quest_solve',
      icon: '⚔️',
      title: 'Defeat Algorithm Monster',
      target: 2,
      current: Math.min(2, totalSolved > 0 ? 1 : 0),
      unit: 'solves',
      rewardXp: 100,
      rewardCoins: 75,
      claimed: !!claimedQuests['quest_solve'],
    },
    {
      id: 'quest_review',
      icon: '📜',
      title: 'Grimoire Bug Purification',
      target: 1,
      current: mistakesCount > 0 ? 1 : 0,
      unit: 'reviewed',
      rewardXp: 60,
      rewardCoins: 40,
      claimed: !!claimedQuests['quest_review'],
    },
  ];

  const handleClaimQuest = (quest: DailyQuest) => {
    soundEffects.playVictory();
    onTriggerConfetti?.();
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...claimedQuests, [quest.id]: true };
    setClaimedQuests(updated);
    localStorage.setItem(`climb1600_quests_${today}`, JSON.stringify(updated));

    gameRewardService.addCoins(quest.rewardCoins, quest.title);
  };

  const handleSelectCharacter = (charId: AnimeCharacterId) => {
    soundEffects.playPop();
    setSelectedCharacter(charId);
    const settings = storageService.getSettings();
    const updated = {
      ...settings,
      theme: {
        ...settings.theme,
        selectedCharacter: charId,
      },
    };
    storageService.saveSettings(updated);
    setShowCharacterModal(false);
  };

  const handleSelectTheme = (presetId: ThemePresetId) => {
    soundEffects.playThemeJingle(presetId);
    setActiveTheme(presetId);
    const settings = storageService.getSettings();
    const updated = {
      ...settings,
      theme: {
        ...settings.theme,
        preset: presetId,
      },
    };
    storageService.saveSettings(updated);
    applyThemeToDom(updated.theme);
    setShowThemeModal(false);
  };

  const handleRandomTheme = () => {
    soundEffects.playDiceRoll();
    const presetKeys = Object.keys(THEME_PRESETS) as ThemePresetId[];
    const random = presetKeys[Math.floor(Math.random() * presetKeys.length)];
    handleSelectTheme(random);
  };

  const currentThemeMeta = THEME_METADATA[activeTheme] || {
    icon: '🏔️',
    category: 'nature',
    ambientTitle: 'CLIMB World',
  };

  const currentCharMeta =
    ANIME_CHARACTERS.find((c) => c.id === selectedCharacter) || ANIME_CHARACTERS[0];

  const staminaPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyGoalMinutes)) * 100));
  const manaPercent = Math.min(100, Math.round(streakDays * 14)); // 7 days = ~100%

  return (
    <div className="space-y-4">
      {/* =====================================================================
          1. TOP GAME HUD HEADER (Status Bar, Class, EXP, Companion, Coins)
          ===================================================================== */}
      <FunCard
        variant="cosmic"
        className="p-5 sm:p-7 shadow-2xl relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-500/40"
      >
        {/* Game UI Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-indigo-200/60 dark:border-white/15">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/25 select-none animate-bounce-subtle">
              🎮
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs">
                  LVL {playerLevel}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                  {playerClass}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-indigo-200/90 font-medium mt-0.5">
                Current Realm: <span className="font-bold text-amber-700 dark:text-amber-300">{currentThemeMeta.icon} {THEME_PRESETS[activeTheme]?.name || 'Realm'}</span>
              </p>
            </div>
          </div>

          {/* Quick HUD Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenRoulette && (
              <button
                type="button"
                onClick={onOpenRoulette}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 dark:bg-pink-500/25 dark:hover:bg-pink-500/40 border border-pink-300 dark:border-pink-400/40 text-pink-800 dark:text-pink-200 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs animate-bounce-subtle"
                title="Spin the Problem Wheel for rewards and mystery gifts"
              >
                <span>🎡</span>
                <span>Spin Wheel</span>
              </button>
            )}

            {onOpenDailyLogin && (
              <button
                type="button"
                onClick={onOpenDailyLogin}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs ${
                  hasUnclaimedDaily
                    ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/35 dark:hover:bg-amber-500/50 border border-amber-300 dark:border-amber-400 text-amber-800 dark:text-amber-200 animate-pulse'
                    : 'bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Everyday login rewards calendar & CS lore"
              >
                <span>🎁</span>
                <span>Daily Gifts</span>
                {hasUnclaimedDaily && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
              </button>
            )}

            {onOpenArcade && (
              <button
                type="button"
                onClick={onOpenArcade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/25 dark:hover:bg-indigo-500/40 border border-indigo-300 dark:border-indigo-400/40 text-indigo-800 dark:text-indigo-200 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs"
                title="3 Funny Logic Games (Pattern Lab, Byte City, Bug Dungeon)"
              >
                <span>🎮</span>
                <span>3 Games</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCharacterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/35 border border-purple-300 dark:border-purple-400/30 text-purple-800 dark:text-purple-200 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Change anime companion"
            >
              <span>{currentCharMeta.avatarEmoji}</span>
              <span>Hero: {currentCharMeta.name.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75">▼</span>
            </button>

            <button
              type="button"
              onClick={() => setShowThemeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/35 border border-cyan-300 dark:border-cyan-400/30 text-cyan-800 dark:text-cyan-200 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Change environment realm"
            >
              <span>{currentThemeMeta.icon}</span>
              <span>Realm (40)</span>
              <span className="text-[10px] opacity-75">▼</span>
            </button>

            <button
              type="button"
              onClick={handleRandomTheme}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/25 dark:hover:bg-amber-500/40 border border-amber-300 dark:border-amber-400/40 text-amber-800 dark:text-amber-300 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Roll a random environment theme"
            >
              <span>🎲</span>
              <span>Surprise</span>
            </button>
          </div>
        </div>

        {/* Central HUD Grid: Hero Sprite + RPG Vitals + Loot Pouch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Hero Sprite with Live Anime Dialogue */}
          <div className="lg:col-span-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <AnimeCharacterSprite
                characterId={selectedCharacter}
                size={110}
                showQuote={true}
                className="drop-shadow-xl"
              />
              <button
                type="button"
                onClick={() => setShowCharacterModal(true)}
                className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-white dark:bg-slate-900/90 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-400/40 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                Switch Hero
              </button>
            </div>

            <div className="flex-1 space-y-2 bg-white/90 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-white/10 backdrop-blur-md shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">{currentCharMeta.name}</span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{currentCharMeta.animeGenre}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-bold italic leading-relaxed">
                &ldquo;{currentCharMeta.quote}&rdquo;
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black">
                  Specialty: {currentCharMeta.title}
                </span>
              </div>
            </div>
          </div>

          {/* Player RPG Vitals (HP Stamina, MP Mana, EXP Bar) */}
          <div className="lg:col-span-7 space-y-3.5 bg-white/90 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-white/10 backdrop-blur-md shadow-xs">
            {/* EXP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <span>⭐ EXP TO NEXT LEVEL</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">({currentRating} / {currentRating + (50 - (currentRating % 50))} pts)</span>
                </span>
                <span className="font-mono text-amber-700 dark:text-amber-300">{levelProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-amber-300 dark:border-amber-400/30">
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-xs shadow-amber-400/50"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            {/* HP Stamina & MP Mana Dual Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* HP Stamina */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-emerald-300 dark:border-emerald-500/30 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                  <span>💚 STAMINA (Practice)</span>
                  <span className="font-mono">{todayMinutes}m / {dailyGoalMinutes}m</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${staminaPercent}%` }}
                  />
                </div>
              </div>

              {/* MP Mana */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-blue-300 dark:border-blue-500/30 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-black text-blue-700 dark:text-blue-400">
                  <span>🔷 MANA (Streak Power)</span>
                  <span className="font-mono">{streakDays} Days</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${manaPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Loot & Inventory Pouch */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-xs font-black">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <span>🪙</span>
                  <span>{coins.toLocaleString()} CF Coins</span>
                </span>
                <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                  <span>💎</span>
                  <span>{totalSolved * 10} Algo Crystals</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {Math.max(0, targetRating - currentRating)} rating points to Boss Level 1600
              </span>
            </div>
          </div>
        </div>
      </FunCard>

      {/* =====================================================================
          2. GUILD QUEST BOARD (Interactive Daily RPG Quests)
          ===================================================================== */}
      <FunCard
        variant="sunset"
        className="p-5 sm:p-6 shadow-xl border-amber-400/40"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-300/30 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Adventurer&apos;s Guild: Daily Quests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete daily trials to earn XP, coins, and competitive strength!
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
            Resets Midnight
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {quests.map((q) => {
            const isDone = q.current >= q.target;
            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  q.claimed
                    ? 'bg-emerald-500/10 border-emerald-500/30 opacity-80'
                    : isDone
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-400/30'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-lg">{q.icon}</span>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {q.current} / {q.target} {q.unit}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {q.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      +{q.rewardXp} XP
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                      +{q.rewardCoins} 🪙
                    </span>
                  </div>
                </div>

                {q.claimed ? (
                  <div className="w-full py-1.5 text-center text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 rounded-lg select-none">
                    ✓ Quest Claimed!
                  </div>
                ) : isDone ? (
                  <button
                    type="button"
                    onClick={() => handleClaimQuest(q)}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer animate-pulse"
                  >
                    🎉 Claim Reward!
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSelectProblem}
                    className="w-full py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Start Mission →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </FunCard>

      {/* =====================================================================
          3. CUTE CHARACTERS & HERO COMPANION MODAL
          ===================================================================== */}
      <CuteCharactersModal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* =====================================================================
          4. ANIMATED WORLD REALM PALACE MODAL (40 Animated Worlds)
          ===================================================================== */}
      <AnimatedThemeShowcaseModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
};
