import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  recommendAdaptiveProblem,
  detectWeaknesses,
  evaluateComplexityEstimation,
  generatePreContestChecklist,
  evaluateContestDecisions,
} from './adaptiveEngine';
import { MistakeRecord, ProblemAttempt } from '../types';

describe('Adaptive Problem Recommendation Engine (Feature 31)', () => {
  test('recommends base difficulty problem when attempt history is low', () => {
    const rec = recommendAdaptiveProblem(1000, [], 'topic_1', []);
    assert.strictEqual(typeof rec.expectedDifficulty, 'number');
    assert.strictEqual(rec.matchedTopicId, 'topic_1');
    assert.ok(rec.rationale.includes('Balanced'));
  });

  test('pushes difficulty (+100) when user has strong recent independent solves', () => {
    const mockAttempts: ProblemAttempt[] = Array(4).fill(null).map((_, idx) => ({
      id: `att_${idx}`,
      problemId: `${idx}A`,
      index: 'A',
      name: `Problem ${idx}`,
      url: 'https://codeforces.com',
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 900,
      hintsUsedCount: 0,
      highestHintLevel: 0,
      outcome: 'solved_independently',
      officialVerdict: 'OK',
      selfReported: false,
      tags: ['math'],
    }));

    const rec = recommendAdaptiveProblem(1100, mockAttempts, 'topic_2', []);
    assert.strictEqual(rec.expectedDifficulty, 1200);
    assert.ok(rec.rationale.includes('+100'));
  });

  test('drops difficulty (-100) when user struggled on recent attempts to consolidate fundamentals', () => {
    const mockAttempts: ProblemAttempt[] = Array(4).fill(null).map((_, idx) => ({
      id: `att_fail_${idx}`,
      problemId: `${idx}A`,
      index: 'A',
      name: `Problem ${idx}`,
      url: 'https://codeforces.com',
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 1800,
      hintsUsedCount: 3,
      highestHintLevel: 5,
      outcome: 'attempted_gave_up',
      officialVerdict: 'WRONG_ANSWER',
      selfReported: false,
      tags: ['dp'],
    }));

    const rec = recommendAdaptiveProblem(1200, mockAttempts, 'topic_3', []);
    assert.strictEqual(rec.expectedDifficulty, 1100);
    assert.ok(rec.rationale.includes('Consolidating'));
  });

  test('cold-start user receives baseline problem with target rating awareness', () => {
    const rec1200 = recommendAdaptiveProblem(800, [], 'topic_foundations', [], { targetRating: 1200 });
    assert.strictEqual(rec1200.expectedDifficulty, 800);
    assert.ok(rec1200.rationale.includes('1200'));

    const rec1600 = recommendAdaptiveProblem(800, [], 'topic_foundations', [], { targetRating: 1600 });
    assert.ok(rec1600.rationale.includes('1600'));
  });

  test('prevents recommending previously attempted or solved problems (duplicate avoidance)', () => {
    // Curated catalog has 4A, 71A, 231A, 282A
    const solvedAttempts: ProblemAttempt[] = [
      {
        id: 'att_4A',
        problemId: '4A',
        contestId: 4,
        index: 'A',
        name: 'Watermelon',
        url: '',
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 600,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['math'],
      },
      {
        id: 'att_71A',
        problemId: '71A',
        contestId: 71,
        index: 'A',
        name: 'Way Too Long Words',
        url: '',
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 600,
        hintsUsedCount: 0,
        highestHintLevel: 0,
        outcome: 'solved_independently',
        officialVerdict: 'OK',
        selfReported: false,
        tags: ['strings'],
      },
    ];

    const rec = recommendAdaptiveProblem(800, solvedAttempts, 'topic_strings', []);
    const recommendedId = `${rec.problem.contestId}${rec.problem.index}`;
    assert.notStrictEqual(recommendedId, '4A', 'Must not recommend 4A since it was solved');
    assert.notStrictEqual(recommendedId, '71A', 'Must not recommend 71A since it was solved');
  });

  test('respects topic exclusion filters', () => {
    const rec = recommendAdaptiveProblem(1400, [], 'topic_adv', [], {
      excludeTopics: ['dp', 'graphs'],
    });

    const tags = (rec.problem.tags || []).map((t) => t.toLowerCase());
    assert.strictEqual(tags.includes('dp'), false, 'Should not recommend dp topic');
    assert.strictEqual(tags.includes('graphs'), false, 'Should not recommend graphs topic');
  });

  test('respects specific topic inclusion filters', () => {
    const rec = recommendAdaptiveProblem(1200, [], 'binary_search', [], {
      includeTopics: ['binary search'],
    });

    const tags = (rec.problem.tags || []).map((t) => t.toLowerCase());
    assert.ok(tags.includes('binary search'), 'Should specifically recommend binary search problem');
  });

  test('scores and ranks candidate problems based on mistake patterns', () => {
    const overflowMistake: MistakeRecord = {
      id: 'm_of',
      problemId: '99A',
      problemName: 'Big Sum',
      problemUrl: '',
      tags: ['math'],
      category: 'integer_overflow',
      originalApproach: '',
      whyItFailed: '32-bit int overflow',
      correctObservation: 'Use long long',
      correctApproach: '',
      personalLesson: 'long long',
      createdAt: new Date().toISOString(),
      nextReviewDate: '',
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
    };

    const rec = recommendAdaptiveProblem(1200, [], 'math', [overflowMistake]);
    assert.ok(rec.rationale.includes('Integer Overflow') || rec.targetSkill.includes('math'));
  });
});

