export type ProgrammingLanguage = 'cpp20' | 'cpp17' | 'python';

export type SkillLevel = 'complete_beginner' | 'some_experience' | 'experienced_coder';

export type MissionMode = 'minimum' | 'standard' | 'deep_work';

export interface UserGoal {
  targetRating: number; // default 1600
  totalDays: number; // default 180
  startDate: string; // ISO date
  dailyMinutes: number; // e.g. 45
  availableDays: number[]; // 0-6 (Sun-Sat)
  preferredHour: string; // e.g. "20:00"
  baselineLevel: SkillLevel;
  currentPhase: number; // 1 to 7
  currentDay: number; // 1 to 180
  personalMotivation: string; // "Why I started"
  examWeeksActive: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cfHandle?: string;
  verifiedCfRating?: number;
  maxCfRating?: number;
  rank?: string;
  avatar?: string;
  preferredLanguage: ProgrammingLanguage;
  theme: 'dark' | 'light';
  onboardingCompleted: boolean;
  createdAt: string;
  lastActiveDate: string;
  hintDelayMinutes: number; // default 15
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  category: 'warmup' | 'concept' | 'problem' | 'mistake_review' | 'reflection' | 'recovery';
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  problemId?: string;
  topicId?: string;
  notes?: string;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1 to 180
  mode: MissionMode;
  targetMinutes: number;
  actualMinutes: number;
  tasks: DailyTask[];
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'recovery';
  reflection?: {
    learned: string;
    difficultyRating: 1 | 2 | 3 | 4 | 5;
    energyLevel: 'low' | 'medium' | 'high';
  };
}

export interface CFProblem {
  contestId?: number;
  index: string;
  name: string;
  type?: string;
  rating?: number;
  tags: string[];
  points?: number;
  solvedCount?: number;
}

export interface ProblemAttempt {
  id: string;
  problemId: string; // e.g. "158A" or "4A"
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  url: string;
  startedAt: string;
  endedAt?: string;
  timeSpentSeconds: number;
  hintsUsedCount: number;
  highestHintLevel: number; // 0 = none, 1-5, 6 = editorial
  outcome: 'solved_independently' | 'solved_with_hints' | 'attempted_gave_up' | 'editorial_studied';
  officialVerdict?: 'OK' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'UNSUBMITTED';
  selfReported: boolean;
  userCode?: string;
  codeLanguage?: ProgrammingLanguage;
  approachNotes?: string;
  complexityNotes?: string;
  mistakeSummary?: string;
}

export type MistakeCategory =
  | 'misread_statement'
  | 'wrong_observation'
  | 'incorrect_algorithm'
  | 'wrong_complexity'
  | 'implementation_bug'
  | 'integer_overflow'
  | 'boundary_case'
  | 'indexing_error'
  | 'wrong_data_structure'
  | 'poor_time_management'
  | 'needed_too_many_hints'
  | 'could_not_prove_correctness';

export interface MistakeRecord {
  id: string;
  problemId: string;
  problemName: string;
  problemUrl: string;
  rating?: number;
  tags: string[];
  category: MistakeCategory;
  originalApproach: string;
  whyItFailed: string;
  correctObservation: string;
  correctApproach: string;
  personalLesson: string;
  codeSnippet?: string;
  createdAt: string;
  nextReviewDate: string; // YYYY-MM-DD
  intervalDays: number;
  reviewCount: number;
  status: 'due' | 'scheduled' | 'mastered';
}

export interface TopicCurriculum {
  id: string;
  title: string;
  phase: number;
  phaseName: string;
  startDay: number;
  endDay: number;
  description: string;
  prerequisites: string[];
  keyIdeas: string[];
  timeComplexityGuidance: string;
  recommendedProblems: {
    contestId: number;
    index: string;
    name: string;
    rating: number;
    tags: string[];
  }[];
  commonMistakes: string[];
  externalResources: { title: string; url: string }[];
}

export interface ConsistencyStats {
  totalActiveDays: number;
  fullPracticeDays: number;
  recoveryDays: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusedMinutes: number;
  solvedProblemsCount: number;
  returnRateAfterMissed: number; // percentage
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  problem: CFProblem;
  programmingLanguage: string;
  verdict?: string;
  testset?: string;
  passedTestCount?: number;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
}
