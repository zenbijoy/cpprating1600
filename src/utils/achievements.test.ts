import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateAchievements, getAchievementStats } from './achievements';
import { ProblemAttempt, UserProfile, MistakeRecord } from '../types';
import { StreakAnalysis } from './streak';

function mockAttempt(id: string, overrides: Partial<ProblemAttempt> = {}): ProblemAttempt {
  return {
    id,
    problemId: `prob_${id}`,
    index: 'A',
    name: `Problem ${id}`,
    rating: 800,
    tags: ['math'],
    url: 'https://codeforces.com',
    startedAt: '2026-10-25T10:00:00Z',
    endedAt: '2026-10-25T10:20:00Z',
    timeSpentSeconds: 1200,
    hintsUsedCount: 0,
    highestHintLevel: 0,
    outcome: 'solved_independently',
    officialVerdict: 'OK',
    selfReported: true,
    ...overrides,
  };
}

describe('Achievements Evaluation Engine', () => {
  it('initializes all badges with zero progress on empty input', () => {
    const badges = evaluateAchievements({
      attempts: [],
      streakAnalysis: undefined,
      profile: undefined,
      mistakes: [],
    });

    assert.ok(badges.length >= 12, 'Should have at least 12 badge milestones');
    const first10 = badges.find((b) => b.id === 'volume_10');
    assert.ok(first10, 'volume_10 badge must exist');
    assert.strictEqual(first10.unlocked, false);
    assert.strictEqual(first10.currentValue, 0);
    assert.strictEqual(first10.progress, 0);

    const streak10 = badges.find((b) => b.id === 'streak_10');
    assert.ok(streak10, 'streak_10 badge must exist');
    assert.strictEqual(streak10.unlocked, false);
    assert.strictEqual(streak10.progress, 0);
  });

  it('unlocks "10-Day Streak" when streak reaches 10', () => {
    const mockStreakAnalysis: StreakAnalysis = {
      days: [],
      currentStreak: 10,
      longestStreak: 10,
      activeDaysLast30: 10,
      consistencyPercentage: 33,
      totalSolvedLast30: 15,
    };

    const badges = evaluateAchievements({
      attempts: [],
      streakAnalysis: mockStreakAnalysis,
    });

    const streak1 = badges.find((b) => b.id === 'streak_1');
    const streak3 = badges.find((b) => b.id === 'streak_3');
    const streak10 = badges.find((b) => b.id === 'streak_10');
    const streak30 = badges.find((b) => b.id === 'streak_30');

    assert.strictEqual(streak1?.unlocked, true);
    assert.strictEqual(streak3?.unlocked, true);
    assert.strictEqual(streak10?.unlocked, true, '"10-Day Streak" must be unlocked');
    assert.strictEqual(streak10?.currentValue, 10);
    assert.strictEqual(streak10?.progress, 1);

    assert.strictEqual(streak30?.unlocked, false);
    assert.strictEqual(streak30?.progress, 10 / 30);
  });

  it('unlocks "First 10 Problems Solved" when exactly 10 problems are solved', () => {
    // 9 solved attempts
    const attempts9 = Array.from({ length: 9 }, (_, i) => mockAttempt(`sol_${i}`));
    const badges9 = evaluateAchievements({
      attempts: attempts9,
    });

    const vol10Before = badges9.find((b) => b.id === 'volume_10');
    assert.strictEqual(vol10Before?.unlocked, false);
    assert.strictEqual(vol10Before?.currentValue, 9);
    assert.strictEqual(vol10Before?.progress, 0.9);

    // 10 solved attempts
    const attempts10 = Array.from({ length: 10 }, (_, i) => mockAttempt(`sol_${i}`));
    const badges10 = evaluateAchievements({
      attempts: attempts10,
    });

    const vol10After = badges10.find((b) => b.id === 'volume_10');
    assert.strictEqual(vol10After?.unlocked, true, '"First 10 Problems Solved" must be unlocked');
    assert.strictEqual(vol10After?.currentValue, 10);
    assert.strictEqual(vol10After?.progress, 1);
  });

  it('unlocks "Rating 1200 Reached" when verified or theoretical rating crosses 1200', () => {
    const mockProfile: UserProfile = {
      id: 'user_1',
      name: 'Tester',
      email: 'test@example.com',
      verifiedCfRating: 1240,
      preferredLanguage: 'cpp20',
      theme: 'dark',
      onboardingCompleted: true,
      createdAt: '2026-10-01',
      lastActiveDate: '2026-10-29',
      hintDelayMinutes: 15,
    };

    const badges = evaluateAchievements({
      attempts: [],
      profile: mockProfile,
    });

    const rating1000 = badges.find((b) => b.id === 'rating_1000');
    const rating1200 = badges.find((b) => b.id === 'rating_1200');
    const rating1400 = badges.find((b) => b.id === 'rating_1400');

    assert.strictEqual(rating1000?.unlocked, true);
    assert.strictEqual(rating1200?.unlocked, true, '"Rating 1200 Reached" must be unlocked');
    assert.strictEqual(rating1200?.currentValue, 1240);
    assert.strictEqual(rating1400?.unlocked, false);
    assert.ok((rating1400?.progress ?? 0) > 0.88);
  });

  it('evaluates mastery achievements (zero-hints, hard problem, mistake logs)', () => {
    const attempts = [
      mockAttempt('1', { outcome: 'solved_independently', hintsUsedCount: 0, rating: 1350 }),
      mockAttempt('2', { outcome: 'solved_independently', hintsUsedCount: 0, rating: 1100 }),
      mockAttempt('3', { outcome: 'solved_independently', hintsUsedCount: 0, rating: 900 }),
      mockAttempt('4', { outcome: 'solved_independently', hintsUsedCount: 0, rating: 800 }),
      mockAttempt('5', { outcome: 'solved_independently', hintsUsedCount: 0, rating: 1000 }),
    ];

    const mockMistakes: MistakeRecord[] = [
      {
        id: 'm1',
        problemId: '158A',
        problemName: 'Next Round',
        problemUrl: '',
        category: 'boundary_case',
        originalApproach: '',
        whyItFailed: '',
        correctObservation: '',
        correctApproach: '',
        personalLesson: '',
        createdAt: '2026-10-25',
        nextReviewDate: '2026-10-30',
        intervalDays: 1,
        reviewCount: 1,
        status: 'due',
        tags: [],
      },
      {
        id: 'm2',
        problemId: '71A',
        problemName: 'Way Too Long Words',
        problemUrl: '',
        category: 'indexing_error',
        originalApproach: '',
        whyItFailed: '',
        correctObservation: '',
        correctApproach: '',
        personalLesson: '',
        createdAt: '2026-10-26',
        nextReviewDate: '2026-10-30',
        intervalDays: 1,
        reviewCount: 1,
        status: 'due',
        tags: [],
      },
      {
        id: 'm3',
        problemId: '231A',
        problemName: 'Team',
        problemUrl: '',
        category: 'misread_statement',
        originalApproach: '',
        whyItFailed: '',
        correctObservation: '',
        correctApproach: '',
        personalLesson: '',
        createdAt: '2026-10-27',
        nextReviewDate: '2026-10-30',
        intervalDays: 1,
        reviewCount: 1,
        status: 'due',
        tags: [],
      },
    ];

    const badges = evaluateAchievements({
      attempts,
      mistakes: mockMistakes,
    });

    const zeroHints = badges.find((b) => b.id === 'mastery_zero_hints');
    assert.strictEqual(zeroHints?.unlocked, true, 'Zero-Hint Purist must unlock with 5 independent solves');

    const giantSlayer = badges.find((b) => b.id === 'mastery_hard_solve');
    assert.strictEqual(giantSlayer?.unlocked, true, 'Giant Slayer must unlock when rating >= 1300 solved');

    const mistakeHunter = badges.find((b) => b.id === 'mastery_mistakes');
    assert.strictEqual(mistakeHunter?.unlocked, true, 'Mistake Hunter must unlock with 3 logged mistakes');
  });

  it('aggregates achievement stats correctly and finds next closest badge', () => {
    const attempts = [
      mockAttempt('1', { rating: 800 }),
      mockAttempt('2', { rating: 900 }),
      mockAttempt('3', { rating: 1000 }),
    ];

    const badges = evaluateAchievements({ attempts });
    const stats = getAchievementStats(badges);

    assert.ok(stats.total >= 12);
    assert.ok(stats.unlockedCount >= 1);
    assert.strictEqual(
      stats.completionPercent,
      Math.round((stats.unlockedCount / stats.total) * 100)
    );
    assert.ok(stats.nextClosestBadge, 'Should identify next closest badge to unlock');
  });
});
