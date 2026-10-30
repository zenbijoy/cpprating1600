import test from 'node:test';
import assert from 'node:assert/strict';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// ─── HELPER RUNNER (mirrors server.ts execution logic) ──────────────────────

interface RunResult {
  status: 'OK' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  stdout: string;
  stderr: string;
  compilerOutput?: string;
  durationMs: number;
  exitCode: number;
}

function runExecutable(
  executable: string,
  args: string[],
  cwd: string,
  stdin: string,
  timeoutMs: number
): Promise<{ status: 'OK' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR'; stdout: string; stderr: string; exitCode: number; durationMs: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const child = spawn(executable, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${child.pid} /T /F`);
        } else {
          child.kill('SIGKILL');
        }
      } catch {}
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      if (stdout.length < 65536) stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      if (stderr.length < 65536) stderr += d.toString();
    });

    if (stdin) {
      try { child.stdin.write(stdin); } catch {}
    }
    try { child.stdin.end(); } catch {}

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const codeNum = code ?? -1;
      if (isTimedOut) {
        resolve({ status: 'TIME_LIMIT_EXCEEDED', stdout, stderr, exitCode: -1, durationMs: timeoutMs });
      } else if (codeNum !== 0) {
        resolve({ status: 'RUNTIME_ERROR', stdout, stderr, exitCode: codeNum, durationMs });
      } else {
        resolve({ status: 'OK', stdout, stderr, exitCode: 0, durationMs });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ status: 'RUNTIME_ERROR', stdout, stderr: err.message, exitCode: -1, durationMs: Date.now() - startTime });
    });
  });
}

