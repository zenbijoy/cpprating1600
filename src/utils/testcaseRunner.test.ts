import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeOutput,
  compareOutputs,
  evaluateTestCaseResult,
} from './testcaseRunner';
import { ProblemTestCase } from '../types';

describe('Test Case Runner & Output Evaluation Engine', () => {
  it('normalizes CRLF and trailing spaces correctly', () => {
    const raw = '  line 1   \r\nline 2   \r\nline 3   \r\n\r\n';
    const normalized = normalizeOutput(raw);
    assert.strictEqual(normalized, 'line 1\nline 2\nline 3');
  });

  it('matches outputs with exact string and whitespace tolerance', () => {
    assert.strictEqual(compareOutputs('42\n', '42'), true);
    assert.strictEqual(compareOutputs('0 1', '0   1'), true);
    assert.strictEqual(compareOutputs('YES\r\n', 'YES\n'), true);
    assert.strictEqual(compareOutputs('NO', 'YES'), false);
  });

  it('matches array bracket formatting equivalents ([0, 1] vs [0,1])', () => {
    assert.strictEqual(compareOutputs('[0, 1]', '[0,1]'), true);
    assert.strictEqual(compareOutputs('[ 0, 1 ]', '[0, 1]'), true);
    assert.strictEqual(compareOutputs('[1, 2, 3]', '[1,2,3]'), true);
    assert.strictEqual(compareOutputs('[0, 2]', '[0, 1]'), false);
  });

  it('matches floating point numbers within 1e-6 epsilon', () => {
    assert.strictEqual(compareOutputs('3.14159265', '3.14159260'), true);
    assert.strictEqual(compareOutputs('10.0000001', '10.0'), true);
    assert.strictEqual(compareOutputs('10.05', '10.0'), false);
  });

  it('evaluates PASS status on matching output', () => {
    const tc: ProblemTestCase = {
      id: 1,
      input: '[2,7,11,15], 9',
      expectedOutput: '[0,1]',
    };

    const res = evaluateTestCaseResult(tc, {
      status: 'OK',
      stdout: '[0, 1]\n',
      executionTimeMs: 45,
    });

    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.actualOutput, '[0, 1]\n');
    assert.strictEqual(res.executionTimeMs, 45);
    assert.strictEqual(res.errorMessage, undefined);
  });

  it('evaluates FAIL status on mismatched output', () => {
    const tc: ProblemTestCase = {
      id: 1,
      input: '4\n1 2 3 4',
      expectedOutput: '10',
    };

    const res = evaluateTestCaseResult(tc, {
      status: 'OK',
      stdout: '11\n',
      executionTimeMs: 25,
    });

    assert.strictEqual(res.status, 'FAIL');
    assert.strictEqual(res.actualOutput, '11\n');
    assert.ok(res.errorMessage?.includes('Output did not match'));
  });

  it('handles COMPILATION_ERROR status properly', () => {
    const tc: ProblemTestCase = {
      id: 1,
      input: '5',
      expectedOutput: '25',
    };

    const res = evaluateTestCaseResult(tc, {
      status: 'COMPILATION_ERROR',
      compilerOutput: 'error: expected ";" before "}" token',
    });

    assert.strictEqual(res.status, 'COMPILATION_ERROR');
    assert.ok(res.errorMessage?.includes('expected ";"'));
  });

  it('handles TIME_LIMIT_EXCEEDED status properly', () => {
    const tc: ProblemTestCase = {
      id: 1,
      input: '100000',
      expectedOutput: '1',
    };

    const res = evaluateTestCaseResult(tc, {
      status: 'TIME_LIMIT_EXCEEDED',
      executionTimeMs: 2000,
    });

    assert.strictEqual(res.status, 'TIME_LIMIT_EXCEEDED');
    assert.ok(res.errorMessage?.includes('Time limit exceeded'));
  });

  it('handles RUNTIME_ERROR status properly', () => {
    const tc: ProblemTestCase = {
      id: 1,
      input: '0',
      expectedOutput: '0',
    };

    const res = evaluateTestCaseResult(tc, {
      status: 'RUNTIME_ERROR',
      stderr: 'ZeroDivisionError: division by zero',
    });

    assert.strictEqual(res.status, 'RUNTIME_ERROR');
    assert.ok(res.errorMessage?.includes('ZeroDivisionError'));
  });
});
