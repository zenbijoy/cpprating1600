import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateFiveMinuteStartTask,
  generateEnergyAdaptedPlan,
  checkUniversityConflicts,
  calculateSmartRecovery,
  evaluateTrainingPolicies,
  calculateGoalControlCenter,
} from './habitEngine';
import { PersonalTrainingPolicy, UniversityCommitment, UserGoal } from '../types';

describe('Five-Minute Start Protocol (Feature 41)', () => {
  test('generates low-friction micro task with 300 second budget', () => {
    const task = generateFiveMinuteStartTask(10);
    assert.strictEqual(task.durationSeconds, 300);
    assert.ok(task.prompt.length > 10);
    assert.ok(['read_statement', 'write_io', 'review_mistake_card'].includes(task.taskType));
  });
});

describe('Energy-Aware Scheduling (Features 42 & 43)', () => {
  test('low energy reduces target minutes and provides gentle tasks', () => {
    const plan = generateEnergyAdaptedPlan(15, 60, 'low');
    assert.ok(plan.targetMinutes <= 30);
    assert.strictEqual(plan.mode, 'minimum');
    assert.ok(plan.tasks.some((t) => t.category === 'warmup'));
  });

  test('high energy generates deep work mission with push problems', () => {
    const plan = generateEnergyAdaptedPlan(15, 45, 'high');
    assert.ok(plan.targetMinutes >= 50);
    assert.strictEqual(plan.mode, 'deep_work');
    assert.ok(plan.tasks.length >= 3);
  });
});

describe('University Schedule Protection (Feature 44)', () => {
  test('detects overlap with protected university commitments and recommends safe slot', () => {
    const commitments: UniversityCommitment[] = [
      {
        id: 'c1',
        title: 'Data Structures Lab',
        type: 'lab',
        startTime: '18:30',
        endTime: '20:30',
        protectsCP: true,
      },
    ];

    const result = checkUniversityConflicts('19:00', 45, commitments);
    assert.strictEqual(result.hasConflict, true);
    assert.strictEqual(result.conflictingEvent?.title, 'Data Structures Lab');
    assert.strictEqual(result.recommendedSlot, '20:45');
  });

  test('returns no conflict when practice is scheduled outside university commitments', () => {
    const commitments: UniversityCommitment[] = [
      {
        id: 'c2',
        title: 'Calculus Lecture',
        type: 'class',
        startTime: '09:00',
        endTime: '11:00',
        protectsCP: true,
      },
    ];

    const result = checkUniversityConflicts('19:00', 45, commitments);
    assert.strictEqual(result.hasConflict, false);
  });
});

describe('Smart Recovery After Missed Days (Feature 45)', () => {
  test('avoids doubling workload after missed days and offers gentle restart', () => {
    const recovery = calculateSmartRecovery(5, 8, 45); // missed days 6 and 7 (2 days)
    assert.strictEqual(recovery.missedDays, 2);
    assert.ok(recovery.rebalancedMinutes <= 30); // does NOT double 45 to 90!
    assert.ok(recovery.recoveryNote.includes('without doubling your workload'));
    assert.strictEqual(recovery.recommendedTask.category, 'recovery');
  });
});

describe('Personal Training Policy Engine (Feature 49)', () => {
  test('enforces warm-up policy before starting hard problems (rating >= 1300)', () => {
    const policies: PersonalTrainingPolicy[] = [
      {
        id: 'pol_1',
        title: 'Warm-up before Hard Problems',
        ruleTrigger: 'problem_rating >= 1300',
        requiredAction: 'Complete 5-minute warm-up',
        isActive: true,
        isUserEditable: true,
      },
    ];

    const nonCompliant = evaluateTrainingPolicies(policies, {
      hasWarmedUp: false,
      problemRating: 1400,
      isInContest: false,
      mistakesReviewedToday: 0,
    });
    assert.strictEqual(nonCompliant.isCompliant, false);
    assert.ok(nonCompliant.advisory.includes('Solve a 5-minute warm-up'));

    const compliant = evaluateTrainingPolicies(policies, {
      hasWarmedUp: true,
      problemRating: 1400,
      isInContest: false,
      mistakesReviewedToday: 0,
    });
    assert.strictEqual(compliant.isCompliant, true);
  });
});

describe('180-Day Goal Control Center (Feature 50)', () => {
  test('calculates realistic progress metrics and uncertainty rating band', () => {
    const mockGoal: UserGoal = {
      targetRating: 1600,
      totalDays: 180,
      startDate: new Date().toISOString(),
      dailyMinutes: 45,
      availableDays: [0, 1, 2, 3, 4, 5, 6],
      preferredHour: '19:00',
      baselineLevel: 'complete_beginner',
      currentPhase: 2,
      currentDay: 20,
      personalMotivation: '',
      examWeeksActive: false,
    };

    const stats = calculateGoalControlCenter(mockGoal, 950, [], 30);
    assert.strictEqual(stats.dayNumber, 20);
    assert.strictEqual(stats.targetRating, 1600);
    assert.ok(stats.projectedRatingBand.min < stats.projectedRatingBand.expected);
    assert.ok(stats.projectedRatingBand.expected < stats.projectedRatingBand.max);
  });
});
