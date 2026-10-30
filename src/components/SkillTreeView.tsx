import React, { useState, useMemo } from 'react';
import {
  TopicMasteryIcon,
  CheckCircleIcon,
  LockIcon,
  UnlockIcon,
  WarningStatusIcon,
  RefreshIcon,
  AISparkleIcon,
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  EditorialIcon,
  ChevronRightIcon,
  TrendUpIcon,
  MedalIcon,
  SettingsSlidersIcon,
  CheckIcon,
  CloseIcon,
  RunCodeIcon,
  TerminalIcon,
  ArrowLeftIcon,
} from './icons';
import { CFProblem, MistakeRecord, ProblemAttempt, UserProfile } from '../types';
import {
  SKILL_TREE_NODES,
  SkillNode,
  SkillNodeStatus,
  TopicProgress,
  calculateTopicMastery,
  checkPrerequisitesStatus,
  recommendNextLearningTopics,
} from '../utils/skillTree';
import { EmptyProblemsState } from './assets';
import { MathText } from './MathText';

interface SkillTreeViewProps {
  attempts: ProblemAttempt[];
  mistakes: MistakeRecord[];
  userRating?: number;
  onSelectProblem: (prob: CFProblem) => void;
  onOpenWorkspace?: (prob: CFProblem) => void;
}

