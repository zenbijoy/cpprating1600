import { ProgrammingLanguage } from '../../../types';

export type LeetCodeDifficulty = 'Easy' | 'Medium' | 'Hard';

export type LeetCodePersonalStatus = 'unsolved' | 'attempted' | 'solved';

export interface LeetCodeTopicTag {
  name: string;
  slug: string;
  problemCount?: number;
}

export interface LeetCodeExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface LeetCodeProblem {
  id: string; // unique slug or ID
  frontendQuestionId: string; // e.g. "1", "42"
  title: string;
  titleSlug: string;
  difficulty: LeetCodeDifficulty;
  topicTags: string[];
  paidOnly: boolean;
  acceptanceRate: number; // percentage (0 - 100)
  url: string; // canonical URL e.g. https://leetcode.com/problems/two-sum/
  source: 'leetcode_graphql' | 'curated_catalog' | 'cached_db';
  description?: string;
  constraints?: string[];
  examples?: LeetCodeExample[];
  hints?: string[];
  starterCode?: Partial<Record<ProgrammingLanguage, string>>;
}

export interface LeetCodeProblemFilter {
  search?: string;
  difficulty?: 'All' | LeetCodeDifficulty;
  topicTags?: string[];
  status?: 'all' | 'solved' | 'attempted' | 'unsolved' | 'bookmarked';
  sortBy?: 'id' | 'title' | 'difficulty' | 'acceptanceRate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedLeetCodeProblems {
  problems: LeetCodeProblem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  availableTags: LeetCodeTopicTag[];
  difficultyCounts: {
    all: number;
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface UserLeetCodeProgress {
  id?: string;
  userId?: string;
  problemSlug: string;
  status: LeetCodePersonalStatus;
  bookmark: boolean;
  personalNotes?: string;
  userCode?: string;
  codeLanguage?: ProgrammingLanguage;
  hintsUsed?: number;
  mistakeCategory?: string;
  difficultyOfRecall?: number; // 1-5
  lastAttemptedAt?: string;
  solvedAt?: string;
  nextRevisionAt?: string;
  selfReported?: boolean;
}

export interface LeetCodeUserProfile {
  username: string;
  realName?: string;
  avatarUrl?: string;
  ranking?: number;
  reputation?: number;
  solvedTotal: number;
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;
  totalSubmissions?: number;
  contestRating?: number;
  contestGlobalRanking?: number;
  contestAttended?: number;
  contestTopPercentage?: number;
  recentSubmissions: {
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }[];
  streak?: number;
  fetchedAt: string;
  isCached: boolean;
  source: 'live_api' | 'cached' | 'fallback';
}

export interface LeetCodeDailyChallenge {
  date: string; // YYYY-MM-DD
  link: string;
  problem: LeetCodeProblem;
  userProgress?: UserLeetCodeProgress;
}

export interface LeetCodeAdaptiveRecommendation {
  dailyProblem: LeetCodeProblem;
  weakTopicProblems: LeetCodeProblem[];
  dueRevisions: LeetCodeProblem[];
  challengeProblem: LeetCodeProblem;
  focusTopic: string;
  minimumDailyGoal: {
    problem: LeetCodeProblem;
    targetMinutes: number;
  };
}
