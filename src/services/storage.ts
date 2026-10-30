import {
  CFRatingChange,
  CFSubmission,
  CFSubmissionRecord,
  CFSyncState,
  CFUserInfo,
  CodeDraft,
  DailyPlan,
  LocalSubmission,
  MistakeRecord,
  ProblemAttempt,
  UserBookmark,
  UserGoal,
  UserProfile,
} from '../types';
import { GlobalUserSettings } from '../types/settings';
import { DEFAULT_GLOBAL_SETTINGS, mergeWithDefaultSettings } from '../utils/settingsDefaults';

const STORAGE_KEYS = {
  PROFILE: 'climb1600_profile',
  GOAL: 'climb1600_goal',
  PLANS: 'climb1600_daily_plans',
  ATTEMPTS: 'climb1600_problem_attempts',
  MISTAKES: 'climb1600_mistakes',
  DRAFTS: 'climb1600_drafts',
  COACH_HISTORY: 'climb1600_coach_history',
  REVISION_HISTORY: 'climb1600_revision_history',
  SYNC_QUEUE: 'climb1600_sync_queue',
  FOCUS_SESSIONS: 'climb1600_focus_sessions',
  STUDY_GROUPS: 'climb1600_study_groups',
  CHALLENGES: 'climb1600_challenges',
  VIRTUAL_CONTESTS: 'climb1600_virtual_contests',
  SETTINGS: 'climb1600_global_settings',
};

export const defaultGoal: UserGoal = {
  targetRating: 1600,
  totalDays: 180,
  startDate: new Date().toISOString().split('T')[0],
  dailyMinutes: 45,
  availableDays: [0, 1, 2, 3, 4, 5, 6],
  preferredHour: '19:00',
  baselineLevel: 'complete_beginner',
  currentPhase: 1,
  currentDay: 1,
  personalMotivation: 'Build strong independent algorithmic intuition and climb to Codeforces Specialist (1600).',
  examWeeksActive: false,
};

export const defaultProfile: UserProfile = {
  id: 'user_local_1',
  name: 'Competitive Programmer',
  email: 'solver@climb1600.dev',
  preferredLanguage: 'cpp20',
  theme: 'light',
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  lastActiveDate: new Date().toISOString().split('T')[0],
  hintDelayMinutes: 15,
};

// Seed sample mistake to show how the Mistake Notebook works immediately
export const initialSampleMistakes: MistakeRecord[] = [
  {
    id: 'sample_m1',
    problemId: '4A',
    problemName: 'Watermelon',
    problemUrl: 'https://codeforces.com/problemset/problem/4/A',
    rating: 800,
    tags: ['brute force', 'math'],
    category: 'boundary_case',
    originalApproach: 'Checked if the weight was even (w % 2 == 0) and printed YES.',
    whyItFailed: 'Failed on w = 2. Splitting 2 into two positive parts gives 1 and 1, which are odd numbers.',
    correctObservation: 'w must be even AND strictly greater than 2.',
    correctApproach: 'w > 2 && w % 2 == 0 ? "YES" : "NO"',
    personalLesson: 'Always test the smallest possible boundary value (e.g. 1 and 2 for integers) before submitting.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    nextReviewDate: new Date().toISOString().split('T')[0], // due today
    intervalDays: 1,
    reviewCount: 0,
    status: 'due',
  },
  {
    id: 'sample_m2',
    problemId: '71A',
    problemName: 'Way Too Long Words',
    problemUrl: 'https://codeforces.com/problemset/problem/71/A',
    rating: 800,
    tags: ['strings'],
    category: 'indexing_error',
    originalApproach: 's[0] + to_string(n) + s[n]',
    whyItFailed: 'In 0-based indexing, the last character is at index (n-1), and the inside count is (n-2).',
    correctObservation: 'Word length > 10 requires first letter, count of middle letters, last letter.',
    correctApproach: 's[0] + to_string(s.length() - 2) + s[s.length() - 1]',
    personalLesson: 'Be vigilant with 0-based vs 1-based indexing limits on strings.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    nextReviewDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    intervalDays: 3,
    reviewCount: 1,
    status: 'scheduled',
  },
];

