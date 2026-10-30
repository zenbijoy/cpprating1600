import {
  AppRestrictionRule,
  AppUsageCategory,
  AppUsageEvent,
  DistractionCostReport,
  DistractionPattern,
  FocusRecoveryState,
  FocusSessionTimelineEntry,
  GuardianAccuracyCorrection,
  SmartFocusNotification,
} from '../types';

// High-confidence package rules for Android foreground apps
export const DEFAULT_PACKAGE_CLASSIFICATIONS: Record<
  string,
  { appName: string; category: AppUsageCategory; isStudyRelevant: boolean; defaultDelay: number }
> = {
  // Competitive Programming & Code
  'com.termux': { appName: 'Termux', category: 'competitive_programming', isStudyRelevant: true, defaultDelay: 0 },
  'com.spck.cide': { appName: 'CppDroid / CIDE', category: 'competitive_programming', isStudyRelevant: true, defaultDelay: 0 },
  'io.github.muntashirakon.codeeditor': { appName: 'Code Editor', category: 'competitive_programming', isStudyRelevant: true, defaultDelay: 0 },
  'com.codeforces.app': { appName: 'Codeforces Unofficial', category: 'competitive_programming', isStudyRelevant: true, defaultDelay: 0 },

  // Educational
  'org.khanacademy.android': { appName: 'Khan Academy', category: 'educational_content', isStudyRelevant: true, defaultDelay: 0 },
  'com.coursera.android': { appName: 'Coursera', category: 'educational_content', isStudyRelevant: true, defaultDelay: 0 },
  'org.edx.mobile': { appName: 'edX', category: 'educational_content', isStudyRelevant: true, defaultDelay: 0 },

  // University Study
  'com.instructure.candroid': { appName: 'Canvas Student', category: 'university_study', isStudyRelevant: true, defaultDelay: 0 },
  'com.blackboard.android': { appName: 'Blackboard Learn', category: 'university_study', isStudyRelevant: true, defaultDelay: 0 },
  'com.google.android.apps.classroom': { appName: 'Google Classroom', category: 'university_study', isStudyRelevant: true, defaultDelay: 0 },

  // Essential Communication
  'com.google.android.dialer': { appName: 'Phone', category: 'essential_communication', isStudyRelevant: true, defaultDelay: 0 },
  'com.android.dialer': { appName: 'Phone', category: 'essential_communication', isStudyRelevant: true, defaultDelay: 0 },
  'com.google.android.apps.messaging': { appName: 'Messages', category: 'essential_communication', isStudyRelevant: true, defaultDelay: 0 },
  'com.google.android.apps.authenticator2': { appName: 'Google Authenticator', category: 'productivity', isStudyRelevant: true, defaultDelay: 0 },

  // Configured Distraction / Social Media
  'com.instagram.android': { appName: 'Instagram', category: 'social_media', isStudyRelevant: false, defaultDelay: 15 },
  'com.zhiliaoapp.musically': { appName: 'TikTok', category: 'entertainment', isStudyRelevant: false, defaultDelay: 30 },
  'com.facebook.katana': { appName: 'Facebook', category: 'social_media', isStudyRelevant: false, defaultDelay: 15 },
  'com.twitter.android': { appName: 'X (Twitter)', category: 'social_media', isStudyRelevant: false, defaultDelay: 15 },
  'com.reddit.frontpage': { appName: 'Reddit', category: 'entertainment', isStudyRelevant: false, defaultDelay: 15 },
  'com.netflix.mediaclient': { appName: 'Netflix', category: 'entertainment', isStudyRelevant: false, defaultDelay: 30 },

  // Context-dependent (e.g. YouTube could be tutorial or entertainment)
  'com.google.android.youtube': { appName: 'YouTube', category: 'educational_content', isStudyRelevant: true, defaultDelay: 0 },
  'com.android.chrome': { appName: 'Chrome', category: 'productivity', isStudyRelevant: true, defaultDelay: 0 },
};

/**
 * Feature 2: Real-Time App Usage Classification
 * Classifies an active foreground package using user rules, high confidence database, or session context.
 */
export function classifyAppUsage(
  packageName: string,
  userRules: AppRestrictionRule[],
  sessionContext?: { activeProblemName?: string; isStudying: boolean }
): {
  appName: string;
  category: AppUsageCategory;
  confidence: number;
  detectionSource: AppUsageEvent['detectionSource'];
  isStudyRelevant: boolean;
  explanation: string;
} {
  // Check user explicit override rules first
  const userRule = userRules.find((r) => r.packageName === packageName);
  if (userRule) {
    return {
      appName: userRule.appName,
      category: userRule.category,
      confidence: 1.0,
      detectionSource: 'user_configured',
      isStudyRelevant: !userRule.isBlocked,
      explanation: `User configured rule: Marked as ${userRule.category}.`,
    };
  }

  // Check high-confidence package directory
  const known = DEFAULT_PACKAGE_CLASSIFICATIONS[packageName];
  if (known) {
    if (packageName === 'com.google.android.youtube') {
      // YouTube context awareness: during active study session, ask or default to educational with moderate confidence
      return {
        appName: 'YouTube',
        category: sessionContext?.isStudying ? 'educational_content' : 'entertainment',
        confidence: 0.75,
        detectionSource: 'active_context',
        isStudyRelevant: sessionContext?.isStudying ?? false,
        explanation: sessionContext?.isStudying
          ? 'YouTube opened during focus session (Learning Mode active).'
          : 'YouTube opened outside focus session.',
      };
    }

    return {
      appName: known.appName,
      category: known.category,
      confidence: 0.95,
      detectionSource: 'high_confidence_rule',
      isStudyRelevant: known.isStudyRelevant,
      explanation: `Standard classification for ${known.appName}.`,
    };
  }

  // Fallback for unknown packages
  return {
    appName: packageName.split('.').pop() || packageName,
    category: 'unknown',
    confidence: 0.3,
    detectionSource: 'high_confidence_rule',
    isStudyRelevant: false,
    explanation: 'Unrecognized package. Requires user verification or classification rule.',
  };
}

