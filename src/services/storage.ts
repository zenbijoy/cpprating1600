import { DailyPlan, MistakeRecord, ProblemAttempt, UserGoal, UserProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'climb1600_profile',
  GOAL: 'climb1600_goal',
  PLANS: 'climb1600_daily_plans',
  ATTEMPTS: 'climb1600_problem_attempts',
  MISTAKES: 'climb1600_mistakes',
  DRAFTS: 'climb1600_drafts',
  COACH_HISTORY: 'climb1600_coach_history',
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
  theme: 'dark',
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

  exportAllData(): string {
    const payload = {
      profile: this.getProfile(),
      goal: this.getGoal(),
      plans: this.getDailyPlans(),
      attempts: this.getAttempts(),
      mistakes: this.getMistakes(),
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
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
      return true;
    } catch (err) {
      console.error('Failed to import user data:', err);
      return false;
    }
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.GOAL);
    localStorage.removeItem(STORAGE_KEYS.PLANS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.MISTAKES);
    localStorage.removeItem(STORAGE_KEYS.DRAFTS);
  },
};