// Seed sample attempts to show 30-day streak and consistency immediately
export const initialSampleAttempts: ProblemAttempt[] = [
  {
    id: 'att_seed_today',
    problemId: '4A',
    contestId: 4,
    index: 'A',
    name: 'Watermelon',
    rating: 800,
    tags: ['brute force', 'math'],
    url: 'https://codeforces.com/problemset/problem/4/A',
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    timeSpentSeconds: 1500,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    officialVerdict: 'OK',
    outcome: 'solved_independently',
    selfReported: false,
    approachNotes: 'Correctly handled boundary condition w=2 and even weight parity.',
  },
  {
    id: 'att_seed_1d',
    problemId: '71A',
    contestId: 71,
    index: 'A',
    name: 'Way Too Long Words',
    rating: 800,
    tags: ['strings'],
    url: 'https://codeforces.com/problemset/problem/71/A',
    startedAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 2.5).toISOString(),
    timeSpentSeconds: 1200,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    officialVerdict: 'OK',
    outcome: 'solved_independently',
    selfReported: false,
    approachNotes: '0-indexed string size manipulation.',
  },
  {
    id: 'att_seed_2d',
    problemId: '231A',
    contestId: 231,
    index: 'A',
    name: 'Team',
    rating: 800,
    tags: ['brute force', 'greedy'],
    url: 'https://codeforces.com/problemset/problem/231/A',
    startedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 3.6).toISOString(),
    timeSpentSeconds: 960,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    officialVerdict: 'OK',
    outcome: 'solved_independently',
    selfReported: false,
    approachNotes: 'Greedy count of sure solutions (>= 2).',
  },
  {
    id: 'att_seed_3d',
    problemId: '158A',
    contestId: 158,
    index: 'A',
    name: 'Next Round',
    rating: 800,
    tags: ['special problem'],
    url: 'https://codeforces.com/problemset/problem/158/A',
    startedAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 1.6).toISOString(),
    timeSpentSeconds: 1440,
    hintsUsedCount: 1,
    highestHintLevel: 2,
    officialVerdict: 'OK',
    outcome: 'solved_with_hints',
    selfReported: false,
    approachNotes: 'Count participants with positive score and >= k-th score.',
  },
  {
    id: 'att_seed_5d',
    problemId: '282A',
    contestId: 282,
    index: 'A',
    name: 'Bit++',
    rating: 800,
    tags: ['implementation'],
    url: 'https://codeforces.com/problemset/problem/282/A',
    startedAt: new Date(Date.now() - 86400000 * 5 - 3600000 * 5).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 5 - 3600000 * 4.7).toISOString(),
    timeSpentSeconds: 780,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    officialVerdict: 'OK',
    outcome: 'solved_independently',
    selfReported: false,
    approachNotes: 'Increment/decrement counting with string contains.',
  },
  {
    id: 'att_seed_6d',
    problemId: '50A',
    contestId: 50,
    index: 'A',
    name: 'Domino piling',
    rating: 800,
    tags: ['greedy', 'math'],
    url: 'https://codeforces.com/problemset/problem/50/A',
    startedAt: new Date(Date.now() - 86400000 * 6 - 3600000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 6 - 3600000 * 3.8).toISOString(),
    timeSpentSeconds: 720,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    officialVerdict: 'OK',
    outcome: 'solved_independently',
    selfReported: false,
    approachNotes: 'Floor division (M * N) / 2.',
  },
];