const STATUS_CONFIG: Record<
  SkillNodeStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  locked_by_prerequisite: {
    label: 'Prereqs Pending',
    bg: 'bg-slate-900/80',
    border: 'border-slate-800',
    text: 'text-slate-400',
    dot: 'bg-slate-500',
  },
  available: {
    label: 'Ready to Start',
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/60',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
  learning: {
    label: 'Learning (1-39%)',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-800/60',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
  },
  practicing: {
    label: 'Practicing (40-69%)',
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  needs_revision: {
    label: 'Needs Revision',
    bg: 'bg-rose-950/50',
    border: 'border-rose-800/70',
    text: 'text-rose-300',
    dot: 'bg-rose-400 animate-pulse',
  },
  strong: {
    label: 'Strong (70%+)',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
};

const CATEGORIES = [
  'All Categories',
  'Core Fundamentals',
  'Algorithmic Paradigms',
  'Search & Navigation',
  'Data Structures',
  'Graphs & Trees',
  'Dynamic Programming',
  'Mathematics',
  'Strings',
];

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  attempts,
  mistakes,
  userRating = 1000,
  onSelectProblem,
  onOpenWorkspace,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('implementation');
  const [mobileSkillTab, setMobileSkillTab] = useState<'tree' | 'details'>('tree');
  const [activeCategory, setActiveCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [overrideModalNode, setOverrideModalNode] = useState<SkillNode | null>(null);
  const [customOverrideInput, setCustomOverrideInput] = useState<number>(50);

  // Load manual overrides from localStorage
  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('climb1600_skill_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveOverride = (nodeId: string, score?: number) => {
    const updated = { ...overrides };
    if (score === undefined) {
      delete updated[nodeId];
    } else {
      updated[nodeId] = score;
    }
    setOverrides(updated);
    try {
      localStorage.setItem('climb1600_skill_overrides', JSON.stringify(updated));
    } catch {}
    setOverrideModalNode(null);
  };

  // Compute progress map for all topics
  const progressMap = useMemo(() => {
    const map = new Map<string, TopicProgress>();
    SKILL_TREE_NODES.forEach((node) => {
      const overrideVal = overrides[node.id];
      const prog = calculateTopicMastery(node, attempts, mistakes, userRating, overrideVal);
      // Soft check if prerequisites are not met and not already practicing/strong
      if (node.prerequisites.length > 0 && prog.masteryScore === 0) {
        const prereqCheck = checkPrerequisitesStatus(node.id, map);
        if (!prereqCheck.satisfied) {
          prog.status = 'locked_by_prerequisite';
        }
      }
      map.set(node.id, prog);
    });
    return map;
  }, [attempts, mistakes, userRating, overrides]);

  // AI recommendations based on prerequisites
  const recommendations = useMemo(() => {
    return recommendNextLearningTopics(progressMap);
  }, [progressMap]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return SKILL_TREE_NODES.filter((node) => {
      const matchesCategory =
        activeCategory === 'All Categories' || node.category === activeCategory;
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const selectedNode = useMemo(() => {
    return SKILL_TREE_NODES.find((n) => n.id === selectedNodeId) || SKILL_TREE_NODES[0];
  }, [selectedNodeId]);

  const selectedProgress = useMemo(() => {
    return progressMap.get(selectedNode.id)!;
  }, [selectedNode, progressMap]);

  const selectedPrereqCheck = useMemo(() => {
    return checkPrerequisitesStatus(selectedNode.id, progressMap);
  }, [selectedNode, progressMap]);

  // Overall mastery summary
  const overallStats = useMemo(() => {
    let totalScore = 0;
    let strongCount = 0;
    let practicingCount = 0;
    let needsRevCount = 0;

    progressMap.forEach((prog) => {
      totalScore += prog.masteryScore;
      if (prog.status === 'strong') strongCount++;
      else if (prog.status === 'practicing') practicingCount++;
      else if (prog.status === 'needs_revision') needsRevCount++;
    });

    const averageMastery = Math.round(totalScore / SKILL_TREE_NODES.length);
    return { averageMastery, strongCount, practicingCount, needsRevCount };
  }, [progressMap]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <TopicMasteryIcon size={20} semantic="primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Algorithm Skill Tree</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactive learning DAG map covering 23 core topics required for Codeforces Rating 1600.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search algorithms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 md:w-56"
            />
          </div>

          <div className="flex p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curriculum List
            </button>
          </div>
        </div>
      </div>

      {/* Top Mastery Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <MedalIcon size={16} semantic="primary" /> Average Mastery
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">{overallStats.averageMastery}%</span>
            <span className="text-xs text-slate-400">across 23 topics</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${overallStats.averageMastery}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <CheckCircleIcon size={16} semantic="success" /> Strong Topics (70%+)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{overallStats.strongCount}</span>
            <span className="text-xs text-slate-400">/ 23 mastered</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for Div. 2 B & C</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <TrendUpIcon size={16} semantic="warning" /> Practicing Topics
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{overallStats.practicingCount}</span>
            <span className="text-xs text-slate-400">active focus</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">40% to 69% mastery</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <RefreshIcon size={16} semantic="error" /> Needs Revision
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{overallStats.needsRevCount}</span>
            <span className="text-xs text-slate-400">topics due</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Spaced retention due</p>
        </div>
      </div>

      {/* AI Next Practice Recommendations Banner */}
      {recommendations.length > 0 && (
        <div className="p-4 rounded-2xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AISparkleIcon size={16} semantic="primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Coach Recommended Next Learning Sequence
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Based on prerequisite readiness</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recommendations.slice(0, 3).map(({ topic, progress, rationale }) => (
              <div
                key={topic.id}
                onClick={() => setSelectedNodeId(topic.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  selectedNodeId === topic.id
                    ? 'border-indigo-500 bg-indigo-950/60 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="truncate">{topic.name}</span>
                    <span className="text-[11px] font-mono text-indigo-400">{progress.masteryScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{rationale}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-indigo-300 font-medium">
                  <span>Explore Topic</span>
                  <ChevronRightIcon size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mobile Mode Switcher */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileSkillTab('tree')}
          className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            mobileSkillTab === 'tree'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🗺️ Skill DAG ({filteredNodes.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileSkillTab('details')}
          className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            mobileSkillTab === 'details'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎯 Topic: {selectedNode.name.slice(0, 16)}
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Skill Tree Graph or List (7 cols on lg) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileSkillTab === 'details' ? 'hidden lg:block' : 'block'}`}>
          {filteredNodes.length === 0 ? (
            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 text-center">
              <EmptyProblemsState
                title="No Algorithms Found"
                description={
                  searchQuery
                    ? `No algorithms match "${searchQuery}". Try searching for binary search, graphs, or dynamic programming.`
                    : 'No algorithms found in this category.'
                }
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearchQuery('');
                  setActiveCategory('All Categories');
                }}
              />
            </div>
          ) : viewMode === 'graph' ? (
            /* Visual Grouped Map */
            <div className="space-y-4">
              {Array.from(new Set(filteredNodes.map((n) => n.category))).map((categoryName) => {
                const nodesInCategory = filteredNodes.filter((n) => n.category === categoryName);
                if (nodesInCategory.length === 0) return null;

                return (
                  <div
                    key={categoryName}
                    className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <TopicMasteryIcon size={14} semantic="primary" />
                        {categoryName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {nodesInCategory.length} topic{nodesInCategory.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nodesInCategory.map((node) => {
                        const prog = progressMap.get(node.id)!;
                        const statusStyle = STATUS_CONFIG[prog.status];
                        const isSelected = selectedNodeId === node.id;

                        return (
                          <div
                            key={node.id}
                            onClick={() => {
                              setSelectedNodeId(node.id);
                              setMobileSkillTab('details');
                            }}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg'
                                : `${statusStyle.bg} ${statusStyle.border} hover:border-slate-600`
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 text-[11px] mb-1.5">
                                <span className="font-semibold text-amber-400/90 font-mono">
                                  ⚡ {node.ratingRange[0]}-{node.ratingRange[1]}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-medium text-[10px] flex items-center gap-1 border ${statusStyle.border} ${statusStyle.text}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                  {statusStyle.label}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300">
                                {node.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                {node.description}
                              </p>
                            </div>

                            {/* Progress bar and metrics */}
                            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">
                                  {prog.solvedCount} solved · {prog.attemptedCount} tried
                                </span>
                                <span className="font-mono font-bold text-slate-200">
                                  {prog.masteryScore}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    prog.masteryScore >= 70
                                      ? 'bg-emerald-400'
                                      : prog.masteryScore >= 40
                                      ? 'bg-amber-400'
                                      : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${prog.masteryScore}%` }}
                                />
                              </div>

                              {/* Prerequisites indicators */}
                              {node.prerequisites.length > 0 && (
                                <div className="text-[10px] text-slate-500 truncate pt-0.5">
                                  Prereqs:{' '}
                                  {node.prerequisites
                                    .map((p) => {
                                      const pNode = SKILL_TREE_NODES.find((x) => x.id === p);
                                      return pNode ? pNode.name.split(' ')[0] : p;
                                    })
                                    .join(' → ')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Linear Curriculum List View */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
              {filteredNodes.map((node) => {
                const prog = progressMap.get(node.id)!;
                const statusStyle = STATUS_CONFIG[prog.status];
                const isSelected = selectedNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setMobileSkillTab('details');
                    }}
                    className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{node.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border ${statusStyle.border} ${statusStyle.text} font-medium`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{node.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Tier {node.difficultyTier} ({node.ratingRange[0]}-{node.ratingRange[1]})</span>
                        <span>·</span>
                        <span>{prog.solvedCount} solves</span>
                        {prog.lastPracticedDate && (
                          <>
                            <span>·</span>
                            <span>Last practiced {prog.lastPracticedDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-slate-200">
                          {prog.masteryScore}%
                        </div>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${prog.masteryScore}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRightIcon size={16} className="text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Topic Practice & Mastery Drawer (5 cols on lg) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileSkillTab === 'tree' ? 'hidden lg:block' : 'block'}`}>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 shadow-xl sticky top-4">
            {/* Mobile Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileSkillTab('tree')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeftIcon size={14} />
                <span>Back to Skill Map</span>
              </button>
              <span className="text-[11px] font-mono text-indigo-400 font-bold">⚡ {selectedNode.ratingRange[0]}-{selectedNode.ratingRange[1]}</span>
            </div>

            {/* Topic Header & Status */}
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  {selectedNode.category}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold border ${
                      STATUS_CONFIG[selectedProgress.status].border
                    } ${STATUS_CONFIG[selectedProgress.status].text}`}
                  >
                    {STATUS_CONFIG[selectedProgress.status].label}
                  </span>
                  <button
                    onClick={() => {
                      setCustomOverrideInput(selectedProgress.masteryScore);
                      setOverrideModalNode(selectedNode);
                    }}
                    title="Manually adjust or reset mastery score"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <SettingsSlidersIcon size={14} />
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-100">{selectedNode.name}</h2>
              <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                <MathText text={selectedNode.description} inline />
              </div>
            </div>

            {/* Transparent Mastery Breakdown Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MedalIcon size={14} semantic="primary" /> Transparent Mastery Score
                </span>
                <span className="font-mono font-bold text-sm text-indigo-300">
                  {selectedProgress.masteryScore} / 100
                </span>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Independent Solves (max 35)</span>
                  <span className="font-mono text-slate-300">
                    {selectedProgress.breakdown.solvesScore} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rating Difficulty Weight (max 25)</span>
                  <span className="font-mono text-slate-300">
                    {selectedProgress.breakdown.difficultyScore} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hint Independence (max 20)</span>
                  <span className="font-mono text-slate-300">
                    {selectedProgress.breakdown.independenceScore} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Mistake Retention / Spaced Review (max 10)</span>
                  <span className="font-mono text-slate-300">
                    {selectedProgress.breakdown.revisionScore} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Consistency / Recency (max 10)</span>
                  <span className="font-mono text-slate-300">
                    {selectedProgress.breakdown.consistencyScore} pts
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                <MathText text={selectedProgress.breakdown.formula} inline />
              </div>
            </div>

            {/* Prerequisites Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TopicMasteryIcon size={14} semantic="primary" /> Prerequisite Dependencies
              </h4>
              {selectedNode.prerequisites.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  None — this is a foundational starting topic.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedNode.prerequisites.map((pId) => {
                    const pNode = SKILL_TREE_NODES.find((x) => x.id === pId);
                    const pProg = progressMap.get(pId);
                    const isSatisfied = pProg && pProg.masteryScore >= 40;

                    return (
                      <div
                        key={pId}
                        onClick={() => setSelectedNodeId(pId)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isSatisfied
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/40'
                            : 'bg-amber-950/20 border-amber-800/40 text-amber-300 hover:bg-amber-950/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSatisfied ? (
                            <CheckCircleIcon size={14} semantic="success" className="shrink-0" />
                          ) : (
                            <WarningStatusIcon size={14} semantic="warning" className="shrink-0" />
                          )}
                          <span className="font-medium">{pNode ? pNode.name : pId}</span>
                        </div>
                        <span className="font-mono text-[11px]">
                          {pProg ? `${pProg.masteryScore}%` : '0%'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Key Concepts & Invariants */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <EditorialIcon size={14} semantic="primary" /> Core Concepts & Invariants
              </h4>
              <ul className="space-y-1">
                {selectedNode.keyConcepts.map((c, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40"
                  >
                    <span className="text-indigo-400 font-bold">·</span>
                    <span className="leading-relaxed">
                      <MathText text={c} inline />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Typical Pitfalls */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <WarningStatusIcon size={14} semantic="error" className="shrink-0" /> Common Mistakes to Avoid
              </h4>
              <ul className="space-y-1">
                {selectedNode.commonPitfalls.map((pitfall, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-rose-300/90 flex items-start gap-2 bg-rose-950/20 p-2 rounded-lg border border-rose-900/40"
                  >
                    <span className="text-rose-400 font-bold">!</span>
                    <span className="leading-relaxed">
                      <MathText text={pitfall} inline />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Curated Practice Problems (Beginner, Intermediate, Challenging) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TerminalIcon size={14} semantic="primary" /> Curated Practice Problems
              </h4>

              <div className="space-y-2">
                {[
                  { level: 'Beginner', prob: selectedNode.practiceProblems.beginner, badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' },
                  { level: 'Intermediate', prob: selectedNode.practiceProblems.intermediate, badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800/80' },
                  { level: 'Challenging', prob: selectedNode.practiceProblems.challenging, badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800/80' },
                ].map(({ level, prob, badgeBg }) => {
                  const pid = `${prob.contestId}${prob.index}`;

                  return (
                    <div
                      key={pid}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${badgeBg}`}>
                            {level}
                          </span>
                          <span className="font-mono text-xs text-slate-400 font-bold">{pid}</span>
                          {prob.rating && (
                            <span className="text-[11px] text-amber-400 font-medium">⚡ {prob.rating}</span>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-slate-200">{prob.name}</h5>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onSelectProblem(prob)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <RunCodeIcon size={12} />
                          <span>Solve</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Next Action Banner */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs space-y-1">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <AISparkleIcon size={14} semantic="primary" /> Next Coach Action
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedProgress.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Mastery Override / Classification Modal */}
      {overrideModalNode && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SettingsSlidersIcon size={16} semantic="primary" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Adjust Mastery: {overrideModalNode.name}
                </h3>
              </div>
              <button
                onClick={() => setOverrideModalNode(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If our automatic mastery telemetry is inaccurate based on your prior competitive programming experience, you can manually adjust or reset your score here.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Topic Mastery:</span>
                <span className="font-mono font-bold text-indigo-400 text-base">
                  {customOverrideInput}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={customOverrideInput}
                onChange={(e) => setCustomOverrideInput(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Untouched)</span>
                <span>40% (Practicing)</span>
                <span>70%+ (Strong)</span>
                <span>100% (Mastered)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
              <button
                onClick={() => saveOverride(overrideModalNode.id, undefined)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-400 transition-colors cursor-pointer"
              >
                Reset to Telemetry
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOverrideModalNode(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveOverride(overrideModalNode.id, customOverrideInput)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
