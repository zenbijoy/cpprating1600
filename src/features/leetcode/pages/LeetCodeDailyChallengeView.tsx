import React, { useState, useEffect } from 'react';
import {
  FlameIcon,
  SparklesIcon,
  TargetRatingIcon,
  CheckCircleIcon,
  CodingBracketsIcon,
  ExternalLinkIcon,
  TimerIcon,
} from '../../../components/icons';
import {
  LeetCodeDailyChallenge,
  LeetCodeProblem,
  LeetCodeAdaptiveRecommendation,
} from '../types/leetcode.types';
import { leetCodeClient } from '../services/leetcodeClient';
import { useLeetCodeProgress } from '../hooks/useLeetCodeProgress';

interface LeetCodeDailyChallengeViewProps {
  onSelectProblem: (problem: LeetCodeProblem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LeetCodeDailyChallengeView: React.FC<LeetCodeDailyChallengeViewProps> = ({
  onSelectProblem,
  onNavigateTab,
}) => {
  const { progressList, updateStatus } = useLeetCodeProgress();
  const [daily, setDaily] = useState<LeetCodeDailyChallenge | null>(null);
  const [recommendations, setRecommendations] = useState<LeetCodeAdaptiveRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchDailyAndAdaptive() {
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
        console.error('Failed fetching daily challenge & adaptive training:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDailyAndAdaptive();
    return () => {
      mounted = false;
    };
  }, []);

  const isDailySolved = daily
    ? progressList.some((p) => p.problemSlug === daily.problem.titleSlug && p.status === 'solved')
    : false;

  const difficultyColors = (diff: string) => {
    if (diff === 'Easy') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (diff === 'Medium') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <FlameIcon size={18} />
          </span>
          <h1 className="text-2xl font-bold text-slate-100">Daily Challenge & Adaptive Training</h1>
        </div>
        <p className="text-sm text-slate-400">
          Stay consistent with the official LeetCode problem of the day and personalized algorithm drills.
        </p>
      </div>

      {/* Main Today's Challenge Feature Card */}
      {daily && (
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <FlameIcon size={13} className="text-amber-400" />
                  Today's Challenge ({daily.date})
                </span>
                {isDailySolved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircleIcon size={14} /> Solved Today!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  #{daily.problem.frontendQuestionId}
                </span>
                <h2
                  onClick={() => onSelectProblem(daily.problem)}
                  className="text-2xl sm:text-3xl font-extrabold text-slate-100 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  {daily.problem.title}
                </h2>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${difficultyColors(daily.problem.difficulty)}`}>
                  {daily.problem.difficulty}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {daily.problem.topicTags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-750"
                  >
                    {t}
                  </span>
                ))}
                <span className="self-center ml-2">Acceptance: {daily.problem.acceptanceRate}%</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
              <a
                href={daily.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors"
              >
                <ExternalLinkIcon size={14} />
                <span>LeetCode Official</span>
              </a>

              <button
                type="button"
                onClick={() => onSelectProblem(daily.problem)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <CodingBracketsIcon size={15} />
                <span>Solve in Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Training Plan Sections */}
      {recommendations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section A: Daily Minimum Practice Goal (For Busy Days) */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <TimerIcon size={18} />
                <h3 className="font-bold text-sm text-slate-100">
                  Minimum Daily Practice Goal (Busy Days)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Short on time today? Keep your problem-solving habit alive with this {recommendations.minimumDailyGoal.targetMinutes}-minute foundational pattern.
              </p>

              <div
                onClick={() => onSelectProblem(recommendations.minimumDailyGoal.problem)}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-400">
                    #{recommendations.minimumDailyGoal.problem.frontendQuestionId}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Easy ({recommendations.minimumDailyGoal.targetMinutes} min)
                  </span>
                </div>
                <h4 className="font-semibold text-slate-200 text-sm">
                  {recommendations.minimumDailyGoal.problem.title}
                </h4>
                <div className="text-[11px] text-slate-400 mt-1">
                  Topic: {recommendations.minimumDailyGoal.problem.topicTags.join(', ')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProblem(recommendations.minimumDailyGoal.problem)}
              className="mt-4 w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              Start Quick 20-Min Drill →
            </button>
          </div>

          {/* Section B: Topic Progression Drill */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <TargetRatingIcon size={18} />
                <h3 className="font-bold text-sm text-slate-100">
                  Topic Drill: {recommendations.focusTopic}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Concentrated practice on your rotational focus topic to develop instinctive algorithmic pattern recognition.
              </p>

              <div className="space-y-2">
                {recommendations.weakTopicProblems.map((prob) => (
                  <div
                    key={prob.id}
                    onClick={() => onSelectProblem(prob)}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">#{prob.frontendQuestionId}</span>
                      <span className="font-medium text-slate-200">{prob.title}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColors(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('leetcode-problems')}
                className="mt-4 w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
              >
                Browse All {recommendations.focusTopic} Problems →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
