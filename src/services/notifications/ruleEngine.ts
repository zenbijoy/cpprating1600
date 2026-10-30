import {
  NotificationEventType,
  EVENT_METADATA,
} from './eventRegistry';
import {
  AppNotification,
  DeliveryChannel,
  NotificationCategory,
  NotificationPriority,
  UserNotificationPreferences,
} from './types';
import { isInQuietHours, QuietHoursConfig } from './quietHours';

export interface EvaluatedNotificationDecision {
  shouldNotify: boolean;
  reason?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  channels: DeliveryChannel[];
  deferUntil?: Date; // If deferred due to quiet hours
  isStale?: boolean;
}

export class NotificationRuleEngine {
  // In-memory cooldown tracking cache (userId_eventCategory_key -> timestamp)
  private cooldownMap = new Map<string, number>();

  /**
   * Resets cooldown cache (useful for testing)
   */
  clearCooldowns() {
    this.cooldownMap.clear();
  }

  /**
   * Manually records a notification sent timestamp for cooldown tracking
   */
  recordNotificationSent(eventType: NotificationEventType, payload: Record<string, any>, userId?: string, time: Date = new Date()) {
    const key = this.getCooldownKey(eventType, payload, userId);
    if (key) {
      this.cooldownMap.set(key, time.getTime());
    }
  }

  /**
   * Evaluates an event against user preferences, quiet hours, cooldowns, and event rules.
   */
  evaluateEvent(
    eventType: NotificationEventType,
    payload: Record<string, any>,
    preferences: UserNotificationPreferences,
    currentTime: Date = new Date()
  ): EvaluatedNotificationDecision {
    const meta = EVENT_METADATA[eventType];
    if (!meta || !meta.generatesNotification) {
      return {
        shouldNotify: false,
        reason: `Event type "${eventType}" is marked as non-notifying internal event.`,
        category: meta?.category || 'system',
        priority: meta?.defaultPriority || 'low',
        title: '',
        body: '',
        channels: [],
      };
    }

    // 1. Check user category preference
    const categoryEnabled = preferences.categories_enabled[meta.category] ?? true;
    if (!categoryEnabled) {
      return {
        shouldNotify: false,
        reason: `Category "${meta.category}" is disabled in user preferences.`,
        category: meta.category,
        priority: meta.defaultPriority,
        title: '',
        body: '',
        channels: [],
      };
    }

    // 2. Check historical backfill exclusion (Section 3: initial import must not claim newly detected activity)
    if (eventType === 'submission.detected' || eventType === 'submission.accepted') {
      if (payload.isHistoricalBackfill) {
        return {
          shouldNotify: false,
          reason: 'Historical backfill submission is excluded from notification generation.',
          category: meta.category,
          priority: meta.defaultPriority,
          title: '',
          body: '',
          channels: [],
        };
      }
    }

    // 3. Stale event check
    if (eventType === 'contest.upcoming' || eventType === 'contest.starting_soon') {
      const contestStart = payload.startTimeSeconds * 1000;
      if (currentTime.getTime() >= contestStart) {
        return {
          shouldNotify: false,
          reason: 'Contest has already started; reminder is stale.',
          category: meta.category,
          priority: meta.defaultPriority,
          title: '',
          body: '',
          channels: [],
          isStale: true,
        };
      }
    }

    // 4. Cooldown checks for repetitive reminders
    const cooldownKey = this.getCooldownKey(eventType, payload, preferences.user_id);
    const cooldownDurationMs = this.getCooldownDuration(eventType);
    if (cooldownKey && cooldownDurationMs > 0) {
      const lastSent = this.cooldownMap.get(cooldownKey) || 0;
      if (currentTime.getTime() - lastSent < cooldownDurationMs) {
        const remainingMinutes = Math.ceil((cooldownDurationMs - (currentTime.getTime() - lastSent)) / 60000);
        return {
          shouldNotify: false,
          reason: `Notification in cooldown for event "${eventType}". Wait ${remainingMinutes}m.`,
          category: meta.category,
          priority: meta.defaultPriority,
          title: '',
          body: '',
          channels: [],
        };
      }
    }

    // 5. Generate Title, Body, Action URL, and Priority
    const content = this.generateNotificationContent(eventType, payload);

    // 6. Quiet Hours Evaluation
    const quietConfig: QuietHoursConfig = {
      enabled: preferences.quiet_hours_enabled,
      start: preferences.quiet_hours_start,
      end: preferences.quiet_hours_end,
      timezone: preferences.timezone,
    };

    const inQuiet = isInQuietHours(currentTime, quietConfig);

    // Determine enabled channels based on user preferences and event allowed channels
    const enabledChannels: DeliveryChannel[] = [];
    if (preferences.in_app_enabled && meta.allowedChannels.includes('in_app')) {
      enabledChannels.push('in_app');
    }

    // Push channels: only if quiet hours allows or if urgent
    const isUrgent = content.priority === 'urgent';
    if (!inQuiet || isUrgent) {
      if (preferences.web_push_enabled && meta.allowedChannels.includes('web_push')) {
        enabledChannels.push('web_push');
      }
      if (preferences.mobile_push_enabled && meta.allowedChannels.includes('android_push')) {
        enabledChannels.push('android_push');
      }
      if (preferences.email_enabled && meta.allowedChannels.includes('email')) {
        enabledChannels.push('email');
      }
    }

    if (enabledChannels.length === 0) {
      return {
        shouldNotify: false,
        reason: inQuiet ? 'Quiet hours are active and all active channels are silenced.' : 'No delivery channels enabled for this notification.',
        category: meta.category,
        priority: content.priority,
        title: content.title,
        body: content.body,
        actionUrl: content.actionUrl,
        channels: [],
      };
    }

    // Register cooldown timestamp
    if (cooldownKey) {
      this.cooldownMap.set(cooldownKey, currentTime.getTime());
    }

    return {
      shouldNotify: true,
      category: meta.category,
      priority: content.priority,
      title: content.title,
      body: content.body,
      actionUrl: content.actionUrl,
      channels: enabledChannels,
    };
  }

