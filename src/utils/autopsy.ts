import { CFProblem, CFSubmission, MistakeCategory, MistakeRecord } from '../types';

export type AutopsyVerdict =
  | 'OK'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'IDLENESS_LIMIT_EXCEEDED'
  | 'OTHER';

export type ConfidenceLevel = 'CONFIRMED' | 'LIKELY' | 'POSSIBLE' | 'UNDETERMINED';

export interface AutopsyFinding {
  id: string;
  category: 'integer_overflow' | 'time_complexity' | 'io_bottleneck' | 'indexing_boundary' | 'memory_allocation' | 'runtime_crash' | 'compiler_diagnostic' | 'corner_case' | 'cleanliness';
  confidence: ConfidenceLevel;
  title: string;
  explanation: string;
  codeSnippet?: string;
  lineNumber?: number;
  suggestedFix: string;
}

export interface AutopsyReport {
  submissionId?: number;
  problem: CFProblem;
  handle?: string;
  verdict: string;
  verdictType: AutopsyVerdict;
  verdictDisplay: {
    label: string;
    short: string;
    color: string;
    bg: string;
  };
  executionTimeMs?: number | null;
  memoryBytes?: number | null;
  language: string;
  submittedAt?: string;
  officialUrl: string;
  codeProvided: boolean;
  findings: AutopsyFinding[];
  counterexampleSuggestion?: {
    input: string;
    expectedBehavior: string;
    rationale: string;
    isAiSuggestion: boolean;
  };
  suggestedMistakeCategory: MistakeCategory;
  primaryLesson: string;
  actionItems: string[];
}

/**
 * Normalizes raw Codeforces verdict strings into typed categories.
 */
export function normalizeVerdict(rawVerdict?: string): AutopsyVerdict {
  if (!rawVerdict) return 'OTHER';
  const upper = rawVerdict.toUpperCase();
  if (upper === 'OK' || upper.includes('ACCEPT')) return 'OK';
  if (upper.includes('WRONG') || upper === 'WA') return 'WRONG_ANSWER';
  if (upper.includes('RUNTIME') || upper === 'RE' || upper.includes('CRASH')) return 'RUNTIME_ERROR';
  if (upper.includes('TIME_LIMIT') || upper.includes('TIME LIMIT') || upper === 'TLE') return 'TIME_LIMIT_EXCEEDED';
  if (upper.includes('MEMORY') || upper === 'MLE') return 'MEMORY_LIMIT_EXCEEDED';
  if (upper.includes('COMPILATION') || upper === 'CE') return 'COMPILATION_ERROR';
  if (upper.includes('IDLENESS')) return 'IDLENESS_LIMIT_EXCEEDED';
  return 'OTHER';
}

/**
 * Parses compiler diagnostic messages into line numbers, errors, and fixes.
 */
export function parseCompilerDiagnostics(compilerOutput: string): AutopsyFinding[] {
  const findings: AutopsyFinding[] = [];
  if (!compilerOutput) return findings;

  // Regex matches: filename.cpp:line:col: error: message
  const errorRegex = /(?:[a-zA-Z0-9_\-\.\/\\]+):(\d+):(\d+):\s+(?:fatal\s+)?error:\s+(.+)/gi;
  let match;
  let count = 0;

  while ((match = errorRegex.exec(compilerOutput)) !== null && count < 5) {
    const lineNum = parseInt(match[1], 10);
    const message = match[3].trim();
    let suggestedFix = 'Check syntax, type declarations, and semicolons near this line.';

    if (message.includes('was not declared in this scope')) {
      const varNameMatch = message.match(/'([^']+)'/);
      const varName = varNameMatch ? varNameMatch[1] : 'symbol';
      if (['vector', 'set', 'map', 'queue', 'stack', 'string', 'cin', 'cout', 'endl'].includes(varName)) {
        suggestedFix = `Missing header. Include <${varName === 'cin' || varName === 'cout' || varName === 'endl' ? 'iostream' : varName}> and using namespace std;`;
      } else if (['sort', 'reverse', 'max', 'min', 'lower_bound', 'upper_bound'].includes(varName)) {
        suggestedFix = 'Missing header. Include <algorithm>.';
      } else if (['gcd', 'lcm', 'accumulate'].includes(varName)) {
        suggestedFix = 'Missing header. Include <numeric>.';
      } else {
        suggestedFix = `Ensure '${varName}' is declared before use and spelled correctly.`;
      }
    } else if (message.includes('no matching function for call to') || message.includes('cannot convert')) {
      suggestedFix = 'Type mismatch in function arguments. Verify parameter types.';
    }

    findings.push({
      id: `ce_${lineNum}_${count++}`,
      category: 'compiler_diagnostic',
      confidence: 'CONFIRMED',
      title: `Compilation Error at Line ${lineNum}`,
      explanation: message,
      lineNumber: lineNum,
      suggestedFix,
    });
  }

  return findings;
}

