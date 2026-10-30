import React, { useState, useMemo } from 'react';
import {
  ProblemTagsIcon,
  WarningStatusIcon,
  LearningRoadmapIcon,
  TopicMasteryIcon,
  ChevronRightIcon,
} from './icons';
import {
  analyzeTopicFrequencies,
  TagPracticeMetric,
  TagPracticeStatus,
} from '../utils/topicAnalysis';
import { CFProblem, ProblemAttempt } from '../types';
import { TOPICS } from '../utils/roadmap';

interface TopicCloudProps {
  attempts: ProblemAttempt[];
  currentDay: number;
  onSelectProblem?: (problem: CFProblem) => void;
  onFilterCurriculum?: (tag: string) => void;
}

type ViewMode = 'deficit_list' | 'cloud' | 'category';

export const TopicCloud: React.FC<TopicCloudProps> = ({
  attempts,
  currentDay,
  onSelectProblem,
  onFilterCurriculum,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('deficit_list');
  const [selectedTag, setSelectedTag] = useState<TagPracticeMetric | null>(null);

  // Frequency analysis
  const analysis = useMemo(() => {
    return analyzeTopicFrequencies(attempts, currentDay);
  }, [attempts, currentDay]);

  // Set default selected tag to the highest deficit tag if none selected
  const activeTag = selectedTag || analysis.topDeficitTags[0] || null;

  // Find a recommended problem for the active tag from curriculum
  const matchingCurriculumProblem: CFProblem | null = useMemo(() => {
    if (!activeTag) return null;
    for (const topic of TOPICS) {
      const match = topic.recommendedProblems.find((p) =>
        p.tags.some((t) => t.toLowerCase() === activeTag.tag.toLowerCase())
      );
      if (match) return match;
    }
    // Fallback problem
    return {
      contestId: 1352,
      index: 'C',
      name: `${activeTag.displayName} Challenge`,
      rating: activeTag.recommendedRating,
      tags: [activeTag.tag],
    };
  }, [activeTag]);

  const getStatusBadge = (status: TagPracticeStatus) => {
    switch (status) {
      case 'critical':
        return {
          label: 'Needs Practice',
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'moderate':
        return {
          label: 'In Progress',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'solid':
      case 'mastered':
        return {
          label: status === 'mastered' ? 'Mastered' : 'Solid',
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-6">
      {/* Header & Coverage Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ProblemTagsIcon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                <span>Topic Cloud & Practice Deficit</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {analysis.topDeficitTags.filter((t) => t.status === 'critical').length} Urgent Focus Areas
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency analysis of your solved problems reveals which algorithmic tags need the most deliberate practice.
              </p>
            </div>
          </div>
        </div>

        {/* Global Tag Coverage Meter */}
        <div className="sm:w-60 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-400">Curriculum Tag Coverage</span>
            <span className="font-mono font-bold text-cyan-400">
              {analysis.totalUniqueTagsSolved} / {analysis.totalTagsAnalyzed} ({analysis.overallCoveragePercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${analysis.overallCoveragePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode View Switcher */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('deficit_list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'deficit_list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <WarningStatusIcon size={14} semantic="warning" />
            <span>Needs Practice Most ({analysis.topDeficitTags.filter((t) => t.status === 'critical').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cloud')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cloud'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LearningRoadmapIcon size={14} semantic="primary" />
            <span>Visual Cloud ({analysis.totalTagsAnalyzed})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'category'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TopicMasteryIcon size={14} semantic="success" />
            <span>By Category</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Click any tag to inspect practice diagnostic
        </span>
      </div>

      {/* Content depending on view mode */}
      {viewMode === 'deficit_list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {analysis.topDeficitTags.slice(0, 8).map((metric) => {
            const isSelected = activeTag?.tag === metric.tag;
            const badge = getStatusBadge(metric.status);

            return (
              <div
                key={metric.tag}
                onClick={() => setSelectedTag(metric)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 shadow-md'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-white truncate">
                    {metric.displayName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {metric.practiceNeedScore}% deficit
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {metric.description}
                </p>

                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Solved:</span>
                    <span className="text-slate-200 font-bold">
                      {metric.solvedCount} / {metric.targetSolves} target
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        metric.status === 'critical'
                          ? 'bg-rose-500'
                          : metric.status === 'moderate'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((metric.solvedCount / metric.targetSolves) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'cloud' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-center gap-3">
          {analysis.tags.map((metric) => {
            const isSelected = activeTag?.tag === metric.tag;
            const badge = getStatusBadge(metric.status);

            // Cloud weighting: higher deficit = larger emphasis
            let sizeClass = 'text-xs px-2.5 py-1';
            if (metric.practiceNeedScore >= 75) {
              sizeClass = 'text-sm font-bold px-3.5 py-1.5 shadow-sm';
            } else if (metric.practiceNeedScore >= 45) {
              sizeClass = 'text-xs font-semibold px-3 py-1.5';
            }

            return (
              <button
                key={metric.tag}
                type="button"
                onClick={() => setSelectedTag(metric)}
                className={`rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${sizeClass} ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-600/30 text-white ring-2 ring-indigo-500 scale-105'
                    : metric.status === 'critical'
                    ? 'border-rose-900/50 bg-rose-950/30 hover:border-rose-700 text-rose-200'
                    : metric.status === 'moderate'
                    ? 'border-amber-900/40 bg-amber-950/20 hover:border-amber-700 text-amber-200'
                    : 'border-emerald-900/40 bg-emerald-950/20 hover:border-emerald-700 text-emerald-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <span>{metric.displayName}</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({metric.solvedCount}/{metric.targetSolves})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'category' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['foundations', 'algorithmic', 'advanced'] as const).map((cat) => {
            const catTags = analysis.tags.filter((t) => t.category === cat);
            const title =
              cat === 'foundations'
                ? 'Foundational Skills'
                : cat === 'algorithmic'
                ? 'Core Algorithms'
                : 'Advanced & Specialist';

            return (
              <div key={cat} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>{title}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {catTags.filter((t) => t.solvedCount > 0).length}/{catTags.length} active
                  </span>
                </h4>

                <div className="space-y-2">
                  {catTags.map((metric) => {
                    const isSelected = activeTag?.tag === metric.tag;
                    const badge = getStatusBadge(metric.status);

                    return (
                      <div
                        key={metric.tag}
                        onClick={() => setSelectedTag(metric)}
                        className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/50 text-white font-bold'
                            : 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
                          <span className="truncate">{metric.displayName}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {metric.solvedCount} / {metric.targetSolves}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Tag Diagnostic Card & Practice Action */}
      {activeTag && (
        <div className="rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/30 via-slate-900/50 to-slate-900/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <ProblemTagsIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{activeTag.displayName}</h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(activeTag.status).bg} ${getStatusBadge(activeTag.status).text} ${getStatusBadge(activeTag.status).border}`}>
                    {getStatusBadge(activeTag.status).label}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    CF Rating ~{activeTag.recommendedRating}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {activeTag.description}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">CURRENT SOLVES</span>
                <span className="text-white font-bold text-sm">
                  {activeTag.solvedCount} / {activeTag.targetSolves}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">DEFICIT SCORE</span>
                <span className="text-rose-400 font-bold text-sm">
                  {activeTag.practiceNeedScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Curated Problem for this Tag & Immediate Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Recommended Practice Problem for {activeTag.displayName}
              </span>
              {matchingCurriculumProblem ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {matchingCurriculumProblem.name}
                  </span>
                  {matchingCurriculumProblem.rating && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Rating {matchingCurriculumProblem.rating}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {matchingCurriculumProblem.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] text-slate-400">#{t}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Search problem arena for #{activeTag.tag}</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {matchingCurriculumProblem && onSelectProblem && (
                <button
                  type="button"
                  onClick={() => onSelectProblem(matchingCurriculumProblem)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-white font-bold px-4 py-2 text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Practice Problem</span>
                  <ChevronRightIcon size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
