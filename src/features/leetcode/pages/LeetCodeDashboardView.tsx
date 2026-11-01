import React, { useState, useEffect } from 'react';
import {
  ProblemsIcon,
  CodingBracketsIcon,
  BookmarksIcon,
  ProgressIcon,
  UserProfileIcon,
  FlameIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  ForwardIcon,
} from '../../../components/icons';
import {
  LeetCodeDailyChallenge,
  LeetCodeProblem,
  LeetCodeAdaptiveRecommendation,
} from '../types/leetcode.types';
import { leetCodeClient } from '../services/leetcodeClient';
import { useLeetCodeProgress } from '../hooks/useLeetCodeProgress';
import { LeetCodeStatRing } from '../components/LeetCodeStatRing';
import { LeetCodeDailyChallengeCard } from '../components/LeetCodeDailyChallengeCard';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';

interface LeetCodeDashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectProblem: (problem: LeetCodeProblem) => void;
}

export const LeetCodeDashboardView: React.FC<LeetCodeDashboardViewProps> = ({
  onNavigateTab,
  onSelectProblem,
}) => {
  const { stats, progressList, toggleBookmark, updateStatus } = useLeetCodeProgress();
  const [daily, setDaily] = useState<LeetCodeDailyChallenge | null>(null);
  const [recommendations, setRecommendations] = useState<LeetCodeAdaptiveRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [dailyData, recsData] = await Promise.all([
          leetCodeClient.getDailyChallenge(),
          leetCodeClient.getRecommendations(),
        ]);
        if (mounted) {
          setDaily(dailyData);
          setRecommendations(recsData);
        }
      } catch (err) {
        console.error('Failed loading leetcode dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const isDailySolved = daily ? progressList.some((p) => p.problemSlug === daily.problem.titleSlug && p.status === 'solved') : false;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              LeetCode DSA Engine
            </span>
            <span className="text-xs text-slate-400">Integrated Practice Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            LeetCode Practice & DSA Mastery
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Train core algorithms, data structures, and company interview patterns alongside your Codeforces 1600 curriculum.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('leetcode-problems')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <ProblemsIcon size={16} />
            <span>Problem Explorer</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('leetcode-profile')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            <UserProfileIcon size={16} />
            <span>LeetCode Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Daily Challenge Banner */}
      {daily && (
        <LeetCodeDailyChallengeCard
          challenge={daily}
          onSelectProblem={onSelectProblem}
          isSolved={isDailySolved}
        />
      )}

      {/* 3. Progress Ring & Quick Navigation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Visual Progress Ring */}
        <div className="lg:col-span-1">
          <LeetCodeStatRing
            totalSolved={stats.totalSolved}
            easySolved={stats.easySolved}
            mediumSolved={stats.mediumSolved}
            hardSolved={stats.hardSolved}
            targetCount={75}
          />
        </div>

        {/* Right 2 Cols: Quick Hub Modules */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Problem Explorer */}
          <div
            onClick={() => onNavigateTab('leetcode-problems')}
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <ProblemsIcon size={18} />
                </div>
                <ForwardIcon size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                Problem Explorer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Filter by Easy, Medium, Hard, topic tags, acceptance rates, and personal status.
              </p>
            </div>
            <div className="mt-3 text-xs text-indigo-400 font-medium flex items-center gap-1">
              Explore 2,500+ problems →
            </div>
          </div>

          {/* Card: Revision Queue & Bookmarks */}
          <div
            onClick={() => onNavigateTab('leetcode-revision')}
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <BookmarksIcon size={18} />
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold">
                  {stats.bookmarkCount} saved
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                Bookmarks & Revision
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Spaced repetition for tricky edge cases, forgotten tricks, and attempted problems.
              </p>
            </div>
            <div className="mt-3 text-xs text-amber-400 font-medium flex items-center gap-1">
              Open Revision Queue →
            </div>
          </div>

          {/* Card: My Progress */}
          <div
            onClick={() => onNavigateTab('leetcode-progress')}
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ProgressIcon size={18} />
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold">
                  {stats.totalSolved} solved
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                My Practice Progress
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Track topic coverage, recall difficulty, time spent, and milestone progress.
              </p>
            </div>
            <div className="mt-3 text-xs text-emerald-400 font-medium flex items-center gap-1">
              View Analytics →
            </div>
          </div>

          {/* Card: Daily Challenge & Adaptive Plan */}
          <div
            onClick={() => onNavigateTab('leetcode-daily')}
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-cyan-500/50 transition-all cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <FlameIcon size={18} />
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-semibold">
                  Adaptive
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                Daily Challenge & Plan
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Structured topic progression and deterministic recommendations tailored to your goals.
              </p>
            </div>
            <div className="mt-3 text-xs text-cyan-400 font-medium flex items-center gap-1">
              Today's Session →
            </div>
          </div>
        </div>
      </div>

      {/* 4. Adaptive Recommendations Section */}
      {recommendations && (
        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon size={18} className="text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">
                Today's Adaptive Recommendations
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium">
                Focus: {recommendations.focusTopic}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('leetcode-problems')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View Full Problemset →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
            {recommendations.weakTopicProblems.map((prob) => (
              <div
                key={prob.id}
                onClick={() => onSelectProblem(prob)}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-slate-400">#{prob.frontendQuestionId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        prob.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : prob.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm line-clamp-1">{prob.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {prob.topicTags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60 mt-3">
                  <span>AC: {prob.acceptanceRate}%</span>
                  <span className="text-indigo-400 font-medium">Practice →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Curated High-Frequency Blind 75 / Interview Patterns */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CodingBracketsIcon size={18} className="text-amber-400" />
            Top Core Patterns (Blind 75 & NeetCode 150 Core)
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('leetcode-problems')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            All {CURATED_LEETCODE_PROBLEMS.length} Curated Patterns →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {CURATED_LEETCODE_PROBLEMS.slice(0, 8).map((prob) => {
            const isSolved = progressList.some((p) => p.problemSlug === prob.titleSlug && p.status === 'solved');
            return (
              <div
                key={prob.id}
                onClick={() => onSelectProblem(prob)}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400 text-[11px]">#{prob.frontendQuestionId}</span>
                    <div className="flex items-center gap-1.5">
                      {isSolved && <CheckCircleIcon size={13} className="text-emerald-400" />}
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-medium border ${
                          prob.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : prob.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-200 text-sm line-clamp-1">{prob.title}</div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
                  <span className="line-clamp-1">{prob.topicTags[0]}</span>
                  <span className="text-indigo-400 font-medium">Solve</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