/**
 * Checks for integer overflow patterns in C++ source code.
 */
export function checkIntegerOverflow(code: string): AutopsyFinding | null {
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern 1: int sum = 0, or int total = 0
    if (/int\s+(?:sum|ans|total|prod|res)\s*=\s*0\b/i.test(line)) {
      return {
        id: `overflow_sum_${i + 1}`,
        category: 'integer_overflow',
        confidence: 'LIKELY',
        title: `Potential 32-bit Integer Overflow on Accumulator`,
        explanation: `Line ${i + 1} declares an accumulator as 32-bit 'int'. If array elements or prefix sums can exceed 2 × 10^9, values will wrap into negative integers.`,
        codeSnippet: line.trim(),
        lineNumber: i + 1,
        suggestedFix: `Replace 'int' with 'long long' (64-bit integer, up to 9 × 10^18).`,
      };
    }

    // Pattern 2: 1 << k bitshift without 1LL
    if (/1\s*<<\s*([a-zA-Z0-9_]+)/.test(line)) {
      const match = line.match(/1\s*<<\s*([a-zA-Z0-9_]+)/);
      return {
        id: `overflow_shift_${i + 1}`,
        category: 'integer_overflow',
        confidence: 'LIKELY',
        title: `32-bit Bitwise Shift Overflow (1 << k)`,
        explanation: `Line ${i + 1} uses '1 << k'. In C++, integer literal '1' is a 32-bit signed int. Shifting by 31 or more positions causes undefined behavior and negative numbers.`,
        codeSnippet: line.trim(),
        lineNumber: i + 1,
        suggestedFix: `Use '1LL << ${match ? match[1] : 'k'}' to ensure 64-bit precision.`,
      };
    }

    // Pattern 3: Multiplying two 32-bit ints stored in 64-bit int: long long x = a * b
    if (/long\s+long\s+[a-zA-Z0-9_]+\s*=\s*[a-zA-Z0-9_]+\s*\*\s*[a-zA-Z0-9_]+/i.test(line)) {
      return {
        id: `overflow_mult_${i + 1}`,
        category: 'integer_overflow',
        confidence: 'POSSIBLE',
        title: `Multiplication Overflow Before 64-bit Assignment`,
        explanation: `Line ${i + 1} multiplies two operands before storing in long long. If both operands are 32-bit ints, C++ evaluates the multiplication in 32-bit precision before conversion!`,
        codeSnippet: line.trim(),
        lineNumber: i + 1,
        suggestedFix: `Cast the first operand: '1LL * a * b' or declare operands as long long.`,
      };
    }
  }

  return null;
}

/**
 * Checks for I/O bottlenecks in C++ code.
 */
