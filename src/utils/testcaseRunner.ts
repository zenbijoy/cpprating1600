import { ProblemTestCase, ProblemTestCaseResult, ProgrammingLanguage } from '../types';

/**
 * Normalizes output text for comparison in competitive programming:
 * - Replaces CRLF (\r\n) with LF (\n)
 * - Trims trailing whitespace from each line
 * - Trims overall leading and trailing whitespace
 */
export function normalizeOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Checks whether two output strings match, with support for:
 * 1. Exact string match after whitespace normalization
 * 2. Token-by-token comparison (ignoring inter-token whitespace differences)
 * 3. Array formatting equivalence e.g. "[0, 1]" vs "[0,1]"
 * 4. Floating point comparison with 1e-6 epsilon tolerance
 */
export function compareOutputs(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) {
    return true;
  }

  // Token-based comparison
  const actualTokens = normActual.split(/\s+/).filter(Boolean);
  const expectedTokens = normExpected.split(/\s+/).filter(Boolean);

  if (actualTokens.length === expectedTokens.length && actualTokens.length > 0) {
    let allTokensMatch = true;
    for (let i = 0; i < actualTokens.length; i++) {
      const a = actualTokens[i];
      const e = expectedTokens[i];

      if (a === e) continue;

      // Try numeric float comparison
      const numA = Number(a);
      const numE = Number(e);
      if (!Number.isNaN(numA) && !Number.isNaN(numE)) {
        if (Math.abs(numA - numE) <= 1e-6 || Math.abs((numA - numE) / (numE || 1)) <= 1e-6) {
          continue;
        }
      }

      allTokensMatch = false;
      break;
    }

    if (allTokensMatch) return true;
  }

  // JSON / array formatting normalization e.g. [0, 1] vs [0,1]
  const cleanA = normActual.replace(/\s+/g, '');
  const cleanE = normExpected.replace(/\s+/g, '');
  if (cleanA === cleanE && cleanA.length > 0) {
    return true;
  }

  return false;
}

/**
 * Evaluates a single test case result given the actual execution response and expected output.
 */
export function evaluateTestCaseResult(
  testCase: ProblemTestCase,
  execResult: {
    status: string;
    stdout?: string;
    stderr?: string;
    compilerOutput?: string;
    executionTimeMs?: number;
    message?: string;
  }
): ProblemTestCaseResult {
  if (execResult.status === 'COMPILATION_ERROR') {
    return {
      testCaseId: testCase.id,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: '',
      status: 'COMPILATION_ERROR',
      executionTimeMs: 0,
      errorMessage: execResult.compilerOutput || execResult.message || 'Compilation failed.',
    };
  }

  if (execResult.status === 'TIME_LIMIT_EXCEEDED') {
    return {
      testCaseId: testCase.id,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: execResult.stdout || '',
      status: 'TIME_LIMIT_EXCEEDED',
      executionTimeMs: execResult.executionTimeMs || 2000,
      errorMessage: 'Time limit exceeded.',
    };
  }

  if (execResult.status === 'RUNTIME_ERROR' || execResult.status === 'BACKEND_UNAVAILABLE') {
    return {
      testCaseId: testCase.id,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: execResult.stdout || '',
      status: 'RUNTIME_ERROR',
      executionTimeMs: execResult.executionTimeMs || 0,
      errorMessage: execResult.stderr || execResult.message || 'Runtime error occurred.',
    };
  }

  const actual = execResult.stdout || '';
  const isMatch = compareOutputs(actual, testCase.expectedOutput);

  return {
    testCaseId: testCase.id,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actual,
    status: isMatch ? 'PASS' : 'FAIL',
    executionTimeMs: execResult.executionTimeMs || 0,
    errorMessage: isMatch ? undefined : 'Output did not match expected value.',
  };
}
