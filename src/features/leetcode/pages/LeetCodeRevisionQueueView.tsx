import React, { useState, useMemo } from 'react';
import {
  BookmarksIcon,
  TimerIcon,
  CheckCircleIcon,
  CodingBracketsIcon,
  ExternalLinkIcon,
  FlameIcon,
} from '../../../components/icons';
import { useLeetCodeProgress } from '../hooks/useLeetCodeProgress';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';
import { LeetCodeProblem } from '../types/leetcode.types';

interface LeetCodeRevisionQueueViewProps {
  onSelectProblem?: (problem: LeetCodeProblem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LeetCodeRevisionQueueView: React.FC<LeetCodeRevisionQueueViewProps> = ({
  onSelectProblem,
  onNavigateTab,
}) => {
  const { bookmarks, revisionQueue, toggleBookmark, updateStatus, saveNotes } =
    useLeetCodeProgress();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'revision'>('bookmarks');

  // Enrich progress items with problem metadata
  const enrichedBookmarks = useMemo(() => {
    return bookmarks.map((bm) => {
      const prob = CURATED_LEETCODE_PROBLEMS.find((p) => p.titleSlug === bm.problemSlug);
      return {
        progress: bm,
        problem: prob || {
          id: bm.problemSlug,
          frontendQuestionId: '?',
          title: bm.problemSlug.replace(/-/g, ' '),
          titleSlug: bm.problemSlug,
          difficulty: 'Medium' as const,
          topicTags: [],
          paidOnly: false,
          acceptanceRate: 50,
          url: `https://leetcode.com/problems/${bm.problemSlug}/`,
          source: 'cached_db' as const,
        },
      };
    });
  }, [bookmarks]);

  const enrichedRevision = useMemo(() => {
    return revisionQueue.map((rev) => {
      const prob = CURATED_LEETCODE_PROBLEMS.find((p) => p.titleSlug === rev.problemSlug);
      return {
        progress: rev,
        problem: prob || {
          id: rev.problemSlug,
          frontendQuestionId: '?',
          title: rev.problemSlug.replace(/-/g, ' '),
          titleSlug: rev.problemSlug,
          difficulty: 'Medium' as const,
          topicTags: [],
          paidOnly: false,
          acceptanceRate: 50,
          url: `https://leetcode.com/problems/${rev.problemSlug}/`,
          source: 'cached_db' as const,
        },
      };
    });
  }, [revisionQueue]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <BookmarksIcon size={18} />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Bookmarks & Revision Queue</h1>
          </div>
          <p className="text-sm text-slate-400">
            Reinforce tricky algorithmic patterns and review previously missed problems using spaced repetition.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookmarksIcon size={14} />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revision')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'revision'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TimerIcon size={14} />
            <span>Due for Revision ({revisionQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      {activeTab === 'bookmarks' ? (
        enrichedBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
            <div className="p-3 rounded-full bg-slate-800 text-amber-400 mb-3">
              <BookmarksIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-100">No Bookmarked Problems</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
              You haven't bookmarked any LeetCode problems yet. Click the bookmark icon on any problem to save it for quick access.
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('leetcode-problems')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Explore Problemset
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedBookmarks.map(({ problem, progress }) => (
              <div
                key={problem.titleSlug}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">
                      #{problem.frontendQuestionId}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(problem.titleSlug)}
                      className="p-1 rounded text-amber-400 hover:text-slate-400"
                      title="Remove Bookmark"
                    >
                      <BookmarksIcon size={15} />
                    </button>
                  </div>

                  <h3
                    onClick={() => onSelectProblem?.(problem)}
                    className="font-semibold text-slate-100 text-sm hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {problem.title}
                  </h3>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {problem.topicTags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {progress.personalNotes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
                      <strong className="text-slate-400 block mb-0.5">Notes:</strong>
                      {progress.personalNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-4 text-xs">
                  <span className="text-slate-400">AC: {problem.acceptanceRate}%</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-white"
                      title="Open on LeetCode"
                    >
                      <ExternalLinkIcon size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => onSelectProblem?.(problem)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : enrichedRevision.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <div className="p-3 rounded-full bg-slate-800 text-emerald-400 mb-3">
            <CheckCircleIcon size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Revision Queue is Clean!</h3>
          <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
            No attempted or failed problems currently due for review. Great work!
          </p>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('leetcode-problems')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Solve Next Problem
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrichedRevision.map(({ problem, progress }) => (
            <div
              key={problem.titleSlug}
              className="flex flex-col justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-900/60 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    Review Needed
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      problem.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : problem.difficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                <h3
                  onClick={() => onSelectProblem?.(problem)}
                  className="font-semibold text-slate-100 text-sm hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  {problem.title}
                </h3>

                {progress.personalNotes && (
                  <div className="mt-2.5 p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    {progress.personalNotes}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-4 text-xs">
                <button
                  type="button"
                  onClick={() => updateStatus(problem.titleSlug, 'solved')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Mark Solved ✓
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProblem?.(problem)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Solve Again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
