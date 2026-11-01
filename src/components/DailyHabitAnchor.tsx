import React, { useState, useEffect } from 'react';
import { gameRewardService, DailyFortune } from '../services/gameRewardService';
import { soundEffects } from '../utils/soundEffects';
import { storageService } from '../services/storage';
import { ANIME_CHARACTERS } from './assets/MascotAndStickers';
import { AnimeCharacterId } from '../types/settings';
import { FunCard } from './common/CardBackgrounds';

interface DailyHabitAnchorProps {
  currentRating: number;
  targetRating: number;
  streakDays: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  solvedCountToday: number;
  mistakesDueCount: number;
  onOpen5MinWarmup: () => void;
  onSelectProblem: () => void;
  onOpenMistakeReview: () => void;
  onOpenDailyLogin: () => void;
  onOpenFortuneModal: () => void;
  onOpenRoulette: () => void;
  onOpenArcade: () => void;
  onTriggerConfetti?: () => void;
}

export const DailyHabitAnchor: React.FC<DailyHabitAnchorProps> = ({
  currentRating,
  targetRating,
  streakDays,
  todayMinutes,
  dailyGoalMinutes,
  solvedCountToday,
  mistakesDueCount,
  onOpen5MinWarmup,
  onSelectProblem,
  onOpenMistakeReview,
  onOpenDailyLogin,
  onOpenFortuneModal,
  onOpenRoulette,
  onOpenArcade,
  onTriggerConfetti,
}) => {
  const [fortune, setFortune] = useState<DailyFortune>(() => gameRewardService.getDailyFortune());
  const [hasClaimedDaily, setHasClaimedDaily] = useState<boolean>(() => gameRewardService.hasClaimedDailyToday());
  const [hasPetMascot, setHasPetMascot] = useState<boolean>(() => gameRewardService.hasPetMascotToday());
  const [mascotBubble, setMascotBubble] = useState<string>('Hey code champion! Tap me for good luck! ✨');
  const [isPetting, setIsPetting] = useState<boolean>(false);
  const [activeBounty, setActiveBounty] = useState(() => gameRewardService.getActiveSpunBounty());

  const selectedCharId: AnimeCharacterId =
    storageService.getSettings()?.theme?.selectedCharacter || 'climby';
  const charMeta =
    ANIME_CHARACTERS.find((c) => c.id === selectedCharId) || ANIME_CHARACTERS[0];

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setFortune(gameRewardService.getDailyFortune());
      setHasClaimedDaily(gameRewardService.hasClaimedDailyToday());
      setHasPetMascot(gameRewardService.hasPetMascotToday());
      setActiveBounty(gameRewardService.getActiveSpunBounty());
    });
  }, []);

  // Today's 3-Step Habit Loop Evaluation
  const step1Done = todayMinutes >= 5;
  const step2Done = solvedCountToday > 0;
  const step3Done = mistakesDueCount === 0 || todayMinutes >= dailyGoalMinutes;

  const completedStepsCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const allHabitsDone = completedStepsCount === 3;

  const handlePetMascot = () => {
    setIsPetting(true);
    soundEffects.playUwUHooray();
    const res = gameRewardService.petMascot();
    setMascotBubble(res.message);
    if (res.isFirstPetToday) {
      onTriggerConfetti?.();
    }
    setTimeout(() => setIsPetting(false), 500);
  };

  return (
    <FunCard
      variant="cosmic"
      className="p-5 sm:p-7 shadow-2xl relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-500/40 space-y-6 sm:space-y-7"
    >
      {/* Ambient background glow */}
      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      {/* Top Banner Row: Habit Addiction Title, Streak Flame, Mascot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-200/60 dark:border-white/15">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/30 shrink-0 animate-bounce-subtle">
            🔥
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight">
                Daily Habit Supercharge
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 uppercase">
                Healthy Addiction Loop
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-indigo-200/90 font-medium">
              3 daily rituals to reach Codeforces 1600.
            </p>
          </div>
        </div>

        {/* Streak & Freeze Status Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-amber-300 dark:border-amber-400/40 shadow-xs dark:shadow-inner">
            <span className="text-xl animate-flame">🔥</span>
            <div>
              <div className="text-xs font-black text-amber-600 dark:text-amber-300">
                {streakDays} DAY STREAK
              </div>
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <span>🛡️</span>
                <span>Streak Freeze Active</span>
              </div>
            </div>
          </div>

          {/* Interactive Mascot High-Five Station */}
          <div
            onClick={handlePetMascot}
            className={`flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-white dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-400/40 cursor-pointer transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/60 active:scale-95 shadow-xs dark:shadow-md ${
              isPetting ? 'scale-110' : ''
            }`}
            title="Click to pet your mascot and receive daily cheer & +5 Love XP!"
          >
            <span className="text-2xl select-none">{charMeta.avatarEmoji}</span>
            <div className="text-left">
              <div className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase">
                {charMeta.name.split(' ')[0]}
              </div>
              <div className="text-[9px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-0.5">
                <span>{hasPetMascot ? '❤️ Happy' : '🐾 Pat me!'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mascot Speech Bubble */}
      <div className="p-3 rounded-xl bg-white/95 dark:bg-slate-950/60 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-2 text-xs text-slate-700 dark:text-indigo-200 shadow-xs">
        <span className="text-base shrink-0">💬</span>
        <span className="italic flex-1">{mascotBubble}</span>
      </div>

      {/* =========================================================================
          THE 3-STEP DAILY RITUAL (The Core Healthy Habit Engine)
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-indigo-200">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <span>⚡ TODAY'S HABIT RITUAL</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono">({completedStepsCount}/3 Completed)</span>
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300">
            {allHabitsDone ? '🎉 All done today!' : 'Complete all 3 to keep momentum!'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* STEP 1: 5-Minute Warmup */}
          <div
            className={`p-4.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
              step1Done
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
                : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-400/60 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center border border-amber-400/30">
                  1
                </span>
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">
                  ⚡ 5-Min Warmup
                </span>
              </div>
              {step1Done ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/40">
                  ✓ DONE ({todayMinutes}m)
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {todayMinutes}/5 min
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              Solve 1 quick warm-up or code for 5 mins.
            </p>

            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpen5MinWarmup();
              }}
              className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                step1Done
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              }`}
            >
              {step1Done ? '⚡ Warmup Done' : '⚡ Start 5-Min Warmup'}
            </button>
          </div>

          {/* STEP 2: Core Algorithm Problem */}
          <div
            className={`p-4.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
              step2Done
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
                : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-indigo-400/60 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-400/30">
                  2
                </span>
                <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300">
                  ⚔️ Solve 1 Problem
                </span>
              </div>
              {step2Done ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/40">
                  ✓ SOLVED
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Rating ~{currentRating + 100}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              Solve today's adaptive problem with hints.
            </p>

            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onSelectProblem();
              }}
              className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                step2Done
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-200 border border-emerald-400/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }`}
            >
              {step2Done ? '⚔️ Problem Solved' : '⚔️ Solve Problem'}
            </button>
          </div>

          {/* STEP 3: Mistake Autopsy / Flashcard */}
          <div
            className={`p-4.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
              step3Done
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
                : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-purple-400/60 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-400 font-black text-xs flex items-center justify-center border border-purple-400/30">
                  3
                </span>
                <span className="text-xs font-black uppercase text-purple-700 dark:text-purple-300">
                  📜 Purify 1 Bug
                </span>
              </div>
              {step3Done ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/40">
                  ✓ IMMUNIZED
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {mistakesDueCount} due
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              Review 1 mistake flashcard to avoid errors.
            </p>

            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpenMistakeReview();
              }}
              className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                step3Done
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-200 border border-emerald-400/40'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
              }`}
            >
              {step3Done ? '📜 Mistake Reviewed' : '📜 Review Mistake'}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4 DAILY ATTRACTION STATIONS (Fortune, Login Gifts, Spinner, Arcade)
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5 pt-4 sm:pt-5 border-t border-indigo-100/60 dark:border-white/10">
        {/* 1. Daily Fortune Cookie */}
        <div
          onClick={() => {
            soundEffects.playSparkle();
            onOpenFortuneModal();
          }}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs ${
            fortune.cracked
              ? 'bg-white dark:bg-slate-950/70 border-purple-200 dark:border-purple-500/40 hover:border-purple-400'
              : 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/80 dark:to-slate-950 border-purple-300 dark:border-purple-400/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-300 dark:ring-purple-400/40 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🥠</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase">
              {fortune.cracked ? 'CRACKED' : 'READY!'}
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
              {fortune.cracked ? fortune.luckyConcept : "Code Prophecy"}
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold truncate">
              {fortune.cracked ? `Buff: ${fortune.powerBuff.title}` : 'Tap to crack (+50🪙)'}
            </div>
          </div>
        </div>

        {/* 2. Daily Login Bounty */}
        <div
          onClick={() => {
            soundEffects.playPop();
            onOpenDailyLogin();
          }}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs ${
            hasClaimedDaily
              ? 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
              : 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/80 dark:to-slate-950 border-amber-300 dark:border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-300 dark:ring-amber-400 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎁</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">
              {hasClaimedDaily ? 'CLAIMED' : 'NEW GIFT!'}
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xs font-black text-slate-900 dark:text-white">
              Daily Login
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate">
              {hasClaimedDaily ? 'Claimed today' : 'Claim daily reward'}
            </div>
          </div>
        </div>

        {/* 3. Spinner Bounty */}
        <div
          onClick={() => {
            soundEffects.playPop();
            onOpenRoulette();
          }}
          className="p-4 rounded-2xl border border-pink-200 dark:border-pink-500/40 bg-white dark:bg-slate-950/70 hover:border-pink-400 text-left cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎡</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 uppercase">
              {activeBounty ? 'ACTIVE BOUNTY' : 'SPIN'}
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
              Wheel of Destiny
            </div>
            <div className="text-[11px] text-pink-700 dark:text-pink-300 font-semibold truncate">
              {activeBounty ? activeBounty.problem.name : 'Spin for rewards'}
            </div>
          </div>
        </div>

        {/* 4. Logic Arcade Games */}
        <div
          onClick={() => {
            soundEffects.playPop();
            onOpenArcade();
          }}
          className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/40 bg-white dark:bg-slate-950/70 hover:border-indigo-400 text-left cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🕹️</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 uppercase">
              ARCADE
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
              Logic Mini-Games
            </div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold truncate">
              Play for rewards
            </div>
          </div>
        </div>
      </div>
    </FunCard>
  );
};