export const storageService = {
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return defaultProfile;
      return JSON.parse(data);
    } catch {
      return defaultProfile;
    }
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getGoal(): UserGoal {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOAL);
      if (!data) return defaultGoal;
      return JSON.parse(data);
    } catch {
      return defaultGoal;
    }
  },

  saveGoal(goal: UserGoal): void {
    localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
  },

  getDailyPlans(): DailyPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveDailyPlan(plan: DailyPlan): void {
    const plans = this.getDailyPlans();
    const idx = plans.findIndex((p) => p.date === plan.date || p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.push(plan);
    }
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  },

  getAttempts(): ProblemAttempt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(initialSampleAttempts));
        return initialSampleAttempts;
      }
      return JSON.parse(data);
    } catch {
      return initialSampleAttempts;
    }
  },

  saveAttempt(attempt: ProblemAttempt): void {
    const attempts = this.getAttempts();
    const idx = attempts.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) {
      attempts[idx] = attempt;
    } else {
      attempts.unshift(attempt);
    }
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  },

  getMistakes(): MistakeRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (!data) {
        // Initialize with realistic initial sample mistakes so the feature is immediately testable
        localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(initialSampleMistakes));
        return initialSampleMistakes;
      }
      return JSON.parse(data);
    } catch {
      return initialSampleMistakes;
    }
  },

  saveMistake(mistake: MistakeRecord): void {
    const mistakes = this.getMistakes();
    const idx = mistakes.findIndex((m) => m.id === mistake.id);
    if (idx >= 0) {
      mistakes[idx] = mistake;
    } else {
      mistakes.unshift(mistake);
    }
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  },

  deleteMistake(id: string): void {
    const mistakes = this.getMistakes().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  },

  getRevisionHistory(): import('../types').RevisionHistoryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVISION_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRevisionHistoryEntry(entry: import('../types').RevisionHistoryEntry): void {
    const history = this.getRevisionHistory();
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.REVISION_HISTORY, JSON.stringify(history.slice(0, 500)));
  },

  getSyncQueue(): import('../types').SyncEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueueSyncEvent(event: Omit<import('../types').SyncEvent, 'id'>): import('../types').SyncEvent {
    const queue = this.getSyncQueue();
    const fullEvent: import('../types').SyncEvent = {
      ...event,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    queue.push(fullEvent);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    return fullEvent;
  },

  dequeueSyncEvent(id: string): void {
    const queue = this.getSyncQueue().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  clearSyncQueue(): void {
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  },

  getFocusSessions(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveFocusSession(session: any): void {
    const sessions = this.getFocusSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.unshift(session);
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions.slice(0, 100)));
  },

  getStudyGroups(): import('../types').StudyGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_GROUPS);
      return data ? JSON.parse(data) : [
        {
          id: 'grp_specialists',
          name: '1600 Specialists Cohort',
          description: 'Daily practice and collaborative upsolving towards Codeforces 1600.',
          inviteCode: 'CLIMB1600',
          createdBy: 'system',
          isPublic: true,
          createdAt: new Date().toISOString(),
          memberCount: 142,
        },
        {
          id: 'grp_binary_search',
          name: 'Binary Search Drill Circle',
          description: 'Focused practice on monotonic predicates, lower_bound, and answer binary search.',
          inviteCode: 'BS1200',
          createdBy: 'system',
          isPublic: true,
          createdAt: new Date().toISOString(),
          memberCount: 88,
        },
      ];
    } catch {
      return [];
    }
  },

  saveStudyGroup(group: import('../types').StudyGroup): void {
    const groups = this.getStudyGroups();
    const idx = groups.findIndex((g) => g.id === group.id);
    if (idx >= 0) groups[idx] = group;
    else groups.unshift(group);
    localStorage.setItem(STORAGE_KEYS.STUDY_GROUPS, JSON.stringify(groups));
  },

  getSocialChallenges(): import('../types').SocialChallenge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return data ? JSON.parse(data) : [
        {
          id: 'ch_weekly_solves',
          title: 'Weekly 15-Problem Sprint',
          description: 'Solve 15 problems within your rating target this week.',
          targetType: 'problems_solved',
          targetValue: 15,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          isOfficial: true,
          participantsCount: 310,
        },
        {
          id: 'ch_revision_streak',
          title: 'Zero Overdue Mistake Streak',
          description: 'Clear all due mistake notebook reviews for 5 consecutive days.',
          targetType: 'streak_days',
          targetValue: 5,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          isOfficial: true,
          participantsCount: 225,
        },
      ];
    } catch {
      return [];
    }
  },

  saveSocialChallenge(challenge: import('../types').SocialChallenge): void {
    const challenges = this.getSocialChallenges();
    const idx = challenges.findIndex((c) => c.id === challenge.id);
    if (idx >= 0) challenges[idx] = challenge;
    else challenges.unshift(challenge);
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  },

  getVirtualContests(): import('../utils/virtualContest').VirtualContestState[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VIRTUAL_CONTESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveVirtualContest(contest: import('../utils/virtualContest').VirtualContestState): void {
    try {
      const contests = this.getVirtualContests();
      const idx = contests.findIndex((c) => c.id === contest.id);
      if (idx >= 0) contests[idx] = contest;
      else contests.unshift(contest);
      localStorage.setItem(STORAGE_KEYS.VIRTUAL_CONTESTS, JSON.stringify(contests));
    } catch (e) {
      console.error('Failed to save virtual contest:', e);
    }
  },

  getUserJoinedGroups(): string[] {
    try {
      const data = localStorage.getItem('climb1600_joined_groups');
      return data ? JSON.parse(data) : ['grp_specialists'];
    } catch {
      return ['grp_specialists'];
    }
  },

  joinGroup(groupId: string): void {
    const current = this.getUserJoinedGroups();
    if (!current.includes(groupId)) {
      current.push(groupId);
      localStorage.setItem('climb1600_joined_groups', JSON.stringify(current));
    }
  },

  leaveGroup(groupId: string): void {
    const current = this.getUserJoinedGroups().filter((id) => id !== groupId);
    localStorage.setItem('climb1600_joined_groups', JSON.stringify(current));
  },

  getUserJoinedChallenges(): string[] {
    try {
      const data = localStorage.getItem('climb1600_joined_challenges');
      return data ? JSON.parse(data) : ['ch_weekly_solves'];
    } catch {
      return ['ch_weekly_solves'];
    }
  },

  joinChallenge(challengeId: string): void {
    const current = this.getUserJoinedChallenges();
    if (!current.includes(challengeId)) {
      current.push(challengeId);
      localStorage.setItem('climb1600_joined_challenges', JSON.stringify(current));
    }
  },

  leaveChallenge(challengeId: string): void {
    const current = this.getUserJoinedChallenges().filter((id) => id !== challengeId);
    localStorage.setItem('climb1600_joined_challenges', JSON.stringify(current));
  },

  getDraft(problemId: string): { code: string; language: string; notes: string; complexity: string } | null {
    try {
      const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      return allDrafts[problemId] || null;
    } catch {
      return null;
    }
  },

  saveDraft(problemId: string, data: { code: string; language: string; notes: string; complexity: string }): void {
    try {
      const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      allDrafts[problemId] = { ...data, lastUpdated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(allDrafts));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  },

  getCodeVersions(problemId: string): import('../types').CodeVersion[] {
    try {
      const all = JSON.parse(localStorage.getItem('climb1600_code_versions') || '{}');
      return all[problemId] || [];
    } catch {
      return [];
    }
  },

  saveCodeVersion(version: import('../types').CodeVersion): void {
    try {
      const all = JSON.parse(localStorage.getItem('climb1600_code_versions') || '{}');
      const list = all[version.problemId] || [];
      list.unshift(version);
      all[version.problemId] = list.slice(0, 30); // keep last 30 versions
      localStorage.setItem('climb1600_code_versions', JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save code version:', e);
    }
  },

  exportAllData(): string {
    const payload = {
      profile: this.getProfile(),
      goal: this.getGoal(),
      plans: this.getDailyPlans(),
      attempts: this.getAttempts(),
      mistakes: this.getMistakes(),
      revisionHistory: this.getRevisionHistory(),
      focusSessions: this.getFocusSessions(),
      studyGroups: this.getStudyGroups(),
      exportedAt: new Date().toISOString(),
      appVersion: '1.1.0',
    };
    return JSON.stringify(payload, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (data.goal) this.saveGoal(data.goal);
      if (Array.isArray(data.plans)) localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(data.plans));
      if (Array.isArray(data.attempts)) localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(data.attempts));
      if (Array.isArray(data.mistakes)) localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(data.mistakes));
      if (Array.isArray(data.revisionHistory)) localStorage.setItem(STORAGE_KEYS.REVISION_HISTORY, JSON.stringify(data.revisionHistory));
      if (Array.isArray(data.focusSessions)) localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(data.focusSessions));
      if (Array.isArray(data.studyGroups)) localStorage.setItem(STORAGE_KEYS.STUDY_GROUPS, JSON.stringify(data.studyGroups));
      return true;
    } catch (err) {
      console.error('Failed to import user data:', err);
      return false;
    }
  },

  getGeminiApiKey(): string {
    try {
      return localStorage.getItem('climb1600_gemini_api_key') || '';
    } catch {
      return '';
    }
  },

  saveGeminiApiKey(key: string): void {
    try {
      if (key && key.trim()) {
        localStorage.setItem('climb1600_gemini_api_key', key.trim());
      } else {
        localStorage.removeItem('climb1600_gemini_api_key');
      }
    } catch (e) {
      console.error('Failed to save Gemini API key:', e);
    }
  },

  loadSampleDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(initialSampleAttempts));
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(initialSampleMistakes));
  },

  getSettings(): GlobalUserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return { ...DEFAULT_GLOBAL_SETTINGS, lastUpdated: new Date().toISOString() };
      return mergeWithDefaultSettings(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_GLOBAL_SETTINGS, lastUpdated: new Date().toISOString() };
    }
  },

  saveSettings(settings: GlobalUserSettings): void {
    try {
      const updated = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  },

  resetSettings(section?: keyof GlobalUserSettings): GlobalUserSettings {
    try {
      const current = this.getSettings();
      let updated: GlobalUserSettings;
      if (!section) {
        updated = { ...DEFAULT_GLOBAL_SETTINGS, lastUpdated: new Date().toISOString() };
      } else {
        updated = {
          ...current,
          [section]: DEFAULT_GLOBAL_SETTINGS[section],
          lastUpdated: new Date().toISOString(),
        };
      }
      this.saveSettings(updated);
      return updated;
    } catch {
      return DEFAULT_GLOBAL_SETTINGS;
    }
  },

  getStorageUsage(): { usedBytes: number; formatted: string; itemCount: number } {
    try {
      let totalBytes = 0;
      let count = 0;
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const val = localStorage.getItem(key) || '';
            totalBytes += key.length * 2 + val.length * 2;
            count++;
          }
        }
      }
      const formatted =
        totalBytes < 1024
          ? `${totalBytes} B`
          : totalBytes < 1024 * 1024
          ? `${(totalBytes / 1024).toFixed(1)} KB`
          : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
      return { usedBytes: totalBytes, formatted, itemCount: count };
    } catch {
      return { usedBytes: 0, formatted: '0 KB', itemCount: 0 };
    }
  },

  clearLocalCache(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        // Clear caches like CF cache, bookmarks, temporary items while preserving core credentials
        localStorage.removeItem(STORAGE_KEYS.DRAFTS);
        localStorage.removeItem('climb1600_code_versions');
        localStorage.removeItem('climb1600_cf_user_info');
        localStorage.removeItem('climb1600_cf_rating_history');
        localStorage.removeItem('climb1600_cf_submissions');
      }
    } catch (e) {
      console.error('Failed to clear local cache:', e);
    }
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.GOAL);
    localStorage.removeItem(STORAGE_KEYS.PLANS);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, '[]');
    localStorage.setItem(STORAGE_KEYS.MISTAKES, '[]');
    localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    localStorage.removeItem('climb1600_code_versions');
  },
};

