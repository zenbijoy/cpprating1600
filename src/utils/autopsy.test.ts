import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVerdict,
  parseCompilerDiagnostics,
  checkIntegerOverflow,
  checkIoBottleneck,
  runSubmissionAutopsy,
  createMistakeFromAutopsy,
} from './autopsy';
import { CFSubmission, CFProblem } from '../types';

describe('Feature 4: Submission Autopsy Engine', () => {
  const sampleProblem: CFProblem = {
    contestId: 1352,
    index: 'C',
    name: 'K-th Not Divisible by n',
    rating: 1200,
    tags: ['binary search', 'math'],
  };

  test('normalizes raw Codeforces verdicts accurately', () => {
    assert.strictEqual(normalizeVerdict('OK'), 'OK');
    assert.strictEqual(normalizeVerdict('ACCEPTED'), 'OK');
    assert.strictEqual(normalizeVerdict('WRONG_ANSWER'), 'WRONG_ANSWER');
    assert.strictEqual(normalizeVerdict('TIME_LIMIT_EXCEEDED'), 'TIME_LIMIT_EXCEEDED');
    assert.strictEqual(normalizeVerdict('MEMORY_LIMIT_EXCEEDED'), 'MEMORY_LIMIT_EXCEEDED');
    assert.strictEqual(normalizeVerdict('RUNTIME_ERROR'), 'RUNTIME_ERROR');
    assert.strictEqual(normalizeVerdict('COMPILATION_ERROR'), 'COMPILATION_ERROR');
    assert.strictEqual(normalizeVerdict('IDLENESS_LIMIT_EXCEEDED'), 'IDLENESS_LIMIT_EXCEEDED');
    assert.strictEqual(normalizeVerdict(undefined), 'OTHER');
  });

  test('detects integer overflow on 32-bit accumulator', () => {
    const buggyCode = `
#include <iostream>
using namespace std;
int main() {
    int sum = 0;
    int n; cin >> n;
    for (int i = 0; i < n; i++) {
        int x; cin >> x;
        sum += x;
    }
    cout << sum << "\\n";
}
    `;

    const finding = checkIntegerOverflow(buggyCode);
    assert.ok(finding !== null);
    assert.strictEqual(finding?.category, 'integer_overflow');
    assert.strictEqual(finding?.confidence, 'LIKELY');
    assert.strictEqual(finding?.lineNumber, 5);
    assert.ok(finding?.suggestedFix.includes('long long'));
  });

  test('detects 32-bit bitshift overflow (1 << k)', () => {
    const shiftCode = `
#include <iostream>
using namespace std;
int main() {
    int k = 40;
    long long mask = 1 << k;
    cout << mask << "\\n";
}
    `;

    const finding = checkIntegerOverflow(shiftCode);
    assert.ok(finding !== null);
    assert.strictEqual(finding?.category, 'integer_overflow');
    assert.ok(finding?.title.includes('Bitwise Shift'));
    assert.ok(finding?.suggestedFix.includes('1LL'));
  });

  test('detects missing fast C++ I/O optimizations', () => {
    const slowIoCode = `
#include <iostream>
using namespace std;
int main() {
    int n; cin >> n;
    cout << n << "\\n";
}
    `;

    const finding = checkIoBottleneck(slowIoCode);
    assert.ok(finding !== null);
    assert.strictEqual(finding?.category, 'io_bottleneck');
    assert.strictEqual(finding?.confidence, 'LIKELY');
    assert.ok(finding?.suggestedFix.includes('ios_base::sync_with_stdio'));
  });

  test('parses compiler diagnostics and identifies missing headers', () => {
    const compilerStderr = `solution.cpp:12:5: error: 'vector' was not declared in this scope\nsolution.cpp:18:10: error: 'sort' was not declared in this scope`;

    const findings = parseCompilerDiagnostics(compilerStderr);
    assert.strictEqual(findings.length, 2);
    assert.strictEqual(findings[0].lineNumber, 12);
    assert.ok(findings[0].suggestedFix.includes('<vector>'));
    assert.strictEqual(findings[1].lineNumber, 18);
    assert.ok(findings[1].suggestedFix.includes('<algorithm>'));
  });

  test('runs full submission autopsy on WA submission without fabricating verdicts', () => {
    const submission: Partial<CFSubmission> = {
      id: 98765432,
      contestId: 1352,
      problem: sampleProblem,
      programmingLanguage: 'GNU C++20 (64)',
      verdict: 'WRONG_ANSWER',
      passedTestCount: 3,
      timeConsumedMillis: 45,
      memoryConsumedBytes: 204800,
      creationTimeSeconds: 1672531199,
    };

    const code = `
#include <iostream>
using namespace std;
int main() {
    int sum = 0;
    int t; cin >> t;
}
    `;

    const report = runSubmissionAutopsy(submission, code);
    assert.strictEqual(report.submissionId, 98765432);
    assert.strictEqual(report.verdictType, 'WRONG_ANSWER');
    assert.strictEqual(report.executionTimeMs, 45);
    assert.strictEqual(report.memoryBytes, 204800);
    assert.strictEqual(report.suggestedMistakeCategory, 'integer_overflow');
    assert.ok(report.findings.length > 0);
    assert.ok(report.counterexampleSuggestion !== undefined);
    assert.strictEqual(report.counterexampleSuggestion?.isAiSuggestion, false);
  });

  test('creates spaced repetition mistake record from autopsy report', () => {
    const submission: Partial<CFSubmission> = {
      id: 11223344,
      contestId: 1352,
      problem: sampleProblem,
      verdict: 'TIME_LIMIT_EXCEEDED',
      timeConsumedMillis: 2000,
      programmingLanguage: 'GNU C++20',
    };

    const code = `
#include <iostream>
using namespace std;
int main() {
    for (int i = 0; i < 100000; i++) {
        for (int j = 0; j < 100000; j++) {
            cout << i + j << endl;
        }
    }
}
    `;

    const report = runSubmissionAutopsy(submission, code);
    const mistake = createMistakeFromAutopsy(report, code, 'Tried brute force nested loops');

    assert.strictEqual(mistake.problemId, '1352C');
    assert.strictEqual(mistake.category, 'wrong_complexity');
    assert.strictEqual(mistake.intervalDays, 1);
    assert.strictEqual(mistake.reviewCount, 0);
    assert.strictEqual(mistake.status, 'scheduled');
    assert.ok(mistake.whyItFailed.length > 0);
    assert.ok(mistake.personalLesson.includes('N=10^5 requires O(N)'));
  });
});
