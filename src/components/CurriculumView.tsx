import React, { useState } from 'react';
import {
  LearningRoadmapIcon,
  EditorialIcon,
  CheckCircleIcon,
  LockIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  SearchIcon,
  CodingBracketsIcon,
  WarningStatusIcon,
  HintIcon,
  AISparkleIcon,
  StreakIcon,
} from './icons';
import { PHASES, TOPICS, PhaseInfo, getPhaseForDay } from '../utils/roadmap';
import { CFProblem, ProblemAttempt, TopicCurriculum } from '../types';
import { TopicCloud } from './TopicCloud';
import { LearningStudyIllustration, EmptyProblemsState } from './assets';
import { MathText } from './MathText';

interface CurriculumViewProps {
  currentDay: number;
  onSelectProblem: (problem: CFProblem) => void;
  selectedTopicId?: string;
  attempts?: ProblemAttempt[];
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  currentDay,
  onSelectProblem,
  selectedTopicId,
  attempts = [],
}) => {
  const activePhase = getPhaseForDay(currentDay).phase;
  const [selectedPhase, setSelectedPhase] = useState<number>(activePhase);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTopic, setActiveModalTopic] = useState<TopicCurriculum | null>(
    selectedTopicId ? TOPICS.find((t) => t.id === selectedTopicId) || null : null
  );

  const filteredTopics = TOPICS.filter((t) => {
    const matchesPhase = searchQuery ? true : t.phase === selectedPhase;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keyIdeas.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPhase && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <AISparkleIcon size={14} semantic="primary" />
              <span>Structured Algorithmic Pathway</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              180-Day Curriculum Roadmap
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              26 weeks structured into 7 progressive mastery phases. Master fundamental invariants, algorithms, and data structures step-by-step from 800 to 1600 with zero guesswork.
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon size={16} semantic="success" /> 7 Phases
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <EditorialIcon size={16} semantic="primary" /> {TOPICS.length} Curated Topics
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <LearningRoadmapIcon size={16} semantic="indigo" /> Codeforces 1600 Target
              </span>
            </div>
          </div>

          <div className="w-full md:w-72 lg:w-80 shrink-0 flex justify-center">
            <div className="w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20 hover:scale-[1.02] transition-transform duration-300">
              <LearningStudyIllustration height={170} />
            </div>
          </div>
        </div>

        {/* Search Bar & Jump to Current Day */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <SearchIcon size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search concepts or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setSelectedPhase(getPhaseForDay(currentDay).phase);
              setSearchQuery('');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
          >
            <StreakIcon size={14} semantic="warning" />
            <span>Jump to My Day (Day {currentDay} · Phase {getPhaseForDay(currentDay).phase})</span>
          </button>
        </div>
      </div>

      {/* Algorithmic Topic Cloud & Practice Deficit Frequency Analysis */}
      <section>
        <TopicCloud
          attempts={attempts}
          currentDay={currentDay}
          onSelectProblem={onSelectProblem}
          onFilterCurriculum={(tag) => setSearchQuery(tag)}
        />
      </section>

      {/* Phase Pills Bar (Swipeable carousel on mobile, responsive grid on desktop) */}
      {!searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible">
          {PHASES.map((p) => {
            const isCurrent = currentDay >= p.startDay && currentDay <= p.endDay;
            const isSelected = selectedPhase === p.phase;
            return (
              <button
                key={p.phase}
                type="button"
                onClick={() => setSelectedPhase(p.phase)}
                className={`min-w-[125px] sm:min-w-0 shrink-0 sm:shrink p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500/50 text-white shadow-md'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                )}
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Phase {p.phase}
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">{p.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">Days {p.startDay}–{p.endDay}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Phase Highlight Summary */}
      {!searchQuery && (
        <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4 space-y-1 text-xs">
          <div className="font-bold text-indigo-300">
            Phase {selectedPhase}: {PHASES.find((p) => p.phase === selectedPhase)?.name} (Target Rating Band: {PHASES.find((p) => p.phase === selectedPhase)?.targetRatingBand})
          </div>
          <p className="text-slate-300 leading-relaxed">
            {PHASES.find((p) => p.phase === selectedPhase)?.focus}
          </p>
          <p className="text-emerald-400 text-[11px] font-medium pt-1">
            <strong>Outcome:</strong> {PHASES.find((p) => p.phase === selectedPhase)?.outcome}
          </p>
        </div>
      )}

      {/* Topic Cards Grid */}
      {filteredTopics.length === 0 ? (
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 text-center">
          <EmptyProblemsState
            title="No Curriculum Topics Found"
            description={searchQuery ? `No topics match "${searchQuery}". Try searching for dynamic programming, binary search, trees, or graphs.` : "No curriculum topics in this phase yet."}
            actionLabel={searchQuery ? "Clear Search" : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => {
          const isCurrentTopic = currentDay >= topic.startDay && currentDay <= topic.endDay;
          return (
            <div
              key={topic.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                isCurrentTopic
                  ? 'border-indigo-500/60 bg-gradient-to-br from-indigo-950/30 to-slate-900/80 shadow-lg shadow-indigo-950/30'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">
                    Days {topic.startDay}–{topic.endDay}
                  </span>
                  {isCurrentTopic && (
                    <span className="rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 text-[10px] font-bold">
                      Current Milestone
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">{topic.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{topic.description}</p>

                {/* Key Ideas preview */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Core Insights
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {topic.keyIdeas.slice(0, 2).map((idea, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 text-xs font-bold">&bull;</span>
                        <span className="line-clamp-2">{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div className="text-[11px] text-slate-400">
                  {topic.recommendedProblems.length} target problems
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalTopic(topic)}
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                  >
                    <EditorialIcon size={14} semantic="primary" />
                    <span>Study Lesson</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectProblem(topic.recommendedProblems[0])}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <span>Practice</span>
                    <ChevronRightIcon size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Detailed Lesson Modal */}
      {activeModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto safe-area-overlay">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Phase {activeModalTopic.phase}: {activeModalTopic.phaseName} &bull; Days {activeModalTopic.startDay}–{activeModalTopic.endDay}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {activeModalTopic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTopic(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Intuition & Purpose
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">
                {activeModalTopic.description}
              </p>
            </div>

            {/* Prerequisites */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prerequisites
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeModalTopic.prerequisites.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Core Insights */}
            <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <HintIcon size={16} semantic="warning" />
                <span>Core Algorithmic Principles</span>
              </h4>
              <ul className="text-xs text-slate-200 space-y-2">
                {activeModalTopic.keyIdeas.map((idea, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">&bull;</span>
                    <span className="leading-relaxed">
                      <MathText text={idea} inline />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Complexity Guidance */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CodingBracketsIcon size={16} semantic="primary" />
                <span>Time & Space Complexity Rules</span>
              </h4>
              <div className="text-xs text-slate-300 font-mono">
                <MathText text={activeModalTopic.timeComplexityGuidance} inline />
              </div>
            </div>

            {/* Common Mistakes */}
            <div className="rounded-xl border border-rose-900/30 bg-rose-950/20 p-4 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <WarningStatusIcon size={16} semantic="error" />
                <span>Common Beginner Traps</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-1">
                {activeModalTopic.commonMistakes.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400">&bull;</span>
                    <span className="leading-relaxed">
                      <MathText text={m} inline />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Problems */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Target Practice Problems
              </h4>
              <div className="space-y-2">
                {activeModalTopic.recommendedProblems.map((prob) => (
                  <div
                    key={`${prob.contestId}${prob.index}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-indigo-400">
                          {prob.contestId}{prob.index}
                        </span>
                        <span className="font-semibold text-xs text-white">{prob.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          Rating {prob.rating}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {prob.tags.join(', ')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalTopic(null);
                        onSelectProblem(prob);
                      }}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Open in Workspace
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* External Verified Resources */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reliable External References
              </span>
              <div className="flex flex-wrap gap-2">
                {activeModalTopic.externalResources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-colors"
                  >
                    <span>{res.title}</span>
                    <ExternalLinkIcon size={12} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
