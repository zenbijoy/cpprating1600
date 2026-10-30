import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec } from 'child_process';
import { ValidationStatus, SolutionManifestItem } from './types';

export interface ValidationResult {
  status: ValidationStatus;
  notes?: string;
}

export class SolutionValidator {
  private hasGppCompiler: boolean = false;

  constructor() {
    try {
      // Test if g++ is accessible
      exec('g++ --version', (_error, stdout) => {
        if (stdout && stdout.includes('Free Software Foundation')) {
          this.hasGppCompiler = true;
        }
      });
    } catch {
      this.hasGppCompiler = false;
    }
  }

  public validateStatic(code: string): ValidationResult {
    // 1. Minimum and maximum size check
    if (code.length < 20) {
      return { status: 'rejected', notes: 'Source code under minimum 20 bytes threshold.' };
    }
    if (code.length > 256 * 1024) {
      return { status: 'rejected', notes: 'Source code exceeds maximum 256KB threshold.' };
    }

    // 2. Check for empty or comment-only files
    const stripped = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim();
    if (stripped.length < 15) {
      return { status: 'rejected', notes: 'File contains only comments or whitespace.' };
    }

    // 3. Check for placeholder markers
    if (/^\s*\/\/\s*TODO\s*$/i.test(stripped) || /^\s*return 0;\s*$/i.test(stripped)) {
      return { status: 'needs_review', notes: 'Suspicious placeholder or incomplete code.' };
    }

    // 4. Balanced brackets/braces check
    let braceCount = 0;
    let parenCount = 0;
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
      else if (ch === '(') parenCount++;
      else if (ch === ')') parenCount--;
    }

    if (braceCount !== 0 || parenCount !== 0) {
      return {
        status: 'needs_review',
        notes: `Unbalanced syntax tokens: braces diff ${braceCount}, parens diff ${parenCount}`,
      };
    }

    // 5. C++ main or header check
    const hasHeader = /#include\s*[<"][a-zA-Z0-9_\.\/]+[>"]/.test(code);
    const hasMain = /(?:int|void|signed)\s+main\s*\(/.test(code);

    if (!hasHeader && !hasMain) {
      return { status: 'rejected', notes: 'Does not contain standard C++ header includes or main entrypoint.' };
    }

    return { status: 'source_checked', notes: 'Passed static syntax and structure checks.' };
  }

  public async validateCompilation(code: string, standard = 'c++17'): Promise<ValidationResult> {
    const staticCheck = this.validateStatic(code);
    if (staticCheck.status === 'rejected' || staticCheck.status === 'needs_review') {
      return staticCheck;
    }

    // Isolated syntax-only compiler verification
    const runId = crypto.randomUUID();
    const tempDir = path.join(os.tmpdir(), `cf_val_${runId}`);

    try {
      await fs.promises.mkdir(tempDir, { recursive: true });
      const srcFile = path.join(tempDir, 'test.cpp');
      await fs.promises.writeFile(srcFile, code, 'utf-8');

      // Use -fsyntax-only: fast, doesn't generate executable binaries, completely safe
      const stdFlag = standard === 'c++20' ? '-std=c++20' : '-std=c++17';
      const cmd = `g++ -O2 ${stdFlag} -fsyntax-only -Wall "${srcFile}"`;

      const result = await new Promise<ValidationResult>((resolve) => {
        exec(cmd, { timeout: 4000, cwd: tempDir }, (error, _stdout, stderr) => {
          if (error) {
            resolve({
              status: 'compilation_failed',
              notes: (stderr || error.message).slice(0, 300),
            });
          } else {
            resolve({
              status: 'compiled',
              notes: 'Successfully compiled with g++ (-fsyntax-only).',
            });
          }
        });
      });

      return result;
    } catch (err: any) {
      return { status: 'source_checked', notes: `Compilation skipped: ${err.message}` };
    } finally {
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