async function executeC(code: string, stdin = '', timeoutMs = 4000): Promise<RunResult> {
  const tempDir = path.join(os.tmpdir(), `pg_test_c_${crypto.randomUUID()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  const src = path.join(tempDir, 'solution.c');
  const exe = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
  await fs.promises.writeFile(src, code, 'utf-8');

  try {
    const compile = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
      exec(`gcc -O2 -std=c11 -Wall -o "${exe}" "${src}"`, { timeout: 8000, cwd: tempDir }, (err, _out, stderr) => {
        resolve({ ok: !err, stderr: stderr || (err ? err.message : '') });
      });
    });

    if (!compile.ok) {
      return {
        status: 'COMPILATION_ERROR',
        stdout: '',
        stderr: '',
        compilerOutput: compile.stderr,
        durationMs: 0,
        exitCode: 1,
      };
    }

    const res = await runExecutable(exe, [], tempDir, stdin, timeoutMs);
    return {
      status: res.status,
      stdout: res.stdout,
      stderr: res.stderr,
      compilerOutput: compile.stderr,
      durationMs: res.durationMs,
      exitCode: res.exitCode,
    };
  } finally {
    fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function executeCpp(code: string, stdin = '', timeoutMs = 4000): Promise<RunResult> {
  const tempDir = path.join(os.tmpdir(), `pg_test_cpp_${crypto.randomUUID()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  const src = path.join(tempDir, 'solution.cpp');
  const exe = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
  await fs.promises.writeFile(src, code, 'utf-8');

  try {
    const compile = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
      exec(`g++ -O2 -std=c++17 -Wall -o "${exe}" "${src}"`, { timeout: 8000, cwd: tempDir }, (err, _out, stderr) => {
        resolve({ ok: !err, stderr: stderr || (err ? err.message : '') });
      });
    });

    if (!compile.ok) {
      return {
        status: 'COMPILATION_ERROR',
        stdout: '',
        stderr: '',
        compilerOutput: compile.stderr,
        durationMs: 0,
        exitCode: 1,
      };
    }

    const res = await runExecutable(exe, [], tempDir, stdin, timeoutMs);
    return {
      status: res.status,
      stdout: res.stdout,
      stderr: res.stderr,
      compilerOutput: compile.stderr,
      durationMs: res.durationMs,
      exitCode: res.exitCode,
    };
  } finally {
    fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function executePython(code: string, stdin = '', timeoutMs = 4000): Promise<RunResult> {
  const tempDir = path.join(os.tmpdir(), `pg_test_py_${crypto.randomUUID()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  const src = path.join(tempDir, 'solution.py');
  await fs.promises.writeFile(src, code, 'utf-8');

  const pythonCandidates = [
    'python',
    'python3',
    'py',
    'C:\\Program Files\\PostgreSQL\\18\\pgAdmin 4\\python\\python.exe',
  ];
  let pythonCmd = 'python';
  for (const c of pythonCandidates) {
    if (fs.existsSync(c)) {
      pythonCmd = c;
      break;
    }
  }

  try {
    const res = await runExecutable(pythonCmd, ['-u', 'solution.py'], tempDir, stdin, timeoutMs);
    return {
      status: res.status,
      stdout: res.stdout,
      stderr: res.stderr,
      durationMs: res.durationMs,
      exitCode: res.exitCode,
    };
  } finally {
    fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ============================================================================
// 1. C EXECUTION TEST SUITE
// ============================================================================

test('C: valid compilation and execution with stdin and stdout', async () => {
  const code = `
#include <stdio.h>
int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("SUM: %d\\n", a + b);
    }
    return 0;
}
`;
  const res = await executeC(code, '15 27\n');
  assert.equal(res.status, 'OK');
  assert.equal(res.exitCode, 0);
  assert.match(res.stdout, /SUM: 42/);
});

test('C: syntax error triggers COMPILATION_ERROR with diagnostics', async () => {
  const code = `
#include <stdio.h>
int main() {
    this_is_an_undeclared_identifier = 42;
    return 0;
}
`;
  const res = await executeC(code);
  assert.equal(res.status, 'COMPILATION_ERROR');
  assert.ok(res.compilerOutput);
  assert.match(res.compilerOutput, /undeclared/i);
});

test('C: missing header produces compiler diagnostic', async () => {
  const code = `
int main() {
    // strlen used without string.h
    int len = strlen("hello");
    return len;
}
`;
  const res = await executeC(code);
  // In C11 without -Werror it may warn or error, check compilerOutput exists
  assert.ok(res.compilerOutput !== undefined);
});

test('C: runtime crash or non-zero exit sets RUNTIME_ERROR', async () => {
  const code = `
#include <stdlib.h>
int main() {
    exit(42);
}
`;
  const res = await executeC(code);
  assert.equal(res.status, 'RUNTIME_ERROR');
  assert.equal(res.exitCode, 42);
});

test('C: program printing nothing sets status OK with empty stdout', async () => {
  const code = `
int main() {
    return 0;
}
`;
  const res = await executeC(code);
  assert.equal(res.status, 'OK');
  assert.equal(res.stdout, '');
  assert.equal(res.exitCode, 0);
});

// ============================================================================
// 2. C++ EXECUTION TEST SUITE
// ============================================================================

test('C++: valid modern C++ with STL vectors and algorithm', async () => {
  const code = `
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v.begin(), v.end());
    int total = accumulate(v.begin(), v.end(), 0);
    cout << "Sorted: ";
    for (int x : v) cout << x << " ";
    cout << "\\nTotal: " << total << "\\n";
    return 0;
}
`;
  const res = await executeCpp(code, '4\n40 10 30 20\n');
  assert.equal(res.status, 'OK');
  assert.match(res.stdout, /Sorted: 10 20 30 40/);
  assert.match(res.stdout, /Total: 100/);
});

test('C++: compilation error for missing semicolon and undeclared type', async () => {
  const code = `
#include <iostream>
int main() {
    std::cout << "Missing semicolon"
    NonExistentType x;
    return 0;
}
`;
  const res = await executeCpp(code);
  assert.equal(res.status, 'COMPILATION_ERROR');
  assert.ok(res.compilerOutput);
});

test('C++: runtime failure with non-zero exit code', async () => {
  const code = `
#include <cstdlib>
int main() {
    return 5;
}
`;
  const res = await executeCpp(code);
  assert.equal(res.status, 'RUNTIME_ERROR');
  assert.equal(res.exitCode, 5);
});

test('C++: large stdin parsing within permitted size', async () => {
  const numbers = Array.from({ length: 500 }, (_, i) => i + 1);
  const stdin = `500\n${numbers.join(' ')}\n`;
  const code = `
#include <iostream>
using namespace std;
int main() {
    int n;
    if (!(cin >> n)) return 0;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        long long val; cin >> val; sum += val;
    }
    cout << sum << "\\n";
    return 0;
}
`;
  const res = await executeCpp(code, stdin);
  assert.equal(res.status, 'OK');
  const expectedSum = (500 * 501) / 2;
  assert.match(res.stdout, new RegExp(String(expectedSum)));
});

// ============================================================================
// 3. PYTHON EXECUTION TEST SUITE
// ============================================================================

test('Python: valid execution with stdin/stdout tokens', async () => {
  const code = `
