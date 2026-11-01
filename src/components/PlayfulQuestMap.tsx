import React from 'react';
import { soundEffects } from '../utils/soundEffects';
import { FunCard } from './common/CardBackgrounds';

interface QuestStation {
  id: string;
  name: string;
  ratingTier: number;
  emoji: string;
  desc: string;
  unlocked: boolean;
  active: boolean;
  stars: number; // 0-3
  color: string;
}

interface PlayfulQuestMapProps {
  currentRating: number;
  onSelectTier: (rating: number) => void;
}

export const PlayfulQuestMap: React.FC<PlayfulQuestMapProps> = ({
  currentRating,
  onSelectTier,
}) => {
  const stations: QuestStation[] = [
    {
      id: 'tier_800',
      name: 'Watermelon Meadow',
      ratingTier: 800,
      emoji: '🍉',
      desc: 'Loops & Conditionals',
      unlocked: true,
      active: currentRating >= 800 && currentRating < 1000,
      stars: currentRating >= 1000 ? 3 : currentRating >= 800 ? 2 : 1,
      color: 'from-emerald-500 to-green-600',
    },
    {
      id: 'tier_1000',
      name: 'Modulo Archipelago',
      ratingTier: 1000,
      emoji: '🏝️',
      desc: 'Math, Sorting & Strings',
      unlocked: currentRating >= 800,
      active: currentRating >= 1000 && currentRating < 1200,
      stars: currentRating >= 1200 ? 3 : currentRating >= 1000 ? 2 : 0,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'tier_1200',
      name: 'Pupil Highlands',
      ratingTier: 1200,
      emoji: '🏔️',
      desc: 'Prefix Sums & Greedy',
      unlocked: currentRating >= 1000,
      active: currentRating >= 1200 && currentRating < 1400,
      stars: currentRating >= 1400 ? 3 : currentRating >= 1200 ? 2 : 0,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'tier_1400',
      name: 'Binary Canyon',
      ratingTier: 1400,
      emoji: '🏜️',
      desc: 'Two Pointers & Graphs',
      unlocked: currentRating >= 1200,
      active: currentRating >= 1400 && currentRating < 1600,
      stars: currentRating >= 1600 ? 3 : currentRating >= 1400 ? 2 : 0,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'tier_1600',
      name: 'Specialist Peak',
      ratingTier: 1600,
      emoji: '👑',
      desc: 'Boss Level • Rating 1600',
      unlocked: currentRating >= 1400,
      active: currentRating >= 1600,
      stars: currentRating >= 1600 ? 3 : 0,
      color: 'from-rose-500 via-pink-600 to-purple-600',
    },
  ];

  return (
    <FunCard
      variant="cosmic"
      sticker="speedrun_1600"
      stickerTilt={-5}
      stickerPosition="top-right"
      className="p-6 sm:p-7 shadow-xl"
    >
      {/* Header with visual badges and generous spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-indigo-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-400/20 select-none animate-bounce-subtle">
            🗺️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                1600 Quest Adventure
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-400/30 uppercase tracking-wider">
                Level Map
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-indigo-200/80 font-medium mt-0.5">
              Tap any zone to battle curated Codeforces challenges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Tier: <strong className="text-cyan-700 dark:text-cyan-300 font-mono">{currentRating}</strong> pts</span>
          </div>
        </div>
      </div>

      {/* Quest Stations Map (Generous Spacing between Nodes) */}
      <div className="overflow-x-auto pb-4 pt-6">
        <div className="min-w-[680px] relative flex items-center justify-between px-8 py-4">
          {/* Connecting Curved Trail Line */}
          <div className="absolute top-1/2 left-14 right-14 h-3 -translate-y-1/2 bg-white/15 rounded-full -z-0">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 rounded-full transition-all duration-700 shadow-sm"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(10, ((currentRating - 800) / 800) * 100)
                )}%`,
              }}
            />
          </div>

          {stations.map((st, idx) => (
            <div
              key={st.id}
              onClick={() => {
                soundEffects.playPop();
                onSelectTier(st.ratingTier);
              }}
              className="relative z-10 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 active:scale-95 select-none"
            >
              {/* Active Pulse Ring */}
              {st.active && (
                <span className="absolute -inset-3 rounded-2xl bg-cyan-400/30 animate-ping pointer-events-none" />
              )}

              {/* Station Circle Node */}
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center text-3xl shadow-xl border-2 transition-all ${
                  st.active
                    ? `bg-gradient-to-br ${st.color} text-white border-white ring-4 ring-cyan-400/50 shadow-cyan-500/40 scale-105`
                    : st.unlocked
                    ? `bg-gradient-to-br ${st.color} text-white border-white/70 shadow-md`
                    : 'bg-slate-800/80 text-slate-500 border-slate-700 grayscale'
                }`}
              >
                <span>{st.emoji}</span>
              </div>

              {/* Star Badges */}
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-300">
                {[1, 2, 3].map((starNum) => (
                  <span
                    key={starNum}
                    className={
                      starNum <= st.stars
                        ? 'opacity-100 drop-shadow-xs'
                        : 'opacity-25 text-slate-400'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Station Title & Rating */}
              <div className="text-center mt-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white block group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  {st.name}
                </span>
                <span className="text-[11px] font-extrabold text-cyan-800 dark:text-cyan-200/90 font-mono">
                  {st.ratingTier}
                </span>
              </div>

              {/* Status Badge */}
              <div className="mt-1.5">
                {st.active ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-cyan-500 text-white dark:bg-cyan-400 dark:text-slate-950 uppercase tracking-wider shadow-sm">
                    Battling ⚔️
                  </span>
                ) : st.stars === 3 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/40">
                    Cleared ✓
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-indigo-200 border border-slate-200 dark:border-white/10">
                    Tier {idx + 1}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FunCard>
  );
};
