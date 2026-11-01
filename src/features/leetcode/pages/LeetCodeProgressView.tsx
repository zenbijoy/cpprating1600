import React, { useMemo } from 'react';
import {
  ProgressIcon,
  CheckCircleIcon,
  TimerIcon,
  BookmarksIcon,
  FlameIcon,
  TargetRatingIcon,
  ProblemsIcon,
} from '../../../components/icons';
import { useLeetCodeProgress } from '../hooks/useLeetCodeProgress';
import { LeetCodeStatRing } from '../components/LeetCodeStatRing';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';
import { LeetCodeProblem } from '../types/leetcode.types';

interface LeetCodeProgressViewProps {
  onSelectProblem?: (problem: LeetCodeProblem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LeetCodeProgressView: React.FC<LeetCodeProgressViewProps> = ({
  onSelectProblem,
  onNavigateTab,
}) => {
  const { stats, progressList, toggleBookmark, updateStatus } = useLeetCodeProgress();

  // Topic mastery aggregation
  const topicStats = useMemo(() => {
    const map = new Map<string, { total: number; solved: number; attempted: number }>();

    for (const prob of CURATED_LEETCODE_PROBLEMS) {
      for (const tag of prob.topicTags) {
        const cur = map.get(tag) || { total: 0, solved: 0, attempted: 0 };
        cur.total++;
        map.set(tag, cur);
      }
    }

    for (const p of progressList) {
      const prob = CURATED_LEETCODE_PROBLEMS.find((cp) => cp.titleSlug === p.problemSlug);
      if (prob) {
        for (const tag of prob.topicTags) {
          const cur = map.get(tag);
          if (cur) {
            if (p.status === 'solved') cur.solved++;
            else if (p.status === 'attempted') cur.attempted++;
          }
        }
      }
    }

    return Array.from(map.entries())
      .map(([topic, counts]) => ({
        topic,
        ...counts,
        percentage: Math.round((counts.solved / Math.max(1, counts.total)) * 100),
      }))
      .sort((a, b) => b.solved - a.solved || b.total - a.total);
  }, [progressList]);

  // Solved and attempted problems list
  const activeProblems = useMemo(() => {
    return progressList
      .filter((p) => p.status === 'solved' || p.status === 'attempted')
      .map((item) => {
        const prob = CURATED_LEETCODE_PROBLEMS.find((cp) => cp.titleSlug === item.problemSlug);
        return {
          progress: item,
          problem: prob || {
            id: item.problemSlug,
            frontendQuestionId: '?',
            title: item.problemSlug.replace(/-/g, ' '),
            titleSlug: item.problemSlug,
            difficulty: 'Medium' as const,
            topicTags: [],
            paidOnly: false,
            acceptanceRate: 50,
            url: `https://leetcode.com/problems/${item.problemSlug}/`,
            source: 'cached_db' as const,
          },
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.progress.lastAttemptedAt || 0).getTime();
        const timeB = new Date(b.progress.lastAttemptedAt || 0).getTime();
        return timeB - timeA;
      });
  }, [progressList]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ProgressIcon size={18} />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">My LeetCode Progress</h1>
          </div>
          <p className="text-sm text-slate-400">
            Audit your algorithm practice consistency, topic mastery, and recall readiness.
          </p>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('leetcode-problems')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Practice New Problems →
          </button>
        )}
      </div>

      {/* Top Stat Ring & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LeetCodeStatRing
            totalSolved={stats.totalSolved}
            easySolved={stats.easySolved}
            mediumSolved={stats.mediumSolved}
            hardSolved={stats.hardSolved}
            targetCount={75}
          />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Solved</span>
            <span className="text-2xl font-bold text-slate-100 font-mono mt-1">{stats.totalSolved}</span>
            <span className="text-[11px] text-emerald-400 mt-2">Verified solves</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Attempted</span>
            <span className="text-2xl font-bold text-amber-400 font-mono mt-1">{stats.totalAttempted}</span>
            <span className="text-[11px] text-slate-400 mt-2">Ready to upsolve</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Bookmarks</span>
            <span className="text-2xl font-bold text-indigo-400 font-mono mt-1">{stats.bookmarkCount}</span>
            <span className="text-[11px] text-slate-400 mt-2">Saved problems</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">DSA Mastery Goal</span>
            <span className="text-2xl font-bold text-cyan-400 font-mono mt-1">
              {Math.min(100, Math.round((stats.totalSolved / 75) * 100))}%
            </span>
            <span className="text-[11px] text-slate-400 mt-2">75 core patterns</span>
          </div>
        </div>
      </div>

      {/* Topic Mastery Matrix */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
        <h2 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
          <TargetRatingIcon size={16} className="text-indigo-400" />
          DSA Topic Mastery & Coverage
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topicStats.map((t) => (
            <div
              key={t.topic}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-xs">{t.topic}</span>
                <span className="text-xs font-mono text-slate-400">
                  {t.solved} / {t.total}
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${t.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.percentage}% Solved</span>
                {t.percentage === 100 ? (
                  <span className="text-emerald-400 font-medium">Mastered</span>
                ) : t.percentage > 0 ? (
                  <span className="text-amber-400 font-medium">In Progress</span>
                ) : (
                  <span className="text-slate-400">Needs Practice</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Practice Log Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
        <h2 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
          <ProblemsIcon size={16} className="text-emerald-400" />
          Recent Practice History ({activeProblems.length})
        </h2>

        {activeProblems.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No practice activity recorded yet. Start practicing in the Workspace to track your progress!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Problem</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Attempted</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeProblems.map(({ problem, progress }) => (
                  <tr key={problem.titleSlug} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]">
                          #{problem.frontendQuestionId}
                        </span>
                        <span>{problem.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
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
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`capitalize font-medium ${
                          progress.status === 'solved'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {progress.status}
                        {progress.selfReported && ' (self-reported)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {progress.lastAttemptedAt
                        ? new Date(progress.lastAttemptedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {progress.personalNotes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectProblem?.(problem)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                      >
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