export function checkIoBottleneck(code: string): AutopsyFinding | null {
  const hasSyncWithStdio = /ios_base::sync_with_stdio\s*\(\s*false\s*\)/i.test(code) || /ios::sync_with_stdio\s*\(\s*false\s*\)/i.test(code);
  const hasCinTie = /cin\.tie\s*\(\s*(?:NULL|nullptr|0)\s*\)/i.test(code);
  const hasEndlInLoops = /for\s*\([^\)]+\)\s*\{[^}]*cout\s*<<[^;]*endl/i.test(code) || /while\s*\([^\)]+\)\s*\{[^}]*cout\s*<<[^;]*endl/i.test(code);

  if (!hasSyncWithStdio || !hasCinTie) {
    return {
      id: 'io_sync_missing',
      category: 'io_bottleneck',
      confidence: 'LIKELY',
      title: 'Missing Fast C++ I/O Optimizations',
      explanation: 'Default C++ cin and cout synchronize with C stdio streams and flush automatically on input. On large inputs (N ≥ 10^5), this can take 0.5s–1.2s alone, triggering TLE.',
      suggestedFix: `Add 'ios_base::sync_with_stdio(false); cin.tie(NULL);' at the top of main().`,
    };
  }

  if (hasEndlInLoops) {
    return {
      id: 'io_endl_flush',
      category: 'io_bottleneck',
      confidence: 'LIKELY',
      title: "Repeated Buffer Flushing with 'std::endl'",
      explanation: "'std::endl' inserts a newline and immediately forces an expensive flush of the OS output buffer. Inside loops, this can slow execution by 10x-50x.",
      suggestedFix: "Replace '<< endl' with '<< \"\\n\"' or '<< \'\\n\''.",
    };
  }

  return null;
}

/**
 * Checks for nested loops that could exceed time limits on N >= 10^5.
 */
export function checkAsymptoticComplexity(code: string): AutopsyFinding | null {
  const lines = code.split('\n');
  let loopDepth = 0;
  let maxDepth = 0;
  let nestedLoopLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\b(for|while)\s*\(/.test(line)) {
      loopDepth++;
      if (loopDepth >= 2 && maxDepth < loopDepth) {
        maxDepth = loopDepth;
        nestedLoopLine = i + 1;
      }
    }
    if (line.includes('}')) {
      loopDepth = Math.max(0, loopDepth - 1);
    }
  }

  if (maxDepth >= 2 && nestedLoopLine > 0) {
    return {
      id: 'complexity_n2',
      category: 'time_complexity',
      confidence: 'POSSIBLE',
      title: `Nested Loops Detected (O(N²) or Higher)`,
      explanation: `Line ${nestedLoopLine} contains nested iterations. If problem constraints have N = 10^5, N² operations is 10^10 ops, which takes ~100 seconds and causes Time Limit Exceeded (standard limit: 1.0s = ~10^8 ops).`,
      lineNumber: nestedLoopLine,
      suggestedFix: `Reduce complexity to O(N) or O(N log N) using Two Pointers, Prefix Sums, Sorting, or Binary Search.`,
    };
  }

  return null;
}

/**
 * Checks for array boundary, off-by-one, or 0/1 indexing issues.
 */
export function checkArrayBoundsAndIndexing(code: string): AutopsyFinding | null {
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern: int a[n] followed by loop up to <= n
    if (/for\s*\(\s*int\s+[a-zA-Z0-9_]+\s*=\s*0\s*;\s*[a-zA-Z0-9_]+\s*<=\s*([a-zA-Z0-9_]+)/.test(line)) {
      return {
        id: `indexing_off_by_one_${i + 1}`,
        category: 'indexing_boundary',
        confidence: 'POSSIBLE',
        title: 'Off-by-One Loop Boundary (<= N with 0-based indexing)',
        explanation: `Line ${i + 1} initializes at index 0 but iterates while 'i <= N'. For a 0-indexed array of size N, valid indices are 0 to N-1. Accessing index N reads out-of-bounds memory.`,
        codeSnippet: line.trim(),
        lineNumber: i + 1,
        suggestedFix: `Change condition to 'i < N' for 0-based indexing, or size array to 'N + 1' if 1-based.`,
      };
    }
  }

  return null;
}

/**
 * Checks for potential division or modulo by zero.
 */
export function checkDivisionByZero(code: string): AutopsyFinding | null {
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for % or / by a variable without obvious zero guard
    const match = line.match(/([a-zA-Z0-9_]+)\s*[%/]\s*([a-zA-Z0-9_]+)/);
    if (match && !/^\d+$/.test(match[2]) && match[2] !== '2' && match[2] !== '10' && match[2] !== 'MOD') {
      return {
        id: `div_zero_${i + 1}`,
        category: 'runtime_crash',
        confidence: 'POSSIBLE',
        title: `Possible Division/Modulo by Zero: ${match[0]}`,
        explanation: `Line ${i + 1} performs division or modulo by variable '${match[2]}'. If this variable can be 0 under edge cases (e.g. empty difference or N=1), the process triggers SIGFPE (Runtime Error).`,
        codeSnippet: line.trim(),
        lineNumber: i + 1,
        suggestedFix: `Verify that '${match[2]} != 0' before performing modulo/division.`,
      };
    }
  }

  return null;
}

