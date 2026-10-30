import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrophyIcon,
  RunCodeIcon,
  TimerIcon,
  WarningStatusIcon,
  ExternalLinkIcon,
  TerminalIcon,
  CheckIcon,
  SearchIcon,
  CloseIcon,
  CheckCircleIcon,
  AISparkleIcon,
  ChevronRightIcon,
  CopyIcon,
} from './icons';
import { useToast } from './Toast';
import { CFProblem, MistakeRecord } from '../types';
import { CFContest, codeforcesService } from '../services/codeforces';
import { storageService } from '../services/storage';
import { ContestArenaIllustration } from './assets';
import {
  ContestDivision,
  ContestSessionMode,
  VirtualContestState,
  ContestProblemState,
  calculateContestPenalty,
  estimatePerformanceRating,
  generateContestDebrief,
  generateMidContestAdvice,
  generatePreContestChecklist,
  getRecommendedTimeAllocations,
  parseContestDivision,
  recordContestSubmission,
  finalizeVirtualContest,
  generateLocalStandings,
  StandingsRow,
} from '../utils/virtualContest';

interface VirtualContestArenaViewProps {
  onSelectProblem: (problem: CFProblem) => void;
  onOpenWorkspace?: (problem: CFProblem) => void;
  mistakes?: MistakeRecord[];
  userRating?: number;
}

