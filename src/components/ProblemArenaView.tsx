import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ProblemsIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  CloseIcon,
  BookmarksIcon,
  ProblemTagsIcon,
  CheckCircleIcon,
  TimerIcon,
  BookmarkActionIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
} from './icons';
import { CFProblem, ProblemAttempt } from '../types';
import { codeforcesService } from '../services/codeforces';
import { cfStorageService } from '../services/storage';
import { EmptyProblemsState, EmptyOfflineState, RocketLoading } from './assets';

interface ProblemArenaViewProps {
  onSelectProblem: (problem: CFProblem) => void;
  attempts: ProblemAttempt[];
  currentRating?: number;
}

const COMMON_TAGS = [
  'implementation',
  'math',
  'greedy',
  'strings',
  'sortings',
  'two pointers',
  'binary search',
  'dp',
  'graphs',
  'dfs and similar',
  'trees',
  'number theory',
  'brute force',
  'constructive algorithms',
  'data structures',
  'prefix sums',
  'bitmasks',
  'combinatorics',
  'geometry',
];

const PAGE_SIZE = 50;

// Sync filters with URL query params
function getFiltersFromURL() {
  const p = new URLSearchParams(window.location.search);
  return {
    search: p.get('q') ?? '',
    tag: p.get('tag') ?? 'all',
    minRating: Number(p.get('minR') ?? 800),
    maxRating: Number(p.get('maxR') ?? 1600),
    status: (p.get('status') as 'all' | 'unsolved' | 'solved' | 'bookmarked') ?? 'all',
  };
}

function pushFiltersToURL(filters: ReturnType<typeof getFiltersFromURL>) {
  const p = new URLSearchParams();
  if (filters.search) p.set('q', filters.search);
  if (filters.tag !== 'all') p.set('tag', filters.tag);
  if (filters.minRating !== 800) p.set('minR', String(filters.minRating));
  if (filters.maxRating !== 1600) p.set('maxR', String(filters.maxRating));
  if (filters.status !== 'all') p.set('status', filters.status);
  const newUrl = `${window.location.pathname}${p.toString() ? '?' + p.toString() : ''}`;
  window.history.replaceState(null, '', newUrl);
}

