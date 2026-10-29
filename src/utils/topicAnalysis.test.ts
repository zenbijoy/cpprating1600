import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeTopicFrequencies, BENCHMARK_TAGS } from './topicAnalysis';
import { ProblemAttempt } from '../types';

function createMockAttempt(id: string, tags: string[], verdict: 'OK' | 'WRONG_ANSWER' = 'OK'): ProblemAttempt {
  return {
    id,
    problemId: id,
    index: 'A',
    name: `Test Problem ${id}`,
    tags,
    url: 'https://codeforces.com',
    startedAt: '2026-10-25T10:00:00Z',
    endedAt: '2026-10-25T10:15:00Z',
    timeSpentSeconds: 900,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    outcome: verdict === 'OK' ? 'solved_independently' : 'attempted_gave_up',
    officialVerdict: verdict,
    selfReported: true,
  };
}

describe('Topic Cloud Frequency Analysis Engine', () => {
  it('initializes benchmark tags with 0 solves and high deficit on empty attempts', () => {
    const result = analyzeTopicFrequencies([], 1);

    assert.strictEqual(result.totalTagsAnalyzed, BENCHMARK_TAGS.length);
    assert.strictEqual(result.totalUniqueTagsSolved, 0);
    assert.strictEqual(result.overallCoveragePercent, 0);

    const mathMetric = result.tags.find((t) => t.tag === 'math');
    assert.ok(mathMetric, 'math tag must exist');
    assert.strictEqual(mathMetric.solvedCount, 0);
    assert.strictEqual(mathMetric.status, 'critical');
    assert.ok(mathMetric.practiceNeedScore >= 75);
  });

  it('correctly tracks solved tag counts and decreases practice deficit', () => {
    const attempts = [
      createMockAttempt('1', ['math', 'implementation']),
      createMockAttempt('2', ['math']),
      createMockAttempt('3', ['implementation', 'brute force']),
    ];

    const result = analyzeTopicFrequencies(attempts, 1);

    const math = result.tags.find((t) => t.tag === 'math');
    assert.strictEqual(math?.solvedCount, 2);

    const impl = result.tags.find((t) => t.tag === 'implementation');
    assert.strictEqual(impl?.solvedCount, 2);

    const dp = result.tags.find((t) => t.tag === 'dp');
    assert.strictEqual(dp?.solvedCount, 0);

    // Unpracticed dp should have higher need score than math/impl
    assert.ok(
      (dp?.practiceNeedScore ?? 0) > (math?.practiceNeedScore ?? 0),
      'Unpracticed DP must have higher practice need score than practiced Math'
    );
  });

  it('increases practice need score when failed attempts occur', () => {
    const attemptsWithoutFails = [
      createMockAttempt('1', ['two pointers'], 'OK'),
    ];
    const attemptsWithFails = [
      createMockAttempt('1', ['two pointers'], 'OK'),
      createMockAttempt('2', ['two pointers'], 'WRONG_ANSWER'),
      createMockAttempt('3', ['two pointers'], 'WRONG_ANSWER'),
    ];

    const res1 = analyzeTopicFrequencies(attemptsWithoutFails, 1);
    const res2 = analyzeTopicFrequencies(attemptsWithFails, 1);

    const metric1 = res1.tags.find((t) => t.tag === 'two pointers');
    const metric2 = res2.tags.find((t) => t.tag === 'two pointers');

    assert.strictEqual(metric2?.failedCount, 2);
    assert.ok(
      (metric2?.practiceNeedScore ?? 0) > (metric1?.practiceNeedScore ?? 0),
      'Failed attempts should increase the urgency of practice'
    );
  });

  it('correctly sorts topDeficitTags by practice need score descending', () => {
    const attempts = [
      createMockAttempt('1', ['implementation'], 'OK'),
      createMockAttempt('2', ['implementation'], 'OK'),
      createMockAttempt('3', ['implementation'], 'OK'),
      createMockAttempt('4', ['implementation'], 'OK'),
      createMockAttempt('5', ['implementation'], 'OK'),
      createMockAttempt('6', ['implementation'], 'OK'),
      createMockAttempt('7', ['implementation'], 'OK'),
      createMockAttempt('8', ['implementation'], 'OK'),
    ];

    const result = analyzeTopicFrequencies(attempts, 1);

    for (let i = 0; i < result.topDeficitTags.length - 1; i++) {
      assert.ok(
        result.topDeficitTags[i].practiceNeedScore >= result.topDeficitTags[i + 1].practiceNeedScore,
        `Index ${i} (${result.topDeficitTags[i].tag}) should have >= need score than index ${i + 1}`
      );
    }

    // Implementation should be much lower in the deficit ranking since it has 8 solves
    const implIndex = result.topDeficitTags.findIndex((t) => t.tag === 'implementation');
    assert.ok(implIndex > 5, 'Implementation should be pushed down the deficit list');
  });

  it('advances status from critical to moderate to solid as solves reach target', () => {
    // Math base target is around 6 for early days
    const attempts = Array.from({ length: 8 }, (_, i) =>
      createMockAttempt(`m_${i}`, ['math'], 'OK')
    );

    const result = analyzeTopicFrequencies(attempts, 1);
    const math = result.tags.find((t) => t.tag === 'math');

    assert.ok(math);
    assert.strictEqual(math.solvedCount, 8);
    assert.ok(math.status === 'solid' || math.status === 'mastered');
    assert.ok(math.practiceNeedScore < 15);
  });
});
