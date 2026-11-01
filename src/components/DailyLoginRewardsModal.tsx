import React, { useState, useEffect } from 'react';
import {
  gameRewardService,
  DAILY_LOGIN_SCHEDULE,
  DailyLoginRewardDay,
  GiftItem,
} from '../services/gameRewardService';
import { soundEffects } from '../utils/soundEffects';

interface DailyLoginRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerConfetti?: () => void;
}

export const DailyLoginRewardsModal: React.FC<DailyLoginRewardsModalProps> = ({
  isOpen,
  onClose,
  onTriggerConfetti,
}) => {
  const [state, setState] = useState(() => gameRewardService.getDailyLoginState());
  const [hasClaimedToday, setHasClaimedToday] = useState(() => gameRewardService.hasClaimedDailyToday());
  const [selectedDay, setSelectedDay] = useState<DailyLoginRewardDay>(() => {
    const idx = gameRewardService.getCurrentDayIndex();
    return DAILY_LOGIN_SCHEDULE[idx] || DAILY_LOGIN_SCHEDULE[0];
  });
  const [claimedGiftNotice, setClaimedGiftNotice] = useState<{
    coins: number;
    gift: GiftItem;
  } | null>(null);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<string>('');

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setState(gameRewardService.getDailyLoginState());
      setHasClaimedToday(gameRewardService.hasClaimedDailyToday());
    });
  }, []);

  // Countdown timer to midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilMidnight(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayIndex = gameRewardService.getCurrentDayIndex();

  const handleClaim = () => {
    soundEffects.playVictory();
    onTriggerConfetti?.();

    const res = gameRewardService.claimDailyReward();
    setHasClaimedToday(true);
    setState(gameRewardService.getDailyLoginState());
    setClaimedGiftNotice({
      coins: res.reward.coins,
      gift: res.giftAwarded,
    });
    setSelectedDay(res.reward);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border-2 border-amber-400/50 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden my-auto">
        {/* Ambient Glowing Background */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

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
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <span>🎁 DAILY LOGIN BOUNTY</span>
              <span>•</span>
              <span>STREAK: {state.streakCount} DAYS 🔥</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Everyday Login Rewards & Lore
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Log in every single day to unlock coins, rare algorithm gifts, and fascinating real-life computer science insights!
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Next Daily Reset</span>
            <span className="font-mono text-xs font-black text-amber-400">{timeUntilMidnight}</span>
          </div>
        </div>

        {/* Claim Success Celebration Banner */}
        {claimedGiftNotice && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-teal-500/25 border-2 border-amber-400/50 text-white space-y-2 animate-bounce-subtle">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{claimedGiftNotice.gift.icon}</span>
              <div>
                <h4 className="font-black text-base text-amber-300">
                  🎉 Today&apos;s Gift Claimed Successfully!
                </h4>
                <p className="text-xs text-slate-200">
                  You earned <strong className="text-amber-400 font-extrabold">+{claimedGiftNotice.coins} Coins</strong> and unlocked the <strong className="text-cyan-300 font-extrabold">{claimedGiftNotice.gift.title}</strong>!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Progressive Reward Track */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-300">
            <span>7-DAY LOGIN STREAK REWARD TRACK</span>
            <span className="text-amber-400">Total Logins: {state.totalLogins}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {DAILY_LOGIN_SCHEDULE.map((dayItem, idx) => {
              const isToday = idx === todayIndex;
              const isPast = idx < todayIndex || (isToday && hasClaimedToday);
              const isSelected = selectedDay.day === dayItem.day;

              return (
                <div
                  key={dayItem.day}
                  onClick={() => setSelectedDay(dayItem)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex flex-col justify-between ${
                    isToday && !hasClaimedToday
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50 animate-pulse'
                      : isSelected
                      ? 'border-indigo-400 bg-indigo-950/60 ring-1 ring-indigo-400/50'
                      : isPast
                      ? 'border-emerald-500/30 bg-emerald-950/20 opacity-85'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="text-slate-400">Day {dayItem.day}</span>
                    {isPast ? (
                      <span className="text-emerald-400 font-bold">✓</span>
                    ) : isToday ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                        TODAY
                      </span>
                    ) : null}
                  </div>

                  <div className="py-2">
                    <span className="text-2xl filter drop-shadow-md">{dayItem.giftIcon}</span>
                    <p className="text-[11px] font-extrabold text-amber-300 mt-1">
                      +{dayItem.coins} 🪙
                    </p>
                  </div>

                  <div className="text-[10px] font-semibold text-slate-300 truncate">
                    {dayItem.giftTitle.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day's "Interesting Thing" & Mindset Booster */}
        <div className="p-5 rounded-2xl border border-indigo-500/40 bg-slate-950/70 backdrop-blur-md space-y-4 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedDay.giftIcon}</span>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Day {selectedDay.day} Interesting Lore & Concept
                </span>
                <h4 className="text-base sm:text-lg font-black text-white">
                  {selectedDay.interestingThing.topic}
                </h4>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase">
              {selectedDay.giftRarity} GIFT
            </span>
          </div>

          {/* Deep Insight Fact */}
          <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
            <p className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              💡 <strong className="text-amber-300">The Fascinating Reality:</strong>{' '}
              {selectedDay.interestingThing.fact}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <span className="text-[10px] uppercase font-black text-purple-300">Real-Life Analogy</span>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedDay.interestingThing.funExample}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30">
                <span className="text-[10px] uppercase font-black text-teal-300">Problem Solving Mindset</span>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedDay.interestingThing.mindsetTip}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Today's Bounty Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400">
            {hasClaimedToday
              ? '✓ Today’s login reward is already collected. Return tomorrow for Day ' + (((todayIndex + 1) % 7) + 1) + '!'
              : 'Claim now to keep your streak burning and claim your daily treasure!'}
          </p>

          <button
            type="button"
            disabled={hasClaimedToday}
            onClick={handleClaim}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all cursor-pointer ${
              hasClaimedToday
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/25 active:scale-95 animate-pulse'
            }`}
          >
            {hasClaimedToday ? '✓ Claimed for Today' : '🎁 CLAIM TODAY’S REWARD (+Coins & Gift!)'}
          </button>
        </div>
      </div>
    </div>
  );
};
