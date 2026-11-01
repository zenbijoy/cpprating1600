import React, { useState, useEffect } from 'react';
import { gameRewardService, DailyFortune } from '../services/gameRewardService';
import { soundEffects } from '../utils/soundEffects';
import { storageService } from '../services/storage';
import { ANIME_CHARACTERS } from './assets/MascotAndStickers';
import { AnimeCharacterId } from '../types/settings';

interface FloatingHabitCompanionProps {
  streakDays: number;
  onOpen5MinWarmup: () => void;
  onOpenDailyLogin: () => void;
  onOpenFortuneModal: () => void;
  onOpenRoulette: () => void;
  onTriggerConfetti?: () => void;
}

export const FloatingHabitCompanion: React.FC<FloatingHabitCompanionProps> = ({
  streakDays,
  onOpen5MinWarmup,
  onOpenDailyLogin,
  onOpenFortuneModal,
  onOpenRoulette,
  onTriggerConfetti,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [fortune, setFortune] = useState<DailyFortune>(() => gameRewardService.getDailyFortune());
  const [hasClaimedDaily, setHasClaimedDaily] = useState<boolean>(() => gameRewardService.hasClaimedDailyToday());
  const [hasPetMascot, setHasPetMascot] = useState<boolean>(() => gameRewardService.hasPetMascotToday());
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.isMuted());
  const [mascotBubble, setMascotBubble] = useState<string>('Climbing together today! 🐾');
  const [showHearts, setShowHearts] = useState<boolean>(false);

  const selectedCharId: AnimeCharacterId =
    storageService.getSettings()?.theme?.selectedCharacter || 'climby';
  const charMeta =
    ANIME_CHARACTERS.find((c) => c.id === selectedCharId) || ANIME_CHARACTERS[0];

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setFortune(gameRewardService.getDailyFortune());
      setHasClaimedDaily(gameRewardService.hasClaimedDailyToday());
      setHasPetMascot(gameRewardService.hasPetMascotToday());
    });
  }, []);

  const hasUnclaimedAttention = !hasClaimedDaily || !fortune.cracked;

  const handlePet = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playUwUHooray();
    setShowHearts(true);
    const res = gameRewardService.petMascot();
    setMascotBubble(res.message);
    if (res.isFirstPetToday) {
      onTriggerConfetti?.();
    }
    setTimeout(() => setShowHearts(false), 800);
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 select-none">
      {/* Floating Hearts Animation */}
      {showHearts && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xl animate-bounce pointer-events-none">
          <span>💖</span>
          <span>✨</span>
          <span>🐾</span>
        </div>
      )}

      {/* EXPANDED MENU */}
      {isExpanded ? (
        <div className="relative w-72 rounded-3xl border-2 border-indigo-500/50 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl shadow-indigo-950/80 space-y-3.5 animate-scale-up text-left">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div
              onClick={handlePet}
              className="flex items-center gap-2 cursor-pointer group"
              title="Click to pet!"
            >
              <span className="text-3xl transition-transform group-hover:scale-125">
                {charMeta.avatarEmoji}
              </span>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1">
                  <span>{charMeta.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-amber-300">🔥 {streakDays}d</span>
                </div>
                <div className="text-[9px] font-bold text-indigo-300">
                  {hasPetMascot ? '❤️ Happy Friend' : '🐾 Click to Pet'}
                </div>
              </div>
            </div>

            {/* Controls: Sound Mute + Close */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
                title={isMuted ? 'Sound Muted (Click to enable)' : 'Sound On (Click to mute)'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-slate-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Speech Bubble */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-indigo-500/30 text-xs text-indigo-200 leading-snug">
            💬 {mascotBubble}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {/* 1. Quick 5-Min Warmup */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpen5MinWarmup();
                setIsExpanded(false);
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 transition-all cursor-pointer text-left"
            >
              <span className="text-base">⚡</span>
              <span className="truncate">5-Min Start</span>
            </button>

            {/* 2. Daily Fortune Cookie */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playSparkle();
                onOpenFortuneModal();
                setIsExpanded(false);
              }}
              className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                fortune.cracked
                  ? 'bg-purple-950/40 hover:bg-purple-900/40 border-purple-500/30 text-purple-200'
                  : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400 text-white animate-pulse'
              }`}
            >
              <span className="text-base">🥠</span>
              <span className="truncate">{fortune.cracked ? 'Prophecy' : 'Crack Fortune!'}</span>
            </button>

            {/* 3. Daily Bounty */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpenDailyLogin();
                setIsExpanded(false);
              }}
              className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                hasClaimedDaily
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-400 text-amber-200 animate-pulse'
              }`}
            >
              <span className="text-base">🎁</span>
              <span className="truncate">{hasClaimedDaily ? 'Daily Gift' : 'Claim Bounty!'}</span>
            </button>

            {/* 4. Spinner Bounty */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playPop();
                onOpenRoulette();
                setIsExpanded(false);
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 transition-all cursor-pointer text-left"
            >
              <span className="text-base">🎡</span>
              <span className="truncate">Spin Wheel</span>
            </button>
          </div>
        </div>
      ) : (
        /* MINIMIZED BUBBLE */
        <div
          onClick={() => {
            soundEffects.playPop();
            setIsExpanded(true);
          }}
          className="relative group cursor-pointer"
          title={`${charMeta.name} — Click for Daily Habit Hub & Quick Actions!`}
        >
          {/* Pulsing ring if unclaimed daily tasks */}
          {hasUnclaimedAttention && (
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 opacity-75 blur-xs animate-ping pointer-events-none" />
          )}

          <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900 border-2 border-indigo-400/60 shadow-xl flex items-center justify-center text-3xl transition-transform duration-200 hover:scale-110 active:scale-95">
            <span className="select-none animate-bounce-subtle">{charMeta.avatarEmoji}</span>

            {/* Unclaimed Attention Dot */}
            {hasUnclaimedAttention && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                !
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