describe('Personalized Weakness Detection Engine (Feature 32)', () => {
  test('accurately identifies recurring mistake patterns and orders by frequency', () => {
    const mistakes: MistakeRecord[] = [
      {
        id: 'm1',
        problemId: '4A',
        problemName: 'Watermelon',
        problemUrl: '',
        category: 'boundary_case',
        originalApproach: '',
        whyItFailed: 'w=2',
        correctObservation: '',
        correctApproach: '',
        personalLesson: 'Check N=2',
        createdAt: new Date().toISOString(),
        nextReviewDate: '',
        intervalDays: 1,
        reviewCount: 0,
        status: 'due',
        tags: [],
      },
      {
        id: 'm2',
        problemId: '71A',
        problemName: 'Words',
        problemUrl: '',
        category: 'boundary_case',
        originalApproach: '',
        whyItFailed: 'len=1',
        correctObservation: '',
        correctApproach: '',
        personalLesson: 'Check small len',
        createdAt: new Date().toISOString(),
        nextReviewDate: '',
        intervalDays: 1,
        reviewCount: 0,
        status: 'due',
        tags: [],
      },
      {
        id: 'm3',
        problemId: '231A',
        problemName: 'Team',
        problemUrl: '',
        category: 'integer_overflow',
        originalApproach: '',
        whyItFailed: 'overflow on sum',
        correctObservation: '',
        correctApproach: '',
        personalLesson: 'use long long',
        createdAt: new Date().toISOString(),
        nextReviewDate: '',
        intervalDays: 1,
        reviewCount: 0,
        status: 'due',
        tags: [],
      },
    ];

    const report = detectWeaknesses(mistakes);
    assert.strictEqual(report.weaknesses.length, 2);
    assert.strictEqual(report.weaknesses[0].category, 'boundary_case');
    assert.strictEqual(report.weaknesses[0].frequency, 2);
    assert.ok(report.weaknesses[0].recommendedAction.includes('trace extreme constraints'));
  });
});

describe('Complexity and Constraint Coach (Feature 35)', () => {
  test('approves valid O(N log N) for N <= 10^5', () => {
    const result = evaluateComplexityEstimation(100000, 'O(N log N)', 'O(N)');
    assert.strictEqual(result.isValid, true);
    assert.ok(result.feedback.includes('operations'));
  });

  test('flags invalid O(N^2) for N = 10^5 with TLE warning', () => {
    const result = evaluateComplexityEstimation(100000, 'O(N^2)', 'O(1)');
    assert.strictEqual(result.isValid, false);
    assert.ok(result.feedback.includes('Time Limit Exceeded'));
  });
});

describe('Pre-Contest Checklist Generator (Feature 36)', () => {
  test('generates baseline checklist plus custom items from mistake notebook', () => {
    const sampleMistake: MistakeRecord = {
      id: 'm_test',
      problemId: '1352C',
      problemName: 'K-th Not Divisible',
      problemUrl: '',
      category: 'integer_overflow',
      originalApproach: '',
      whyItFailed: 'k up to 10^9',
      correctObservation: '',
      correctApproach: '',
      personalLesson: 'use int64_t for k and n',
      createdAt: new Date().toISOString(),
      nextReviewDate: '',
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
      tags: [],
    };

    const checklist = generatePreContestChecklist('Codeforces Round 950 (Div. 2)', [sampleMistake]);
    assert.strictEqual(checklist.contestTitle, 'Codeforces Round 950 (Div. 2)');
    assert.ok(checklist.items.length >= 4);
    assert.ok(checklist.items.some((i) => i.rule.includes('K-th Not Divisible')));
  });
});

describe('Contest Decision Coach (Feature 38)', () => {
  test('warns when over 35 minutes were spent on an unsolved problem', () => {
    const result = evaluateContestDecisions(120, [
      { index: 'A', timeSpentMinutes: 15, solved: true },
      { index: 'B', timeSpentMinutes: 45, solved: false },
    ]);
    assert.ok(result.pacingAdvice.includes('25-minute skip rule'));
    assert.strictEqual(result.upsolvingPriority.length, 1);
  });
});
