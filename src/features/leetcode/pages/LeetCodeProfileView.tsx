import React, { useState, useEffect } from 'react';
import {
  UserProfileIcon,
  SearchIcon,
  RefreshIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  FlameIcon,
  TargetRatingIcon,
} from '../../../components/icons';
import { LeetCodeUserProfile } from '../types/leetcode.types';
import { leetCodeClient } from '../services/leetcodeClient';

export const LeetCodeProfileView: React.FC = () => {
  const [username, setUsername] = useState<string>(() => leetCodeClient.getSavedUsername() || '');
  const [profile, setProfile] = useState<LeetCodeUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (targetUser: string) => {
    if (!targetUser.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await leetCodeClient.getUserProfile(targetUser.trim());
      setProfile(data);
      leetCodeClient.setSavedUsername(targetUser.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch LeetCode profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfile(username);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <UserProfileIcon size={18} />
          </span>
          <h1 className="text-2xl font-bold text-slate-100">LeetCode Profile Integration</h1>
        </div>
        <p className="text-sm text-slate-400">
          Sync and inspect your public LeetCode stats, contest rating, and recent submissions.
        </p>
      </div>

      {/* Username Input Card */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <UserProfileIcon
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter public LeetCode username (e.g. tourist, neetcode)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshIcon size={15} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Fetching...' : 'Sync Profile'}</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400 mt-2">
          Note: Only public statistics from LeetCode.com are fetched. We never ask for session cookies, passwords, or private tokens.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start justify-between gap-3">
          <div>
            <strong className="block font-semibold mb-1">Profile Query Issue</strong>
            {error}. Check the spelling or open your public profile on LeetCode directly.
          </div>
          {username && (
            <a
              href={`https://leetcode.com/${encodeURIComponent(username)}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 shrink-0"
            >
              Open on LeetCode ↗
            </a>
          )}
        </div>
      )}

      {/* Profile Stats Cards */}
      {profile && (
        <div className="space-y-6">
          {/* Main User Card */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-400 overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username.slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-100">{profile.username}</h2>
                  {profile.source === 'live_api' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Cached Stats
                    </span>
                  )}
                </div>
                {profile.realName && (
                  <p className="text-xs text-slate-400 mt-0.5">{profile.realName}</p>
                )}
                {profile.ranking && (
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Global Ranking: #{profile.ranking.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <a
              href={`https://leetcode.com/${encodeURIComponent(profile.username)}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors"
            >
              <ExternalLinkIcon size={14} />
              <span>Official Profile</span>
            </a>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-xs text-slate-400">Total Solved</span>
              <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
                {profile.solvedTotal}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {profile.totalSubmissions ? `${profile.totalSubmissions} submissions` : 'Public record'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
              <span className="text-xs text-emerald-400 font-medium">Easy Solved</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                {profile.solvedEasy}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Fundamentals</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
              <span className="text-xs text-amber-400 font-medium">Medium Solved</span>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                {profile.solvedMedium}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Core Patterns</span>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10">
              <span className="text-xs text-rose-400 font-medium">Hard Solved</span>
              <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
                {profile.solvedHard}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Advanced</span>
            </div>
          </div>

          {/* Contest Performance Card */}
          {profile.contestRating ? (
            <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TargetRatingIcon size={18} className="text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">LeetCode Contest Standing</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Contest Rating</span>
                  <div className="text-xl font-bold text-indigo-300 font-mono mt-0.5">
                    {profile.contestRating}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Contest Rank</span>
                  <div className="text-xl font-bold text-slate-200 font-mono mt-0.5">
                    {profile.contestGlobalRanking
                      ? `#${profile.contestGlobalRanking.toLocaleString()}`
                      : '—'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Top Percentage</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {profile.contestTopPercentage ? `Top ${profile.contestTopPercentage}%` : '—'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Contests Attended</span>
                  <div className="text-xl font-bold text-slate-200 font-mono mt-0.5">
                    {profile.contestAttended ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Recent Submissions */}
          {profile.recentSubmissions && profile.recentSubmissions.length > 0 && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-slate-100 text-sm mb-3">Recent Accepted Submissions</h3>
              <div className="divide-y divide-slate-800">
                {profile.recentSubmissions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between text-xs text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon size={14} className="text-emerald-400 shrink-0" />
                      <span className="font-medium text-slate-100">{sub.title}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800">
                        {sub.lang}
                      </span>
                      <span>{new Date(sub.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
