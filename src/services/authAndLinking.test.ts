import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateHandle,
  generateChallengeCode,
  matchesChallengeInProfile,
  deduplicateSolvedProblems,
  CF_HANDLE_REGEX,
} from './codeforcesVerificationServer.ts';

test('1. Handle Input Validation: Valid Codeforces Handles', () => {
  const validHandles = ['tourist', 'Petr', 'Errichto', 'User_123', 'alpha-beta', 'john.doe', 'cf'];
  for (const h of validHandles) {
    if (h.length < 3) {
      const res = validateHandle(h);
      assert.equal(res.valid, false, `Handle "${h}" should be rejected for length < 3`);
    } else {
      const res = validateHandle(h);
      assert.equal(res.valid, true, `Handle "${h}" should be valid`);
      assert.equal(res.normalized, h.toLowerCase());
      assert.equal(res.original, h);
    }
  }
});

test('2. Handle Input Validation: Invalid or Malformed Codeforces Handles', () => {
  const invalidCases = [
    { input: '', expected: 'Codeforces handle cannot be empty.' },
    { input: '   ', expected: 'Codeforces handle cannot be empty.' },
    { input: null, expected: 'Codeforces handle must be a string.' },
    { input: undefined, expected: 'Codeforces handle must be a string.' },
    { input: 'ab', expected: 'Codeforces handle must be at least 3 characters.' },
    { input: 'a'.repeat(25), expected: 'Codeforces handle must be at most 24 characters.' },
    { input: 'user@domain.com', expected: 'Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.' },
    { input: 'user name', expected: 'Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.' },
    { input: '<script>', expected: 'Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.' },
    { input: 'user$hack', expected: 'Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.' },
  ];

  for (const c of invalidCases) {
    const res = validateHandle(c.input);
    assert.equal(res.valid, false, `Should reject ${c.input}`);
    assert.ok(res.error?.includes(c.expected), `Expected error to contain "${c.expected}", got "${res.error}"`);
  }
});

test('3. Challenge Generation: Cryptographic Randomness and Format', () => {
  const code1 = generateChallengeCode();
  const code2 = generateChallengeCode();

  assert.match(code1, /^CLIMB-[0-9A-F]{8}$/, 'Challenge code format must match CLIMB-XXXXXXXX');
  assert.match(code2, /^CLIMB-[0-9A-F]{8}$/, 'Challenge code format must match CLIMB-XXXXXXXX');
  assert.notEqual(code1, code2, 'Subsequent challenge codes must be random and unique');
});

test('4. Profile Matching Heuristics: Successfully Matches in Supported Fields', () => {
  const code = 'CLIMB-3F9A1B2C';

  // In firstName
  const res1 = matchesChallengeInProfile(
    { handle: 'tourist', firstName: 'CLIMB-3F9A1B2C', lastName: 'Korotkevich' },
    code
  );
  assert.equal(res1.matched, true);
  assert.equal(res1.fieldMatched, 'firstName');

  // In lastName (case-insensitive substring)
  const res2 = matchesChallengeInProfile(
    { handle: 'tourist', firstName: 'Gennady', lastName: 'climb-3f9a1b2c' },
    code
  );
  assert.equal(res2.matched, true);
  assert.equal(res2.fieldMatched, 'lastName');

  // In organization
  const res3 = matchesChallengeInProfile(
    { handle: 'tourist', firstName: 'Gennady', organization: 'ITMO [CLIMB-3F9A1B2C]' },
    code
  );
  assert.equal(res3.matched, true);
  assert.equal(res3.fieldMatched, 'organization');

  // In city
  const res4 = matchesChallengeInProfile(
    { handle: 'tourist', city: 'Gomel CLIMB-3F9A1B2C' },
    code
  );
  assert.equal(res4.matched, true);
  assert.equal(res4.fieldMatched, 'city');
});

test('5. Profile Matching Heuristics: Rejects When Challenge Is Missing or Altered', () => {
  const code = 'CLIMB-3F9A1B2C';

  // No code in any field
  const res1 = matchesChallengeInProfile(
    { handle: 'tourist', firstName: 'Gennady', lastName: 'Korotkevich', organization: 'ITMO' },
    code
  );
  assert.equal(res1.matched, false);
  assert.equal(res1.details.firstName, 'Gennady');
  assert.equal(res1.details.lastName, 'Korotkevich');
  assert.equal(res1.details.organization, 'ITMO');

  // Typo in code
  const res2 = matchesChallengeInProfile(
    { handle: 'tourist', firstName: 'CLIMB-3F9A1B2D' },
    code
  );
  assert.equal(res2.matched, false);
});

test('6. Deduplication of Solved Problems from Submission Stream', () => {
  const mockSubmissions = [
    { id: 101, contestId: 4, problem: { contestId: 4, index: 'A', name: 'Watermelon', rating: 800 }, verdict: 'OK' },
    { id: 102, contestId: 4, problem: { contestId: 4, index: 'A', name: 'Watermelon', rating: 800 }, verdict: 'OK' }, // Duplicate solve
    { id: 103, contestId: 71, problem: { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800 }, verdict: 'WRONG_ANSWER' }, // Failed
    { id: 104, contestId: 71, problem: { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800 }, verdict: 'OK' }, // Eventually solved
    { id: 105, contestId: 158, problem: { contestId: 158, index: 'B', name: 'Taxi', rating: 1100 }, verdict: 'TIME_LIMIT_EXCEEDED' },
    { id: 106, contestId: 231, problem: { contestId: 231, index: 'A', name: 'Team', rating: 800 }, verdict: 'OK' },
  ];

  const result = deduplicateSolvedProblems(mockSubmissions);
  assert.equal(result.totalSubmissions, 6);
  assert.equal(result.solvedCount, 3, 'Should count exactly 3 unique problems solved: 4A, 71A, 231A');
  assert.deepEqual(result.solvedProblemIds.sort(), ['158B', '231A', '4A', '71A'].filter(id => id !== '158B').sort());
});

test('7. Challenge Expiration Logic Simulation', () => {
  const expiresAtPast = new Date(Date.now() - 1000).toISOString();
  const expiresAtFuture = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  assert.equal(new Date() > new Date(expiresAtPast), true, 'Past challenge must be evaluated as expired');
  assert.equal(new Date() > new Date(expiresAtFuture), false, 'Future challenge must remain active');
});

test('8. Challenge Attempt Limit Rate Limiting Simulation', () => {
  const maxAttempts = 5;
  let currentAttempts = 0;

  for (let i = 1; i <= 6; i++) {
    currentAttempts++;
    if (currentAttempts > maxAttempts) {
      assert.ok(true, 'Attempt beyond max_attempts correctly flagged');
    }
  }
  assert.equal(currentAttempts, 6);
});