/**
 * Generates deterministic boundary counterexample suggestions based on problem metadata.
 */
export function generateCounterexampleSuggestion(
  problem: CFProblem,
  verdict: AutopsyVerdict
): { input: string; expectedBehavior: string; rationale: string; isAiSuggestion: boolean } {
  if (verdict === 'WRONG_ANSWER') {
    return {
      input: '1\n1\n',
      expectedBehavior: 'Verify behavior when array length N = 1 or input is minimal boundary.',
      rationale: 'Single-element inputs often bypass standard 2-pointer loops or crash when accessing a[1]. Trace by hand.',
      isAiSuggestion: false,
    };
  }

  if (verdict === 'TIME_LIMIT_EXCEEDED') {
    return {
      input: '100000\n[100,000 identical elements or strictly decreasing values]',
      expectedBehavior: 'Execution must terminate in under 1.0 second (~10^8 operations).',
      rationale: 'Worst-case input testing quadratic degradation (e.g. quicksort with bad pivot, or unbuffered I/O on 10^5 lines).',
      isAiSuggestion: false,
    };
  }

  if (verdict === 'MEMORY_LIMIT_EXCEEDED') {
    return {
      input: 'Max constraint input N=10^5, M=10^5',
      expectedBehavior: 'RAM usage must remain within 256 MB (approx. 6.4 × 10^7 ints).',
      rationale: 'Checks if large 2D table or recursive call stack exceeds allocated memory limit.',
      isAiSuggestion: false,
    };
  }

  return {
    input: '1\n0\n',
    expectedBehavior: 'Handles zero/empty or extreme boundaries cleanly.',
    rationale: 'Boundary edge case.',
    isAiSuggestion: false,
  };
}

/**
 * Runs a comprehensive post-submission autopsy on a Codeforces submission.
 */