// Curated past Codeforces rounds with known problem sets
const CURATED_PAST_ROUNDS: {
  id: number;
  name: string;
  division: ContestDivision;
  problemCount: number;
  problems: CFProblem[];
}[] = [
  {
    id: 1352,
    name: 'Codeforces Round 640 (Div. 4)',
    division: 'Div. 4',
    problemCount: 7,
    problems: [
      { contestId: 1352, index: 'A', name: 'Sum of Round Numbers', rating: 800, tags: ['math'] },
      { contestId: 1352, index: 'B', name: 'Same Parity Summands', rating: 1200, tags: ['constructive algorithms', 'math'] },
      { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
      { contestId: 1352, index: 'D', name: 'Alice, Bob and Candies', rating: 1300, tags: ['implementation', 'two pointers'] },
      { contestId: 1352, index: 'E', name: 'Special Elements', rating: 1300, tags: ['brute force'] },
      { contestId: 1352, index: 'F', name: 'Binary String Reconstruction', rating: 1400, tags: ['constructive algorithms'] },
      { contestId: 1352, index: 'G', name: 'Special Permutation', rating: 1400, tags: ['constructive algorithms'] },
    ],
  },
  {
    id: 1335,
    name: 'Codeforces Round 634 (Div. 3)',
    division: 'Div. 3',
    problemCount: 6,
    problems: [
      { contestId: 1335, index: 'A', name: 'Candies and Two Sisters', rating: 800, tags: ['math'] },
      { contestId: 1335, index: 'B', name: 'Construct the String', rating: 900, tags: ['constructive algorithms'] },
      { contestId: 1335, index: 'C', name: 'Two Teams Composing', rating: 1100, tags: ['greedy', 'sortings'] },
      { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
      { contestId: 1335, index: 'E1', name: 'Three Blocks Palindrome (easy)', rating: 1500, tags: ['dp', 'two pointers'] },
      { contestId: 1335, index: 'F', name: 'Robots on a Grid', rating: 2100, tags: ['dfs and similar', 'graphs'] },
    ],
  },
  {
    id: 1374,
    name: 'Codeforces Round 653 (Div. 3)',
    division: 'Div. 3',
    problemCount: 5,
    problems: [
      { contestId: 1374, index: 'A', name: 'Required Remainder', rating: 800, tags: ['math'] },
      { contestId: 1374, index: 'B', name: 'Multiply by 2, divide by 6', rating: 900, tags: ['math'] },
      { contestId: 1374, index: 'C', name: 'Move Brackets', rating: 1000, tags: ['greedy', 'strings'] },
      { contestId: 1374, index: 'D', name: 'Zero Remainder Array', rating: 1400, tags: ['math', 'sortings'] },
      { contestId: 1374, index: 'E1', name: 'Reading Books (easy version)', rating: 1500, tags: ['greedy', 'sortings'] },
    ],
  },
  {
    id: 1551,
    name: 'Codeforces Round 734 (Div. 3)',
    division: 'Div. 3',
    problemCount: 6,
    problems: [
      { contestId: 1551, index: 'A', name: 'Polycarp and Coins', rating: 800, tags: ['math'] },
      { contestId: 1551, index: 'B1', name: 'Wonderful Coloring - 1', rating: 800, tags: ['greedy', 'strings'] },
      { contestId: 1551, index: 'B2', name: 'Wonderful Coloring - 2', rating: 1400, tags: ['greedy', 'sortings'] },
      { contestId: 1551, index: 'C', name: 'Interesting Story', rating: 1400, tags: ['greedy', 'sortings', 'strings'] },
      { contestId: 1551, index: 'D1', name: 'Domino (easy version)', rating: 1500, tags: ['constructive algorithms', 'math'] },
      { contestId: 1551, index: 'E', name: 'Fixed Points', rating: 1800, tags: ['binary search', 'dp'] },
    ],
  },
  {
    id: 1676,
    name: 'Codeforces Round 790 (Div. 4)',
    division: 'Div. 4',
    problemCount: 8,
    problems: [
      { contestId: 1676, index: 'A', name: 'Lucky?', rating: 800, tags: ['implementation'] },
      { contestId: 1676, index: 'B', name: 'Equal Candies', rating: 800, tags: ['greedy', 'math', 'sortings'] },
      { contestId: 1676, index: 'C', name: 'Most Similar Words', rating: 800, tags: ['brute force', 'strings'] },
      { contestId: 1676, index: 'D', name: 'X-Sum', rating: 1000, tags: ['brute force', 'implementation'] },
      { contestId: 1676, index: 'E', name: 'Eating Queries', rating: 1100, tags: ['binary search', 'greedy', 'sortings'] },
      { contestId: 1676, index: 'F', name: 'Longest Strike', rating: 1300, tags: ['data structures', 'greedy', 'sortings', 'two pointers'] },
      { contestId: 1676, index: 'G', name: 'White-Black Balanced Subtrees', rating: 1300, tags: ['dfs and similar', 'dp', 'trees'] },
      { contestId: 1676, index: 'H1', name: 'Maximum Crossings (Easy Version)', rating: 1400, tags: ['data structures', 'implementation'] },
    ],
  },
  {
    id: 1520,
    name: 'Codeforces Round 719 (Div. 3)',
    division: 'Div. 3',
    problemCount: 6,
    problems: [
      { contestId: 1520, index: 'A', name: 'Do Not Be Distracted!', rating: 800, tags: ['brute force', 'strings'] },
      { contestId: 1520, index: 'B', name: 'Ordinary Numbers', rating: 800, tags: ['math'] },
      { contestId: 1520, index: 'C', name: 'Not Adjacent Matrix', rating: 1000, tags: ['constructive algorithms'] },
      { contestId: 1520, index: 'D', name: 'Same Differences', rating: 1200, tags: ['combinatorics', 'data structures', 'math'] },
      { contestId: 1520, index: 'E', name: 'Arranging The Sheep', rating: 1400, tags: ['greedy', 'math', 'two pointers'] },
      { contestId: 1520, index: 'F1', name: 'Guess the K-th Zero (Easy version)', rating: 1600, tags: ['binary search', 'interactive'] },
    ],
  },
  {
    id: 1613,
    name: 'Educational Codeforces Round 118',
    division: 'Educational',
    problemCount: 5,
    problems: [
      { contestId: 1613, index: 'A', name: 'Long Comparison', rating: 900, tags: ['math'] },
      { contestId: 1613, index: 'B', name: 'Absent Remainder', rating: 1000, tags: ['greedy', 'sortings'] },
      { contestId: 1613, index: 'C', name: 'Poisoned Dagger', rating: 1200, tags: ['binary search'] },
      { contestId: 1613, index: 'D', name: 'MEX Sequences', rating: 1900, tags: ['dp', 'math'] },
      { contestId: 1613, index: 'E', name: 'Crazy Robot', rating: 2000, tags: ['dfs and similar', 'graphs'] },
    ],
  },
];

export const VirtualContestArenaView: React.FC<VirtualContestArenaViewProps> = ({
  onSelectProblem,
  onOpenWorkspace,
  mistakes = [],
  userRating = 1000,
}) => {
  const toast = useToast();
  // Navigation State
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeContestId, setActiveContestId] = useState<number>(CURATED_PAST_ROUNDS[0].id);

  // Pre-Contest Config Modal
  const [showPreContestBriefing, setShowPreContestBriefing] = useState<boolean>(false);
  const [sessionMode, setSessionMode] = useState<ContestSessionMode>('simulated');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(120);

  // Active Contest Simulation State
  const [contestState, setContestState] = useState<VirtualContestState | null>(null);
  const [activeProblemIndex, setActiveProblemIndex] = useState<string>('A');
  const [timeSpentOnActiveProblem, setTimeSpentOnActiveProblem] = useState<number>(0);
  const [showDebrief, setShowDebrief] = useState<boolean>(false);
  const [activeArenaTab, setActiveArenaTab] = useState<'problems' | 'standings'>('problems');
  const [mobileArenaPane, setMobileArenaPane] = useState<'list' | 'solver'>('solver');

  // Timer Tick
  useEffect(() => {
    if (!contestState || contestState.isPaused || contestState.isCompleted) return;

    const timer = setInterval(() => {
      setContestState((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          clearInterval(timer);
          const finalized = finalizeVirtualContest({ ...prev, secondsRemaining: 0 });
          storageService.saveVirtualContest(finalized);
          return finalized;
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });

      setTimeSpentOnActiveProblem((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [contestState?.isPaused, contestState?.isCompleted]);

  // Strategy Coach Advice Monitor
  const currentAdvice = useMemo(() => {
    if (!contestState || contestState.isCompleted) return null;
    const currentProb = contestState.problems.find(
      (p) => p.problem.index === activeProblemIndex
    );
    if (!currentProb || currentProb.status === 'solved') return null;

    return generateMidContestAdvice(
      timeSpentOnActiveProblem,
      currentProb.attemptsCount,
      activeProblemIndex
    );
  }, [contestState, activeProblemIndex, timeSpentOnActiveProblem]);

  // Launch Virtual Contest Session
  const handleStartContest = () => {
    const round = CURATED_PAST_ROUNDS.find((r) => r.id === activeContestId) || CURATED_PAST_ROUNDS[0];
    const initialProblems: ContestProblemState[] = round.problems.map((p) => ({
      problem: p,
      status: 'unattempted',
      attemptsCount: 0,
      penaltyMinutes: 0,
    }));

    const durationSeconds = sessionDurationMinutes * 60;

    const newContest: VirtualContestState = {
      id: `vc_${Date.now()}`,
      contestId: round.id,
      contestName: round.name,
      division: round.division,
      mode: sessionMode,
      durationSeconds,
      secondsRemaining: durationSeconds,
      isPaused: false,
      isCompleted: false,
      startedAt: new Date().toISOString(),
      hideTagsAndRatings: sessionMode === 'simulated',
      problems: initialProblems,
      strategyPrompts: [],
    };

    setContestState(newContest);
    setActiveProblemIndex(round.problems[0].index);
    setTimeSpentOnActiveProblem(0);
    setActiveArenaTab('problems');
    setShowPreContestBriefing(false);
    setShowDebrief(false);
  };

  // Mark Problem As Solved
  const handleMarkProblemSolved = (index: string) => {
    if (!contestState) return;
    const elapsedSeconds = contestState.durationSeconds - contestState.secondsRemaining;
    const updated = recordContestSubmission(contestState, index, 'OK', elapsedSeconds);
    setContestState(updated);
  };

  // Log Failed Attempt
  const handleLogFailedAttempt = (
    index: string,
    verdict: 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' = 'WRONG_ANSWER'
  ) => {
    if (!contestState) return;
    const elapsedSeconds = contestState.durationSeconds - contestState.secondsRemaining;
    const updated = recordContestSubmission(contestState, index, verdict, elapsedSeconds);
    setContestState(updated);
  };

  // End Contest Manually
  const handleEndContest = () => {
    if (!contestState) return;
    const finalized = finalizeVirtualContest(contestState);
    setContestState(finalized);
    storageService.saveVirtualContest(finalized);
    setShowDebrief(true);
  };

  // Local Standings
  const localStandings = useMemo(() => {
    if (!contestState) return [];
    return generateLocalStandings(contestState, 'You');
  }, [contestState]);

  // Filtered Rounds
  const filteredRounds = useMemo(() => {
    return CURATED_PAST_ROUNDS.filter((r) => {
      const matchDiv = selectedDivision === 'All' || r.division === selectedDivision;
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.id).includes(searchQuery);
      return matchDiv && matchSearch;
    });
  }, [selectedDivision, searchQuery]);

  const selectedRound = useMemo(() => {
    return CURATED_PAST_ROUNDS.find((r) => r.id === activeContestId) || CURATED_PAST_ROUNDS[0];
  }, [activeContestId]);

  const preContestChecklist = useMemo(() => {
    return generatePreContestChecklist(selectedRound.division, mistakes);
  }, [selectedRound, mistakes]);

  // Active Problem
  const currentProblemState = useMemo(() => {
    if (!contestState) return null;
    return contestState.problems.find((p) => p.problem.index === activeProblemIndex) || contestState.problems[0];
  }, [contestState, activeProblemIndex]);

  // Scoring
  const contestScore = useMemo(() => {
    if (!contestState) return { solvedCount: 0, totalPenaltyMinutes: 0 };
    return calculateContestPenalty(contestState.problems);
  }, [contestState]);

  // Debrief
  const debriefData = useMemo(() => {
    if (!contestState) return null;
    return generateContestDebrief(contestState, userRating);
  }, [contestState, userRating]);

  // Time format helper
  const formatTimeRemaining = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrophyIcon size={20} semantic="warning" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Virtual Contest Arena</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate real Codeforces past rounds under strict contest pressure, penalty scoring, and live Strategy Coach prompts.
              </p>
            </div>
          </div>
        </div>

        {contestState && !contestState.isCompleted && (
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                contestState.secondsRemaining <= 300
                  ? 'bg-rose-950/80 border-rose-500 shadow-md shadow-rose-500/20 text-rose-200 animate-pulse'
                  : contestState.secondsRemaining <= 600
                  ? 'bg-amber-950/80 border-amber-500 shadow-sm shadow-amber-500/20 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              <TimerIcon
                size={16}
                semantic={
                  contestState.secondsRemaining <= 300
                    ? 'error'
                    : contestState.secondsRemaining <= 600
                    ? 'warning'
                    : 'primary'
                }
              />
              <span className="font-mono font-bold text-sm">
                {formatTimeRemaining(contestState.secondsRemaining)}
              </span>
              {contestState.secondsRemaining <= 300 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white uppercase">
                  5m Left
                </span>
              )}
            </div>

            <button
              onClick={() =>
                setContestState((prev) => (prev ? { ...prev, isPaused: !prev.isPaused } : null))
              }
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title={contestState.isPaused ? 'Resume Contest' : 'Pause Contest'}
            >
              {contestState.isPaused ? <RunCodeIcon size={16} /> : <TimerIcon size={16} />}
            </button>

            <button
              onClick={handleEndContest}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md"
            >
              Finish & Debrief
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE CONTEST WORKSPACE (If session is running) */}
      {contestState && !contestState.isCompleted ? (
        <div className="space-y-4">
          {/* Strategy Coach Alert Banner if triggered */}
          {currentAdvice && (
            <div className="p-4 rounded-2xl border border-amber-800/80 bg-amber-950/40 space-y-1 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <WarningStatusIcon size={16} semantic="warning" />
                <span>Strategy Coach Mid-Contest Alert</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">{currentAdvice}</p>
            </div>
          )}

          {/* Arena Navigation Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveArenaTab('problems')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeArenaTab === 'problems'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Problems & Submissions
              </button>
              <button
                onClick={() => setActiveArenaTab('standings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeArenaTab === 'standings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrophyIcon size={14} />
                <span>Scoreboard ({contestScore.solvedCount} AC)</span>
              </button>
            </div>
          </div>

          {activeArenaTab === 'standings' ? (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <TrophyIcon size={16} semantic="warning" />
                    <span>Live Contest Scoreboard</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ranked by problems solved (descending), then penalty minutes (ascending).
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Round #{contestState.contestId} · {contestState.division}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold w-12">#</th>
                      <th className="py-2.5 px-3 font-semibold">Contestant</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20">Solved</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-24">Penalty</th>
                      {contestState.problems.map((p) => (
                        <th key={p.problem.index} className="py-2.5 px-2 font-mono text-center w-20">
                          {p.problem.index}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {localStandings.map((row) => (
                      <tr
                        key={row.handle}
                        className={`${
                          row.isCurrentUser
                            ? 'bg-indigo-950/40 font-bold border-l-2 border-indigo-500'
                            : 'hover:bg-slate-800/20'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-400">{row.rank}</td>
                        <td className="py-2.5 px-3">
                          <span className={row.isCurrentUser ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                            {row.handle} {row.isCurrentUser && '(You)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">
                          {row.solvedCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {row.totalPenaltyMinutes}m
                        </td>
                        {contestState.problems.map((p) => {
                          const pStat = row.problemStatuses[p.problem.index];
                          return (
                            <td key={p.problem.index} className="py-2 px-2 text-center font-mono">
                              {pStat ? (
                                pStat.solved ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300">
                                    +{pStat.attempts > 1 ? pStat.attempts - 1 : ''}
                                    {pStat.solveTimeMin !== undefined ? ` (${pStat.solveTimeMin}m)` : ''}
                                  </span>
                                ) : pStat.attempts > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-[10px] text-rose-300">
                                    -{pStat.attempts}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">·</span>
                                )
                              ) : (
                                <span className="text-slate-600">·</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
          <div>
            {/* Mobile switcher between Problem list and Solver pane */}
            <div className="lg:hidden flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 gap-1 mb-3">
              <button
                onClick={() => setMobileArenaPane('list')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  mobileArenaPane === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Problem Set ({contestScore.solvedCount}/{contestState.problems.length} AC)
              </button>
              <button
                onClick={() => setMobileArenaPane('solver')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  mobileArenaPane === 'solver'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Solving Problem {activeProblemIndex}
              </button>
            </div>

            {/* Arena Grid: Problems Table on Left (4 cols), Active Problem Solver on Right (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Contest Problems Status Table */}
              <div className={`lg:col-span-4 space-y-4 ${mobileArenaPane !== 'list' ? 'hidden lg:block' : 'block'}`}>
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">{contestState.contestName}</h3>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {contestState.division} · {contestState.mode} mode
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {contestScore.solvedCount} AC
                      </span>
                      <p className="text-[10px] text-slate-500">{contestScore.totalPenaltyMinutes}m penalty</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {contestState.problems.map((p) => {
                      const isCurrent = p.problem.index === activeProblemIndex;
                      const isSolved = p.status === 'solved';
                      const isFailed = p.status === 'failed';

                      return (
                        <div
                          key={p.problem.index}
                          onClick={() => {
                            setActiveProblemIndex(p.problem.index);
                            setTimeSpentOnActiveProblem(0);
                            setMobileArenaPane('solver');
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            isCurrent
                              ? 'border-indigo-500 bg-indigo-950/60 shadow-md ring-1 ring-indigo-500/30'
                              : isSolved
                              ? 'border-emerald-800/60 bg-emerald-950/30 hover:border-emerald-700'
                              : isFailed
                              ? 'border-red-800/60 bg-red-950/30 hover:border-red-700'
                              : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                          }`}
                        >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 font-mono font-bold flex items-center justify-center shrink-0">
                            {p.problem.index}
                          </span>
                          <div className="truncate">
                            <h4 className="font-semibold text-slate-200 truncate">
                              {p.problem.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {p.attemptsCount > 0 && (
                                <span>{p.attemptsCount} attempt{p.attemptsCount > 1 ? 's' : ''}</span>
                              )}
                              {isSolved && p.solvedTimeSeconds && (
                                <span className="text-emerald-400">
                                  at {Math.floor(p.solvedTimeSeconds / 60)}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isSolved ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px]">
                              +AC
                            </span>
                          ) : isFailed ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-950 border border-red-800 text-red-300 font-bold text-[10px]">
                              -{p.attemptsCount}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono text-[11px]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Active Problem Statement, Workspace Trigger & Verdict Buttons */}
            {currentProblemState && (
              <div className={`lg:col-span-8 space-y-4 ${mobileArenaPane !== 'solver' ? 'hidden lg:block' : 'block'}`}>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
                  {/* Mobile Back Button */}
                  <div className="lg:hidden pb-1">
                    <button
                      onClick={() => setMobileArenaPane('list')}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                    >
                      <span>← Back to Problem List</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-xl">
                        {currentProblemState.problem.index}
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-slate-100">
                          {currentProblemState.problem.name}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>Contest {contestState.contestId}</span>
                          {!contestState.hideTagsAndRatings && currentProblemState.problem.rating && (
                            <>
                              <span>·</span>
                              <span className="text-amber-400 font-semibold">
                                ⚡ Rating {currentProblemState.problem.rating}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://codeforces.com/contest/${contestState.contestId}/problem/${currentProblemState.problem.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                      >
                        <span>Official Statement</span>
                        <ExternalLinkIcon size={14} />
                      </a>

                      {onOpenWorkspace && (
                        <button
                          onClick={() => onOpenWorkspace(currentProblemState.problem)}
                          className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all cursor-pointer"
                        >
                          <TerminalIcon size={14} />
                          <span>Code in Workspace</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submission Result Controller */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Submit Verdict on Problem {currentProblemState.problem.index}
                    </span>

                    <p className="text-xs text-slate-400">
                      Write your code in the Debugging Workspace or on Codeforces, then record your verdict to update contest standings:
                    </p>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <button
                        onClick={() => handleMarkProblemSolved(currentProblemState.problem.index)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <CheckIcon size={16} semantic="success" />
                        <span>Accepted (AC)</span>
                      </button>

                      <button
                        onClick={() => handleLogFailedAttempt(currentProblemState.problem.index, 'WRONG_ANSWER')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <span>Wrong Answer (WA)</span>
                      </button>

                      <button
                        onClick={() => handleLogFailedAttempt(currentProblemState.problem.index, 'TIME_LIMIT_EXCEEDED')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <span>Time Limit (TLE)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        </div>
      ) : (
        /* CONTEST BROWSER & PRE-CONTEST PREPARATION */
        <div className="space-y-6">
          {/* Vibrant Contest Arena Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-900/40 bg-gradient-to-r from-[#110b24] via-[#1e1035] to-[#080c18] p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <TrophyIcon size={14} />
                  <span>Competitive Arena Simulation</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Simulate Real Codeforces Contests
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Test your algorithmic problem-solving speed under real contest conditions. Live scoreboard tracking, official 20-minute WA penalties, and adaptive mid-contest strategic advice.
                </p>
              </div>
              <div className="md:col-span-5 flex justify-center">
                <ContestArenaIllustration height={140} className="rounded-xl overflow-hidden shadow-lg border border-white/5" />
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {['All', 'Div. 2', 'Div. 3', 'Div. 4'].map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search past rounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Past Rounds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredRounds.map((round) => {
              const isSelected = activeContestId === round.id;

              return (
                <div
                  key={round.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-950/30 shadow-lg'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-indigo-400 font-bold">Round #{round.id}</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 font-semibold text-slate-300 text-[10px]">
                        {round.division}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{round.name}</h3>

                    <p className="text-xs text-slate-400">
                      Standard {round.problemCount}-problem contest. Recommended target: 3–4 solves for Rating 1600 milestone.
                    </p>

                    {/* Problem chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {round.problems.map((p) => (
                        <span
                          key={p.index}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                        >
                          {p.index} ({p.rating || '?'})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-xs text-slate-500">2.0 Hours Standard</span>
                    <button
                      onClick={() => {
                        setActiveContestId(round.id);
                        setShowPreContestBriefing(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <RunCodeIcon size={14} />
                      <span>Prepare & Enter Contest</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pre-Contest Strategy & Briefing Modal */}
      {showPreContestBriefing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrophyIcon size={20} semantic="warning" />
                <h3 className="font-bold text-slate-100 text-base">
                  Pre-Contest Briefing: {selectedRound.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPreContestBriefing(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Mode & Duration Config */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Contest Mode:</label>
                <select
                  value={sessionMode}
                  onChange={(e) => setSessionMode(e.target.value as ContestSessionMode)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="simulated">Simulated (Strict, Hide Tags)</option>
                  <option value="practice">Practice (Pausable, Visible Tags)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Duration (Minutes):</label>
                <select
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="60">60 Minutes (Speed Drill)</option>
                  <option value="90">90 Minutes (Express Round)</option>
                  <option value="120">120 Minutes (Standard CF)</option>
                </select>
              </div>
            </div>

            {/* Strategy Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <WarningStatusIcon size={16} semantic="warning" /> Pre-Contest Strategy Checklist
              </h4>
              <ul className="space-y-1.5">
                {preContestChecklist.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <CheckCircleIcon size={14} semantic="success" className="shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Allocation Recommendation */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/40 text-xs space-y-1">
              <span className="font-semibold text-indigo-300">
                Recommended Allocation for 1600 Target:
              </span>
              <p className="text-slate-300 text-[11px]">
                Problem A: ~15 mins · Problem B: ~25 mins · Problem C: ~45 mins. Leave remaining time to verify boundary invariants on C!
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowPreContestBriefing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartContest}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                Start Virtual Contest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Contest Debrief Modal */}
      {showDebrief && debriefData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrophyIcon size={20} semantic="success" />
                <h3 className="font-bold text-slate-100 text-base">
                  Contest Debrief: {debriefData.contestName}
                </h3>
              </div>
              <button
                onClick={() => setShowDebrief(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Standings Summary Strip */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Final Rank</span>
                <p className="text-xl font-bold font-mono text-indigo-400 mt-1">
                  #{localStandings.find((r) => r.isCurrentUser)?.rank || 1}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Problems Solved</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {debriefData.totalSolved} / {debriefData.totalProblems}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Penalty</span>
                <p className="text-xl font-bold font-mono text-slate-200 mt-1">
                  {debriefData.totalPenaltyMinutes}m
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Performance Rating</span>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                  ~{debriefData.estimatedPerformanceRating}
                </p>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Key Strategic Takeaways
              </h4>
              <ul className="space-y-1.5">
                {debriefData.keyTakeaways.map((takeaway, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <AISparkleIcon size={14} semantic="primary" className="shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upsolving Queue */}
            {debriefData.upsolvingQueue.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <TerminalIcon size={14} /> Recommended Upsolving Queue ({debriefData.upsolvingQueue.length} unsolved)
                  </h4>
                  <button
                    onClick={() => {
                      const firstUnsolved = debriefData.upsolvingQueue[0];
                      setShowDebrief(false);
                      if (onOpenWorkspace) onOpenWorkspace(firstUnsolved);
                      else onSelectProblem(firstUnsolved);
                      toast.show(`Opened Problem ${firstUnsolved.index} in Workspace for upsolving!`, 'info');
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    <span>Upsolve Next: Problem {debriefData.upsolvingQueue[0].index}</span>
                    <ChevronRightIcon size={12} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {debriefData.upsolvingQueue.map((prob) => (
                    <div
                      key={prob.index}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{prob.index}</span>
                        <span className="text-slate-300">{prob.name}</span>
                        {prob.rating && (
                          <span className="text-[11px] text-amber-400 font-semibold">⚡ {prob.rating}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://codeforces.com/contest/${contestState?.contestId}/problem/${prob.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1"
                        >
                          <ExternalLinkIcon size={12} />
                          <span>CF</span>
                        </a>
                        <button
                          onClick={() => {
                            setShowDebrief(false);
                            if (onOpenWorkspace) onOpenWorkspace(prob);
                            else onSelectProblem(prob);
                            toast.show(`Opened Problem ${prob.index} in Workspace`, 'info');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Upsolve in IDE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const summary = `🏆 Codeforces Round #${contestState?.contestId} (${contestState?.division})\n` +
                    `Solved: ${debriefData.totalSolved}/${debriefData.totalProblems} | Penalty: ${debriefData.totalPenaltyMinutes}m | Performance: ~${debriefData.estimatedPerformanceRating}\n` +
                    `Upsolving Queue: ${debriefData.upsolvingQueue.map(p => p.index).join(', ') || 'All Solved!'}`;
                  navigator.clipboard.writeText(summary);
                  toast.show('Contest summary copied to clipboard!', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
              >
                <CopyIcon size={14} />
                <span>Copy Summary</span>
              </button>

              <div className="flex items-center gap-2">
                {debriefData.upsolvingQueue.length > 0 && (
                  <button
                    onClick={() => {
                      const first = debriefData.upsolvingQueue[0];
                      setShowDebrief(false);
                      if (onOpenWorkspace) onOpenWorkspace(first);
                      else onSelectProblem(first);
                      toast.show(`Starting upsolve on Problem ${first.index}`, 'info');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <TerminalIcon size={14} />
                    <span>Upsolve Problem {debriefData.upsolvingQueue[0].index}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDebrief(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
