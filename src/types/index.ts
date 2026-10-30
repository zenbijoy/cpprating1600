export type ProgrammingLanguage = 'javascript' | 'python' | 'cpp20' | 'cpp17' | 'c' | 'java';

export interface ProblemTestCase {
  id: number;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface ProblemTestCaseResult {
  testCaseId: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
  executionTimeMs?: number;
  errorMessage?: string;
}

export interface ProblemDetail {
  id: string;
  name: string;
  contestId?: number;
  index?: string;
  rating?: number;
  difficultyLabel: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  testCases: ProblemTestCase[];
  starterCode?: Partial<Record<ProgrammingLanguage, string>>;
}

export type SkillLevel = 'complete_beginner' | 'some_experience' | 'experienced_coder';

export type MissionMode = 'minimum' | 'standard' | 'deep_work';

export type EnergyLevel = 'normal' | 'low' | 'limited_time' | 'exam_pressure' | 'high';

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
  theme: 'dark' | 'light' | 'multicolor' | 'orange' | 'purple' | 'system';
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
    energyLevel: EnergyLevel;
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
  | 'monotonicity_violation'
  | 'wrong_data_structure'
  | 'poor_time_management'
  | 'needed_too_many_hints'
  | 'could_not_prove_correctness';

export type Sm2Quality = 0 | 1 | 2 | 3 | 4 | 5;

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
  easeFactor?: number; // SM-2 ease factor (default 2.5, min 1.3)
  consecutiveSuccesses?: number; // SM-2 consecutive successful recalls
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

export type CFSubmissionRecord = CFSubmission;

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFUserInfo {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CFSyncState {
  handle?: string;
  lastSyncedAt?: string;
  lastUserInfoSync?: string | null;
  lastRatingSync?: string | null;
  lastSubmissionsSync?: string | null;
  status: 'idle' | 'syncing' | 'error' | 'ok' | 'success';
  errorMessage?: string | null;
  error?: string;
}

export interface UserBookmark {
  problemId: string;
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  savedAt: string;
  notes?: string;
}

export interface CodeVersion {
  id: string;
  problemId: string;
  versionNumber: number;
  code: string;
  language: ProgrammingLanguage;
  savedAt: string;
  description?: string;
}

export interface ExecutionResult {
  status: 'OK' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'BACKEND_UNAVAILABLE';
  stdout?: string;
  stderr?: string;
  compilerOutput?: string;
  executionTimeMs?: number;
  memoryConsumedBytes?: number;
  message?: string;
}

export interface PlaygroundExecutionResult {
  status:
    | 'OK'
    | 'COMPILATION_ERROR'
    | 'RUNTIME_ERROR'
    | 'TIME_LIMIT_EXCEEDED'
    | 'MEMORY_LIMIT_EXCEEDED'
    | 'CANCELLED'
    | 'BACKEND_UNAVAILABLE'
    | 'PROVIDER_ERROR';
  stdout?: string;
  stderr?: string;
  compilerOutput?: string;
  compileTimeMs?: number;
  executionTimeMs?: number;
  isCachedCompilation?: boolean;
  memoryConsumedBytes?: number;
  exitCode?: number;
  message?: string;
  jobId?: string;
}

export interface AiDebugRequest {
  code: string;
  language: string;
  compilerOutput?: string;
  stderr?: string;
  stdout?: string;
  stdin?: string;
  expectedOutput?: string;
  userDescription?: string;
  executionTimeMs?: number;
}

export interface AiDebugResponse {
  success: boolean;
  summary: string;
  errorCategory: string;
  evidence: string;
  rootCause: string;
  suggestedFix: string;
  correctedCode?: string | null;
  correctedCodeExplanation?: string | null;
  additionalTests?: string;
  confidence: string;
  disclaimer: string;
  source: string;
}

export interface PlaygroundSnippet {
  id: string;
  userId: string;
  title: string;
  description?: string;
  language: ProgrammingLanguage;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeDraft {
  id?: string;
  problemId: string;
  language: string;
  code: string;
  notes?: string;
  complexity?: string;
  lastUpdated?: string;
  updatedAt?: string;
  name?: string;
}

export type SubmissionStatus =
  | 'draft'
  | 'ready'
  | 'opened_on_cf'
  | 'awaiting_sync'
  | 'submitted'
  | 'judging'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'runtime_error'
  | 'compilation_error'
  | 'other_verdict'
  | 'unable_to_verify';

export interface LocalSubmission {
  id: string;
  problemId: string;
  contestId?: number;
  problemIndex?: string;
  problemName?: string;
  language: string;
  code: string;
  status: SubmissionStatus | string;
  verdict?: string;
  cfSubmissionId?: number;
  cfVerdict?: string;
  cfTimeMs?: number;
  cfMemoryBytes?: number;
  openedAt?: string;
  syncedAt?: string;
  timeSpentSeconds?: number;
  createdAt: string;
  notes?: string;
}

// ============================================================================
// CATEGORY 1: AI STUDY GUARDIAN & PHONE USAGE INTELLIGENCE
// ============================================================================

export type AppUsageCategory =
  | 'competitive_programming'
  | 'educational_content'
  | 'university_study'
  | 'essential_communication'
  | 'productivity'
  | 'entertainment'
  | 'social_media'
  | 'configured_distraction'
  | 'unknown';

export interface AppUsageEvent {
  id: string;
  packageName: string;
  appName: string;
  category: AppUsageCategory;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  confidence: number; // 0 to 1
  detectionSource:
    | 'high_confidence_rule'
    | 'user_configured'
    | 'active_context'
    | 'on_device_classifier'
    | 'gemini_vision'
    | 'user_override';
  userCorrection?: AppUsageCategory;
  isStudyRelevant: boolean;
  relevanceExplanation: string;
}

export interface FocusSessionTimelineEntry {
  id: string;
  type: 'focus' | 'authorized_break' | 'essential_interruption' | 'configured_distraction' | 'unknown';
  startTime: string;
  endTime: string;
  durationSeconds: number;
  title: string;
  details: string;
  confidence: number;
  source: string;
  userVerified: boolean;
}

export interface DistractionCostReport {
  scheduledStudyMinutes: number;
  confirmedForegroundMinutes: number;
  estimatedOffTaskMinutes: number;
  authorizedBreakMinutes: number;
  unclassifiedMinutes: number;
  lostPercentage: number;
  weeklyTrends: { day: string; distractedMinutes: number; focusedMinutes: number }[];
  practicalInterventions: string[];
}

export interface DistractionPattern {
  id: string;
  triggerContext: string;
  targetApp: string;
  frequency: number;
  suggestedIntervention: string;
}

export interface SmartFocusNotification {
  id: string;
  type: 'session_starting' | 'distraction_warning' | 'break_ended' | 'task_reschedule';
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
}

export interface GuardianAccuracyCorrection {
  id: string;
  timestamp: string;
  packageName: string;
  appName: string;
  originalCategory: AppUsageCategory;
  correctedCategory: AppUsageCategory;
  reason?: string;
  updatedRule?: boolean;
}

// ============================================================================
// CATEGORY 2: ANDROID DISTRACTION CONTROL
// ============================================================================

export interface AppRestrictionRule {
  id: string;
  packageName: string;
  appName: string;
  category: AppUsageCategory;
  isBlocked: boolean;
  delaySeconds: number; // 0, 10, or 30
  allowInStrictFocus: boolean;
  isEssential: boolean;
}

export interface WebsiteFilterRule {
  id: string;
  domain: string;
  category: 'distraction' | 'sensitive' | 'learning_allowlist';
  isBlocked: boolean;
  profileId?: string;
}

export interface StudyProfile {
  id: string;
  name: 'Codeforces Practice' | 'C++ Learning' | 'University Study' | 'Contest Mode' | 'Deep Work' | string;
  allowedDomains: string[];
  restrictedApps: string[];
  strictBlocking: boolean;
  active: boolean;
}

export interface StrictFocusModeConfig {
  active: boolean;
  durationMinutes: number;
  startedAt?: string;
  endsAt?: string;
  restrictedAppsCount: number;
  blockedWebsitesCount: number;
  allowedEmergencyApps: string[];
  canEarlyExit: boolean;
  exitReason?: string;
}

export interface ScheduledFocusPolicy {
  id: string;
  name: string;
  daysOfWeek: number[]; // 0-6
  startTime: string; // "19:00"
  endTime: string; // "21:00"
  strictLevel: 'gentle' | 'standard' | 'strict';
  profileId: string;
  isEnabled: boolean;
}

export interface FocusRecoveryState {
  activeProblemId?: string;
  activeProblemName?: string;
  problemUrl?: string;
  elapsedSeconds: number;
  timerRunning: boolean;
  lastSavedNote?: string;
  nextActionSuggestion?: string;
  interruptedAt?: string;
  requiresRecap: boolean;
}

export interface AndroidDeviceHealth {
  usageStatsGranted: boolean;
  accessibilityGranted: boolean;
  screenCaptureAuthorized: boolean;
  notificationGranted: boolean;
  vpnConnected: boolean;
  batteryOptimizationsIgnored: boolean;
  lastSyncTimestamp: string;
  deviceModel: string;
  androidVersion: string;
}

export interface PlannedEntertainmentWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string;
  isEnabled: boolean;
}

// ============================================================================
// CATEGORY 3: AI CONTENT CLASSIFICATION & PRIVACY
// ============================================================================

export interface EducationalVideoContext {
  category:
    | 'programming_tutorial'
    | 'algorithm_lecture'
    | 'editorial_explanation'
    | 'university_lecture'
    | 'documentation'
    | 'entertainment'
    | 'unknown';
  confidence: number;
  titleOrTopic: string;
  source: 'heuristic' | 'on_device' | 'gemini_vision' | 'user_reported';
  isRelevant: boolean;
}

export interface YouTubeLearningSession {
  id: string;
  videoUrl: string;
  videoTitle: string;
  learningObjective: string;
  timestampedNotes: { timestamp: string; note: string }[];
  aiRecap?: string;
  relatedProblemId?: string;
  conceptCheckQuestion?: string;
  userExplanation?: string;
  completed: boolean;
}

export interface PrivacyPolicySettings {
  localFirstOnly: boolean;
  cloudGeminiVisionEnabled: boolean;
  screenshotRetention: 'discard_after_classification' | 'save_when_explicit';
  sensitiveWebsitesBlocked: boolean;
  allowExport: boolean;
  lastDataPurgedAt?: string;
}

// ============================================================================
// CATEGORY 4: ADVANCED COMPETITIVE PROGRAMMING INTELLIGENCE
// ============================================================================

export interface AdaptiveProblemRecommendation {
  problem: CFProblem;
  rationale: string;
  targetSkill: string;
  expectedDifficulty: number;
  matchedTopicId: string;
}

export interface WeaknessDetectionReport {
  weaknesses: {
    category: MistakeCategory;
    title: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
    recommendedAction: string;
    recommendedProblemIds: string[];
  }[];
}

export interface ComplexityCoachSession {
  problemId: string;
  problemConstraints: string;
  userEstimatedTime: string;
  userEstimatedSpace: string;
  coachValidation?: string;
  opsCountEstimate?: string;
  approved: boolean;
}

export interface VirtualContestSession {
  id: string;
  name: string;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string;
  problems: {
    problem: CFProblem;
    verdict?: string;
    solvedTimeMinutes?: number;
    attemptsCount: number;
  }[];
  upsolvingPlan: {
    problem: CFProblem;
    priority: 'high' | 'medium';
    deadlineDate: string;
  }[];
  reflectionNotes?: string;
}

export interface PreContestMistakeChecklist {
  id: string;
  contestTitle: string;
  generatedAt: string;
  items: {
    id: string;
    rule: string;
    rationale: string;
    rootCause: MistakeCategory;
    verified: boolean;
  }[];
}

// ============================================================================
// CATEGORY 5: PERFORMANCE OPTIMIZATION & HABIT FORMATION
// ============================================================================

export interface FiveMinuteStartTask {
  id: string;
  prompt: string;
  taskType: 'read_statement' | 'write_io' | 'review_mistake_card' | 'warmup_problem' | 'explain_concept';
  targetId?: string;
  durationSeconds: number;
}

export interface UniversityCommitment {
  id: string;
  title: string;
  type: 'class' | 'lab' | 'assignment' | 'exam' | 'deadline';
  startTime: string;
  endTime: string;
  date?: string;
  dayOfWeek?: number;
  protectsCP: boolean;
}

export interface PersonalExperiment {
  id: string;
  title: string;
  hypothesis: string;
  parameter: 'time_of_day' | 'session_length' | 'editorial_delay' | 'warmup_rule' | 'spaced_ratio';
  variantA: string;
  variantB: string;
  durationWeeks: number;
  scoreA: number;
  scoreB: number;
  status: 'planning' | 'running' | 'completed';
  conclusion?: string;
}

export interface WeeklyAICoachReport {
  id: string;
  weekNumber: number;
  period: string;
  improvements: string[];
  persistentWeaknesses: string[];
  timeLostDistractions: string[];
  recurringDistractions: string[];
  nextThreePriorities: string[];
  ratingProjectionSummary: string;
}

export interface PersonalTrainingPolicy {
  id: string;
  title: string;
  ruleTrigger: string;
  requiredAction: string;
  isActive: boolean;
  isUserEditable: boolean;
}

export interface GoalControlCenterStats {
  targetRating: number;
  currentRating: number;
  dayNumber: number;
  totalDays: number;
  curriculumPhase: number;
  phaseName: string;
  topicMasteryPercent: number;
  contestCount: number;
  practiceConsistencyPercent: number;
  mistakeRecurrenceCount: number;
  distractionMinutesWeekly: number;
  nextMilestone: string;
  projectedRatingBand: { min: number; expected: number; max: number };
}

// -------------------------------------------------------------
// REVISION ENGINE, SOCIAL & SYNC DATA TYPES
// -------------------------------------------------------------

export type ReviewOutcome = 'easy' | 'difficult' | 'failed';

export interface RevisionHistoryEntry {
  id: string;
  mistakeId: string;
  problemId: string;
  reviewDate: string; // ISO date-time string
  outcome: ReviewOutcome;
  previousInterval: number;
  newInterval: number;
  confidenceScore: number; // 1 to 5
  notes?: string;
}

export interface RevisionQueueItem {
  mistake: MistakeRecord;
  isOverdue: boolean;
  daysOverdue: number;
  history: RevisionHistoryEntry[];
  priorityScore: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  memberCount?: number;
}

export interface StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  verifiedCfRating?: number;
  solvedCount?: number;
  streakDays?: number;
}

export interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  targetType: 'problems_solved' | 'streak_days' | 'topic_mastery' | 'virtual_contest';
  targetValue: number;
  topicTag?: string;
  minRating?: number;
  startDate: string;
  endDate: string;
  isOfficial: boolean;
  createdBy?: string;
  participantsCount?: number;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  userName?: string;
  currentProgress: number;
  completed: boolean;
  completedAt?: string;
  joinedAt: string;
}

export interface SyncEvent {
  id: string;
  clientEventId: string;
  entityType: 'attempt' | 'mistake' | 'plan' | 'focus_session' | 'contest' | 'revision';
  action: 'upsert' | 'delete';
  payload: any;
  clientTimestamp: string;
  processedAt?: string;
}

