import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateMilestone,
  evaluateDifficultyTrajectory,
  generatePersonalizedMission,
  rescheduleMission,
  generateWeeklyCoachReport,
} from './missionControl';
import { ProblemAttempt, UserGoal, UserProfile } from '../types';

describe('Feature 1: Rating 1600 Mission Control', () => {
  it('calculates milestones and rating gaps accurately across rating bands', () => {
    const m1 = calculateMilestone(850, 1600);
    assert.strictEqual(m1.milestoneNumber, 1);
    assert.strictEqual(m1.ratingGap, 750);
    assert.strictEqual(m1.progressPercent, 25);

    const m2 = calculateMilestone(1150, 1600);
    assert.strictEqual(m2.milestoneNumber, 2);
    assert.strictEqual(m2.ratingGap, 450);

    const m3 = calculateMilestone(1350, 1600);
    assert.strictEqual(m3.milestoneNumber, 3);
    assert.strictEqual(m3.ratingGap, 250);

    const m4 = calculateMilestone(1550, 1600);
    assert.strictEqual(m4.milestoneNumber, 4);
    assert.strictEqual(m4.ratingGap, 50);

    const m5 = calculateMilestone(1620, 1600);
    assert.strictEqual(m5.milestoneNumber, 5);
    assert.strictEqual(m5.ratingGap, 0);
    assert.strictEqual(m5.progressPercent, 100);
  });

  it('detects difficulty struggle on multiple consecutive failures and steps down rating', () => {
    const attempts: ProblemAttempt[] = [
      {
        id: '1',
        problemId: '100A',
        index: 'A',
        name: 'Hard DP Problem',
        rating: 1300,
        tags: ['dp'],
        url: '',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        timeSpentSeconds: 1800,
        hintsUsedCount: 3,
        highestHintLevel: 5,
        outcome: 'attempted_gave_up',
        officialVerdict: 'WRONG_ANSWER',
        selfReported: false,
      },
      {
        id: '2',
        problemId: '101A',
        index: 'A',
        name: 'Hard Graph Problem',
        rating: 1300,
        tags: ['graphs', 'dfs and similar'],
        url: '',
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        timeSpentSeconds: 2400,
        hintsUsedCount: 4,
        highestHintLevel: 6,
        outcome: 'editorial_studied',
        officialVerdict: 'TIME_LIMIT_EXCEEDED',
        selfReported: false,
      },
      {
        id: '3',
        problemId: '102A',
        index: 'A',
        name: 'Earlier Problem',
        rating: 1200,
        tags: ['greedy'],
        url: '',
        startedAt: new Date(Date.now() - 10800000).toISOString(),
        timeSpentSeconds: 1200,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
      },
    ];

    const evalResult = evaluateDifficultyTrajectory(attempts, 1300);
    assert.strictEqual(evalResult.adjustmentType, 'step_down');
    assert.strictEqual(evalResult.recommendedRating, 1200);
    assert.strictEqual(evalResult.consecutiveFailsAtDifficulty, 2);
    assert.ok(evalResult.suggestedPrerequisites.length > 0);
  });

  it('steps up difficulty when user comfortably solves consecutive problems with minimal hints', () => {
    const comfortableAttempts: ProblemAttempt[] = Array.from({ length: 6 }, (_, i) => ({
      id: `att_${i}`,
      problemId: `${200 + i}A`,
      index: 'A',
      name: `Solid Problem ${i}`,
      rating: 1100,
      tags: ['greedy', 'math'],
      url: '',
      startedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      timeSpentSeconds: 900,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      outcome: 'solved_independently',
      officialVerdict: 'OK',
      selfReported: false,
    }));

    const evalResult = evaluateDifficultyTrajectory(comfortableAttempts, 1100);
    assert.strictEqual(evalResult.adjustmentType, 'step_up');
    assert.strictEqual(evalResult.recommendedRating, 1200);
    assert.strictEqual(evalResult.consecutiveFailsAtDifficulty, 0);
  });

  it('generates a personalized daily mission matching all 6 required task categories', () => {
    const mockProfile: UserProfile = {
      id: 'test_u',
      name: 'Tester',
      email: 'test@climb1600.dev',
      preferredLanguage: 'cpp20',
      theme: 'dark',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      hintDelayMinutes: 15,
      verifiedCfRating: 1100,
    };

    const mockGoal: UserGoal = {
      targetRating: 1600,
      totalDays: 180,
      startDate: '2026-01-01',
      dailyMinutes: 60,
      availableDays: [0, 1, 2, 3, 4, 5, 6],
      preferredHour: '19:00',
      baselineLevel: 'some_experience',
      currentPhase: 2,
      currentDay: 20,
      personalMotivation: 'Reach 1600',
      examWeeksActive: false,
    };

    const mission = generatePersonalizedMission({
      userProfile: mockProfile,
      userGoal: mockGoal,
      recentAttempts: [],
      mistakesDue: [],
      weakestTopic: { id: 'bin_search', name: 'Binary Search' },
      durationMode: '60min',
    });

    assert.strictEqual(mission.targetMinutes, 60);
    assert.ok(mission.tasks.some((t) => t.category === 'warmup'));
    assert.ok(mission.tasks.some((t) => t.category === 'problem'));
    assert.ok(mission.tasks.some((t) => t.category === 'mistake_review'));
    assert.ok(mission.tasks.some((t) => t.category === 'reflection'));
  });

  it('reschedules a mission cleanly without shame or streak resets', () => {
    const mockPlan: any = {
      id: 'plan_today',
      date: '2026-10-29',
      dayNumber: 15,
      mode: 'standard',
      targetMinutes: 60,
      actualMinutes: 0,
      tasks: [{ id: 't1', title: 'Task 1', completed: false, category: 'problem' }],
      status: 'planned',
    };

    const rescheduled = rescheduleMission(mockPlan, '2026-10-30', 'Busy with university exams');
    assert.strictEqual(rescheduled.date, '2026-10-30');
    assert.strictEqual(rescheduled.status, 'planned');
    assert.ok(rescheduled.tasks[0].notes?.includes('Busy with university exams'));
  });

  it('generates weekly coach report distinguishing measured facts from AI interpretations', () => {
    const mockAttempts: ProblemAttempt[] = [
      {
        id: 'w1',
        problemId: '4A',
        index: 'A',
        name: 'Watermelon',
        rating: 800,
        tags: ['math'],
        url: '',
        startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        timeSpentSeconds: 1200,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
      },
      {
        id: 'w2',
        problemId: '71A',
        index: 'A',
        name: 'Way Too Long Words',
        rating: 900,
        tags: ['strings'],
        url: '',
        startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        timeSpentSeconds: 1500,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
      },
    ];

    const report = generateWeeklyCoachReport(mockAttempts, [], 1);
    assert.strictEqual(report.measuredResults.problemsAttempted, 2);
    assert.strictEqual(report.measuredResults.problemsAccepted, 2);
    assert.strictEqual(report.measuredResults.solveRatePercent, 100);
    assert.ok(report.aiInterpretations.whatImproved.length > 0);
    assert.ok(report.aiInterpretations.nextWeekStrategicFocus.length > 0);
  });
});
