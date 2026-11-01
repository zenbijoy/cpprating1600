import React, { useState, useEffect } from 'react';
import { soundEffects } from '../../utils/soundEffects';
import { gameRewardService } from '../../services/gameRewardService';

export interface PatternLevel {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  lore: string;
  characterQuote: string;
  targetFunction: (n: number) => string;
  testCases: number[];
  starterCode: string;
  solutionHint: string;
  rewardCoins: number;
}

const PATTERN_LEVELS: PatternLevel[] = [
  {
    id: 'lvl_pyramid',
    name: '1. Pyramid of Protection',
    difficulty: 'Easy',
    description: 'Construct a centered star pyramid of height N to deflect B0B’s falling plasma bolts.',
    lore: 'Rogue Robot B0B is bombarding the server room from above! We need a triangular deflection shield.',
    characterQuote: 'BZZT! You cannot stop gravity with simple loops!',
    targetFunction: (n: number) => {
      const lines: string[] = [];
      for (let i = 0; i < n; i++) {
        const spaces = ' '.repeat(n - i - 1);
        const stars = '*'.repeat(2 * i + 1);
        lines.push(spaces + stars);
      }
      return lines.join('\n');
    },
    testCases: [3, 5],
    starterCode: `function generatePattern(n) {
  let lines = [];
  for (let i = 0; i < n; i++) {
    // Hint: (n - i - 1) spaces followed by (2 * i + 1) stars
    let spaces = " ".repeat(n - i - 1);
    let stars = "*".repeat(2 * i + 1);
    lines.push(spaces + stars);
  }
  return lines.join("\\n");
}`,
    solutionHint: 'Each row i (from 0 to n-1) needs (n - i - 1) spaces and (2*i + 1) asterisks.',
    rewardCoins: 200,
  },
  {
    id: 'lvl_hollow_box',
    name: '2. Hollow Containment Cell',
    difficulty: 'Easy',
    description: 'Build an N x N containment cage where only the borders are solid `#` and the interior is empty.',
    lore: 'Mittens the Chaos Cat is trapped on a server rack! Build a cage with open space inside so she can nap safely.',
    characterQuote: 'Meow! If there’s no room inside, I will knock over your variables!',
    targetFunction: (n: number) => {
      const lines: string[] = [];
      for (let i = 0; i < n; i++) {
        if (i === 0 || i === n - 1) {
          lines.push('#'.repeat(n));
        } else {
          lines.push('#' + ' '.repeat(n - 2) + '#');
        }
      }
      return lines.join('\n');
    },
    testCases: [4, 6],
    starterCode: `function generatePattern(n) {
  let lines = [];
  for (let r = 0; r < n; r++) {
    let row = "";
    for (let c = 0; c < n; c++) {
      // Is this a border cell?
      if (r === 0 || r === n - 1 || c === 0 || c === n - 1) {
        row += "#";
      } else {
        row += " ";
      }
    }
    lines.push(row);
  }
  return lines.join("\\n");
}`,
    solutionHint: 'A cell (r, c) is on the boundary if r === 0, r === n - 1, c === 0, or c === n - 1.',
    rewardCoins: 250,
  },
  {
    id: 'lvl_diamond',
    name: '3. Diamond Laser Barrier',
    difficulty: 'Medium',
    description: 'Construct a symmetric diamond of asterisks with 2N - 1 total rows.',
    lore: 'B0B has activated his 360-degree laser! Only a double-pyramid diamond can refract the laser beam into harmless confetti.',
    characterQuote: 'Beep! My lasers have zero blind spots... unless you know two-way loop symmetry!',
    targetFunction: (n: number) => {
      const lines: string[] = [];
      // Top half + middle (0 to n - 1)
      for (let i = 0; i < n; i++) {
        lines.push(' '.repeat(n - i - 1) + '*'.repeat(2 * i + 1));
      }
      // Bottom half (n - 2 down to 0)
      for (let i = n - 2; i >= 0; i--) {
        lines.push(' '.repeat(n - i - 1) + '*'.repeat(2 * i + 1));
      }
      return lines.join('\n');
    },
    testCases: [3, 4],
    starterCode: `function generatePattern(n) {
  let lines = [];
  // 1. Top pyramid including center row
  for (let i = 0; i < n; i++) {
    lines.push(" ".repeat(n - i - 1) + "*".repeat(2 * i + 1));
  }
  // 2. Bottom inverted pyramid
  for (let i = n - 2; i >= 0; i--) {
    lines.push(" ".repeat(n - i - 1) + "*".repeat(2 * i + 1));
  }
  return lines.join("\\n");
}`,
    solutionHint: 'Create the top half with i going from 0 to n-1, then invert the indices for the bottom half from n-2 down to 0.',
    rewardCoins: 300,
  },
  {
    id: 'lvl_checkerboard',
    name: '4. Alternating Pulse Checkerboard',
    difficulty: 'Medium',
    description: 'Generate an N x N grid alternating between `X` and `O`. The top-left cell must always be `X`.',
    lore: 'The quantum memory grid is destabilizing! Alternate positive and negative electron spins to stabilize the core.',
    characterQuote: 'Bzzzt! Parity check error! (r + c) % 2 will be your undoing!',
    targetFunction: (n: number) => {
      const lines: string[] = [];
      for (let r = 0; r < n; r++) {
        let row = '';
        for (let c = 0; c < n; c++) {
          row += (r + c) % 2 === 0 ? 'X' : 'O';
        }
        lines.push(row);
      }
      return lines.join('\n');
    },
    testCases: [4, 5],
    starterCode: `function generatePattern(n) {
  let lines = [];
  for (let r = 0; r < n; r++) {
    let row = "";
    for (let c = 0; c < n; c++) {
      // Check sum of row and column index
      row += ((r + c) % 2 === 0) ? "X" : "O";
    }
    lines.push(row);
  }
  return lines.join("\\n");
}`,
    solutionHint: 'Notice that whenever (r + c) is even, the cell is X, and when (r + c) is odd, it is O.',
    rewardCoins: 350,
  },
  {
    id: 'lvl_hourglass',
    name: '5. Hourglass Stun Wave',
    difficulty: 'Hard',
    description: 'Generate an hourglass shape of size N (N is odd, e.g. 5 or 7).',
    lore: 'Freeze time! An hourglass geometry channels chronological particles, pausing B0B’s logic clock.',
    characterQuote: 'Tick tock! You cannot trap time itself in nested loops!',
    targetFunction: (n: number) => {
      const lines: string[] = [];
      const mid = Math.floor(n / 2);
      // Top half including waist
      for (let i = 0; i <= mid; i++) {
        lines.push(' '.repeat(i) + '*'.repeat(n - 2 * i));
      }
      // Bottom half
      for (let i = mid - 1; i >= 0; i--) {
        lines.push(' '.repeat(i) + '*'.repeat(n - 2 * i));
      }
      return lines.join('\n');
    },
    testCases: [5, 7],
    starterCode: `function generatePattern(n) {
  let lines = [];
  let mid = Math.floor(n / 2);
  // Top half down to center
  for (let i = 0; i <= mid; i++) {
    lines.push(" ".repeat(i) + "*".repeat(n - 2 * i));
  }
  // Bottom expanding back out
  for (let i = mid - 1; i >= 0; i--) {
    lines.push(" ".repeat(i) + "*".repeat(n - 2 * i));
  }
  return lines.join("\\n");
}`,
    solutionHint: 'In an hourglass of odd size N, row i starts with i spaces and has (n - 2*i) asterisks.',
    rewardCoins: 400,
  },
];

