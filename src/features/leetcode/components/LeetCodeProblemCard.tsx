import React from 'react';
import {
  ExternalLinkIcon,
  BookmarksIcon,
  CheckCircleIcon,
  CodingBracketsIcon,
  TimerIcon,
} from '../../../components/icons';
import { LeetCodeProblem, UserLeetCodeProgress } from '../types/leetcode.types';

interface LeetCodeProblemCardProps {
  problem: LeetCodeProblem;
  progress?: UserLeetCodeProgress;
  onSelect: (problem: LeetCodeProblem) => void;
  onToggleBookmark: (slug: string) => void;
  onUpdateStatus: (slug: string, status: 'unsolved' | 'attempted' | 'solved') => void;
}

export const LeetCodeProblemCard: React.FC<LeetCodeProblemCardProps> = ({
  problem,
  progress,
  onSelect,
  onToggleBookmark,
  onUpdateStatus,
}) => {
  const isBookmarked = progress?.bookmark ?? false;
  const status = progress?.status ?? 'unsolved';

  const difficultyColors = {
    Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  }[problem.difficulty];

  const statusIcons = {
    solved: <CheckCircleIcon size={16} className="text-emerald-400" />,
    attempted: <TimerIcon size={16} className="text-amber-400" />,
    unsolved: <span className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block" />,
  }[status];

  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700 transition-all shadow-xs hover:shadow-md">
      <div>
        {/* Header: ID, Title, Difficulty, Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 shrink-0">
              #{problem.frontendQuestionId}
            </span>
            <button
              type="button"
              onClick={() => onSelect(problem)}
              className="text-left font-semibold text-slate-100 hover:text-indigo-400 transition-colors text-sm sm:text-base line-clamp-1 cursor-pointer"
            >
              {problem.title}
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleBookmark(problem.titleSlug)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Add to Bookmarks'}
            >
              <BookmarksIcon size={15} />
            </button>

            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${difficultyColors}`}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {problem.topicTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
          {problem.topicTags.length > 3 && (
            <span className="text-[11px] px-1.5 py-0.5 text-slate-400">
              +{problem.topicTags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Acceptance rate, Status selector, Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span>AC: {problem.acceptanceRate}%</span>
          {problem.paidOnly && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Premium
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status quick toggle */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {statusIcons}
            <select
              value={status}
              onChange={(e) =>
                onUpdateStatus(problem.titleSlug, e.target.value as 'unsolved' | 'attempted' | 'solved')
              }
              className="bg-transparent text-[11px] text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="unsolved" className="bg-slate-900 text-slate-300">Unsolved</option>
              <option value="attempted" className="bg-slate-900 text-amber-400">Attempted</option>
              <option value="solved" className="bg-slate-900 text-emerald-400">Solved</option>
            </select>
          </div>

          {/* Official LeetCode Link */}
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-slate-700/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Open on LeetCode.com"
          >
            <ExternalLinkIcon size={14} />
          </a>

          {/* Workspace Practice Button */}
          <button
            type="button"
            onClick={() => onSelect(problem)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-xs"
          >
            <CodingBracketsIcon size={13} />
            <span>Practice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
