import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  CalendarIcon,
  TimerIcon,
  ExternalLinkIcon,
  WarningStatusIcon,
  FlameIcon,
} from './icons';
import { CFContest, codeforcesService } from '../services/codeforces';
import { CFProblem, MistakeRecord } from '../types';
import { VirtualContestArenaView } from './VirtualContestArenaView';
import { EmptyContestsState } from './assets';
import { soundEffects } from '../utils/soundEffects';
import { AnimeViewCompanionBanner } from './common/AnimeViewCompanionBanner';

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
      {/* Anime Tournament Cheerleader Banner */}
      <AnimeViewCompanionBanner
        screenTitle="Tournament Arena &amp; Codeforces Contests"
        subtitle="Simulate authentic Codeforces Division 2 &amp; 3 contests under 2-hour battle pressure. Test your time management and claim the champion crown!"
        badgeText="Coliseum Arena"
        badgeIcon="⚔️"
        stickerType="speedrun_1600"
      />

      {/* Top Mode Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => {
              soundEffects.playPop();
              setActiveSubTab('arena');
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'arena'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrophyIcon size={16} />
            <span>Virtual Contest Arena</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                activeSubTab === 'arena' ? 'bg-amber-950/40 text-amber-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Multi-Platform
            </span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPop();
              setActiveSubTab('upcoming');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon size={16} />
            <span>Official Upcoming Schedule</span>
            {contests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800 font-mono">
                {contests.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick reminder pill */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-xl">
          <FlameIcon size={14} className="text-amber-400" />
          <span>Rating 1600 Target: Solve 3–4 problems consistently in virtual rounds</span>
        </div>
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
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CalendarIcon size={16} semantic="primary" />
              <span>Official Codeforces Calendar</span>
            </h3>
            <span className="text-xs text-slate-400">Fetched via official public API</span>
          </div>

          {error && (
            <div className="p-4 rounded-2xl border border-rose-900/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
              <WarningStatusIcon size={16} semantic="error" className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
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
            <div className="space-y-3">
              {contests.slice(0, 15).map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-950/80 hover:border-slate-700 transition-all gap-4 shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-mono font-bold">
                        #{c.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <TimerIcon size={14} semantic="primary" />
                        <span>{formatLocalTime(c.startTimeSeconds || 0)}</span>
                      </span>
                      <span>·</span>
                      <span>Duration: {Math.round(c.durationSeconds / 3600)}h</span>
                      <span>·</span>
                      <span className="text-slate-400">Type: {c.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Starts in
                      </span>
                      <span className="text-sm font-mono font-black text-amber-300">
                        {formatCountdown(c.startTimeSeconds || 0)}
                      </span>
                    </div>

                    <a
                      href={`https://codeforces.com/contestRegistration/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md shadow-indigo-600/20"
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
