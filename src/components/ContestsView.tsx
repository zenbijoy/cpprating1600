import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Target,
  Sparkles,
} from 'lucide-react';
import { CFContest, codeforcesService } from '../services/codeforces';
import { CFProblem } from '../types';

interface ContestsViewProps {
  onSelectProblem: (problem: CFProblem) => void;
}

export const ContestsView: React.FC<ContestsViewProps> = ({ onSelectProblem }) => {
  const [contests, setContests] = useState<CFContest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Virtual Contest Simulator
  const [virtualActive, setVirtualActive] = useState<boolean>(false);
  const [virtualDuration, setVirtualDuration] = useState<number>(7200); // 2 hours
  const [virtualSecondsRemaining, setVirtualSecondsRemaining] = useState<number>(7200);
  const [virtualTimerRunning, setVirtualTimerRunning] = useState<boolean>(false);

  const virtualProblems: CFProblem[] = [
    { contestId: 1335, index: 'A', name: 'Candies and Two Sisters', rating: 800, tags: ['math'] },
    { contestId: 1335, index: 'B', name: 'Construct the String', rating: 900, tags: ['constructive algorithms'] },
    { contestId: 1335, index: 'C', name: 'Two Teams Composing', rating: 1100, tags: ['greedy', 'sortings'] },
    { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
  ];

  useEffect(() => {
    async function loadContests() {
      setLoading(true);
      setError(null);
      try {
        const list = await codeforcesService.getUpcomingContests();
        setContests(list);
      } catch (err: any) {
        setError(err.message || 'Could not fetch contests from Codeforces.');
      } finally {
        setLoading(false);
      }
    }
    loadContests();
  }, []);

  // Virtual Contest Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (virtualTimerRunning && virtualSecondsRemaining > 0) {
      interval = setInterval(() => {
        setVirtualSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [virtualTimerRunning, virtualSecondsRemaining]);

  const formatCountdown = (startTimeSeconds?: number) => {
    if (!startTimeSeconds) return 'TBA';
    const now = Math.floor(Date.now() / 1000);
    const diff = startTimeSeconds - now;
    if (diff <= 0) return 'Live / Recent';
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatLocalTime = (startTimeSeconds?: number) => {
    if (!startTimeSeconds) return '';
    return new Date(startTimeSeconds * 1000).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Contest Training Center</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Track official rated rounds in your local timezone, or simulate timed virtual contests with no hints to build competition composure.
        </p>
      </div>

      {/* Virtual Contest Simulator Panel */}
      <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Exam Simulation
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Virtual Div.3 / Div.2 Mock Round
            </h3>
            <p className="text-xs text-slate-300">
              4 real Codeforces problems (800 to 1300). AI hints are suppressed during virtual rounds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl font-mono font-black text-amber-300 bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-xl shadow-inner">
              {formatTimer(virtualSecondsRemaining)}
            </div>

            {!virtualActive ? (
              <button
                type="button"
                onClick={() => {
                  setVirtualActive(true);
                  setVirtualTimerRunning(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Mock Contest</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVirtualTimerRunning(!virtualTimerRunning)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3.5 py-2 cursor-pointer"
              >
                <span>{virtualTimerRunning ? 'Pause' : 'Resume'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Virtual Round Problems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {virtualProblems.map((prob, idx) => (
            <div
              key={prob.index}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">Problem {prob.index}</span>
                  <span className="rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold px-1.5 py-0.2 border border-cyan-800/60">
                    {prob.rating}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-1 truncate">{prob.name}</h4>
              </div>

              <button
                type="button"
                onClick={() => onSelectProblem(prob)}
                className="w-full text-center rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white py-1.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Attempt Problem {prob.index}
              </button>
            </div>
          ))}
        </div>

        {/* Post-Contest Upsolving Checklist */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5 text-slate-300">
          <span className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>The Upsolving Protocol</span>
          </span>
          <p className="text-[11px] text-slate-400">
            Rule of competitive programming: Real rating growth occurs when you solve <strong>at least one problem you failed during the contest</strong> within 24 hours.
          </p>
        </div>
      </div>

      {/* Official Upcoming Codeforces Rounds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Official Codeforces Calendar</span>
          </h3>
          <span className="text-xs text-slate-400">Fetched via official public API</span>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center text-xs text-slate-400">
            No upcoming contests scheduled in the official API right now. Check back soon!
          </div>
        ) : (
          <div className="space-y-2.5">
            {contests.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400">#{c.id}</span>
                    <h4 className="text-sm font-bold text-white">{c.name}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formatLocalTime(c.startTimeSeconds)}</span>
                    </span>
                    <span>Duration: {Math.round(c.durationSeconds / 3600)}h</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Starts in</span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {formatCountdown(c.startTimeSeconds)}
                    </span>
                  </div>

                  <a
                    href={`https://codeforces.com/contestRegistration/${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 transition-all shadow-sm"
                  >
                    <span>Register on CF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