  private getCooldownDuration(eventType: NotificationEventType): number {
    switch (eventType) {
      case 'daily_goal.incomplete':
        return 4 * 60 * 60 * 1000; // 4 hours
      case 'practice.reminder_due':
        return 12 * 60 * 60 * 1000; // 12 hours
      case 'streak.at_risk':
        return 12 * 60 * 60 * 1000; // 12 hours
      case 'revision.due':
        return 8 * 60 * 60 * 1000;  // 8 hours
      default:
        return 0;
    }
  }

  private getCooldownKey(eventType: NotificationEventType, payload: Record<string, any>, userId?: string): string | null {
    const uid = userId || payload.userId || 'anon';
    switch (eventType) {
      case 'daily_goal.incomplete':
        return `cd_${uid}_daily_goal_${payload.date || 'today'}`;
      case 'practice.reminder_due':
        return `cd_${uid}_practice_${payload.reminderType || 'daily'}`;
      case 'streak.at_risk':
        return `cd_${uid}_streak_risk`;
      case 'revision.due':
        return `cd_${uid}_revision_${payload.mistakeId || 'all'}`;
      default:
        return null;
    }
  }

  /**
   * Deterministic, factual, encouraging message generation without shaming.
   */
  generateNotificationContent(eventType: NotificationEventType, payload: Record<string, any>): {
    title: string;
    body: string;
    actionUrl?: string;
    priority: NotificationPriority;
  } {
    switch (eventType) {
      case 'submission.accepted': {
        const prob = `${payload.contestId ?? ''}${payload.problemIndex}: ${payload.problemName}`;
        const ratingStr = payload.rating ? ` (${payload.rating})` : '';
        return {
          title: 'Problem Solved! 🎉',
          body: `Accepted on ${prob}${ratingStr}. Excellent work!`,
          actionUrl: payload.contestId ? `/problems?contestId=${payload.contestId}&index=${payload.problemIndex}` : '/submissions',
          priority: 'high',
        };
      }

      case 'submission.verdict_updated': {
        const prob = `${payload.contestId ?? ''}${payload.problemIndex}: ${payload.problemName}`;
        const isOk = payload.newVerdict === 'OK';
        return {
          title: isOk ? 'Submission Accepted' : `Verdict: ${payload.newVerdict}`,
          body: `Submission for ${prob} transitioned from ${payload.oldVerdict} to ${payload.newVerdict}.`,
          actionUrl: '/submissions',
          priority: isOk ? 'high' : 'normal',
        };
      }

      case 'practice.reminder_due': {
        const topicText = payload.suggestedTopic ? ` Today's suggested focus: ${payload.suggestedTopic}.` : '';
        return {
          title: 'Daily Practice Time',
          body: `It is your scheduled practice time for Day ${payload.dayNumber}.${topicText} Ready for a focused session?`,
          actionUrl: '/dashboard',
          priority: 'normal',
        };
      }

      case 'daily_goal.incomplete': {
        return {
          title: 'Daily Practice Target',
          body: `You've completed ${payload.actualMinutes}m of your ${payload.targetMinutes}m target today. ${payload.remainingMinutes}m remaining.`,
          actionUrl: '/dashboard',
          priority: 'normal',
        };
      }

      case 'daily_goal.completed': {
        return {
          title: 'Daily Target Complete! 🏆',
          body: `You've hit your ${payload.targetMinutes}-minute practice goal for Day ${payload.dayNumber}. Consistency builds mastery.`,
          actionUrl: '/dashboard',
          priority: 'high',
        };
      }

      case 'streak.at_risk': {
        return {
          title: 'Practice Streak At Risk',
          body: `You have an active ${payload.currentStreak}-day practice streak with ~${Math.round(payload.hoursRemaining)}h remaining in your local day. A quick solve keeps it alive!`,
          actionUrl: '/dashboard',
          priority: 'urgent',
        };
      }

      case 'streak.milestone_reached': {
        return {
          title: 'Streak Milestone! 🌟',
          body: `Incredible dedication! You've reached a ${payload.streakDays}-day competitive programming streak.`,
          actionUrl: '/analytics',
          priority: 'high',
        };
      }

      case 'contest.upcoming': {
        const hours = Math.round(payload.advanceNoticeMinutes / 60);
        const timeDesc = hours >= 24 ? `${Math.round(hours / 24)} day` : `${hours} hours`;
        return {
          title: `Upcoming Contest: ${payload.contestName}`,
          body: `Round starts in approximately ${timeDesc}. Review your pre-contest checklist and strategy.`,
          actionUrl: `/contests?id=${payload.contestId}`,
          priority: 'normal',
        };
      }

      case 'contest.starting_soon': {
        return {
          title: `Contest Starting in ${payload.minutesUntilStart}m! ⚡`,
          body: `${payload.contestName} begins in ${payload.minutesUntilStart} minutes. Prepare your editor and template!`,
          actionUrl: `/contests?id=${payload.contestId}`,
          priority: 'urgent',
        };
      }

      case 'contest.ended': {
        return {
          title: `Contest Ended: ${payload.contestName}`,
          body: 'The contest has ended. Check the results and add unsolved problems to your upsolving queue.',
          actionUrl: `/contests?id=${payload.contestId}`,
          priority: 'low',
        };
      }

      case 'revision.due': {
        return {
          title: 'Spaced Repetition Review Due',
          body: `Mistake notebook review due for "${payload.problemName}" (${payload.category}). Reviewing past errors reinforces key insights.`,
          actionUrl: '/mistakes',
          priority: 'normal',
        };
      }

      case 'new_problem.matching_preferences': {
        return {
          title: `Recommended Problem: ${payload.name}`,
          body: `Rating ${payload.rating} problem matching your learning profile: ${payload.reason}`,
          actionUrl: `/problems?id=${payload.problemId}`,
          priority: 'low',
        };
      }

      case 'guardian.focus_session.started': {
        return {
          title: 'Focus Session Active',
          body: `Guardian session active on "${payload.targetProblemName}" (${payload.plannedDurationMinutes} min planned). Stay deliberate!`,
          actionUrl: '/guardian',
          priority: 'normal',
        };
      }

      case 'guardian.focus_session.ended': {
        return {
          title: 'Focus Session Complete',
          body: `Session concluded: ${payload.actualDurationMinutes}m elapsed, ${payload.problemsSolved} problem(s) solved with ${payload.distractionsCount} distraction(s).`,
          actionUrl: '/guardian',
          priority: 'normal',
        };
      }

      case 'system.announcement': {
        return {
          title: payload.title || 'Platform Announcement',
          body: payload.message,
          actionUrl: payload.actionUrl,
          priority: payload.severity === 'critical' ? 'urgent' : 'high',
        };
      }

      default:
        return {
          title: 'CLIMB 1600 Update',
          body: 'You have a new competitive programming notification.',
          actionUrl: '/dashboard',
          priority: 'normal',
        };
    }
  }
}

export const notificationRuleEngine = new NotificationRuleEngine();
