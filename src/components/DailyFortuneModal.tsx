import React, { useState, useEffect } from 'react';
import {
  gameRewardService,
  DailyFortune,
} from '../services/gameRewardService';
import { soundEffects } from '../utils/soundEffects';

interface DailyFortuneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerConfetti?: () => void;
  onPracticeConcept?: (concept: string) => void;
}

export const DailyFortuneModal: React.FC<DailyFortuneModalProps> = ({
  isOpen,
  onClose,
  onTriggerConfetti,
  onPracticeConcept,
}) => {
  const [fortune, setFortune] = useState<DailyFortune>(() => gameRewardService.getDailyFortune());
  const [isCracking, setIsCracking] = useState<boolean>(false);
  const [justCracked, setJustCracked] = useState<boolean>(false);

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setFortune(gameRewardService.getDailyFortune());
    });
  }, []);

  if (!isOpen) return null;

  const handleCrackFortune = () => {
    if (fortune.cracked || isCracking) return;
    setIsCracking(true);
    soundEffects.playSparkle();

    setTimeout(() => {
      soundEffects.playStarCollect();
      onTriggerConfetti?.();
      const res = gameRewardService.crackDailyFortune();
      setFortune(res.fortune);
      setIsCracking(false);
      setJustCracked(true);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border-2 border-purple-500/50 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden my-auto">
        {/* Mystical Ambient Orbs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Modal Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-all hover:bg-slate-700 active:scale-95 z-20"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <span>🔮 TODAY'S CODE PROPHECY</span>
              <span>•</span>
              <span>DAILY ALGORITHMIC FORTUNE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fortune Cookie of Destiny
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Every single day brings a lucky algorithmic pattern, daily mindset superpower, and juicy bonus coins!
            </p>
          </div>
        </div>

        {/* UNCRACKED STATE: Interactive Fortune Cookie Card */}
        {!fortune.cracked ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
            <div
              onClick={handleCrackFortune}
              className={`relative cursor-pointer select-none transition-transform duration-300 ${
                isCracking ? 'scale-115 rotate-6 animate-pulse' : 'hover:scale-110 active:scale-95'
              }`}
            >
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center animate-bounce-subtle">
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center border-2 border-amber-300/60">
                  <span className="text-6xl drop-shadow-lg">🥠</span>
                  <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider mt-1">
                    Tap to Crack
                  </span>
                </div>
              </div>

              {/* Sparkling Embers */}
              <span className="absolute -top-2 -right-2 text-2xl animate-spin-slow">✨</span>
              <span className="absolute -bottom-1 -left-2 text-2xl animate-pulse">🌟</span>
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-black text-white">
                Today’s Algorithmic Rune is Sealed!
              </h3>
              <p className="text-xs text-slate-300">
                Crack open your daily fortune cookie to reveal today's lucky data structure, power buff, and collect <strong className="text-amber-400">+50 Coins & +25 XP</strong>.
              </p>
            </div>

            <button
              type="button"
              disabled={isCracking}
              onClick={handleCrackFortune}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-95 animate-pulse"
            >
              {isCracking ? '✨ UNVEILING PROPHECY...' : '🥠 CRACK OPEN TODAY’S PROPHECY (+50 Coins)'}
            </button>
          </div>
        ) : (
          /* CRACKED STATE: Revealed Fortune Card */
          <div className="space-y-4 animate-fade-in">
            {/* Reward Notification Banner */}
            {(justCracked || fortune.cracked) && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/25 via-amber-500/25 to-emerald-500/25 border-2 border-purple-400/50 text-white flex items-center justify-between gap-3 animate-bounce-subtle">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🥠</span>
                  <div>
                    <h4 className="font-black text-sm text-amber-300">
                      Fortune Unlocked for {fortune.date}!
                    </h4>
                    <p className="text-xs text-slate-200">
                      Earned <strong className="text-amber-400 font-extrabold">+{fortune.rewardCoins} Coins</strong> and <strong className="text-purple-300 font-extrabold">+{fortune.rewardXp} XP</strong>!
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shrink-0">
                  +50 🪙
                </span>
              </div>
            )}

            {/* Lucky Concept Hero Block */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/40 backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {fortune.conceptEmoji}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-purple-400">
                      Lucky Algorithmic Concept
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {fortune.luckyConcept}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-400/30">
                    CF {fortune.luckyRating}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Const: {fortune.luckyConstant}
                  </span>
                </div>
              </div>

              {/* Power Buff Banner */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
                <span className="text-2xl shrink-0">{fortune.powerBuff.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-300 uppercase">
                      Active Daily Buff:
                    </span>
                    <strong className="text-xs font-black text-white">
                      {fortune.powerBuff.title}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {fortune.powerBuff.effect}
                  </p>
                </div>
              </div>

              {/* Mindset Advice & Pro Tip */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                  <span>🧠</span>
                  <span>Mindset Strategy for Today</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {fortune.mindsetAdvice}
                </p>
              </div>

              {/* Programmer Humor Quote */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 text-xs sm:text-sm text-indigo-200 italic">
                &ldquo;{fortune.humorQuote}&rdquo;
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400">
                Returns with a brand-new fortune tomorrow at midnight!
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {onPracticeConcept && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playPop();
                      onPracticeConcept(fortune.luckyConcept);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-purple-600/30"
                  >
                    🎯 Practice {fortune.luckyConcept.split(' ')[0]}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