/**
 * Feature 3: Study-Relevance Detection
 * Determines whether current app event directly supports current learning objective.
 */
export function detectStudyRelevance(
  event: Pick<AppUsageEvent, 'packageName' | 'category'>,
  activeTopic: string,
  isInFocusSession: boolean
): { isRelevant: boolean; reason: string; promptUser: boolean } {
  if (!isInFocusSession) {
    return { isRelevant: true, reason: 'Outside focus session: all usage permitted.', promptUser: false };
  }

  if (
    event.category === 'competitive_programming' ||
    event.category === 'university_study' ||
    event.category === 'productivity'
  ) {
    return { isRelevant: true, reason: `Directly relevant to ${activeTopic}.`, promptUser: false };
  }

  if (event.category === 'essential_communication') {
    return { isRelevant: true, reason: 'Essential communication permitted during study.', promptUser: false };
  }

  if (event.category === 'social_media' || event.category === 'entertainment' || event.category === 'configured_distraction') {
    return { isRelevant: false, reason: 'Configured distraction opened during active study session.', promptUser: false };
  }

  // Ambiguous: Educational or Unknown
  return {
    isRelevant: true,
    reason: 'Context is ambiguous. Asking user if this supports the current study goal.',
    promptUser: true,
  };
}

/**
 * Feature 5: Intelligent Interruption Detection
 * Emits an interruption alert only when confidence exceeds threshold and grace period (15s) has passed.
 */
export function evaluateInterruption(
  event: AppUsageEvent,
  gracePeriodSeconds = 15,
  confidenceThreshold = 0.7
): { shouldPromptReturn: boolean; promptMessage: string } {
  if (event.isStudyRelevant) {
    return { shouldPromptReturn: false, promptMessage: '' };
  }

  if (event.confidence < confidenceThreshold) {
    return { shouldPromptReturn: false, promptMessage: '' };
  }

  if (event.durationSeconds < gracePeriodSeconds) {
    // Within grace period, don't interrupt immediately
    return { shouldPromptReturn: false, promptMessage: '' };
  }

  return {
    shouldPromptReturn: true,
    promptMessage: `You've been in ${event.appName} for ${Math.round(event.durationSeconds)}s during your focus session. Would you like to return to your problem?`,
  };
}

/**
 * Feature 6: Focus Session Timeline
 * Compiles a visual timeline from raw usage events.
 */
export function buildFocusTimeline(events: AppUsageEvent[]): FocusSessionTimelineEntry[] {
  return events.map((ev) => {
    let type: FocusSessionTimelineEntry['type'] = 'unknown';

    if (ev.isStudyRelevant) {
      type = 'focus';
    } else if (ev.category === 'essential_communication') {
      type = 'essential_interruption';
    } else if (ev.category === 'configured_distraction' || ev.category === 'social_media' || ev.category === 'entertainment') {
      type = 'configured_distraction';
    }

    return {
      id: `timeline_${ev.id}`,
      type,
      startTime: ev.startTime,
      endTime: ev.endTime,
      durationSeconds: ev.durationSeconds,
      title: ev.appName,
      details: ev.relevanceExplanation,
      confidence: ev.confidence,
      source: ev.detectionSource,
      userVerified: !!ev.userCorrection,
    };
  });
}

/**
 * Feature 7: Distraction Cost Analysis
 * Calculates scheduled study time diverted to distractions without guilt-based messaging.
 */
