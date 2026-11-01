import React, { useState, useEffect } from 'react';
import { soundEffects } from '../../utils/soundEffects';
import { gameRewardService } from '../../services/gameRewardService';

export interface CityCrisisScenario {
  id: string;
  title: string;
  characterName: string;
  characterEmoji: string;
  realLifeConcept: string;
  description: string;
  story: string;
  starterCode: string;
  solutionHint: string;
  rewardCoins: number;
  runSimulation: (userFn: any) => { success: boolean; log: string[]; metric: string };
}

const CITY_SCENARIOS: CityCrisisScenario[] = [
  {
    id: 'pizza_rush',
    title: '1. Midnight Pizza Rush Scheduling',
    characterName: 'Chef Luigi',
    characterEmoji: '🍕',
    realLifeConcept: 'Greedy Interval Scheduling & Earliest Deadline First (EDF)',
    description: 'Sort and dispatch pizza orders to maximize on-time deliveries before pizzas get cold!',
    story: 'Mamma Mia! 5 orders came in at once. If we cook them in random order, half will be late! Deliver the earliest deadline first!',
    starterCode: `function schedulePizzaOrders(orders) {
  // Each order is { id: number, prepTime: number, deadline: number }
  // Return array of order IDs sorted by earliest deadline first (EDF)
  return orders
    .slice()
    .sort((a, b) => a.deadline - b.deadline)
    .map(o => o.id);
}`,
    solutionHint: 'Earliest Deadline First (EDF) is the mathematically proven optimal schedule on a single resource to minimize maximum lateness!',
    rewardCoins: 250,
    runSimulation: (userFn) => {
      const orders = [
        { id: 101, prepTime: 10, deadline: 30 },
        { id: 102, prepTime: 5, deadline: 10 },
        { id: 103, prepTime: 15, deadline: 45 },
        { id: 104, prepTime: 8, deadline: 20 },
      ];
      const scheduledIds = userFn(orders);
      const expectedIds = [102, 104, 101, 103];

      const isMatch = JSON.stringify(scheduledIds) === JSON.stringify(expectedIds);
      const log = [
        `Incoming Orders: ${orders.map((o) => `#${o.id} (Due: ${o.deadline}m)`).join(', ')}`,
        `Your Schedule: ${scheduledIds.join(' -> ')}`,
        isMatch
          ? '🎉 All 4 orders delivered piping hot! Zero customer complaints!'
          : '⚠️ Delay detected! An order missed its delivery window.',
      ];
      return { success: isMatch, log, metric: isMatch ? '100% On-Time' : 'Late Orders' };
    },
  },
  {
    id: 'traffic_priority',
    title: '2. Rush-Hour Emergency Dispatch',
    characterName: 'Officer Robo-Pup',
    characterEmoji: '🚔',
    realLifeConcept: 'Priority Queue (Heap) & Starvation Prevention',
    description: 'Dispatch vehicles through a congested 4-way intersection, prioritizing ambulances and fire trucks!',
    story: 'Gridlock! An ambulance with sirens blaring is stuck behind a delivery truck. Process emergency vehicles with rank 1 first, then transit rank 2, then regular cars rank 3.',
    starterCode: `function dispatchTraffic(vehicles) {
  // Each vehicle is { id: string, type: string, priorityRank: number, waitTimeSec: number }
  // Sort by priorityRank (1 = highest, 3 = lowest). 
  // Ties broken by highest waitTimeSec!
  return vehicles
    .slice()
    .sort((a, b) => {
      if (a.priorityRank !== b.priorityRank) {
        return a.priorityRank - b.priorityRank;
      }
      return b.waitTimeSec - a.waitTimeSec;
    })
    .map(v => v.id);
}`,
    solutionHint: 'Sort primarily by priorityRank ascending (1 before 2). If tied, sort by waitTimeSec descending (FIFO tiebreak).',
    rewardCoins: 300,
    runSimulation: (userFn) => {
      const vehicles = [
        { id: 'Sedan-A', type: 'car', priorityRank: 3, waitTimeSec: 60 },
        { id: 'Ambulance-911', type: 'emergency', priorityRank: 1, waitTimeSec: 15 },
        { id: 'Bus-42', type: 'transit', priorityRank: 2, waitTimeSec: 40 },
        { id: 'Sedan-B', type: 'car', priorityRank: 3, waitTimeSec: 90 },
      ];
      const dispatched = userFn(vehicles);
      const expected = ['Ambulance-911', 'Bus-42', 'Sedan-B', 'Sedan-A'];

      const isMatch = JSON.stringify(dispatched) === JSON.stringify(expected);
      const log = [
        'Vehicles Waiting: Ambulance (p1), Bus (p2), Sedan-B (p3, 90s), Sedan-A (p3, 60s)',
        `Your Dispatch Sequence: ${dispatched.join(' ➔ ')}`,
        isMatch
          ? '🚨 Ambulance cleared intersection in 0.4s! Hospital reached safely!'
          : '⚠️ Emergency vehicle delayed in traffic queue!',
      ];
      return { success: isMatch, log, metric: isMatch ? '0s Emergency Delay' : 'Bottleneck' };
    },
  },
  {
    id: 'vault_heist',
    title: '3. The Vault 1600 Binary Search Heist',
    characterName: 'Detective Sherlock Byte',
    characterEmoji: '🕵️',
    realLifeConcept: 'Binary Search (Logarithmic O(log N) Time Complexity)',
    description: 'Find the stolen trophy inside 100,000 bank lockers in under 18 laser scans!',
    story: 'The master thief hid the 1600 Trophy in one of 100,000 lockers. Linear search would trigger the alarm in 20 seconds. Use binary search to locate the exact locker in under 18 queries!',
    starterCode: `function locateTrophy(totalLockers, scanLocker) {
  // scanLocker(num) returns:
  //   -1 if target is in a lower numbered locker
  //    1 if target is in a higher numbered locker
  //    0 if trophy is found!
  let low = 1;
  let high = totalLockers;

  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    let result = scanLocker(mid);
    if (result === 0) {
      return mid; // Found!
    } else if (result === 1) {
      low = mid + 1; // Target is higher
    } else {
      high = mid - 1; // Target is lower
    }
  }
  return -1;
}`,
    solutionHint: 'Cut the search space in half every scan: `mid = Math.floor((low + high) / 2)`. In 17 scans, you can search 2^17 = 131,072 items!',
    rewardCoins: 350,
    runSimulation: (userFn) => {
      const targetLocker = 73491;
      let scansUsed = 0;
      const scanLocker = (mid: number) => {
        scansUsed++;
        if (mid === targetLocker) return 0;
        return targetLocker > mid ? 1 : -1;
      };

      const found = userFn(100000, scanLocker);
      const isSuccess = found === targetLocker && scansUsed <= 18;

      const log = [
        `Target Locker: #${targetLocker} (Hidden among 100,000 lockers)`,
        `Your Scans Used: ${scansUsed} / 18 allowed scans`,
        isSuccess
          ? `🏆 FOUND IN LOCKER #${found} with only ${scansUsed} queries! (Logarithmic efficiency!)`
          : `⚠️ Failed to locate or exceeded scan budget (used ${scansUsed}).`,
      ];
      return { success: isSuccess, log, metric: `${scansUsed} / 18 Scans` };
    },
  },
  {
    id: 'rainwater_flood',
    title: '4. Skyscraper Rainwater Reservoir',
    characterName: 'Engineer Wendy',
    characterEmoji: '🏙️',
    realLifeConcept: 'Two Pointers & Monotonic Constraints (Trapping Rain Water)',
    description: 'Calculate trapped rainwater between city buildings to prevent urban flooding!',
    story: 'Heavy monsoon season! The city skyline has buildings of varying heights. Water collects in the valleys between taller buildings. Compute total water trapped.',
    starterCode: `function trapRainWater(heights) {
  // heights is an array of building heights: e.g. [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
  // Return total units of trapped rainwater
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    if (heights[left] < heights[right]) {
      if (heights[left] >= leftMax) {
        leftMax = heights[left];
      } else {
        totalWater += leftMax - heights[left];
      }
      left++;
    } else {
      if (heights[right] >= rightMax) {
        rightMax = heights[right];
      } else {
        totalWater += rightMax - heights[right];
      }
      right--;
    }
  }
  return totalWater;
}`,
    solutionHint: 'Use two pointers from left and right. Water above building i is bounded by min(leftMax, rightMax) - heights[i].',
    rewardCoins: 400,
    runSimulation: (userFn) => {
      const heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
      const result = userFn(heights);
      const expected = 6;
      const isMatch = result === expected;

      const log = [
        `City Heights: [${heights.join(', ')}]`,
        `Calculated Trapped Water: ${result} megaliters (Expected: ${expected})`,
        isMatch
          ? '🌊 Perfect calculation! City drainage reservoirs deployed without overflow!'
          : '⚠️ Reservoir calculation error! Streets flooded.',
      ];
      return { success: isMatch, log, metric: `${result} Megaliters` };
    },
  },
];

