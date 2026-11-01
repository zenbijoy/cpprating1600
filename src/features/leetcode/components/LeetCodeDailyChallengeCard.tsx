import React from 'react';
import {
  ExternalLinkIcon,
  CodingBracketsIcon,
  FlameIcon,
  CheckCircleIcon,
  TimerIcon,
} from '../../../components/icons';
import { LeetCodeDailyChallenge, LeetCodeProblem } from '../types/leetcode.types';

interface LeetCodeDailyChallengeCardProps {
  challenge: LeetCodeDailyChallenge;
  onSelectProblem: (problem: LeetCodeProblem) => void;
  isSolved?: boolean;
}

export const LeetCodeDailyChallengeCard: React.FC<LeetCodeDailyChallengeCardProps> = ({
  challenge,
  onSelectProblem,
  isSolved = false,
}) => {
  const { problem, date, link } = challenge;

  const difficultyColors = {
    Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  }[problem.difficulty];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900/60 p-5 shadow-md">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {/* Top meta: Daily Challenge pill + date */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FlameIcon size={12} className="text-amber-400" />
              LeetCode Daily Challenge
            </span>
            <span className="text-xs text-slate-400 font-mono">{date}</span>
            {isSolved && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium ml-2">
                <CheckCircleIcon size={13} />
                Completed Today
              </span>
            )}
          </div>

          {/* Problem title */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
              #{problem.frontendQuestionId}
            </span>
            <h3
              onClick={() => onSelectProblem(problem)}
              className="text-lg font-bold text-slate-100 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {problem.title}
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${difficultyColors}`}>
              {problem.difficulty}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
            {problem.topicTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50 text-[11px]"
              >
                {tag}
              </span>
            ))}
            <span className="ml-2 text-slate-400 self-center">AC Rate: {problem.acceptanceRate}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <a
            href={link || problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors"
          >
            <ExternalLinkIcon size={14} />
            <span>LeetCode.com</span>
          </a>

          <button
            type="button"
            onClick={() => onSelectProblem(problem)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <CodingBracketsIcon size={14} />
            <span>Practice Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
