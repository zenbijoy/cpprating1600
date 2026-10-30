import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPhaseForDay,
  getTopicForDay,
  generateDailyPlan,
  calculateCurriculumProgress,
  replacePlanProblem,
  postponeTask,
} from './roadmap';

test('getPhaseForDay correctly resolves all 7 phases across 180 days', () => {
  assert.equal(getPhaseForDay(1).phase, 1);
  assert.equal(getPhaseForDay(14).phase, 1);
  assert.equal(getPhaseForDay(15).phase, 2);
  assert.equal(getPhaseForDay(35).phase, 2);
  assert.equal(getPhaseForDay(36).phase, 3);
  assert.equal(getPhaseForDay(71).phase, 4);
  assert.equal(getPhaseForDay(106).phase, 5);
  assert.equal(getPhaseForDay(141).phase, 6);
  assert.equal(getPhaseForDay(166).phase, 7);
  assert.equal(getPhaseForDay(180).phase, 7);
  // clamps safely
  assert.equal(getPhaseForDay(0).phase, 1);
  assert.equal(getPhaseForDay(250).phase, 7);
});

test('getPhaseForDay and getTopicForDay scale across custom totalDays (60, 90, 365)', () => {
  // 60-day sprint
  assert.equal(getPhaseForDay(1, 60).phase, 1);
  assert.equal(getPhaseForDay(60, 60).phase, 7);
  assert.ok(getTopicForDay(30, 60).id);

  // 90-day bootcamp
  assert.equal(getPhaseForDay(1, 90).phase, 1);
  assert.equal(getPhaseForDay(90, 90).phase, 7);
  assert.ok(getTopicForDay(45, 90).id);

  // 365-day marathon
  assert.equal(getPhaseForDay(1, 365).phase, 1);
  assert.equal(getPhaseForDay(365, 365).phase, 7);
  assert.ok(getTopicForDay(180, 365).id);
});

test('getTopicForDay returns an active topic curriculum for any day', () => {
  const day1Topic = getTopicForDay(1);
  assert.ok(day1Topic.id);
  assert.ok(day1Topic.title);
  assert.ok(day1Topic.recommendedProblems.length > 0);

  const day50Topic = getTopicForDay(50);
  assert.ok(day50Topic.keyIdeas.length > 0);
  assert.ok(day50Topic.timeComplexityGuidance);
});

test('generateDailyPlan produces appropriate tasks per mission mode', () => {
  const minPlan = generateDailyPlan(5, 'minimum', 15);
  assert.equal(minPlan.mode, 'minimum');
  assert.equal(minPlan.tasks.length, 1);
  assert.equal(minPlan.tasks[0].category, 'recovery');

  const stdPlan = generateDailyPlan(10, 'standard', 45);
  assert.equal(stdPlan.mode, 'standard');
  assert.ok(stdPlan.tasks.length >= 3);
  assert.ok(stdPlan.tasks.some((t) => t.category === 'problem'));

  const deepPlan = generateDailyPlan(20, 'deep_work', 90);
  assert.equal(deepPlan.mode, 'deep_work');
  assert.ok(deepPlan.tasks.length >= 4);
  assert.ok(deepPlan.targetMinutes >= 70);
});

test('calculateCurriculumProgress accurately computes percentage', () => {
  const p1 = calculateCurriculumProgress(1, 0);
  assert.equal(p1.dayProgress, 1);
  assert.equal(p1.currentPhaseNumber, 1);

  const p90 = calculateCurriculumProgress(90, 45);
  assert.equal(p90.dayProgress, 50);
  assert.equal(p90.currentPhaseNumber, 4);
});

test('generateDailyPlan integrates due revisions, replacement, and postponement', () => {
  const mockDueMistakes = [
    {
      id: 'm1',
      problemId: '4A',
      problemName: 'Watermelon',
      problemUrl: '',
      tags: [],
      category: 'boundary_case' as const,
      originalApproach: '',
      whyItFailed: '',
      correctObservation: '',
      correctApproach: '',
      personalLesson: '',
      createdAt: '',
      nextReviewDate: '',
      intervalDays: 1,
      reviewCount: 0,
      status: 'due' as const,
    },
  ];

  const planWithRevisions = generateDailyPlan(12, 'standard', 45, undefined, mockDueMistakes);
  const revTask = planWithRevisions.tasks.find((t) => t.category === 'mistake_review');
  assert.ok(revTask, 'Should contain a mistake_review task when due revisions exist');
  assert.ok(revTask.title.includes('Due Mistake Revisions'));

  // Test replacing a problem
  const probTask = planWithRevisions.tasks.find((t) => t.category === 'problem');
  assert.ok(probTask?.problemId);
  const oldId = probTask.problemId;

  const replacedPlan = replacePlanProblem(
    planWithRevisions,
    oldId,
    { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search'] },
    'Alternative binary search problem'
  );
  const updatedTask = replacedPlan.tasks.find((t) => t.category === 'problem');
  assert.equal(updatedTask?.problemId, '1352C');
  assert.equal(updatedTask?.title, "Today's Mission: K-th Not Divisible by n");

  // Test postponing a task
  const postponedPlan = postponeTask(replacedPlan, updatedTask!.id);
  const postponedTask = postponedPlan.tasks.find((t) => t.id === updatedTask!.id);
  assert.equal(postponedTask?.notes, 'Postponed to tomorrow.');
});