export const ByteCityCrisisGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const scenario = CITY_SCENARIOS[selectedIdx];
  const [code, setCode] = useState(scenario.starterCode);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [metricText, setMetricText] = useState<string>('');

  useEffect(() => {
    setCode(scenario.starterCode);
    setSimulationLog([]);
    setIsSuccess(false);
    setShowHint(false);
    setMetricText('');
  }, [selectedIdx]);

  const handleRunSimulation = () => {
    setRunning(true);
    soundEffects.playPop();

    setTimeout(() => {
      try {
        // Safe evaluation
        // eslint-disable-next-line no-new-func
        const fnName = scenario.starterCode.match(/function\s+(\w+)/)?.[1] || '';
        const userFn = new Function(`${code}; return ${fnName};`)();

        if (typeof userFn !== 'function') {
          throw new Error(`Code must define function "${fnName}".`);
        }

        const simResult = scenario.runSimulation(userFn);
        setSimulationLog(simResult.log);
        setIsSuccess(simResult.success);
        setMetricText(simResult.metric);

        if (simResult.success) {
          soundEffects.playVictory();
          gameRewardService.recordGameLevelComplete(
            'byte_city',
            scenario.id,
            3,
            scenario.rewardCoins
          );
        } else {
          soundEffects.playWa();
        }
      } catch (err: any) {
        setSimulationLog([`⚠️ Error: ${err.message || 'Execution error'}`]);
        soundEffects.playTle();
        setIsSuccess(false);
      } finally {
        setRunning(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-xl">
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
              <span className="text-xl">🏙️</span>
              <h3 className="text-lg font-black text-white">
                Byte City Panic: Real-Life Concept Fixer
              </h3>
            </div>
            <p className="text-xs text-emerald-300">
              Apply real-world algorithmic logic to solve urban crises, scheduling & logistics!
            </p>
          </div>
        </div>

        {/* Scenario Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CITY_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedIdx === idx
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{sc.characterEmoji}</span>
              <span>Case {idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Comic Dialogue Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/30">
        <div className="md:col-span-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-emerald-400/40 flex items-center justify-center text-3xl shadow-lg animate-bounce-subtle">
            {scenario.characterEmoji}
          </div>
          <div>
            <h4 className="font-black text-white text-sm">{scenario.characterName}</h4>
            <span className="text-[10px] font-bold text-emerald-400">Byte City Citizen</span>
          </div>
        </div>

        <div className="md:col-span-7 bg-slate-900/80 p-3 rounded-xl border border-white/10">
          <p className="text-xs text-slate-200 italic">
            &ldquo;{scenario.story}&rdquo;
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
              Real-Life Concept: {scenario.realLifeConcept}
            </span>
          </div>
        </div>

        <div className="md:col-span-2 text-right">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
            +{scenario.rewardCoins} 🪙 Coins
          </span>
        </div>
      </div>

      {/* Code Editor and Simulation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300 flex items-center gap-2">
              <span>🛠️ LOGIC IMPLEMENTATION</span>
              <span className="text-slate-400 font-mono text-[11px]">(Real-Life Algorithm)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint((p) => !p)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {showHint ? 'Hide Hint' : '💡 Concept Hint'}
              </button>
              <button
                type="button"
                onClick={() => setCode(scenario.starterCode)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Reset Code
              </button>
            </div>
          </div>

          {showHint && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs">
              💡 <strong>Real-Life Concept Insight:</strong> {scenario.solutionHint}
            </div>
          )}

          <div className="rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400">{scenario.id}.js</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">● CITY SIMULATOR</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed selection:bg-emerald-600"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={running}
              onClick={handleRunSimulation}
              className={`px-7 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer ${
                running
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black shadow-emerald-500/25 active:scale-95'
              }`}
            >
              {running ? '⏳ Executing Simulation...' : '🚀 DISPATCH ALGORITHM TO CITY'}
            </button>
          </div>
        </div>

        {/* Right: Simulation Telemetry & Real-Life Animation */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-black text-cyan-300 flex items-center justify-between">
            <span>📡 CITY LOGISTICS MONITOR</span>
            {metricText && <span className="font-mono text-amber-400 text-xs">{metricText}</span>}
          </span>

          <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-slate-950/80 backdrop-blur-md min-h-[340px] flex flex-col justify-between shadow-2xl space-y-4">
            {/* Visual Diorama */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-4xl animate-bounce-subtle">{scenario.characterEmoji}</div>
              <h5 className="font-black text-white text-sm">{scenario.title}</h5>
              <p className="text-xs text-slate-400">{scenario.description}</p>
            </div>

            {/* Live Event Feed */}
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Simulation Terminal Feed</span>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1.5 min-h-[140px]">
                {simulationLog.length > 0 ? (
                  simulationLog.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith('🎉') || line.startsWith('🏆')
                          ? 'text-emerald-400 font-bold'
                          : line.startsWith('⚠️')
                          ? 'text-red-400'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-600 italic">Run algorithm to dispatch and monitor city telemetry...</span>
                )}
              </div>
            </div>

            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-between animate-bounce-subtle">
                <span>✓ CITY CRISIS RESOLVED!</span>
                <span>+{scenario.rewardCoins} 🪙 Coins</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
