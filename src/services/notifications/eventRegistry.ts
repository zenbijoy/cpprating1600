import { z } from 'zod';
import { NotificationCategory, NotificationPriority, DeliveryChannel } from './types';

// The 18 official event types
export const NOTIFICATION_EVENT_TYPES = [
  'submission.detected',
  'submission.verdict_updated',
  'submission.accepted',
  'practice.reminder_due',
  'daily_goal.incomplete',
  'daily_goal.completed',
  'streak.at_risk',
  'streak.milestone_reached',
  'contest.upcoming',
  'contest.starting_soon',
  'contest.ended',
  'new_problem.matching_preferences',
  'training_plan.created',
  'training_plan.updated',
  'revision.due',
  'guardian.focus_session.started',
  'guardian.focus_session.ended',
  'system.announcement',
] as const;

export type NotificationEventType = typeof NOTIFICATION_EVENT_TYPES[number];

// 1. submission.detected
export const SubmissionDetectedPayloadSchema = z.object({
  userId: z.string().uuid(),
  submissionId: z.number().int().positive(),
  contestId: z.number().int().optional(),
  problemIndex: z.string().min(1).max(5),
  problemName: z.string().min(1),
  verdict: z.string(),
  handle: z.string().min(1),
  submittedAt: z.string(),
  isHistoricalBackfill: z.boolean().default(false),
});
export type SubmissionDetectedPayload = z.infer<typeof SubmissionDetectedPayloadSchema>;

// 2. submission.verdict_updated
export const SubmissionVerdictUpdatedPayloadSchema = z.object({
  userId: z.string().uuid(),
  submissionId: z.number().int().positive(),
  contestId: z.number().int().optional(),
  problemIndex: z.string().min(1).max(5),
  problemName: z.string().min(1),
  oldVerdict: z.string(),
  newVerdict: z.string(),
  handle: z.string().min(1),
});
export type SubmissionVerdictUpdatedPayload = z.infer<typeof SubmissionVerdictUpdatedPayloadSchema>;

// 3. submission.accepted
export const SubmissionAcceptedPayloadSchema = z.object({
  userId: z.string().uuid(),
  submissionId: z.number().int().positive(),
  contestId: z.number().int().optional(),
  problemIndex: z.string().min(1).max(5),
  problemName: z.string().min(1),
  rating: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  handle: z.string().min(1),
  solvedAt: z.string(),
});
export type SubmissionAcceptedPayload = z.infer<typeof SubmissionAcceptedPayloadSchema>;

// 4. practice.reminder_due
export const PracticeReminderDuePayloadSchema = z.object({
  userId: z.string().uuid(),
  reminderType: z.enum(['daily_preferred_time', 'scheduled_session', 'inactivity_return']),
  preferredTime: z.string(),
  dayNumber: z.number().int().min(1).max(180),
  suggestedTopic: z.string().optional(),
  suggestedProblem: z.object({
    id: z.string(),
    name: z.string(),
    rating: z.number().optional(),
  }).optional(),
});
export type PracticeReminderDuePayload = z.infer<typeof PracticeReminderDuePayloadSchema>;

// 5. daily_goal.incomplete
export const DailyGoalIncompletePayloadSchema = z.object({
  userId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(180),
  targetMinutes: z.number().int().positive(),
  actualMinutes: z.number().int().min(0),
  remainingMinutes: z.number().int().positive(),
  date: z.string(), // YYYY-MM-DD
});
export type DailyGoalIncompletePayload = z.infer<typeof DailyGoalIncompletePayloadSchema>;

// 6. daily_goal.completed
export const DailyGoalCompletedPayloadSchema = z.object({
  userId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(180),
  targetMinutes: z.number().int().positive(),
  actualMinutes: z.number().int().positive(),
  completedAt: z.string(),
});
export type DailyGoalCompletedPayload = z.infer<typeof DailyGoalCompletedPayloadSchema>;

// 7. streak.at_risk
export const StreakAtRiskPayloadSchema = z.object({
  userId: z.string().uuid(),
  currentStreak: z.number().int().positive(),
  hoursRemaining: z.number().min(0).max(24),
  lastActiveDate: z.string(),
});
export type StreakAtRiskPayload = z.infer<typeof StreakAtRiskPayloadSchema>;