// -----------------------------------------------------------------------
// CF-specific storage: bookmarks + cached CF submissions for solve status
// -----------------------------------------------------------------------

export type ProblemBookmark = UserBookmark;

const EXT_KEYS = {
  CF_USER_INFO: 'climb1600_cf_user_info',
  CF_RATING_HISTORY: 'climb1600_cf_rating_history',
  CF_SUBMISSIONS: 'climb1600_cf_submissions',
  CF_SYNC_STATE: 'climb1600_cf_sync_state',
  BOOKMARKS: 'climb1600_bookmarks',
  CODE_DRAFTS: 'climb1600_code_drafts',
  LOCAL_SUBMISSIONS: 'climb1600_local_submissions',
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const cfStorageService = {
  // CF User Info
  getCFUserInfo: (): CFUserInfo | null =>
    readJSON<CFUserInfo | null>(EXT_KEYS.CF_USER_INFO, null),
  saveCFUserInfo: (info: CFUserInfo) => writeJSON(EXT_KEYS.CF_USER_INFO, info),
  clearCFUserInfo: () => localStorage.removeItem(EXT_KEYS.CF_USER_INFO),

  // Rating History
  getRatingHistory: (): CFRatingChange[] =>
    readJSON<CFRatingChange[]>(EXT_KEYS.CF_RATING_HISTORY, []),
  saveRatingHistory: (history: CFRatingChange[]) => writeJSON(EXT_KEYS.CF_RATING_HISTORY, history),

  // Submissions
  getCFSubmissions: (): CFSubmissionRecord[] =>
    readJSON<CFSubmissionRecord[]>(EXT_KEYS.CF_SUBMISSIONS, []),
  saveCFSubmissions: (subs: CFSubmissionRecord[]) => writeJSON(EXT_KEYS.CF_SUBMISSIONS, subs),

  // Sync State
  getSyncState: (): CFSyncState | null =>
    readJSON<CFSyncState | null>(EXT_KEYS.CF_SYNC_STATE, null),
  saveSyncState: (state: CFSyncState) => writeJSON(EXT_KEYS.CF_SYNC_STATE, state),

  // Bookmarks
  getBookmarks: (): UserBookmark[] =>
    readJSON<UserBookmark[]>(EXT_KEYS.BOOKMARKS, []),
  saveBookmark: (bm: UserBookmark) => {
    const existing = readJSON<UserBookmark[]>(EXT_KEYS.BOOKMARKS, []);
    const filtered = existing.filter(b => b.problemId !== bm.problemId);
    writeJSON(EXT_KEYS.BOOKMARKS, [bm, ...filtered]);
  },
  removeBookmark: (problemId: string) => {
    const existing = readJSON<UserBookmark[]>(EXT_KEYS.BOOKMARKS, []);
    writeJSON(EXT_KEYS.BOOKMARKS, existing.filter(b => b.problemId !== problemId));
  },
  isBookmarked: (problemId: string): boolean => {
    const existing = readJSON<UserBookmark[]>(EXT_KEYS.BOOKMARKS, []);
    return existing.some(b => b.problemId === problemId);
  },

  // Code Drafts
  getAllDrafts: (): CodeDraft[] =>
    readJSON<CodeDraft[]>(EXT_KEYS.CODE_DRAFTS, []),
  getDraft: (problemId: string, language: string): CodeDraft | null => {
    const all = readJSON<CodeDraft[]>(EXT_KEYS.CODE_DRAFTS, []);
    return all.find(d => d.problemId === problemId && d.language === language) ?? null;
  },
  saveDraft: (draft: CodeDraft) => {
    const all = readJSON<CodeDraft[]>(EXT_KEYS.CODE_DRAFTS, []);
    const idx = all.findIndex(d => d.problemId === draft.problemId && d.language === draft.language);
    if (idx >= 0) all[idx] = draft; else all.unshift(draft);
    writeJSON(EXT_KEYS.CODE_DRAFTS, all);
  },

  // Local Submissions
  getLocalSubmissions: (): LocalSubmission[] =>
    readJSON<LocalSubmission[]>(EXT_KEYS.LOCAL_SUBMISSIONS, []),
  saveLocalSubmission: (sub: LocalSubmission) => {
    const all = readJSON<LocalSubmission[]>(EXT_KEYS.LOCAL_SUBMISSIONS, []);
    const idx = all.findIndex(s => s.id === sub.id);
    if (idx >= 0) all[idx] = sub; else all.unshift(sub);
    writeJSON(EXT_KEYS.LOCAL_SUBMISSIONS, all);
  },
};