export function runSubmissionAutopsy(
  submission: Partial<CFSubmission>,
  code: string,
  compilerStderr?: string,
  handle?: string
): AutopsyReport {
  const problem: CFProblem = submission.problem || {
    contestId: submission.contestId || 0,
    index: 'A',
    name: 'Problem',
    tags: [],
  };

  const rawVerdict = submission.verdict || 'UNSUBMITTED';
  const verdictType = normalizeVerdict(rawVerdict);

  const verdictStyles: Record<AutopsyVerdict, { label: string; short: string; color: string; bg: string }> = {
    OK: { label: 'Accepted', short: 'AC', color: 'text-emerald-300', bg: 'bg-emerald-950/60 border-emerald-800/60' },
    WRONG_ANSWER: { label: 'Wrong Answer', short: 'WA', color: 'text-red-300', bg: 'bg-red-950/60 border-red-800/60' },
    TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded', short: 'TLE', color: 'text-amber-300', bg: 'bg-amber-950/60 border-amber-800/60' },
    MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit Exceeded', short: 'MLE', color: 'text-orange-300', bg: 'bg-orange-950/60 border-orange-800/60' },
    RUNTIME_ERROR: { label: 'Runtime Error', short: 'RE', color: 'text-rose-300', bg: 'bg-rose-950/60 border-rose-800/60' },
    COMPILATION_ERROR: { label: 'Compilation Error', short: 'CE', color: 'text-pink-300', bg: 'bg-pink-950/60 border-pink-800/60' },
    IDLENESS_LIMIT_EXCEEDED: { label: 'Idleness Limit Exceeded', short: 'ILE', color: 'text-cyan-300', bg: 'bg-cyan-950/60 border-cyan-800/60' },
    OTHER: { label: rawVerdict, short: '?', color: 'text-slate-300', bg: 'bg-slate-900 border-slate-700/60' },
  };

  const verdictDisplay = verdictStyles[verdictType];
  const officialUrl = problem.contestId
    ? `https://codeforces.com/contest/${problem.contestId}/submission/${submission.id || ''}`
    : 'https://codeforces.com';

  const findings: AutopsyFinding[] = [];

  // 1. Compiler diagnostics if CE or stderr present
  if (verdictType === 'COMPILATION_ERROR' || compilerStderr) {
    const ceFindings = parseCompilerDiagnostics(compilerStderr || '');
    findings.push(...ceFindings);
  }

  // 2. Verdict-specific code analysis
  if (code && code.trim().length > 0) {
    if (verdictType === 'WRONG_ANSWER') {
      const overflow = checkIntegerOverflow(code);
      if (overflow) findings.push(overflow);

      const bounds = checkArrayBoundsAndIndexing(code);
      if (bounds) findings.push(bounds);

      // Add general logical inspection finding
      findings.push({
        id: 'wa_corner_case',
        category: 'corner_case',
        confidence: 'LIKELY',
        title: 'Boundary & Extremal Invariant Verification',
        explanation: 'The judge input produced an answer differing from official answer. Common causes include minimum/maximum constraints (N=1, N=2), all identical values, negative coordinates, or floating-point precision differences.',
        suggestedFix: 'Trace with the minimal counterexample and verify the problem invariant holds on odd vs even parity.',
      });
    } else if (verdictType === 'TIME_LIMIT_EXCEEDED') {
      const io = checkIoBottleneck(code);
      if (io) findings.push(io);

      const complexity = checkAsymptoticComplexity(code);
      if (complexity) findings.push(complexity);

      if (!complexity && !io) {
        findings.push({
          id: 'tle_loop_stagnation',
          category: 'time_complexity',
          confidence: 'LIKELY',
          title: 'Infinite Loop or Slow Constant Factor',
          explanation: 'The program exceeded the execution time limit. Check for while-loops where loop pointer does not advance (e.g. while(l < r) without moving l or r).',
          suggestedFix: 'Ensure every branch inside while-loops strictly modifies loop state.',
        });
      }
    } else if (verdictType === 'RUNTIME_ERROR') {
      const divZero = checkDivisionByZero(code);
      if (divZero) findings.push(divZero);

      const bounds = checkArrayBoundsAndIndexing(code);
      if (bounds) findings.push(bounds);

      findings.push({
        id: 're_memory_crash',
        category: 'runtime_crash',
        confidence: 'LIKELY',
        title: 'Out-of-Bounds Memory or Stack Overflow',
        explanation: 'Program crashed during execution (SIGSEGV / SIGFPE / SIGABRT). Common reasons: accessing vector out-of-bounds, pop on empty stack, or unbounded recursion depth > 10^5.',
        suggestedFix: 'Size arrays generously (e.g. N + 10 instead of N) and check recursion termination conditions.',
      });
    } else if (verdictType === 'MEMORY_LIMIT_EXCEEDED') {
      findings.push({
        id: 'mle_allocation',
        category: 'memory_allocation',
        confidence: 'CONFIRMED',
        title: 'Excessive Dynamic or Static Allocation',
        explanation: 'Allocated memory exceeded the 256MB limit. An array of 10,000 × 10,000 32-bit ints consumes ~400MB.',
        suggestedFix: 'Reduce 2D DP dimensions to rolling 1D arrays, or use sparse data structures (std::map / coordinate compression).',
      });
    } else if (verdictType === 'OK') {
      const io = checkIoBottleneck(code);
      if (io) findings.push(io);
      findings.push({
        id: 'ok_cleanliness',
        category: 'cleanliness',
        confidence: 'CONFIRMED',
        title: 'Accepted! Verified Solution Correctness',
        explanation: `All judge test cases passed! Execution time: ${submission.timeConsumedMillis ?? 'N/A'}ms, Memory: ${submission.memoryConsumedBytes ? Math.round(submission.memoryConsumedBytes / 1024) + 'KB' : 'N/A'}.`,
        suggestedFix: 'Review alternative community submissions to compare code brevity, idiom elegance, and asymptotic speed.',
      });
    }
  }

  // Determine suggested mistake category
  let suggestedMistakeCategory: MistakeCategory = 'implementation_bug';
  let primaryLesson = 'Carefully dry-run edge cases before submitting to prevent penalty points.';

  if (verdictType === 'WRONG_ANSWER') {
    if (findings.some((f) => f.category === 'integer_overflow')) {
      suggestedMistakeCategory = 'integer_overflow';
      primaryLesson = 'Always calculate maximum possible sum or product; switch to long long when bounds exceed 2×10^9.';
    } else if (findings.some((f) => f.category === 'indexing_boundary')) {
      suggestedMistakeCategory = 'indexing_error';
      primaryLesson = 'Check 0-based vs 1-based indexing consistently across all loops and prefix queries.';
    } else {
      suggestedMistakeCategory = 'boundary_case';
      primaryLesson = 'Always test minimal constraints (N=1, empty, all equal) by hand with pencil and paper.';
    }
  } else if (verdictType === 'TIME_LIMIT_EXCEEDED') {
    suggestedMistakeCategory = 'wrong_complexity';
    primaryLesson = 'Check problem constraints before coding; N=10^5 requires O(N) or O(N log N) with fast I/O.';
  } else if (verdictType === 'RUNTIME_ERROR') {
    suggestedMistakeCategory = 'implementation_bug';
    primaryLesson = 'Guard against division by zero, empty stack pop, and size arrays at least N+10.';
  } else if (verdictType === 'COMPILATION_ERROR') {
    suggestedMistakeCategory = 'implementation_bug';
    primaryLesson = 'Compile with -Wall -Wextra locally and ensure all required standard headers are included.';
  }

  const counterexampleSuggestion = generateCounterexampleSuggestion(problem, verdictType);

  const actionItems: string[] = [
    `Understand why the code produced ${verdictDisplay.label} using the autopsy findings.`,
    verdictType === 'OK'
      ? 'Document this elegant implementation in your notes for future reference.'
      : 'Log this mistake into the Mistake Notebook to schedule spaced revision reviews.',
    'Test with the recommended counterexample input before resubmitting.',
  ];

  return {
    submissionId: submission.id,
    problem,
    handle,
    verdict: rawVerdict,
    verdictType,
    verdictDisplay,
    executionTimeMs: submission.timeConsumedMillis,
    memoryBytes: submission.memoryConsumedBytes,
    language: submission.programmingLanguage || 'C++20',
    submittedAt: submission.creationTimeSeconds
      ? new Date(submission.creationTimeSeconds * 1000).toISOString()
      : undefined,
    officialUrl,
    codeProvided: Boolean(code && code.trim().length > 0),
    findings,
    counterexampleSuggestion,
    suggestedMistakeCategory,
    primaryLesson,
    actionItems,
  };
}

