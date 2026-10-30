import { ExecutionResult, ProblemTestCase, ProblemTestCaseResult, ProgrammingLanguage } from '../types';
import { evaluateTestCaseResult } from '../utils/testcaseRunner';

export const executionService = {
  async executeCode(params: {
    code: string;
    language: ProgrammingLanguage;
    stdin?: string;
    timeoutMs?: number;
  }): Promise<ExecutionResult> {
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return {
        status: 'BACKEND_UNAVAILABLE',
        message: err.message || 'Network error reaching code execution endpoint.',
      };
    }
  },

  async executeTestCases(params: {
    code: string;
    language: ProgrammingLanguage;
    testCases: ProblemTestCase[];
    timeoutMs?: number;
  }): Promise<{
    results: ProblemTestCaseResult[];
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
  }> {
    try {
      const res = await fetch('/api/execute-testcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback if batch endpoint unavailable: execute sequentially via single execution
    const results: ProblemTestCaseResult[] = [];
    for (const tc of params.testCases) {
      const exec = await this.executeCode({
        code: params.code,
        language: params.language,
        stdin: tc.input,
        timeoutMs: params.timeoutMs || 2500,
      });
      results.push(evaluateTestCaseResult(tc, exec));
    }

    const passedCount = results.filter((r) => r.status === 'PASS').length;
    return {
      results,
      allPassed: passedCount === results.length && results.length > 0,
      passedCount,
      totalCount: results.length,
    };
  },

  async getCounterexample(params: {
    problemName: string;
    problemStatement?: string;
    userApproach?: string;
    userCode?: string;
  }): Promise<{
    success: boolean;
    isAISuggestion: boolean;
    disclaimer: string;
    counterexampleInput: string;
    expectedOutput: string;
    explanation: string;
  }> {
    try {
      const res = await fetch('/api/ai/counterexample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        isAISuggestion: true,
        disclaimer: 'AI suggestion error.',
        counterexampleInput: '1\n',
        expectedOutput: '0\n',
        explanation: 'Check minimal single element boundary condition.',
      };
    }
  },
};