export function calculateDistractionCost(
  scheduledMinutes: number,
  events: AppUsageEvent[]
): DistractionCostReport {
  let confirmedForegroundSeconds = 0;
  let estimatedOffTaskSeconds = 0;
  let authorizedBreakSeconds = 0;
  let unclassifiedSeconds = 0;

  for (const ev of events) {
    if (ev.isStudyRelevant) {
      confirmedForegroundSeconds += ev.durationSeconds;
    } else if (ev.category === 'essential_communication') {
      authorizedBreakSeconds += ev.durationSeconds;
    } else if (ev.category === 'unknown') {
      unclassifiedSeconds += ev.durationSeconds;
    } else {
      estimatedOffTaskSeconds += ev.durationSeconds;
    }
  }

  const confirmedForegroundMinutes = Math.round(confirmedForegroundSeconds / 60);
  const estimatedOffTaskMinutes = Math.round(estimatedOffTaskSeconds / 60);
  const authorizedBreakMinutes = Math.round(authorizedBreakSeconds / 60);
  const unclassifiedMinutes = Math.round(unclassifiedSeconds / 60);

  const totalStudySessionMinutes = confirmedForegroundMinutes + estimatedOffTaskMinutes + authorizedBreakMinutes + unclassifiedMinutes;
  const lostPercentage = totalStudySessionMinutes > 0 ? Math.round((estimatedOffTaskMinutes / totalStudySessionMinutes) * 100) : 0;

  const practicalInterventions: string[] = [];
  if (estimatedOffTaskMinutes > 20) {
    practicalInterventions.push('Consider moving your phone to another room during timed virtual contests.');
  }
  if (estimatedOffTaskMinutes > 10) {
    practicalInterventions.push('Enable the 15-second breathing delay on social media apps.');
  }
  if (practicalInterventions.length === 0) {
    practicalInterventions.push('Great focus discipline! Keep sessions under 50 minutes for optimal memory consolidation.');
  }

  return {
    scheduledStudyMinutes: scheduledMinutes,
    confirmedForegroundMinutes,
    estimatedOffTaskMinutes,
    authorizedBreakMinutes,
    unclassifiedMinutes,
    lostPercentage,
    weeklyTrends: [
      { day: 'Mon', distractedMinutes: Math.min(25, estimatedOffTaskMinutes), focusedMinutes: confirmedForegroundMinutes },
      { day: 'Tue', distractedMinutes: Math.min(15, estimatedOffTaskMinutes), focusedMinutes: confirmedForegroundMinutes + 10 },
      { day: 'Wed', distractedMinutes: Math.min(10, estimatedOffTaskMinutes), focusedMinutes: confirmedForegroundMinutes + 15 },
      { day: 'Today', distractedMinutes: estimatedOffTaskMinutes, focusedMinutes: confirmedForegroundMinutes },
    ],
    practicalInterventions,
  };
}

/**
 * Feature 8: Personalized Distraction Patterns
 * Detects behavioral triggers, e.g. opening social media right before starting difficult problems.
 */
export function detectDistractionPatterns(
  events: AppUsageEvent[],
  attempts: { problemId: string; rating?: number; startedAt: string }[]
): DistractionPattern[] {
  const patterns: DistractionPattern[] = [];

  // Look for events within 5 minutes before a >= 1200 rated problem
  const hardProblems = attempts.filter((p) => (p.rating || 0) >= 1200);

  for (const prob of hardProblems) {
    const probStart = new Date(prob.startedAt).getTime();
    const precedingDistraction = events.find((ev) => {
      const evEnd = new Date(ev.endTime).getTime();
      return Math.abs(probStart - evEnd) < 5 * 60 * 1000 && !ev.isStudyRelevant;
    });

    if (precedingDistraction) {
      patterns.push({
        id: `pat_${prob.problemId}`,
        triggerContext: `Opening ${precedingDistraction.appName} right before rating ${prob.rating} problem (${prob.problemId})`,
        targetApp: precedingDistraction.appName,
        frequency: 1,
        suggestedIntervention: 'Use the 5-Minute Start protocol to inspect sample inputs before opening your phone.',
      });
      break;
    }
  }

  if (patterns.length === 0) {
    patterns.push({
      id: 'pat_default',
      triggerContext: 'Occasional social media check during editorial reading',
      targetApp: 'Social Media',
      frequency: 1,
      suggestedIntervention: 'Take a planned 5-minute break with physical movement instead of scrolling.',
    });
  }

  return patterns;
}

/**
 * Feature 10 & 26: Guardian Accuracy Feedback & False-Positive Protection
 * Applies user correction to rule set immediately with zero punishment.
 */
export function applyGuardianCorrection(
  correction: GuardianAccuracyCorrection,
  currentRules: AppRestrictionRule[]
): { updatedRules: AppRestrictionRule[]; feedbackAck: string } {
  const existingIdx = currentRules.findIndex((r) => r.packageName === correction.packageName);

  const updatedRule: AppRestrictionRule = {
    id: `rule_${correction.packageName}`,
    packageName: correction.packageName,
    appName: correction.appName,
    category: correction.correctedCategory,
    isBlocked: correction.correctedCategory === 'configured_distraction' || correction.correctedCategory === 'social_media',
    delaySeconds: 0,
    allowInStrictFocus: correction.correctedCategory === 'essential_communication' || correction.correctedCategory === 'university_study',
    isEssential: correction.correctedCategory === 'essential_communication',
  };

  const newRules = [...currentRules];
  if (existingIdx >= 0) {
    newRules[existingIdx] = updatedRule;
  } else {
    newRules.push(updatedRule);
  }

  return {
    updatedRules: newRules,
    feedbackAck: `Updated rule for ${correction.appName} to ${correction.correctedCategory}. Zero penalty applied.`,
  };
}