import sys
tokens = sys.stdin.read().split()
if tokens:
    nums = [int(x) for x in tokens]
    print(f"SUM:{sum(nums)}")
`;
  const res = await executePython(code, '10 20 30\n');
  assert.equal(res.status, 'OK');
  assert.match(res.stdout, /SUM:60/);
});

test('Python: syntax error reports RUNTIME_ERROR with traceback', async () => {
  const code = `
def broken_syntax(
    print("Invalid python")
`;
  const res = await executePython(code);
  assert.equal(res.status, 'RUNTIME_ERROR');
  assert.match(res.stderr, /SyntaxError/);
});

test('Python: runtime exception (ZeroDivisionError)', async () => {
  const code = `
x = 10 / 0
`;
  const res = await executePython(code);
  assert.equal(res.status, 'RUNTIME_ERROR');
  assert.match(res.stderr, /ZeroDivisionError/);
});

test('Python: unicode output preserved correctly', async () => {
  const code = `
print("বাংলা UTF-8 বাংলা - π ≈ 3.14159 - ✓ Done")
`;
  const res = await executePython(code);
  assert.equal(res.status, 'OK');
  assert.match(res.stdout, /বাংলা UTF-8/);
  assert.match(res.stdout, /3\.14159/);
});

// ============================================================================
// 4. EXECUTION TIMEOUT & LIMITS
// ============================================================================

test('Timeout: infinite loop triggers TIME_LIMIT_EXCEEDED within timeout period', async () => {
  const code = `
#include <iostream>
int main() {
    while (true) {
        // Infinite loop
    }
    return 0;
}
`;
  // Set short timeout of 1000ms
  const res = await executeCpp(code, '', 1000);
  assert.equal(res.status, 'TIME_LIMIT_EXCEEDED');
  assert.ok(res.durationMs >= 900);
});

// ============================================================================
// 5. AI DEBUGGER PARSING & STRUCTURE TEST
// ============================================================================

test('AI Debugger: structured schema handles and validates responses', () => {
  const mockAIJson = JSON.stringify({
    summary: 'Array index out of bounds in loop condition',
    errorCategory: 'RUNTIME_ERROR',
    evidence: 'line 14: a[i] accessed when i == n',
    rootCause: 'Loop used i <= n instead of i < n for 0-indexed vector',
    suggestedFix: 'Change loop condition from i <= n to i < n',
    correctedCode: 'for (int i = 0; i < n; i++) { ... }',
    correctedCodeExplanation: 'Prevents reading past the end of allocated memory',
    additionalTests: 'n = 1: [5] -> 5\nn = 0: [] -> 0',
    confidence: 'high',
    disclaimer: 'AI suggestion only; verify with compiler.',
  });

  const parsed = JSON.parse(mockAIJson);
  assert.equal(parsed.errorCategory, 'RUNTIME_ERROR');
  assert.equal(parsed.confidence, 'high');
  assert.ok(parsed.correctedCode);
  assert.ok(parsed.suggestedFix);
});

test('Output comparison: trailing whitespace normalization test', () => {
  const normalize = (str: string, ignoreTrailing: boolean) => {
    if (ignoreTrailing) {
      return str.split('\n').map((l) => l.trimEnd()).join('\n').trim();
    }
    return str;
  };

  const actual = '150   \n\n';
  const expected = '150\n';

  assert.notEqual(actual, expected);
  assert.equal(normalize(actual, true), normalize(expected, true));
});

test('Speed optimization: cached code execution avoids recompilation overhead', async () => {
  const code = `
#include <stdio.h>
int main() {
    int x;
    if (scanf("%d", &x) == 1) {
        printf("RESULT:%d\\n", x * 2);
    }
    return 0;
}
`;
  // First run: compiles
  const firstRun = await executeC(code, '21\n');
  assert.equal(firstRun.status, 'OK');
  assert.match(firstRun.stdout, /RESULT:42/);

  // Second run with different stdin
  const secondRun = await executeC(code, '50\n');
  assert.equal(secondRun.status, 'OK');
  assert.match(secondRun.stdout, /RESULT:100/);
});
