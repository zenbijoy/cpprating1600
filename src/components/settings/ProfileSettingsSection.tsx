import React from 'react';
import {
  UserProfileIcon as User,
  MedalIcon as Award,
  ShieldIcon as ShieldCheck,
  ProblemTagsIcon as Tag,
  CheckCircleIcon as CheckCircle2,
} from '../icons';
import { ProfileSettings } from '../../types/settings';
import { ProgrammingLanguage } from '../../types';
import { useTranslation } from '../../utils/i18n';

interface ProfileSettingsSectionProps {
  profile: ProfileSettings;
  onChange: (updated: ProfileSettings) => void;
  cfHandle?: string;
  cfRating?: number;
  cfMaxRating?: number;
  cfRank?: string;
  isCfVerified?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
];

const AVAILABLE_TOPICS = [
  'greedy',
  'dp',
  'binary search',
  'two pointers',
  'math',
  'data structures',
  'graphs',
  'strings',
  'trees',
  'number theory',
  'bit manipulation',
  'combinatorics',
  'constructive algorithms',
];

const AVAILABLE_GOALS = [
  { id: 'reach_1600_rating', label: 'Reach Codeforces 1600 (Specialist)' },
  { id: 'master_dynamic_programming', label: 'Master DP Subproblems & Recurrences' },
  { id: 'two_pointers_fluency', label: 'Zero Hesitation Two-Pointer Implementations' },
  { id: 'fast_div2_ab', label: 'Solve Div.2 A & B within 15 Minutes' },
  { id: 'zero_hint_streak', label: 'Maintain a 14-Day Zero-Hint Problem Streak' },
  { id: 'clear_mistake_backlog', label: 'Clear Overdue Mistake Notebook Daily' },
];

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  profile,
  onChange,
  cfHandle,
  cfRating,
  cfMaxRating,
  cfRank,
  isCfVerified = false,
}) => {
  const { t } = useTranslation();

  const toggleTopic = (topic: string) => {
    const current = profile.preferredTopics || [];
    const exists = current.includes(topic);
    const updated = exists ? current.filter((t) => t !== topic) : [...current, topic];
    onChange({ ...profile, preferredTopics: updated });
  };

  const toggleGoal = (goalId: string) => {
    const current = profile.learningGoals || [];
    const exists = current.includes(goalId);
    const updated = exists ? current.filter((g) => g !== goalId) : [...current, goalId];
    onChange({ ...profile, learningGoals: updated });
  };

  return (
    <div className="space-y-6">
      {/* 1. Identity & Avatar Selection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Personal Information & Identity</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="relative group shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-950 border-2 border-indigo-700 flex items-center justify-center font-bold text-xl text-indigo-300">
                {(profile.displayName || 'U')[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-1 flex-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Avatar Selection</span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange({ ...profile, avatar: url })}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    profile.avatar === url ? 'border-indigo-400 scale-110 shadow-sm' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
              <input
                type="text"
                placeholder="Or paste custom image URL..."
                value={profile.avatar}
                onChange={(e) => onChange({ ...profile, avatar: e.target.value })}
                className="w-full sm:w-60 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.display_name')}</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => onChange({ ...profile, displayName: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Tourist Jr."
            />
          </div>

          {/* Country / Region */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.country')}</label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => onChange({ ...profile, country: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Bangladesh, United States, Poland"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.bio')}</label>
          <textarea
            rows={2}
            value={profile.bio}
            onChange={(e) => onChange({ ...profile, bio: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            placeholder="Share your CP goals, focus philosophy, or university affiliation..."
          />
        </div>
      </div>

      {/* 2. Competitive Programming Track Record */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>Competitive Programming Profile</span>
        </h3>

        {/* Verified Codeforces Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {cfHandle || 'No Codeforces handle linked'}
              </span>
              {isCfVerified ? (
                <span className="flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="rounded bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Current Rating: <strong className="text-slate-900 dark:text-white font-mono">{cfRating || 'Unrated'}</strong> • Max Rating: <strong className="text-slate-700 dark:text-slate-300 font-mono">{cfMaxRating || 'N/A'}</strong> ({cfRank || 'Unrated'})
            </p>
          </div>
          <span className="text-[11px] text-slate-500">
            Ratings are verified via Codeforces API and cannot be manually modified.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Experience Level */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.experience')}</label>
            <select
              value={profile.experienceLevel}
              onChange={(e) => onChange({ ...profile, experienceLevel: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="complete_beginner">{t('profile.exp_beginner')}</option>
              <option value="some_experience">{t('profile.exp_intermediate')}</option>
              <option value="experienced_coder">{t('profile.exp_experienced')}</option>
            </select>
          </div>

          {/* Preferred Language */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.preferred_lang')}</label>
            <select
              value={profile.preferredLanguage}
              onChange={(e) => onChange({ ...profile, preferredLanguage: e.target.value as ProgrammingLanguage })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="cpp20">C++20 (Recommended for Speed)</option>
              <option value="cpp17">C++17 (Standard CP)</option>
              <option value="python">Python 3 / PyPy3</option>
            </select>
          </div>

          {/* Target Rating */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.target_rating')}</label>
            <input
              type="number"
              min={800}
              max={3500}
              step={50}
              value={profile.targetRating}
              onChange={(e) => onChange({ ...profile, targetRating: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Weekly Goal Hours */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('profile.weekly_goal')}</label>
            <span className="font-mono font-bold text-indigo-400">{profile.weeklyGoalHours} hrs / week</span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={profile.weeklyGoalHours}
            onChange={(e) => onChange({ ...profile, weeklyGoalHours: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Preferred Topics & Goals */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>{t('profile.preferred_topics')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Select the algorithmic topics you want prioritized in your daily mission recommendations and practice arena.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOPICS.map((topic) => {
            const isSelected = (profile.preferredTopics || []).includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-700'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Learning Goals */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Learning Milestones</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_GOALS.map((goal) => {
              const isChecked = (profile.learningGoals || []).includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isChecked
                      ? 'border-indigo-800/80 bg-indigo-950/30 text-indigo-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isChecked ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span>{goal.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
