import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  CalendarIcon,
  TimerIcon,
  ExternalLinkIcon,
  WarningStatusIcon,
} from './icons';
import { CFContest, codeforcesService } from '../services/codeforces';
import { CFProblem, MistakeRecord } from '../types';
import { VirtualContestArenaView } from './VirtualContestArenaView';
import { EmptyContestsState } from './assets';

interface ContestsViewProps {
  onSelectProblem: (problem: CFProblem) => void;
  onOpenWorkspace?: (problem: CFProblem) => void;
  mistakes?: MistakeRecord[];
  userRating?: number;
}

export const ContestsView: React.FC<ContestsViewProps> = ({
  onSelectProblem,
  onOpenWorkspace,
  mistakes = [],
  userRating = 1000,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'arena' | 'upcoming'>('arena');
  const [contests, setContests] = useState<CFContest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatLocalTime = (startTimeSeconds: number) => {
    return new Date(startTimeSeconds * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCountdown = (startTimeSeconds: number) => {
    const diffSeconds = Math.max(0, startTimeSeconds - Math.floor(Date.now() / 1000));
    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Mode Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('arena')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'arena'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrophyIcon size={16} />
          <span>Virtual Contest Arena</span>
        </button>

        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon size={16} />
          <span>Official Upcoming Schedule</span>
          {contests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800">
              {contests.length}
            </span>
          )}
        </button>
      </div>

      {/* Render selected mode */}
      {activeSubTab === 'arena' ? (
        <VirtualContestArenaView
          onSelectProblem={onSelectProblem}
          onOpenWorkspace={onOpenWorkspace}
          mistakes={mistakes}
          userRating={userRating}
        />
      ) : (
        /* Official Upcoming Codeforces Rounds */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CalendarIcon size={16} semantic="primary" />
              <span>Official Codeforces Calendar</span>
            </h3>
            <span className="text-xs text-slate-400">Fetched via official public API</span>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
              <WarningStatusIcon size={16} semantic="error" className="shrink-0" />
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
            <EmptyContestsState
              title="No Upcoming Contests Scheduled"
              description="No upcoming contests are currently listed in the official Codeforces API schedule. Virtual contests remain available 24/7!"
              actionText="Switch to Virtual Arena"
              onAction={() => setActiveSubTab('arena')}
            />
          ) : (
            <div className="space-y-2.5">
              {contests.slice(0, 10).map((c) => (
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
                        <TimerIcon size={14} semantic="primary" />
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
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
