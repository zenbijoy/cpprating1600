import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  classifyAppUsage,
  detectStudyRelevance,
  evaluateInterruption,
  buildFocusTimeline,
  calculateDistractionCost,
  applyGuardianCorrection,
} from './guardianEngine';
import { AppRestrictionRule, AppUsageEvent } from '../types';

describe('App Usage Classification Engine (Feature 2)', () => {
  test('classifies Termux and Code Editor as competitive programming with high confidence', () => {
    const result = classifyAppUsage('com.termux', []);
    assert.strictEqual(result.category, 'competitive_programming');
    assert.ok(result.confidence >= 0.9);
    assert.strictEqual(result.isStudyRelevant, true);
  });

  test('prioritizes user configured custom rule over default heuristic', () => {
    const userRules: AppRestrictionRule[] = [
      {
        id: 'r_custom',
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        category: 'educational_content',
        isBlocked: false,
        delaySeconds: 0,
        allowInStrictFocus: true,
        isEssential: false,
      },
    ];

    const result = classifyAppUsage('com.instagram.android', userRules);
    assert.strictEqual(result.category, 'educational_content');
    assert.strictEqual(result.detectionSource, 'user_configured');
    assert.strictEqual(result.isStudyRelevant, true);
  });

  test('contextualizes YouTube during active focus session', () => {
    const studyRes = classifyAppUsage('com.google.android.youtube', [], { isStudying: true });
    assert.strictEqual(studyRes.category, 'educational_content');
    assert.strictEqual(studyRes.isStudyRelevant, true);

    const leisureRes = classifyAppUsage('com.google.android.youtube', [], { isStudying: false });
    assert.strictEqual(leisureRes.category, 'entertainment');
    assert.strictEqual(leisureRes.isStudyRelevant, false);
  });
});

describe('Study-Relevance Detection Engine (Feature 3)', () => {
  test('permits essential communication during active focus sessions', () => {
    const res = detectStudyRelevance({ packageName: 'com.android.dialer', category: 'essential_communication' }, 'Two Pointers', true);
    assert.strictEqual(res.isRelevant, true);
    assert.strictEqual(res.promptUser, false);
  });

  test('flags social media during active focus session', () => {
    const res = detectStudyRelevance({ packageName: 'com.instagram.android', category: 'social_media' }, 'DP Basics', true);
    assert.strictEqual(res.isRelevant, false);
  });
});

describe('Intelligent Interruption Detection (Feature 5)', () => {
  test('respects grace period before prompting return', () => {
    const shortEvent: AppUsageEvent = {
      id: 'e1',
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      category: 'entertainment',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: 10, // under 15s grace period
      confidence: 0.95,
      detectionSource: 'high_confidence_rule',
      isStudyRelevant: false,
      relevanceExplanation: '',
    };

    const res = evaluateInterruption(shortEvent, 15, 0.7);
    assert.strictEqual(res.shouldPromptReturn, false);
  });

  test('prompts return when off-task duration exceeds grace period and threshold', () => {
    const longEvent: AppUsageEvent = {
      id: 'e2',
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      category: 'entertainment',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: 45, // exceeds 15s
      confidence: 0.95,
      detectionSource: 'high_confidence_rule',
      isStudyRelevant: false,
      relevanceExplanation: '',
    };

    const res = evaluateInterruption(longEvent, 15, 0.7);
    assert.strictEqual(res.shouldPromptReturn, true);
    assert.ok(res.promptMessage.includes('TikTok'));
  });
});

describe('Focus Session Timeline & Distraction Cost (Features 6 & 7)', () => {
  test('builds chronological timeline with verified classification tags', () => {
    const events: AppUsageEvent[] = [
      {
        id: 'ev_1',
        packageName: 'com.spck.cide',
        appName: 'C++ IDE',
        category: 'competitive_programming',
        startTime: '2026-10-29T10:00:00Z',
        endTime: '2026-10-29T10:30:00Z',
        durationSeconds: 1800,
        confidence: 0.95,
        detectionSource: 'high_confidence_rule',
        isStudyRelevant: true,
        relevanceExplanation: 'Active problem solving',
      },
      {
        id: 'ev_2',
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        category: 'social_media',
        startTime: '2026-10-29T10:30:00Z',
        endTime: '2026-10-29T10:40:00Z',
        durationSeconds: 600,
        confidence: 0.95,
        detectionSource: 'high_confidence_rule',
        isStudyRelevant: false,
        relevanceExplanation: 'Distraction',
      },
    ];

    const timeline = buildFocusTimeline(events);
    assert.strictEqual(timeline.length, 2);
    assert.strictEqual(timeline[0].type, 'focus');
    assert.strictEqual(timeline[1].type, 'configured_distraction');

    const cost = calculateDistractionCost(45, events);
    assert.strictEqual(cost.confirmedForegroundMinutes, 30);
    assert.strictEqual(cost.estimatedOffTaskMinutes, 10);
    assert.strictEqual(cost.lostPercentage, 25);
    assert.ok(cost.practicalInterventions.length > 0);
  });
});

describe('Guardian Accuracy Feedback & False Positive Protection (Features 10 & 26)', () => {
  test('updates rules immediately upon user correction with zero penalty', () => {
    const correction = {
      id: 'corr_1',
      timestamp: new Date().toISOString(),
      packageName: 'com.example.cslecture',
      appName: 'CS Lecture Player',
      originalCategory: 'entertainment' as const,
      correctedCategory: 'educational_content' as const,
      reason: 'University algorithms lecture',
    };

    const { updatedRules, feedbackAck } = applyGuardianCorrection(correction, []);
    assert.strictEqual(updatedRules.length, 1);
    assert.strictEqual(updatedRules[0].category, 'educational_content');
    assert.strictEqual(updatedRules[0].isBlocked, false);
    assert.ok(feedbackAck.includes('Zero penalty applied'));
  });
});