export const ProblemArenaView: React.FC<ProblemArenaViewProps> = ({
  onSelectProblem,
  attempts,
  currentRating,
}) => {
  const initial = getFiltersFromURL();
  const [problems, setProblems] = useState<CFProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initial.search);
  const [selectedTag, setSelectedTag] = useState(initial.tag);
  const [minRating, setMinRating] = useState(initial.minRating);
  const [maxRating, setMaxRating] = useState(initial.maxRating);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved' | 'bookmarked'>(initial.status);
  const [sortBy, setSortBy] = useState<'rating-asc' | 'rating-desc' | 'contest-desc' | 'contest-asc' | 'name-asc'>('rating-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    const bms = cfStorageService.getBookmarks();
    return new Set(bms.map(b => b.problemId));
  });

  // Focus search box with '/' hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // CF submissions for solve status
  const cfSubmissions = useMemo(() => cfStorageService.getCFSubmissions(), []);
  const cfSolvedIds = useMemo(() => {
    const s = new Set<string>();
    for (const sub of cfSubmissions) {
      if (sub.verdict === 'OK') {
        s.add(`${sub.problem.contestId ?? ''}${sub.problem.index}`);
      }
    }
    return s;
  }, [cfSubmissions]);

  // Local attempt status
  const solvedProblemIds = useMemo(() => new Set(
    attempts
      .filter(a => a.officialVerdict === 'OK' || a.outcome === 'solved_independently')
      .map(a => a.problemId)
  ), [attempts]);

  const attemptedProblemIds = useMemo(() => new Set(attempts.map(a => a.problemId)), [attempts]);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
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
  }, [selectedTag, minRating, maxRating]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  // Sync URL
  useEffect(() => {
    pushFiltersToURL({ search: searchQuery, tag: selectedTag, minRating, maxRating, status: statusFilter });
  }, [searchQuery, selectedTag, minRating, maxRating, statusFilter]);

  const filteredProblems = useMemo(() => {
    return problems.filter(prob => {
      const id = `${prob.contestId ?? ''}${prob.index}`;
      const matchesSearch =
        searchQuery === '' ||
        prob.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        id.toLowerCase().includes(searchQuery.toLowerCase());

      const isSolved = solvedProblemIds.has(id) || cfSolvedIds.has(id);
      const isBookmarked = bookmarks.has(id);

      if (statusFilter === 'solved' && !isSolved) return false;
      if (statusFilter === 'unsolved' && isSolved) return false;
      if (statusFilter === 'bookmarked' && !isBookmarked) return false;

      return matchesSearch;
    });
  }, [problems, searchQuery, statusFilter, solvedProblemIds, cfSolvedIds, bookmarks]);

  const sortedProblems = useMemo(() => {
    const list = [...filteredProblems];
    if (sortBy === 'rating-asc') {
      list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'rating-desc') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'contest-desc') {
      list.sort((a, b) => (b.contestId || 0) - (a.contestId || 0));
    } else if (sortBy === 'contest-asc') {
      list.sort((a, b) => (a.contestId || 0) - (b.contestId || 0));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredProblems, sortBy]);

  const displayedProblems = sortedProblems.slice(0, page * PAGE_SIZE);
  const hasMore = displayedProblems.length < sortedProblems.length;

  const filterStats = useMemo(() => {
    let solvedCount = 0;
    for (const p of filteredProblems) {
      const id = `${p.contestId ?? ''}${p.index}`;
      if (solvedProblemIds.has(id) || cfSolvedIds.has(id)) solvedCount++;
    }
    return {
      total: filteredProblems.length,
      solved: solvedCount,
      pct: filteredProblems.length > 0 ? Math.round((solvedCount / filteredProblems.length) * 100) : 0,
    };
  }, [filteredProblems, solvedProblemIds, cfSolvedIds]);

  const handlePickRandom = () => {
    const pool = filteredProblems.length > 0 ? filteredProblems : problems;
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    onSelectProblem(chosen);
  };

  const toggleBookmark = (prob: CFProblem) => {
    const id = `${prob.contestId ?? ''}${prob.index}`;
    if (bookmarks.has(id)) {
      cfStorageService.removeBookmark(id);
      setBookmarks(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      cfStorageService.saveBookmark({
        problemId: id,
        contestId: prob.contestId,
        index: prob.index,
        name: prob.name,
        rating: prob.rating,
        tags: prob.tags,
        savedAt: new Date().toISOString(),
      });
      setBookmarks(prev => new Set([...prev, id]));
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTag('all');
    setMinRating(800);
    setMaxRating(1600);
    setStatusFilter('all');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedTag !== 'all' || minRating !== 800 || maxRating !== 1600 || statusFilter !== 'all';

  const getRatingColor = (r?: number) => {
    if (!r) return 'text-slate-500';
    if (r < 1200) return 'text-green-400';
    if (r < 1400) return 'text-cyan-400';
    if (r < 1600) return 'text-blue-400';
    if (r < 1900) return 'text-violet-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Visual Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <ProblemsIcon size={14} semantic="primary" />
              <span>Official Codeforces Problemset</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Problem Arena & Archive
            </h1>
            <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-300 font-medium">
              <span className="bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg">
                📚 <strong>{loading ? '...' : filteredProblems.length.toLocaleString()}</strong> available
              </span>
              <span className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-lg">
                ✅ <strong>{filterStats.solved}</strong> solved ({filterStats.pct}%)
              </span>
              {currentRating && (
                <span className="bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 px-2.5 py-1 rounded-lg">
                  🎯 Rating <strong>{currentRating}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={handlePickRandom}
              disabled={loading || filteredProblems.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              title="Pick a random problem from current filter"
            >
              <RefreshIcon size={14} semantic="primary" />
              <span>Surprise Me</span>
            </button>
            <button
              onClick={fetchProblems}
              disabled={loading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              title="Sync Archive from Codeforces"
            >
              <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Quick Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by name or ID (e.g. 158A)… Press / to focus"
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <CloseIcon size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${showFilters ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300' : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'}`}
          >
            <FilterIcon size={16} />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors">
              Reset
            </button>
          )}
        </div>

        {/* Quick Difficulty Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 font-medium shrink-0 mr-1">Difficulty:</span>
          {[
            { label: 'All', min: 800, max: 2400 },
            { label: '800–1000 (Div. 2 A/B)', min: 800, max: 1000 },
            { label: '1100–1300 (Div. 2 B/C)', min: 1100, max: 1300 },
            { label: '1400–1600 (Specialist)', min: 1400, max: 1600 },
            { label: '1600+ (Mastery)', min: 1600, max: 2400 },
          ].map((preset) => {
            const isSelected = minRating === preset.min && maxRating === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setMinRating(preset.min);
                  setMaxRating(preset.max);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Status Quick Filters + Sort Dropdown */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'unsolved', 'solved', 'bookmarked'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'bookmarked' ? '🔖 Saved' : s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="rating-asc">Rating: Low to High</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="contest-desc">Contest: Newest First</option>
              <option value="contest-asc">Contest: Oldest First</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Tags */}
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-2">Topic Tag</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => { setSelectedTag('all'); setPage(1); }}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${selectedTag === 'all' ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  All
                </button>
                {COMMON_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(tag); setPage(1); }}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${selectedTag === tag ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            {/* Rating Range */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Min Rating</label>
                <select
                  value={minRating}
                  onChange={e => { setMinRating(Number(e.target.value)); setPage(1); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {[800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Max Rating</label>
                <select
                  value={maxRating}
                  onChange={e => { setMaxRating(Number(e.target.value)); setPage(1); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {[900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <EmptyOfflineState
          title="Problem Archive Sync Paused"
          description={error}
          actionText="Retry Codeforces Sync"
          onAction={fetchProblems}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="py-12">
          <RocketLoading size={130} label="Fetching Problems from Codeforces Archive..." />
        </div>
      )}

      {/* Problem List */}
      {!loading && !error && (
        <div className="space-y-2">
          {displayedProblems.length === 0 ? (
            <EmptyProblemsState
              title="No Problems Found"
              description="No problems match your current search, rating range, or tag filters."
              actionText="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            displayedProblems.map(prob => {
              const id = `${prob.contestId ?? ''}${prob.index}`;
              const isSolved = solvedProblemIds.has(id) || cfSolvedIds.has(id);
              const isAttempted = attemptedProblemIds.has(id);
              const isBookmarked = bookmarks.has(id);
              const cfUrl = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;

              return (
                <div
                  key={id}
                  className={`bg-slate-900/40 border rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-900/80 transition-all group ${
                    isSolved ? 'border-emerald-800/30' : 'border-slate-800/60'
                  }`}
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {isSolved ? (
                      <CheckCircleIcon size={20} semantic="success" />
                    ) : isAttempted ? (
                      <TimerIcon size={20} semantic="warning" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                    )}
                  </div>

                  {/* Problem Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500 shrink-0">{id}</span>
                      <button
                        onClick={() => onSelectProblem(prob)}
                        className="text-sm font-medium text-slate-200 hover:text-indigo-300 transition-colors text-left truncate"
                      >
                        {prob.name}
                      </button>
                      {prob.rating && (
                        <span className={`text-xs font-bold ${getRatingColor(prob.rating)}`}>
                          ⚡{prob.rating}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {prob.tags.slice(0, 5).map(tag => (
                        <button
                          key={tag}
                          onClick={() => { setSelectedTag(tag); setPage(1); setShowFilters(true); }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-slate-700/40"
                        >
                          {tag}
                        </button>
                      ))}
                      {prob.tags.length > 5 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                          +{prob.tags.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Visible across Mobile & Desktop) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleBookmark(prob)}
                      title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isBookmarked
                          ? 'text-amber-400 bg-amber-900/30 border border-amber-600/40'
                          : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                      }`}
                    >
                      {isBookmarked ? <BookmarksIcon size={16} semantic="primary" /> : <BookmarkActionIcon size={16} />}
                    </button>
                    <a
                      href={cfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open on Codeforces"
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden sm:flex"
                    >
                      <ExternalLinkIcon size={16} />
                    </a>
                    <button
                      onClick={() => onSelectProblem(prob)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <span>Solve</span>
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-sm transition-colors"
              >
                Load more ({filteredProblems.length - displayedProblems.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
