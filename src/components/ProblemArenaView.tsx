import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { CFProblem, ProblemAttempt } from '../types';
import { codeforcesService } from '../services/codeforces';

interface ProblemArenaViewProps {
  onSelectProblem: (problem: CFProblem) => void;
  attempts: ProblemAttempt[];
  currentRating?: number;
}

const COMMON_TAGS = [
  'all',
  'implementation',
  'math',
  'greedy',
  'strings',
  'sortings',
  'two pointers',
  'binary search',
  'dp',
  'graphs',
  'number theory',
  'brute force',
];

export const ProblemArenaView: React.FC<ProblemArenaViewProps> = ({
  onSelectProblem,
  attempts,
  currentRating,
}) => {
  const [problems, setProblems] = useState<CFProblem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(800);
  const [maxRating, setMaxRating] = useState<number>(1600);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved'>('all');

  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await codeforcesService.getProblems({
        tag: selectedTag === 'all' ? undefined : selectedTag,
        minRating,
        maxRating,
      });
      setProblems(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch problems from Codeforces API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [selectedTag, minRating, maxRating]);

  // Map attempted and solved status
  const solvedProblemIds = new Set(
    attempts
      .filter((a) => a.officialVerdict === 'OK' || a.outcome === 'solved_independently')
      .map((a) => a.problemId)
  );

  const attemptedProblemIds = new Set(attempts.map((a) => a.problemId));

  const filteredProblems = problems.filter((prob) => {
    const id = `${prob.contestId || ''}${prob.index}`;
    const matchesSearch =
      searchQuery === '' ||
      prob.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());

    const isSolved = solvedProblemIds.has(id);
    if (statusFilter === 'solved' && !isSolved) return false;
    if (statusFilter === 'unsolved' && isSolved) return false;

    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Problem Arena</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real Codeforces problem set filtered for the 800–1600 rating progression. Practice with live hints and draft persistence.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProblems}
          disabled={loading}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Problem Set</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem title or ID (e.g. 4A, Watermelon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Rating Range Selectors */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Rating:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {[800, 900, 1000, 1100, 1200, 1300, 1400, 1500].map((r) => (
                <option key={r} value={r}>Min {r}</option>
              ))}
            </select>
            <span className="text-xs text-slate-500">to</span>
            <select
              value={maxRating}
              onChange={(e) => setMaxRating(Number(e.target.value))}
              className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {[900, 1000, 1100, 1200, 1300, 1400, 1500, 1600].map((r) => (
                <option key={r} value={r}>Max {r}</option>
              ))}
            </select>
          </div>

          {/* Solved Filter */}
          <div className="md:col-span-3 flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            {(['all', 'unsolved', 'solved'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`flex-1 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  statusFilter === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {COMMON_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTag(t)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-all cursor-pointer ${
                selectedTag === t
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Problems List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-2">
          <Search className="w-8 h-8 mx-auto text-slate-500" />
          <h3 className="font-bold text-white text-base">No problems match your filters</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your rating bounds or searching for a different topic tag.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProblems.map((prob) => {
            const id = `${prob.contestId || ''}${prob.index}`;
            const isSolved = solvedProblemIds.has(id);
            const isAttempted = attemptedProblemIds.has(id);

            return (
              <div
                key={id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {prob.contestId}{prob.index}
                    </span>
                    <h4 className="text-sm font-bold text-white">{prob.name}</h4>

                    {prob.rating && (
                      <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold px-2 py-0.5">
                        {prob.rating}
                      </span>
                    )}

                    {isSolved ? (
                      <span className="flex items-center gap-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold px-1.5 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Solved</span>
                      </span>
                    ) : isAttempted ? (
                      <span className="rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-bold px-1.5 py-0.5">
                        Attempted
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {prob.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition-colors"
                    title="View on Codeforces"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectProblem(prob)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 transition-all cursor-pointer shadow-sm"
                  >
                    <span>Solve in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
