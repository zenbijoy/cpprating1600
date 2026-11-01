import React, { useState, useEffect } from 'react';
import { soundEffects } from '../../utils/soundEffects';
import { gameRewardService } from '../../services/gameRewardService';
import { MascotClimby } from '../assets/MascotAndStickers';

export interface MonsterBoss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  hpMax: number;
  taunt: string;
  bugDescription: string;
  defeatQuote: string;
  starterCode: string;
  solutionHint: string;
  rewardCoins: number;
  testFunction: (userFn: any) => { passed: boolean; message: string; damage: number };
}

const MONSTER_BOSSES: MonsterBoss[] = [
  {
    id: 'boss_ogre',
    name: 'Gorg the Off-By-One Ogre',
    title: 'Wielder of Broken Fenceposts',
    emoji: '👹',
    hpMax: 400,
    taunt: 'I always check <= length! Out of bounds error is my favorite weapon!',
    bugDescription: 'Gorg loops past the end of arrays, accessing undefined memory. Fix the fencepost loop to sum only valid elements!',
    defeatQuote: 'Aaargh! Strict < bound checks... my fence has collapsed!',
    starterCode: `function safeArraySum(arr) {
  // Fix Gorg's off-by-one bug: loop strictly within array bounds!
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
    solutionHint: 'Never loop up to `i <= arr.length` on 0-indexed arrays! The last index is `arr.length - 1`.',
    rewardCoins: 250,
    testFunction: (userFn) => {
      const arr1 = [10, 20, 30, 40, 50];
      const arr2 = [];
      const arr3 = [7, -3, 14];

      if (userFn(arr1) === 150 && userFn(arr2) === 0 && userFn(arr3) === 18) {
        return { passed: true, message: 'CRITICAL HIT! Safe bounds verified across all test arrays!', damage: 400 };
      }
      return { passed: false, message: 'Ogre hit! Output did not match safe array sum.', damage: 0 };
    },
  },
  {
    id: 'boss_goblin',
    name: 'Sneaky NullPointer Goblin',
    title: 'Thief of Memory References',
    emoji: '👺',
    hpMax: 500,
    taunt: 'Hehehe! Dereferencing null... TypeError: Cannot read properties of undefined!',
    bugDescription: 'The Goblin breaks nested object paths by injecting null references. Write a safe object path extractor `get(obj, path, defaultValue)`!',
    defeatQuote: 'Curses! Optional chaining and null checks have banished my void smoke!',
    starterCode: `function safePathAccess(obj, path, defaultValue) {
  // path is a string like "user.profile.rating"
  // Safely traverse without throwing on null/undefined!
  const keys = path.split(".");
  let current = obj;
  for (const k of keys) {
    if (current == null) return defaultValue;
    current = current[k];
  }
  return current !== undefined ? current : defaultValue;
}`,
    solutionHint: 'Check `if (current == null)` before accessing `current[k]`, or use modern optional chaining `?.`.',
    rewardCoins: 300,
    testFunction: (userFn) => {
      const target = { user: { profile: { rating: 1600 } } };
      const broken = { user: null };

      const t1 = userFn(target, 'user.profile.rating', 0) === 1600;
      const t2 = userFn(broken, 'user.profile.rating', 800) === 800;
      const t3 = userFn({}, 'a.b.c', 'fallback') === 'fallback';

      if (t1 && t2 && t3) {
        return { passed: true, message: 'BANISH SPELL SUCCEEDED! Goblin void vanished without throwing TypeError!', damage: 500 };
      }
      return { passed: false, message: 'Goblin escaped! Null pointer threw or returned incorrect fallback.', damage: 0 };
    },
  },
  {
    id: 'boss_slime',
    name: 'Gluttonous Memory Slime',
    title: 'Exponential O(2^N) Devourer',
    emoji: '🦠',
    hpMax: 600,
    taunt: 'Slurp! Naive recursion clones me exponentially! Your RAM is mine!',
    bugDescription: 'The slime grows with naive recursive Fibonacci O(2^N). Cast dynamic programming / memoization in O(N) to shrink it down!',
    defeatQuote: 'Squelch! Memoization cached all my subproblems! I am reduced to a puddle!',
    starterCode: `function fastFibonacci(n) {
  // Calculate Nth Fibonacci number in O(N) time with memoization / iterative DP
  if (n <= 1) return n;
  let a = 0;
  let b = 1;
  for (let i = 2; i <= n; i++) {
    let c = a + b;
    a = b;
    b = c;
  }
  return b;
}`,
    solutionHint: 'An iterative loop using two variables `a` and `b` runs in linear O(N) time and O(1) space, avoiding stack overflow!',
    rewardCoins: 350,
    testFunction: (userFn) => {
      const t1 = userFn(0) === 0;
      const t2 = userFn(1) === 1;
      const t3 = userFn(10) === 55;
      const t4 = userFn(30) === 832040;

      if (t1 && t2 && t3 && t4) {
        return { passed: true, message: 'TURBO DP CAST! Slime shrunk from 1,000,000 recursive branches to 30 linear steps!', damage: 600 };
      }
      return { passed: false, message: 'Slime absorbed spell! Incorrect Fibonacci calculation.', damage: 0 };
    },
  },
  {
    id: 'boss_dragon',
    name: 'Ignis the Two-Sum Dragon',
    title: 'Keeper of the Hash Crypt',
    emoji: '🐉',
    hpMax: 800,
    taunt: 'Only those who find pair coordinates in O(N) hash time may pass my flames!',
    bugDescription: 'Find indices of two numbers that add up to `target`. Must run in linear time with a Map / Hash Table!',
    defeatQuote: 'By the algorithmic gods! Your O(N) hash lookups were faster than dragon breath!',
    starterCode: `function twoSum(nums, target) {
  // Return [index1, index2] such that nums[index1] + nums[index2] === target
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    solutionHint: 'Use a Hash Map storing `value -> index`. For each number, check if `target - num` already exists in the map.',
    rewardCoins: 500,
    testFunction: (userFn) => {
      const r1 = userFn([2, 7, 11, 15], 9);
      const r2 = userFn([3, 2, 4], 6);

      const ok1 = Array.isArray(r1) && r1[0] === 0 && r1[1] === 1;
      const ok2 = Array.isArray(r2) && r2[0] === 1 && r2[1] === 2;

      if (ok1 && ok2) {
        return { passed: true, message: 'DRAGON SLAYER AC! Boss Dragon bows before your O(N) Hash mastery!', damage: 800 };
      }
      return { passed: false, message: 'Dragon deflected! Two sum indices incorrect.', damage: 0 };
    },
  },
];

export const DungeonOfQuirkyBugsGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const [bossIdx, setBossIdx] = useState(0);
  const boss = MONSTER_BOSSES[bossIdx];
  const [code, setCode] = useState(boss.starterCode);
  const [bossHp, setBossHp] = useState(boss.hpMax);
  const [heroHp, setHeroHp] = useState(100);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isBossDefeated, setIsBossDefeated] = useState(false);
  const [casting, setCasting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setCode(boss.starterCode);
    setBossHp(boss.hpMax);
    setHeroHp(100);
    setCombatLog([`⚔️ Encountered ${boss.name}! ${boss.taunt}`]);
    setIsBossDefeated(false);
    setShowHint(false);
  }, [bossIdx]);

  const handleCastSpell = () => {
    setCasting(true);
    soundEffects.playPop();

    setTimeout(() => {
      try {
        // eslint-disable-next-line no-new-func
        const fnName = boss.starterCode.match(/function\s+(\w+)/)?.[1] || '';
        const userFn = new Function(`${code}; return ${fnName};`)();

        if (typeof userFn !== 'function') {
          throw new Error(`Code must define function "${fnName}".`);
        }

        const result = boss.testFunction(userFn);

        if (result.passed) {
          setBossHp(0);
          setIsBossDefeated(true);
          soundEffects.playVictory();
          setCombatLog((prev) => [
            `✨ ${result.message}`,
            `💥 -${result.damage} HP! ${boss.name} was vanquished!`,
            `💬 ${boss.name}: "${boss.defeatQuote}"`,
            ...prev,
          ]);

          gameRewardService.recordGameLevelComplete(
            'dungeon_bugs',
            boss.id,
            3,
            boss.rewardCoins
          );
        } else {
          setHeroHp((prev) => Math.max(20, prev - 25));
          soundEffects.playWa();
          setCombatLog((prev) => [
            `⚠️ ${result.message}`,
            `💔 Monster hit your hero for 25 damage!`,
            ...prev,
          ]);
        }
      } catch (err: any) {
        soundEffects.playTle();
        setCombatLog((prev) => [`⚠️ Spell fizzled: ${err.message}`, ...prev]);
      } finally {
        setCasting(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border-2 border-red-500/40 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHub}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            ← Arcade Hub
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🗡️</span>
              <h3 className="text-lg font-black text-white">
                Dungeon of Quirky Bugs: Hero vs Monster Bosses
              </h3>
            </div>
            <p className="text-xs text-red-300">
              Debug real edge cases, memoization & pointer traps to defeat mischievous dungeon beasts!
            </p>
          </div>
        </div>

        {/* Boss Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {MONSTER_BOSSES.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBossIdx(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                bossIdx === idx
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/30 ring-2 ring-red-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{b.emoji}</span>
              <span>Boss {idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Battle Stage Arena: Hero Sprite vs Boss Monster Sprite */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-950 border-2 border-red-500/30 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Hero Climby */}
          <div className="md:col-span-5 flex items-center gap-4">
            <MascotClimby size={90} className="filter drop-shadow-xl animate-bounce-subtle" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">Hero Climby</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{heroHp}/100 HP</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-emerald-500/30">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${heroHp}%` }}
                />
              </div>
              <span className="text-[10px] text-indigo-300 font-bold">Class: Algorithmic Spellblade</span>
            </div>
          </div>

          {/* VS Icon */}
          <div className="md:col-span-2 text-center">
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-black text-xs border border-red-500/40">
              VS BOSS
            </span>
          </div>

          {/* Right: Boss Monster */}
          <div className="md:col-span-5 flex items-center gap-4 justify-end text-right">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-red-400">{bossHp}/{boss.hpMax} HP</span>
                <span className="font-black text-white text-sm">{boss.name}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-red-500/30">
                <div
                  className="bg-red-500 h-full transition-all duration-300"
                  style={{ width: `${(bossHp / boss.hpMax) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-300 font-bold">{boss.title}</span>
            </div>
            <div className="w-18 h-18 rounded-2xl bg-slate-800 border-2 border-red-500/40 flex items-center justify-center text-4xl shadow-xl animate-pulse">
              {boss.emoji}
            </div>
          </div>
        </div>

        {/* Boss Bug Description Banner */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
          <span>⚠️ <strong>Monster&apos;s Curse:</strong> {boss.bugDescription}</span>
          <span className="text-amber-400 font-bold">Bounty: +{boss.rewardCoins} 🪙 Coins</span>
        </div>
      </div>

      {/* Main Workspace: Spell Terminal + Battle Combat Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-300 flex items-center gap-2">
              <span>📜 SPELL TERMINAL</span>
              <span className="text-slate-400 font-mono text-[11px]">(Algorithmic Counter-Attack)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint((p) => !p)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {showHint ? 'Hide Hint' : '💡 Grimoire Hint'}
              </button>
              <button
                type="button"
                onClick={() => setCode(boss.starterCode)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Reset Spell
              </button>
            </div>
          </div>

          {showHint && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs">
              💡 <strong>Counter-Spell Secret:</strong> {boss.solutionHint}
            </div>
          )}

          <div className="rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400">counter_spell.js</span>
              <span className="text-[10px] text-red-400 font-mono font-bold">● BOSS ENCOUNTER</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={13}
              className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed selection:bg-red-600"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={casting || isBossDefeated}
              onClick={handleCastSpell}
              className={`px-7 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer ${
                casting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : isBossDefeated
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black shadow-red-500/25 active:scale-95'
              }`}
            >
              {casting
                ? '⚡ Casting Counter-Spell...'
                : isBossDefeated
                ? '✓ BOSS VANQUISHED!'
                : '🗡️ CAST ALGORITHMIC SPELL'}
            </button>
          </div>
        </div>

        {/* Right: Real-Time Battle Combat Log */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-black text-amber-300">
            📜 DUNGEON COMBAT SCROLL
          </span>

          <div className="p-4 rounded-2xl border-2 border-red-500/30 bg-slate-950/80 backdrop-blur-md min-h-[320px] flex flex-col justify-between shadow-2xl space-y-3">
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] p-2">
              {combatLog.map((entry, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-xs leading-relaxed font-mono ${
                    entry.startsWith('✨') || entry.startsWith('💥')
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : entry.startsWith('⚠️') || entry.startsWith('💔')
                      ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}
                >
                  {entry}
                </div>
              ))}
            </div>

            {isBossDefeated && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border-2 border-amber-400/50 text-center animate-bounce-subtle">
                <span className="text-sm font-black text-amber-300 block">
                  🏆 VICTORY! {boss.name.toUpperCase()} DEFEATED!
                </span>
                <span className="text-xs text-slate-200 mt-1 block">
                  +{boss.rewardCoins} 🪙 Coins added to your pouch!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
