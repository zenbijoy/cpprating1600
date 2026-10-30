import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SKILL_TREE_NODES,
  calculateTopicMastery,
  checkPrerequisitesStatus,
  recommendNextLearningTopics,
  TopicProgress,
} from './skillTree';
import { ProblemAttempt, MistakeRecord } from '../types';

describe('Feature 3: Algorithm Skill Tree Engine', () => {
  const binarySearchNode = SKILL_TREE_NODES.find((n) => n.id === 'binary_search')!;
  const implementationNode = SKILL_TREE_NODES.find((n) => n.id === 'implementation')!;

  test('calculates baseline mastery for a topic with zero attempts', () => {
    const progress = calculateTopicMastery(binarySearchNode, [], [], 1000);
    assert.strictEqual(progress.masteryScore, 0);
    assert.strictEqual(progress.status, 'available');
    assert.strictEqual(progress.solvedCount, 0);
    assert.ok(progress.breakdown.formula.includes('Mastery (0%)'));
  });

  test('does not assign expert-level mastery merely from a single accepted problem', () => {
    const singleSolve: ProblemAttempt = {
      id: 'att_1',
      problemId: '706B',
      contestId: 706,
      index: 'B',
      name: 'Interesting drink',
      rating: 1100,
      tags: ['binary search', 'dp'],
      url: 'https://codeforces.com/problemset/problem/706/B',
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 600,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      outcome: 'solved_independently',
      officialVerdict: 'OK',
      selfReported: false,
    };

    const progress = calculateTopicMastery(binarySearchNode, [singleSolve], [], 1100);
    // 1 solve = 12pts + difficulty (~23) + independence (20) + revision (10) + recency (10) = ~75 max, NOT 100
    assert.ok(progress.masteryScore < 90, 'Single solve should never award full mastery');
    assert.strictEqual(progress.solvedCount, 1);
    assert.ok(progress.breakdown.solvesScore <= 12, 'Single solve capped at 12 solves score points');
  });

  test('rewards independent solves more than hint-dependent solves', () => {
    const independentAttempts: ProblemAttempt[] = [
      {
        id: 'att_indep_1',
        problemId: '706B',
        contestId: 706,
        index: 'B',
        name: 'Interesting drink',
        rating: 1100,
        tags: ['binary search'],
        url: '',
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 600,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
      },
      {
        id: 'att_indep_2',
        problemId: '279B',
        contestId: 279,
        index: 'B',
        name: 'Books',
        rating: 1100,
        tags: ['binary search'],
        url: '',
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 800,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
      },
    ];

    const hintDependentAttempts: ProblemAttempt[] = independentAttempts.map((a, idx) => ({
      ...a,
      id: `att_hint_${idx}`,
      hintsUsedCount: 4,
      highestHintLevel: 5,
      outcome: 'solved_with_hints',
    }));

    const indepProgress = calculateTopicMastery(binarySearchNode, independentAttempts, [], 1100);
    const hintProgress = calculateTopicMastery(binarySearchNode, hintDependentAttempts, [], 1100);

    assert.ok(
      indepProgress.breakdown.independenceScore > hintProgress.breakdown.independenceScore,
      'Independence score should be higher for independent solves'
    );
    assert.ok(indepProgress.masteryScore > hintProgress.masteryScore);
  });

  test('flags status as needs_revision when due mistake cards exist', () => {
    const attempts: ProblemAttempt[] = [
      {
        id: 'att_1',
        problemId: '706B',
        contestId: 706,
        index: 'B',
        name: 'Interesting drink',
        rating: 1100,
        tags: ['binary search'],
        url: '',
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 600,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
      },
    ];

    const dueMistake: MistakeRecord = {
      id: 'm_1',
      problemId: '706B',
      problemName: 'Interesting drink',
      problemUrl: '',
      rating: 1100,
      tags: ['binary search'],
      category: 'boundary_case',
      originalApproach: 'Off by one',
      whyItFailed: 'Infinite loop on l=mid',
      correctObservation: 'Use l = mid + 1',
      correctApproach: 'std::upper_bound',
      personalLesson: 'Always check midpoint increment',
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
    };

    const progress = calculateTopicMastery(binarySearchNode, attempts, [dueMistake], 1100);
    assert.strictEqual(progress.status, 'needs_revision');
    assert.strictEqual(progress.revisionDueCount, 1);
    assert.ok(progress.recommendedAction.includes('due mistake cards'));
  });

  test('checks prerequisites status accurately', () => {
    const progressMap = new Map<string, TopicProgress>();

    // sorting is a prereq of binary_search. If sorting is not in map or < 40, check fails
    const check1 = checkPrerequisitesStatus('binary_search', progressMap);
    assert.strictEqual(check1.satisfied, false);
    assert.ok(check1.missingPrereqs.includes('Sorting & Custom Comparators'));

    // Now satisfy sorting
    const sortingNode = SKILL_TREE_NODES.find((n) => n.id === 'sorting')!;
    progressMap.set('sorting', {
      topicId: 'sorting',
      name: sortingNode.name,
      status: 'practicing',
      masteryScore: 55,
      breakdown: {
        solvesScore: 20,
        difficultyScore: 15,
        independenceScore: 10,
        revisionScore: 5,
        consistencyScore: 5,
        totalScore: 55,
        formula: '',
      },
      solvedCount: 2,
      attemptedCount: 2,
      accuracyRate: 1.0,
      revisionDueCount: 0,
      recommendedAction: '',
    });

    const check2 = checkPrerequisitesStatus('binary_search', progressMap);
    assert.strictEqual(check2.satisfied, true);
    assert.strictEqual(check2.missingPrereqs.length, 0);
  });

  test('applies user manual override score cleanly', () => {
    const progress = calculateTopicMastery(implementationNode, [], [], 1000, 85);
    assert.strictEqual(progress.masteryScore, 85);
    assert.strictEqual(progress.status, 'strong');
    assert.strictEqual(progress.userOverrideScore, 85);
    assert.ok(progress.breakdown.formula.includes('Manual user override'));
  });

  test('recommends next learning sequence based on satisfied prerequisites and due revisions', () => {
    const progressMap = new Map<string, TopicProgress>();
    SKILL_TREE_NODES.forEach((n) => {
      progressMap.set(n.id, calculateTopicMastery(n, [], [], 1000));
    });

    const recs = recommendNextLearningTopics(progressMap);
    assert.ok(recs.length > 0);
    // Root nodes with no prerequisites (like implementation) should be recommended first
    assert.strictEqual(recs[0].topic.id, 'implementation');
  });
});
