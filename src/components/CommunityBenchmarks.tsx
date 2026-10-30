import React, { useState, useMemo } from 'react';
import {
  CommunityIcon,
  TrendUpIcon,
  TargetRatingIcon,
  CheckCircleIcon,
  WarningStatusIcon,
  AISparkleIcon,
  AddIcon,
  CopyIcon,
  StreakIcon,
  CloseIcon,
} from './icons';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  calculateCommunityBenchmarks,
  CommunityBenchmarkComparison,
} from '../utils/communityBenchmarks';
import { ProblemAttempt, StudyGroup, SocialChallenge, UserGoal, UserProfile } from '../types';
import { storageService } from '../services/storage';

interface CommunityBenchmarksProps {
  attempts: ProblemAttempt[];
  goal: UserGoal;
  profile?: UserProfile;
}

type ComparisonMetric = 'rating' | 'solves';
type CommunityTab = 'benchmarks' | 'groups' | 'challenges';

export const CommunityBenchmarks: React.FC<CommunityBenchmarksProps> = ({
  attempts,
  goal,
  profile,
}) => {
  const [metric, setMetric] = useState<ComparisonMetric>('rating');
  const [activeCommunityTab, setActiveCommunityTab] = useState<CommunityTab>('benchmarks');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() => storageService.getStudyGroups());
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(() => storageService.getUserJoinedGroups());
  const [challenges, setChallenges] = useState<SocialChallenge[]>(() => storageService.getSocialChallenges());
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>(() => storageService.getUserJoinedChallenges());

  // Create Group Modal State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  const comparison: CommunityBenchmarkComparison = useMemo(() => {
    return calculateCommunityBenchmarks(attempts, goal, profile);
  }, [attempts, goal, profile]);

  const handleToggleGroup = (groupId: string) => {
    if (joinedGroupIds.includes(groupId)) {
      storageService.leaveGroup(groupId);
      setJoinedGroupIds((prev) => prev.filter((id) => id !== groupId));
    } else {
      storageService.joinGroup(groupId);
      setJoinedGroupIds((prev) => [...prev, groupId]);
    }
  };

  const handleToggleChallenge = (challengeId: string) => {
    if (joinedChallengeIds.includes(challengeId)) {
      storageService.leaveChallenge(challengeId);
      setJoinedChallengeIds((prev) => prev.filter((id) => id !== challengeId));
    } else {
      storageService.joinChallenge(challengeId);
      setJoinedChallengeIds((prev) => [...prev, challengeId]);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: StudyGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || 'Collaborative competitive programming cohort.',
      inviteCode: `CLIMB-${Math.floor(1000 + Math.random() * 9000)}`,
      createdBy: profile?.id || 'user_local_1',
      isPublic: true,
      createdAt: new Date().toISOString(),
      memberCount: 1,
    };
    storageService.saveStudyGroup(newGroup);
    storageService.joinGroup(newGroup.id);
    setStudyGroups((prev) => [newGroup, ...prev]);
    setJoinedGroupIds((prev) => [...prev, newGroup.id]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowCreateGroup(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedInvite(text);
    setTimeout(() => setCopiedInvite(null), 2000);
  };

  const getPaceBadge = (status: CommunityBenchmarkComparison['paceStatus']) => {
    switch (status) {
      case 'ahead':
        return {
          label: 'Ahead of Average Cohort',
          bg: 'bg-emerald-950/40 border-emerald-800/60',
          text: 'text-emerald-300',
          icon: <CheckCircleIcon size={14} semantic="success" />,
        };
      case 'on_pace':
        return {
          label: 'Tracking Community Average',
          bg: 'bg-indigo-950/40 border-indigo-800/60',
          text: 'text-indigo-300',
          icon: <TrendUpIcon size={14} semantic="primary" />,
        };
      case 'behind':
      default:
        return {
          label: 'Trailing Average Cohort',
          bg: 'bg-amber-950/40 border-amber-800/60',
          text: 'text-amber-300',
          icon: <WarningStatusIcon size={14} semantic="warning" />,
        };
    }
  };

  const paceBadge = getPaceBadge(comparison.paceStatus);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CommunityIcon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                <span>Community & Cohort Hub</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Target 1600 Cohort
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Benchmark your trajectory, collaborate in study groups, and complete community challenges.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveCommunityTab('benchmarks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeCommunityTab === 'benchmarks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendUpIcon size={14} />
            <span>Cohort Stats</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCommunityTab('groups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeCommunityTab === 'groups'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CommunityIcon size={14} />
            <span>Study Groups ({studyGroups.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCommunityTab('challenges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeCommunityTab === 'challenges'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TargetRatingIcon size={14} />
            <span>Challenges ({challenges.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COHORT BENCHMARKS */}
      {activeCommunityTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Select Comparison Dimension:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMetric('rating')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metric === 'rating' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rating Trajectory
              </button>
              <button
                type="button"
                onClick={() => setMetric('solves')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metric === 'solves' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cumulative Solves
              </button>
            </div>
          </div>

          {/* Cohort Comparison Highlight Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Percentile Rank Card */}
            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Cohort Percentile
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-black text-white">
                  {comparison.cohortPercentile}
                  <span className="text-xs text-indigo-300">th</span>
                </span>
                <span className="text-[10px] text-slate-400">percentile</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Top {100 - comparison.cohortPercentile}% of active learners
              </p>
            </div>

            {/* Pace Status Card */}
            <div className={`rounded-xl border p-3.5 space-y-1 ${paceBadge.bg}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cohort Pace
              </span>
              <div className="flex items-center gap-1.5">
                {paceBadge.icon}
                <span className={`text-sm md:text-base font-bold ${paceBadge.text} truncate`}>
                  {comparison.paceStatus === 'ahead'
                    ? 'Ahead of Cohort'
                    : comparison.paceStatus === 'on_pace'
                    ? 'On Cohort Pace'
                    : 'Trailing Cohort'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Day {comparison.currentDay} of 180
              </p>
            </div>

            {/* Solves vs Cohort Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Solves vs Cohort Avg
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-black text-cyan-400">
                  {comparison.userSolvedCount}
                </span>
                <span className="text-xs text-slate-400">vs {comparison.communityAvgSolves} avg</span>
              </div>
              <p className={`text-[10px] font-mono ${comparison.solvesDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {comparison.solvesDelta >= 0 ? `+${comparison.solvesDelta}` : `${comparison.solvesDelta}`} problems delta
              </p>
            </div>

            {/* Weekly Velocity Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Weekly Velocity
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-black text-amber-300">
                  {comparison.userWeeklyVelocity}
                </span>
                <span className="text-xs text-slate-400">/ wk</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Cohort median: ~5.0 probs/wk
              </p>
            </div>
          </div>

          {/* Comparative Recharts Graph */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {metric === 'rating'
                    ? 'Codeforces Rating Trajectory (User vs Cohort)'
                    : 'Cumulative Solves Progression (User vs Cohort)'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">0 to 180 Days</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                {metric === 'rating' ? 'Target: 1600 Specialist' : 'Target: ~240 Solves'}
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={comparison.points}
                  margin={{ top: 20, right: 20, bottom: 5, left: -10 }}
                >
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    domain={metric === 'rating' ? [750, 1750] : [0, 320]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: 10,
                      fontSize: 12,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(val: any, name: any) => {
                      if (val === null || val === undefined) return ['--', name];
                      const unit = metric === 'rating' ? 'pts' : 'solves';
                      return [`${val} ${unit}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

                  {metric === 'rating' && (
                    <ReferenceLine
                      y={1600}
                      stroke="#38bdf8"
                      strokeDasharray="4 4"
                      label={{
                        value: '1600 Target',
                        fill: '#38bdf8',
                        fontSize: 11,
                        position: 'top',
                      }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey={metric === 'rating' ? 'topQuartileRating' : 'topQuartileSolves'}
                    stroke="none"
                    fill="rgba(99, 102, 241, 0.12)"
                    name="Top 25% Cohort Band"
                  />

                  <Line
                    type="monotone"
                    dataKey={metric === 'rating' ? 'communityAverageRating' : 'communityAverageSolves'}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                    name="Community Average (50th %ile)"
                  />

                  <Line
                    type="monotone"
                    dataKey={metric === 'rating' ? 'topQuartileRating' : 'topQuartileSolves'}
                    stroke="#a855f7"
                    strokeDasharray="2 2"
                    strokeWidth={1.5}
                    dot={false}
                    name="Top 25% Fast-Track"
                  />

                  <Line
                    type="monotone"
                    dataKey={metric === 'rating' ? 'userRating' : 'userCumulativeSolves'}
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 1.5 }}
                    name="Your Trajectory"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cohort Coaching Analysis & Insights */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <AISparkleIcon size={16} semantic="warning" />
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Cohort Progress Analysis
              </h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {comparison.insights}
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-800/60 pt-2">
              Cohort data is synthesized from historical Codeforces trainee trajectories (starting unrated and progressing toward Div.2 Specialist). Rating gains accelerate during Phases 3 and 4 as pattern recognition solidifies.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STUDY GROUPS */}
      {activeCommunityTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Study Groups & Peer Circles</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Join or create focused peer training groups to compare solves and maintain practice consistency.
              </p>
            </div>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <AddIcon size={14} />
              <span>Create Group</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyGroups.map((group) => {
              const isJoined = joinedGroupIds.includes(group.id);
              return (
                <div
                  key={group.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-100 text-sm">{group.name}</h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {group.memberCount || 1} members
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{group.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyToClipboard(group.inviteCode)}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800"
                      title="Copy Invite Code"
                    >
                      <CopyIcon size={12} />
                      <span>{copiedInvite === group.inviteCode ? 'Copied!' : group.inviteCode}</span>
                    </button>

                    <button
                      onClick={() => handleToggleGroup(group.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isJoined
                          ? 'bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isJoined ? 'Leave Group' : 'Join Group'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL CHALLENGES */}
      {activeCommunityTab === 'challenges' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100">Active Community Sprints & Challenges</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Participate in weekly community training sprints to build consistent habits and algorithmic stamina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => {
              const isJoined = joinedChallengeIds.includes(challenge.id);
              const solvesDone = attempts.filter(
                (a) => a.outcome === 'solved_independently' || a.outcome === 'solved_with_hints' || a.officialVerdict === 'OK'
              ).length;
              const currentProgress = Math.min(challenge.targetValue, solvesDone);
              const progressPct = Math.round((currentProgress / challenge.targetValue) * 100);

              return (
                <div
                  key={challenge.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StreakIcon size={16} semantic="warning" />
                        <h5 className="font-bold text-slate-100 text-sm">{challenge.title}</h5>
                      </div>
                      {challenge.isOfficial && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{challenge.description}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Progress: {currentProgress} / {challenge.targetValue}</span>
                        <span className="text-emerald-400">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {challenge.participantsCount || 100}+ participants
                    </span>

                    <button
                      onClick={() => handleToggleChallenge(challenge.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isJoined
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-slate-800'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isJoined ? 'Joined ✓' : 'Join Challenge'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">Create Study Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-slate-400 hover:text-slate-200">
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka Div.2 Upsolvers"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  placeholder="Briefly state your study schedule, goal rating, and target focus."
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Create & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cohort Coaching Analysis & Insights */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <AISparkleIcon size={16} semantic="warning" />
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Cohort Progress Analysis
          </h4>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {comparison.insights}
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-800/60 pt-2">
          Cohort data is synthesized from historical Codeforces trainee trajectories (starting unrated and progressing toward Div.2 Specialist). Rating gains accelerate during Phases 3 and 4 as pattern recognition solidifies.
        </p>
      </div>
    </div>
  );
};
