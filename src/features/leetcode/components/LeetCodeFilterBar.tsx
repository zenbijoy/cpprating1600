import React from 'react';
import {
  SearchIcon,
  FilterIcon,
  CloseIcon,
  ProblemTagsIcon,
} from '../../../components/icons';
import { LeetCodeDifficulty, LeetCodeTopicTag } from '../types/leetcode.types';

interface LeetCodeFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedDifficulty: 'All' | LeetCodeDifficulty;
  onDifficultyChange: (diff: 'All' | LeetCodeDifficulty) => void;
  difficultyCounts: { all: number; easy: number; medium: number; hard: number };
  availableTags: LeetCodeTopicTag[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  sortBy: 'id' | 'title' | 'difficulty' | 'acceptanceRate';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'id' | 'title' | 'difficulty' | 'acceptanceRate', sortOrder: 'asc' | 'desc') => void;
  statusFilter: 'all' | 'solved' | 'attempted' | 'unsolved' | 'bookmarked';
  onStatusFilterChange: (status: 'all' | 'solved' | 'attempted' | 'unsolved' | 'bookmarked') => void;
}

export const LeetCodeFilterBar: React.FC<LeetCodeFilterBarProps> = ({
  search,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  difficultyCounts,
  availableTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  sortBy,
  sortOrder,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      {/* Top Row: Search input + Status Filter + Sort dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems by name, slug, tag, or #ID..."
            className="w-full pl-10 pr-9 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {/* Status quick filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/70 border border-slate-800 shrink-0 overflow-x-auto">
          {(['all', 'unsolved', 'attempted', 'solved', 'bookmarked'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sortBy}
            onChange={(e) =>
              onSortChange(
                e.target.value as 'id' | 'title' | 'difficulty' | 'acceptanceRate',
                sortOrder
              )
            }
            className="px-2.5 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="id">Sort by Problem #</option>
            <option value="title">Sort by Title</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="acceptanceRate">Sort by Acceptance Rate</option>
          </select>

          <button
            type="button"
            onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium"
            title="Toggle sort direction"
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {/* Middle Row: Difficulty Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
          <FilterIcon size={13} />
          Difficulty:
        </span>

        <button
          type="button"
          onClick={() => onDifficultyChange('All')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            selectedDifficulty === 'All'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All ({difficultyCounts.all})
        </button>

        <button
          type="button"
          onClick={() => onDifficultyChange('Easy')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            selectedDifficulty === 'Easy'
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
              : 'bg-slate-800/80 text-emerald-400 border-emerald-500/20 hover:bg-slate-700'
          }`}
        >
          Easy ({difficultyCounts.easy})
        </button>

        <button
          type="button"
          onClick={() => onDifficultyChange('Medium')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            selectedDifficulty === 'Medium'
              ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
              : 'bg-slate-800/80 text-amber-400 border-amber-500/20 hover:bg-slate-700'
          }`}
        >
          Medium ({difficultyCounts.medium})
        </button>

        <button
          type="button"
          onClick={() => onDifficultyChange('Hard')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            selectedDifficulty === 'Hard'
              ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-xs ring-1 ring-rose-500/30'
              : 'bg-slate-800/80 text-rose-400 border-rose-500/20 hover:bg-slate-700'
          }`}
        >
          Hard ({difficultyCounts.hard})
        </button>
      </div>

      {/* Bottom Row: Topic Tags Quick Filter */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <ProblemTagsIcon size={12} />
            Topics:
          </span>

          {availableTags.slice(0, 12).map((t) => {
            const isSelected = selectedTags.includes(t.name);
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => onToggleTag(t.name)}
                className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60'
                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {t.name}
                {t.problemCount != null && (
                  <span className="ml-1 opacity-60">({t.problemCount})</span>
                )}
              </button>
            );
          })}

          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={onClearTags}
              className="text-[11px] px-2 py-0.5 text-rose-400 hover:text-rose-300 underline ml-1"
            >
              Clear filters ({selectedTags.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