// 8. streak.milestone_reached
export const StreakMilestoneReachedPayloadSchema = z.object({
  userId: z.string().uuid(),
  streakDays: z.number().int().positive(),
  achievedAt: z.string(),
});
export type StreakMilestoneReachedPayload = z.infer<typeof StreakMilestoneReachedPayloadSchema>;

// 9. contest.upcoming
export const ContestUpcomingPayloadSchema = z.object({
  contestId: z.number().int().positive(),
  contestName: z.string().min(1),
  startTimeSeconds: z.number().int().positive(),
  durationSeconds: z.number().int().positive(),
  advanceNoticeMinutes: z.number().int().positive(),
  contestUrl: z.string().url(),
  userId: z.string().uuid().optional(), // if targeting specific user
});
export type ContestUpcomingPayload = z.infer<typeof ContestUpcomingPayloadSchema>;

// 10. contest.starting_soon
export const ContestStartingSoonPayloadSchema = z.object({
  contestId: z.number().int().positive(),
  contestName: z.string().min(1),
  startTimeSeconds: z.number().int().positive(),
  minutesUntilStart: z.number().int().positive(),
  contestUrl: z.string().url(),
  userId: z.string().uuid().optional(),
});
export type ContestStartingSoonPayload = z.infer<typeof ContestStartingSoonPayloadSchema>;

// 11. contest.ended
export const ContestEndedPayloadSchema = z.object({
  contestId: z.number().int().positive(),
  contestName: z.string().min(1),
  endedAt: z.string(),
  contestUrl: z.string().url(),
  userId: z.string().uuid().optional(),
});
export type ContestEndedPayload = z.infer<typeof ContestEndedPayloadSchema>;

// 12. new_problem.matching_preferences
export const NewProblemMatchingPreferencesPayloadSchema = z.object({
  userId: z.string().uuid(),
  problemId: z.string().min(1),
  name: z.string().min(1),
  rating: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  reason: z.string(),
});
export type NewProblemMatchingPreferencesPayload = z.infer<typeof NewProblemMatchingPreferencesPayloadSchema>;

// 13. training_plan.created
export const TrainingPlanCreatedPayloadSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().min(1),
  dayNumber: z.number().int().min(1).max(180),
  taskCount: z.number().int().positive(),
  targetMinutes: z.number().int().positive(),
});
export type TrainingPlanCreatedPayload = z.infer<typeof TrainingPlanCreatedPayloadSchema>;

// 14. training_plan.updated
export const TrainingPlanUpdatedPayloadSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().min(1),
  dayNumber: z.number().int().min(1).max(180),
  updatedFields: z.array(z.string()),
});
export type TrainingPlanUpdatedPayload = z.infer<typeof TrainingPlanUpdatedPayloadSchema>;

// 15. revision.due
export const RevisionDuePayloadSchema = z.object({
  userId: z.string().uuid(),
  mistakeId: z.string().min(1),
  problemName: z.string().min(1),
  problemId: z.string().min(1),
  category: z.string().min(1),
  daysOverdue: z.number().int().min(0),
});
export type RevisionDuePayload = z.infer<typeof RevisionDuePayloadSchema>;

// 16. guardian.focus_session.started
export const GuardianFocusSessionStartedPayloadSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().min(1),
  targetProblemName: z.string().min(1),
  plannedDurationMinutes: z.number().int().positive(),
  startedAt: z.string(),
});
export type GuardianFocusSessionStartedPayload = z.infer<typeof GuardianFocusSessionStartedPayloadSchema>;

// 17. guardian.focus_session.ended
export const GuardianFocusSessionEndedPayloadSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().min(1),
  actualDurationMinutes: z.number().int().min(0),
  problemsSolved: z.number().int().min(0),
  distractionsCount: z.number().int().min(0),
  endedAt: z.string(),
});
export type GuardianFocusSessionEndedPayload = z.infer<typeof GuardianFocusSessionEndedPayloadSchema>;

// 18. system.announcement
export const SystemAnnouncementPayloadSchema = z.object({
  announcementId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
  actionUrl: z.string().optional(),
  targetAudience: z.enum(['all', 'verified_only']).default('all'),
  userId: z.string().uuid().optional(),
});
export type SystemAnnouncementPayload = z.infer<typeof SystemAnnouncementPayloadSchema>;