/**
 * Automatically creates a spaced-repetition MistakeRecord from an AutopsyReport.
 * Schedules the initial revision for tomorrow (+1 day).
 */
export function createMistakeFromAutopsy(
  report: AutopsyReport,
  userCode?: string,
  userNotes?: string
): Omit<MistakeRecord, 'id'> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextReviewDate = tomorrow.toISOString().slice(0, 10);

  const primaryFinding = report.findings[0];
  const whyItFailed = primaryFinding
    ? `${primaryFinding.title}: ${primaryFinding.explanation}`
    : `Submission failed with official verdict ${report.verdictDisplay.label}.`;

  const correctObservation =
    report.counterexampleSuggestion?.rationale ||
    'Identify invariant and verify boundary constraints.';

  const correctApproach = primaryFinding?.suggestedFix || 'Apply required algorithmic approach and fast I/O.';

  return {
    problemId: `${report.problem.contestId || ''}${report.problem.index}`,
    problemName: report.problem.name,
    problemUrl: report.officialUrl,
    rating: report.problem.rating,
    tags: report.problem.tags,
    category: report.suggestedMistakeCategory,
    originalApproach: userNotes || 'Initial submission attempt.',
    whyItFailed,
    correctObservation,
    correctApproach,
    personalLesson: report.primaryLesson,
    codeSnippet: userCode ? userCode.slice(0, 1500) : undefined,
    createdAt: new Date().toISOString(),
    nextReviewDate,
    intervalDays: 1,
    reviewCount: 0,
    status: 'scheduled',
  };
}
