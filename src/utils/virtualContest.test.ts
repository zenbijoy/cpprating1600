import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseContestDivision,
  calculateContestPenalty,
  estimatePerformanceRating,
  generateMidContestAdvice,
  generatePreContestChecklist,
  generateContestDebrief,
  createVirtualContestSession,
  recordContestSubmission,
  finalizeVirtualContest,
  generateLocalStandings,
  ContestProblemState,
  VirtualContestState,
} from './virtualContest';
import { CFProblem, MistakeRecord } from '../types';

describe('Feature 5: Virtual Contest Arena Engine', () => {
  test('accurately identifies contest divisions from titles', () => {
    assert.strictEqual(parseContestDivision('Codeforces Round 900 (Div. 3)'), 'Div. 3');
    assert.strictEqual(parseContestDivision('Codeforces Round 895 (Div. 2)'), 'Div. 2');
    assert.strictEqual(parseContestDivision('Codeforces Round 871 (Div. 4)'), 'Div. 4');
    assert.strictEqual(parseContestDivision('Educational Codeforces Round 150'), 'Educational');
    assert.strictEqual(parseContestDivision('Global Round 25'), 'Other');
  });

  test('calculates contest penalty correctly with 20-minute failed attempt penalties', () => {
    const problems: ContestProblemState[] = [
      {
        problem: { contestId: 1352, index: 'A', name: 'A', tags: [] },
        status: 'solved',
        attemptsCount: 1, // 1st try AC at 10 mins (600s)
        solvedTimeSeconds: 600,
        penaltyMinutes: 0,
      },
      {
        problem: { contestId: 1352, index: 'B', name: 'B', tags: [] },
        status: 'solved',
        attemptsCount: 3, // 3rd try AC at 30 mins (1800s) -> 30 + 2 * 20 = 70 mins penalty
        solvedTimeSeconds: 1800,
        penaltyMinutes: 0,
      },
      {
        problem: { contestId: 1352, index: 'C', name: 'C', tags: [] },
        status: 'failed',
        attemptsCount: 2,
        penaltyMinutes: 0,
      },
    ];

    const { solvedCount, totalPenaltyMinutes } = calculateContestPenalty(problems);
    assert.strictEqual(solvedCount, 2);
    // Problem A: 10 mins. Problem B: 30 + 2*20 = 70 mins. Total = 80 mins.
    assert.strictEqual(totalPenaltyMinutes, 80);
  });

  test('estimates realistic rating performance across divisions', () => {
    // 3 solves in Div. 2 should estimate ~1600+
    const div2Rating = estimatePerformanceRating(3, 'Div. 2', 60);
    assert.ok(div2Rating >= 1600, '3 solves in Div. 2 should cross 1600 benchmark');

    // 5 solves in Div. 3 should estimate ~1600+
    const div3Rating = estimatePerformanceRating(5, 'Div. 3', 60);
    assert.ok(div3Rating >= 1600, '5 solves in Div. 3 should cross 1600 benchmark');

    // 0 solves should return baseline novice rating
    const zeroRating = estimatePerformanceRating(0, 'Div. 3');
    assert.ok(zeroRating <= 800);
  });

  test('triggers mid-contest advice when stuck on Problem A/B > 25 minutes or 3 failed attempts', () => {
    const adviceTime = generateMidContestAdvice(1600, 1, 'A'); // 26 mins on Problem A
    assert.ok(adviceTime !== null);
    assert.ok(adviceTime?.includes('26 minutes on Problem A'));

    const adviceFails = generateMidContestAdvice(600, 3, 'B'); // 3 failed submissions
    assert.ok(adviceFails !== null);
    assert.ok(adviceFails?.includes('consecutive failed submissions'));
  });

  test('includes personalized mistake warning in pre-contest checklist', () => {
    const mistakes: MistakeRecord[] = [
      {
        id: 'm1',
        problemId: '1352C',
        problemName: 'K-th Not Divisible by n',
        problemUrl: '',
        category: 'integer_overflow',
        originalApproach: '32-bit int',
        whyItFailed: 'Overflow',
        correctObservation: '',
        correctApproach: 'long long',
        personalLesson: '',
        createdAt: '',
        nextReviewDate: '',
        intervalDays: 1,
        reviewCount: 0,
        tags: ['math'],
        status: 'scheduled',
      },
    ];

    const checklist = generatePreContestChecklist('Div. 2', mistakes);
    assert.ok(checklist.some((item) => item.includes('Integer overflow was logged')));
  });

  test('generates complete debrief with upsolving queue and performance telemetry', () => {
    const problems: ContestProblemState[] = [
      {
        problem: { contestId: 1335, index: 'A', name: 'Candies', tags: [] },
        status: 'solved',
        attemptsCount: 1,
        solvedTimeSeconds: 600,
        penaltyMinutes: 10,
      },
      {
        problem: { contestId: 1335, index: 'B', name: 'Construct the String', tags: [] },
        status: 'solved',
        attemptsCount: 1,
        solvedTimeSeconds: 1200,
        penaltyMinutes: 20,
      },
      {
        problem: { contestId: 1335, index: 'C', name: 'Two Teams Composing', tags: [] },
        status: 'unattempted',
        attemptsCount: 0,
        penaltyMinutes: 0,
      },
    ];

    const contestState: VirtualContestState = {
      id: 'v_1',
      contestId: 1335,
      contestName: 'Codeforces Round 634 (Div. 3)',
      division: 'Div. 3',
      mode: 'simulated',
      durationSeconds: 7200,
      secondsRemaining: 3600,
      isPaused: false,
      isCompleted: true,
      startedAt: new Date().toISOString(),
      hideTagsAndRatings: true,
      problems,
      strategyPrompts: [],
    };

    const debrief = generateContestDebrief(contestState, 1600);
    assert.strictEqual(debrief.totalSolved, 2);
    assert.strictEqual(debrief.upsolvingQueue.length, 1);
    assert.strictEqual(debrief.upsolvingQueue[0].index, 'C');
    assert.ok(debrief.keyTakeaways.length > 0);
  });

  test('virtual contest lifecycle: creation, submission recording, duplicate avoidance, and finalization', () => {
    const mockProblems: CFProblem[] = [
      { contestId: 1000, index: 'A', name: 'Prob A', rating: 800, tags: ['math'] },
      { contestId: 1000, index: 'B', name: 'Prob B', rating: 1200, tags: ['dp'] },
    ];

    const session = createVirtualContestSession({
      contestName: 'Custom Mock Round',
      durationSeconds: 3600,
      problems: mockProblems,
      mode: 'simulated',
    });

    assert.equal(session.durationSeconds, 3600);
    assert.equal(session.isCompleted, false);
    assert.equal(session.problems.length, 2);
    assert.equal(session.hideTagsAndRatings, true);

    // Record WA on A
    const sub1 = recordContestSubmission(session, 'A', 'WRONG_ANSWER', 300);
    const probA = sub1.problems.find((p) => p.problem.index === 'A');
    assert.equal(probA?.status, 'failed');
    assert.equal(probA?.attemptsCount, 1);

    // Record AC on A
    const sub2 = recordContestSubmission(sub1, 'A', 'OK', 600);
    const probAAc = sub2.problems.find((p) => p.problem.index === 'A');
    assert.equal(probAAc?.status, 'solved');
    assert.equal(probAAc?.attemptsCount, 2);
    assert.equal(probAAc?.solvedTimeSeconds, 600);

    // Duplicate submission after AC should be ignored
    const dupSub = recordContestSubmission(sub2, 'A', 'WRONG_ANSWER', 800);
    const dupProbA = dupSub.problems.find((p) => p.problem.index === 'A');
    assert.equal(dupProbA?.status, 'solved', 'Accepted status must be immutable');
    assert.equal(dupProbA?.attemptsCount, 2, 'Duplicate submission attempts count should not increment');

    // Finalize contest
    const finalized = finalizeVirtualContest(dupSub);
    assert.equal(finalized.isCompleted, true);
    assert.equal(finalized.secondsRemaining, 0);
    assert.equal(finalized.hideTagsAndRatings, false);
  });

  test('generateLocalStandings breaks ties correctly using penalty minutes', () => {
    const problems: ContestProblemState[] = [
      {
        problem: { index: 'A', name: 'A', tags: [] },
        status: 'solved',
        attemptsCount: 1,
        solvedTimeSeconds: 600, // 10m penalty
        penaltyMinutes: 10,
      },
    ];

    const contestState: VirtualContestState = {
      id: 'v_standings',
      contestId: 1,
      contestName: 'Round 1',
      division: 'Div. 3',
      mode: 'simulated',
      durationSeconds: 7200,
      secondsRemaining: 0,
      isPaused: false,
      isCompleted: true,
      startedAt: '',
      hideTagsAndRatings: false,
      problems,
      strategyPrompts: [],
    };

    const simulatedCompetitors = [
      { handle: 'fast_solver', solvedCount: 1, penaltyMinutes: 5 }, // 1 solve, 5 mins -> rank 1
      { handle: 'slow_solver', solvedCount: 1, penaltyMinutes: 40 }, // 1 solve, 40 mins -> rank 3
    ];

    const standings = generateLocalStandings(contestState, 'CurrentUser', simulatedCompetitors);
    assert.equal(standings.length, 3);
    assert.equal(standings[0].handle, 'fast_solver', 'Fast solver with lowest penalty should be rank 1');
    assert.equal(standings[1].handle, 'CurrentUser', 'Current user with 10m penalty should be rank 2');
    assert.equal(standings[2].handle, 'slow_solver', 'Slow solver with 40m penalty should be rank 3');
  });
});
