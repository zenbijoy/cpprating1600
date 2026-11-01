import React, { useState, useMemo } from 'react';
import {
  ProblemsIcon,
  RefreshIcon,
  FilterIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  TimerIcon,
  BookmarksIcon,
} from '../../../components/icons';
import { LeetCodeProblem } from '../types/leetcode.types';
import { useLeetCodeProblems } from '../hooks/useLeetCodeProblems';
import { useLeetCodeProgress } from '../hooks/useLeetCodeProgress';
import { LeetCodeProblemCard } from '../components/LeetCodeProblemCard';
import { LeetCodeFilterBar } from '../components/LeetCodeFilterBar';
import { LeetCodePagination } from '../components/LeetCodePagination';

interface LeetCodeProblemExplorerViewProps {
  onSelectProblem: (problem: LeetCodeProblem) => void;
}

export const LeetCodeProblemExplorerView: React.FC<LeetCodeProblemExplorerViewProps> = ({
  onSelectProblem,
}) => {
  const {
    problems,
    total,
    page,
    limit,
    totalPages,
    availableTags,
    difficultyCounts,
    filter,
    loading,
    error,
    refetch,
    setSearch,
    setDifficulty,
    toggleTag,
    clearTags,
    setSort,
    setPage,
  } = useLeetCodeProblems();

  const { progressMap, toggleBookmark, updateStatus } = useLeetCodeProgress();
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'attempted' | 'unsolved' | 'bookmarked'>('all');

  // Apply personal status filter on current page slice (or combined with remote)
  const displayedProblems = useMemo(() => {
    if (statusFilter === 'all') return problems;
    return problems.filter((p) => {
      const prog = progressMap.get(p.titleSlug);
      if (statusFilter === 'bookmarked') return prog?.bookmark === true;
      if (statusFilter === 'solved') return prog?.status === 'solved';
      if (statusFilter === 'attempted') return prog?.status === 'attempted';
      if (statusFilter === 'unsolved') return !prog || prog.status === 'unsolved';
      return true;
    });
  }, [problems, statusFilter, progressMap]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ProblemsIcon size={18} />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">LeetCode Problem Explorer</h1>
          </div>
          <p className="text-sm text-slate-400">
            Browse, search, and practice verified algorithms and data structure problems.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          title="Refresh problemset"
        >
          <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <LeetCodeFilterBar
        search={filter.search || ''}
        onSearchChange={setSearch}
        selectedDifficulty={filter.difficulty || 'All'}
        onDifficultyChange={setDifficulty}
        difficultyCounts={difficultyCounts}
        availableTags={availableTags}
        selectedTags={filter.topicTags || []}
        onToggleTag={toggleTag}
        onClearTags={clearTags}
        sortBy={filter.sortBy || 'id'}
        sortOrder={filter.sortOrder || 'asc'}
        onSortChange={setSort}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse flex flex-col justify-between h-44"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-5 bg-slate-800 rounded" />
                  <div className="w-16 h-5 bg-slate-800 rounded-full" />
                </div>
                <div className="w-3/4 h-5 bg-slate-800 rounded mb-2" />
                <div className="flex gap-2">
                  <div className="w-14 h-4 bg-slate-800 rounded" />
                  <div className="w-16 h-4 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex justify-between">
                <div className="w-16 h-4 bg-slate-800 rounded" />
                <div className="w-20 h-6 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry Button */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3">
            <RefreshIcon size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Unable to Load Problems</h3>
          <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
            {error}. You can retry or access problems directly on LeetCode.com.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
            <a
              href="https://leetcode.com/problemset/all/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-750 transition-colors flex items-center gap-1.5"
            >
              <ExternalLinkIcon size={14} />
              <span>Open LeetCode.com</span>
            </a>
          </div>
        </div>
      ) : displayedProblems.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <div className="p-3 rounded-full bg-slate-800 text-slate-400 mb-3">
            <FilterIcon size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">No Problems Found</h3>
          <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
            No problems match your current search, difficulty, or tag filters. Try clearing some filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDifficulty('All');
              clearTags();
              setStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Problem Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProblems.map((problem) => (
            <LeetCodeProblemCard
              key={problem.titleSlug}
              problem={problem}
              progress={progressMap.get(problem.titleSlug)}
              onSelect={onSelectProblem}
              onToggleBookmark={toggleBookmark}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && (
        <LeetCodePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
