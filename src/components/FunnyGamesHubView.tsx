import React, { useState, useEffect } from 'react';
import { gameRewardService } from '../services/gameRewardService';
import { soundEffects } from '../utils/soundEffects';
import { PatternMatrixLabGame } from './games/PatternMatrixLabGame';
import { ByteCityCrisisGame } from './games/ByteCityCrisisGame';
import { DungeonOfQuirkyBugsGame } from './games/DungeonOfQuirkyBugsGame';
import { FunCard } from './common/CardBackgrounds';

interface FunnyGamesHubViewProps {
  onOpenSpinner?: () => void;
  onOpenDailyLogin?: () => void;
}

export const FunnyGamesHubView: React.FC<FunnyGamesHubViewProps> = ({
  onOpenSpinner,
  onOpenDailyLogin,
}) => {
  const [activeGame, setActiveGame] = useState<'hub' | 'pattern' | 'city' | 'dungeon'>('hub');
  const [coins, setCoins] = useState(() => gameRewardService.getCoins());
  const [progress, setProgress] = useState(() => gameRewardService.getGamesProgress());

  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setCoins(gameRewardService.getCoins());
      setProgress(gameRewardService.getGamesProgress());
    });
  }, []);

  const totalStars =
    (progress.pattern_matrix?.starsTotal || 0) +
    (progress.byte_city?.starsTotal || 0) +
    (progress.dungeon_bugs?.starsTotal || 0);

  const handleLaunchGame = (game: 'pattern' | 'city' | 'dungeon') => {
    soundEffects.playPop();
    setActiveGame(game);
  };

  if (activeGame === 'pattern') {
    return <PatternMatrixLabGame onBackToHub={() => setActiveGame('hub')} />;
  }

  if (activeGame === 'city') {
    return <ByteCityCrisisGame onBackToHub={() => setActiveGame('hub')} />;
  }

  if (activeGame === 'dungeon') {
    return <DungeonOfQuirkyBugsGame onBackToHub={() => setActiveGame('hub')} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Arcade Header + Coin Pouch + Stars */}
      <FunCard variant="cosmic" className="p-6 sm:p-8 shadow-2xl relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-500/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md">
              <span>🕹️ LOGIC & PROBLEM SOLVING ARCADE</span>
              <span>•</span>
              <span>LEARN CODING WITH JOY</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              3 Hilarious Games to Level Up Your Intuition
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-indigo-200 leading-relaxed">
              Step into the world where mischievous characters create real-life bugs and chaos!
              Write real code, generate beautiful geometric patterns, manage city logistics, and cast algorithmic spells to defeat quirky monster bosses.
            </p>
          </div>

          {/* Quick HUD Scoreboard */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-white/90 dark:bg-slate-950/70 p-4 rounded-2xl border border-indigo-200/80 dark:border-white/10 backdrop-blur-md shadow-xs">
            <div className="text-center px-3 border-r border-slate-200 dark:border-white/10">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 block uppercase">Coin Pouch</span>
              <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                <span>🪙</span>
                <span>{coins.toLocaleString()}</span>
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 block uppercase">Arcade Stars</span>
              <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-yellow-400 flex items-center justify-center gap-1 mt-0.5">
                <span>⭐</span>
                <span>{totalStars} / 39</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons: Spinner & Daily Login */}
        <div className="flex flex-wrap items-center gap-3 pt-5 mt-5 border-t border-indigo-200/60 dark:border-white/15">
          {onOpenSpinner && (
            <button
              type="button"
              onClick={onOpenSpinner}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>🎡</span>
              <span>Spin Problem Wheel (+Bounty Coins & Gifts)</span>
            </button>
          )}

          {onOpenDailyLogin && (
            <button
              type="button"
              onClick={onOpenDailyLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>🎁</span>
              <span>Everyday Login Rewards Calendar</span>
            </button>
          )}
        </div>
      </FunCard>

      {/* 3 Main Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GAME 1: Pattern Matrix Lab */}
        <div className="p-6 rounded-3xl border-2 border-indigo-500/40 bg-slate-900/90 shadow-2xl flex flex-col justify-between space-y-5 hover:border-indigo-400 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🤖
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black">
                {progress.pattern_matrix?.starsTotal || 0} ⭐ Stars
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                GAME 1 • PATTERNS & SYMMETRY
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Pattern Matrix Lab: Rogue Robot Uprising
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Rogue Robot B0B and Mittens the Chaos Cat are wrecking server room coordinates! Write code with nested loops, pyramids, diamonds, and checkerboards to project containment shields!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>🎯 <strong>Concepts:</strong> Nested Loops, Coordinate Geometry, 2D Arrays</div>
              <div>⚡ <strong>Characters:</strong> Rogue Bot B0B, Chaos Cat Mittens</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLaunchGame('pattern')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
          >
            ▶ PLAY PATTERN MATRIX LAB →
          </button>
        </div>

        {/* GAME 2: Byte City Crisis */}
        <div className="p-6 rounded-3xl border-2 border-emerald-500/40 bg-slate-900/90 shadow-2xl flex flex-col justify-between space-y-5 hover:border-emerald-400 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🏙️
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black">
                {progress.byte_city?.starsTotal || 0} ⭐ Stars
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                GAME 2 • REAL-LIFE CONCEPTS
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Byte City Panic: Real-Life Concept Fixer
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Emergency in Byte City! Chef Luigi needs pizza rush scheduling, Officer Robo-Pup has an intersection gridlock, and Sherlock Byte needs binary search to locate the 1600 Trophy!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>🎯 <strong>Concepts:</strong> Greedy Scheduling, Priority Queues, Binary Search</div>
              <div>⚡ <strong>Characters:</strong> Chef Luigi, Officer Robo-Pup, Sherlock Byte</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLaunchGame('city')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            ▶ PLAY BYTE CITY PANIC →
          </button>
        </div>

        {/* GAME 3: Dungeon of Quirky Bugs */}
        <div className="p-6 rounded-3xl border-2 border-red-500/40 bg-slate-900/90 shadow-2xl flex flex-col justify-between space-y-5 hover:border-red-400 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🗡️
              </span>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black">
                {progress.dungeon_bugs?.starsTotal || 0} ⭐ Stars
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                GAME 3 • RPG HERO VS BUG MONSTERS
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Dungeon of Quirky Bugs: Hero vs Bosses
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Fight Gorg the Off-By-One Ogre, the NullPointer Goblin, the Exponential Memory Slime, and the Two-Sum Dragon! Cast algorithmic counter-spells to slay the bugs!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>🎯 <strong>Concepts:</strong> Fencepost Loop Bounds, Null-Safety, Memoization DP, Two-Sum</div>
              <div>⚡ <strong>Characters:</strong> Hero Climby vs 4 Hilarious Monster Bosses</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLaunchGame('dungeon')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-400 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-500/25 active:scale-95 transition-all cursor-pointer"
          >
            ▶ PLAY DUNGEON OF BUGS →
          </button>
        </div>
      </div>
    </div>
  );
};