export const PatternMatrixLabGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const [selectedLevelIdx, setSelectedLevelIdx] = useState(0);
  const currentLevel = PATTERN_LEVELS[selectedLevelIdx];
  const [code, setCode] = useState(currentLevel.starterCode);
  const [output, setOutput] = useState<string>('');
  const [targetOutput, setTargetOutput] = useState<string>('');
  const [previewN, setPreviewN] = useState<number>(currentLevel.testCases[0]);
  const [testResults, setTestResults] = useState<{ n: number; passed: boolean; user: string; expected: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Sync starter code when level changes
  useEffect(() => {
    setCode(currentLevel.starterCode);
    setPreviewN(currentLevel.testCases[0]);
    setOutput('');
    setTargetOutput(currentLevel.targetFunction(currentLevel.testCases[0]));
    setTestResults([]);
    setIsSuccess(false);
    setErrorMessage(null);
    setShowHint(false);
  }, [selectedLevelIdx]);

  const handleRunCode = () => {
    setExecuting(true);
    setErrorMessage(null);
    soundEffects.playPop();

    setTimeout(() => {
      try {
        // Safe Function evaluation in local scope
        // eslint-disable-next-line no-new-func
        const userFn = new Function(`${code}; return generatePattern;`)();

        if (typeof userFn !== 'function') {
          throw new Error('Code must define a function named "generatePattern(n)".');
        }

        const results = currentLevel.testCases.map((n) => {
          const userOut = String(userFn(n) || '').trimEnd();
          const expOut = currentLevel.targetFunction(n).trimEnd();
          return {
            n,
            passed: userOut === expOut,
            user: userOut,
            expected: expOut,
          };
        });

        setTestResults(results);
        const allPassed = results.every((r) => r.passed);

        // Preview output for current previewN
        const previewOut = String(userFn(previewN) || '');
        setOutput(previewOut);
        setTargetOutput(currentLevel.targetFunction(previewN));

        if (allPassed) {
          setIsSuccess(true);
          soundEffects.playVictory();
          gameRewardService.recordGameLevelComplete(
            'pattern_matrix',
            currentLevel.id,
            3,
            currentLevel.rewardCoins
          );
        } else {
          setIsSuccess(false);
          soundEffects.playWa();
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Syntax or runtime error in code.');
        soundEffects.playTle();
        setIsSuccess(false);
      } finally {
        setExecuting(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Top Game Navigation & Lore Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border-2 border-indigo-500/40 shadow-xl">
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
              <span className="text-xl">🤖</span>
              <h3 className="text-lg font-black text-white">
                Pattern Matrix Lab: Rogue Robot Uprising
              </h3>
            </div>
            <p className="text-xs text-indigo-300">
              Master nested loops, coordinate geometry & algorithmic symmetry to contain rogue bots!
            </p>
          </div>
        </div>

        {/* Level Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {PATTERN_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setSelectedLevelIdx(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedLevelIdx === idx
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Lvl {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Comic Dialogue / Character Story Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30">
        <div className="md:col-span-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-purple-400/40 flex items-center justify-center text-3xl shadow-lg animate-bounce-subtle">
            🤖
          </div>
          <div>
            <h4 className="font-black text-white text-sm">B0B the Rogue Bot</h4>
            <span className="text-[10px] font-bold text-pink-400">Chaos Level: Critical</span>
          </div>
        </div>

        <div className="md:col-span-7 bg-slate-900/80 p-3 rounded-xl border border-white/10 relative">
          <p className="text-xs text-slate-200 italic">
            &ldquo;{currentLevel.characterQuote}&rdquo;
          </p>
          <p className="text-[11px] text-amber-300 font-semibold mt-1">
            Mission: {currentLevel.description}
          </p>
        </div>

        <div className="md:col-span-2 text-right">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
            +{currentLevel.rewardCoins} 🪙 Coins
          </span>
        </div>
      </div>

      {/* Main Workspace: Code Editor on Left, Live Matrix Canvas on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Code Editor Terminal */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-300 flex items-center gap-2">
              <span>💻 CODE TERMINAL</span>
              <span className="text-slate-400 font-mono text-[11px]">(JavaScript Sandbox)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint((p) => !p)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                {showHint ? 'Hide Hint' : '💡 Need Hint?'}
              </button>
              <button
                type="button"
                onClick={() => setCode(currentLevel.starterCode)}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Reset Code
              </button>
            </div>
          </div>

          {showHint && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs">
              💡 <strong>Algorithm Insight:</strong> {currentLevel.solutionHint}
            </div>
          )}

          <div className="rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400">pattern_generator.js</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">● LIVE ENGINE</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed selection:bg-indigo-600"
              spellCheck={false}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Test with N =</span>
              {currentLevel.testCases.map((tc) => (
                <button
                  key={tc}
                  type="button"
                  onClick={() => {
                    setPreviewN(tc);
                    setTargetOutput(currentLevel.targetFunction(tc));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                    previewN === tc
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tc}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={executing}
              onClick={handleRunCode}
              className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer ${
                executing
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 active:scale-95'
              }`}
            >
              {executing ? '⚡ Compiling Logic...' : '▶ RUN & CONTAIN ROBOT'}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono">
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* Right: Real-Time Visual Matrix Screen */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-black text-cyan-300 flex items-center justify-between">
            <span>🛡️ CONTAINMENT MATRIX VISUALIZER</span>
            <span className="font-mono text-slate-400 text-[11px]">N = {previewN}</span>
          </span>

          <div className="p-4 rounded-2xl border-2 border-cyan-500/30 bg-slate-950/80 backdrop-blur-md min-h-[320px] flex flex-col justify-between shadow-2xl">
            {/* Visual Screen */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Your Generated Pattern Matrix
                </span>
                <div className="mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300 whitespace-pre overflow-x-auto min-h-[110px] flex items-center justify-center">
                  {output ? output : <span className="text-slate-600 italic">Run your code to project shield...</span>}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Required Target Containment Pattern
                </span>
                <div className="mt-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs text-emerald-400 whitespace-pre overflow-x-auto min-h-[110px] flex items-center justify-center">
                  {targetOutput}
                </div>
              </div>
            </div>

            {/* Test Suite Telemetry */}
            {testResults.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResults.map((r) => (
                    <span
                      key={r.n}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        r.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      N={r.n}: {r.passed ? 'PASS' : 'MISMATCH'}
                    </span>
                  ))}
                </div>

                {isSuccess && (
                  <span className="text-xs font-black text-amber-300 animate-bounce-subtle">
                    🎉 +{currentLevel.rewardCoins} COINS EARNED!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