// Registry mapping event names to schemas
export const EVENT_PAYLOAD_SCHEMAS: Record<NotificationEventType, z.ZodTypeAny> = {
  'submission.detected': SubmissionDetectedPayloadSchema,
  'submission.verdict_updated': SubmissionVerdictUpdatedPayloadSchema,
  'submission.accepted': SubmissionAcceptedPayloadSchema,
  'practice.reminder_due': PracticeReminderDuePayloadSchema,
  'daily_goal.incomplete': DailyGoalIncompletePayloadSchema,
  'daily_goal.completed': DailyGoalCompletedPayloadSchema,
  'streak.at_risk': StreakAtRiskPayloadSchema,
  'streak.milestone_reached': StreakMilestoneReachedPayloadSchema,
  'contest.upcoming': ContestUpcomingPayloadSchema,
  'contest.starting_soon': ContestStartingSoonPayloadSchema,
  'contest.ended': ContestEndedPayloadSchema,
  'new_problem.matching_preferences': NewProblemMatchingPreferencesPayloadSchema,
  'training_plan.created': TrainingPlanCreatedPayloadSchema,
  'training_plan.updated': TrainingPlanUpdatedPayloadSchema,
  'revision.due': RevisionDuePayloadSchema,
  'guardian.focus_session.started': GuardianFocusSessionStartedPayloadSchema,
  'guardian.focus_session.ended': GuardianFocusSessionEndedPayloadSchema,
  'system.announcement': SystemAnnouncementPayloadSchema,
};

// Event metadata configuration
export interface EventMetadata {
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
  allowedChannels: DeliveryChannel[];
  generatesNotification: boolean; // Not every internal event automatically generates a notification
}

export const EVENT_METADATA: Record<NotificationEventType, EventMetadata> = {
  'submission.detected': {
    category: 'submission',
    defaultPriority: 'low',
    allowedChannels: ['in_app'],
    generatesNotification: false, // Internal tracking; only notify on meaningful verdict update or accept
  },
  'submission.verdict_updated': {
    category: 'submission',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'submission.accepted': {
    category: 'submission',
    defaultPriority: 'high',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'practice.reminder_due': {
    category: 'practice',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'daily_goal.incomplete': {
    category: 'practice',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'daily_goal.completed': {
    category: 'practice',
    defaultPriority: 'high',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'streak.at_risk': {
    category: 'streak',
    defaultPriority: 'urgent',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'streak.milestone_reached': {
    category: 'streak',
    defaultPriority: 'high',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'contest.upcoming': {
    category: 'contest',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'web_push', 'android_push', 'email'],
    generatesNotification: true,
  },
  'contest.starting_soon': {
    category: 'contest',
    defaultPriority: 'urgent',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'contest.ended': {
    category: 'contest',
    defaultPriority: 'low',
    allowedChannels: ['in_app'],
    generatesNotification: true,
  },
  'new_problem.matching_preferences': {
    category: 'curriculum',
    defaultPriority: 'low',
    allowedChannels: ['in_app'],
    generatesNotification: true,
  },
  'training_plan.created': {
    category: 'curriculum',
    defaultPriority: 'low',
    allowedChannels: ['in_app'],
    generatesNotification: false, // Internal event
  },
  'training_plan.updated': {
    category: 'curriculum',
    defaultPriority: 'low',
    allowedChannels: ['in_app'],
    generatesNotification: false, // Internal event
  },
  'revision.due': {
    category: 'practice',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'web_push', 'android_push'],
    generatesNotification: true,
  },
  'guardian.focus_session.started': {
    category: 'guardian',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'android_push'],
    generatesNotification: true,
  },
  'guardian.focus_session.ended': {
    category: 'guardian',
    defaultPriority: 'normal',
    allowedChannels: ['in_app', 'android_push'],
    generatesNotification: true,
  },
  'system.announcement': {
    category: 'system',
    defaultPriority: 'high',
    allowedChannels: ['in_app', 'web_push', 'android_push', 'email'],
    generatesNotification: true,
  },
};

/**
 * Validates any event payload against its registered schema.
 * Rejects invalid events with descriptive validation errors.
 */
export function validateEventPayload<T = any>(eventType: string, payload: unknown): {
  valid: boolean;
  data?: T;
  error?: string;
} {
  const schema = EVENT_PAYLOAD_SCHEMAS[eventType as NotificationEventType];
  if (!schema) {
    return {
      valid: false,
      error: `Unregistered notification event type: "${eventType}".`,
    };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return {
      valid: false,
      error: `Invalid payload for event "${eventType}": ${errorDetails}`,
    };
  }

  return {
    valid: true,
    data: result.data as T,
  };
}
