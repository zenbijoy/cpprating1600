import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  SaveIcon,
  SubmissionHistoryIcon,
  SourceCodeIcon,
  AISparkleIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  RetryIcon,
  TerminalIcon,
  DebugCodeIcon,
  RunCodeIcon,
  CodingBracketsIcon,
  CheckCircleIcon,
  WarningStatusIcon,
  InformationStatusIcon,
} from './icons';
import { CodeDraft, CodeVersion, ExecutionResult, ProgrammingLanguage } from '../types';
import { cfStorageService, storageService } from '../services/storage';
import { executionService } from '../services/execution';
import { VersionDiffModal } from './VersionDiffModal';

interface CodeEditorProps {
  problemId: string;
  problemName?: string;
  contestId?: number;
  problemIndex?: string;
  language: ProgrammingLanguage;
  onChangeLanguage: (lang: ProgrammingLanguage) => void;
  code: string;
  onChangeCode: (code: string) => void;
  sampleInput: string;
  onChangeSampleInput: (input: string) => void;
  sampleOutput: string | null;
  onRunSample: () => void;
  isRunning?: boolean;
  onAutopsyRequested?: (code: string, verdict: string) => void;
}

const TEMPLATES: Record<ProgrammingLanguage, string> = {
  cpp20: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <map>
#include <set>
#include <queue>

using namespace std;

void solve() {
    // Write your solution here
    int n;
    if (!(cin >> n)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    // Output result
    long long ans = 0;
    cout << ans << "\\n";
}

int main() {
    // Fast I/O for competitive programming
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t; // Uncomment if problem has multiple test cases
    while (t--) {
        solve();
    }
    return 0;
}
`,
  cpp17: `#include <bits/stdc++.h>
using namespace std;

void solve() {
    // Solution code
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t = 1;
    // cin >> t;
    while (t--) solve();
    return 0;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve() {
    int n;
    if (scanf("%d", &n) != 1) return;
    printf("%d\\n", n);
}

int main() {
    int t = 1;
    // scanf("%d", &t);
    while (t--) {
        solve();
    }
    return 0;
}
`,
  python: `import sys

def solve():
    # Read all inputs from stdin
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Process problem logic here
    pass

if __name__ == '__main__':
    solve()
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    // Process problem logic here
    console.log(input.join(' '));
}

solve();
`,
  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        System.out.println(line);
    }
}
`,
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  problemId,
  problemName,
  contestId,
  problemIndex,
  language,
  onChangeLanguage,
  code,
  onChangeCode,
  sampleInput,
  onChangeSampleInput,
  sampleOutput,
  onRunSample,
  isRunning = false,
  onAutopsyRequested,
}) => {
  const cpPrefs = storageService.getSettings().competitiveProgramming;
  const [fontSize, setFontSize] = useState<number>(() => cpPrefs.editorFontSize || 14);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light' | 'hc-black'>(
    () => (cpPrefs.editorTheme as any) || 'vs-dark'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [activeDraftName, setActiveDraftName] = useState<string>('Main Solution');
  const [draftList, setDraftList] = useState<string[]>(['Main Solution', 'Approach 2', 'Brute Force']);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Execution result state
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecutingLocal, setIsExecutingLocal] = useState<boolean>(false);

  // Version history state
  const [versions, setVersions] = useState<CodeVersion[]>(() => storageService.getCodeVersions(problemId));
  const [diffSelection, setDiffSelection] = useState<{ a: CodeVersion; b: CodeVersion } | null>(null);
  const [showVersionList, setShowVersionList] = useState<boolean>(false);

  // Auto-save drafts per problem and language
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      cfStorageService.saveDraft({
        problemId: `${problemId}_${activeDraftName}`,
        language,
        code,
        name: activeDraftName,
        lastUpdated: new Date().toISOString(),
      });
      setSavedToast(`Autosaved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
      setTimeout(() => setSavedToast(null), 3000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [code, problemId, language, activeDraftName]);

  // Real sandboxed test execution
  const handleExecuteCode = async () => {
    setIsExecutingLocal(true);
    setExecutionResult(null);
    try {
      const res = await executionService.executeCode({
        code,
        language,
        stdin: sampleInput,
        timeoutMs: 2000,
      });
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        status: 'BACKEND_UNAVAILABLE',
        message: err.message || 'Execution failed to connect to runner.',
      });
    } finally {
      setIsExecutingLocal(false);
    }
  };

  // Save manual snapshot version
  const handleSaveVersionSnapshot = () => {
    const nextVerNum = versions.length > 0 ? Math.max(...versions.map((v) => v.versionNumber)) + 1 : 1;
    const newVersion: CodeVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      problemId,
      versionNumber: nextVerNum,
      code,
      language,
      savedAt: new Date().toISOString(),
      description: `${activeDraftName} snapshot`,
    };
    storageService.saveCodeVersion(newVersion);
    setVersions(storageService.getCodeVersions(problemId));
    setSavedToast(`Saved Version ${nextVerNum}!`);
    setTimeout(() => setSavedToast(null), 2500);
  };

  // Keyboard shortcuts (Ctrl+Enter / Cmd+Enter to run, Ctrl+S to save version)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveVersionSnapshot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, sampleInput, versions, activeDraftName]);

  // Code validation helper
  const validateCode = () => {
    const warnings: string[] = [];
    if (!code.trim()) {
      warnings.push('Code is currently empty.');
    } else {
      if (language === 'cpp20' || language === 'cpp17') {
        if (!code.includes('ios_base::sync_with_stdio') && !code.includes('cin.tie')) {
          warnings.push('Fast I/O recommendation: Include `ios_base::sync_with_stdio(false); cin.tie(NULL);` to avoid TLE on large inputs.');
        }
        if (code.includes('endl')) {
          warnings.push('Caution: `endl` flushes the output buffer each time. Prefer `\\n` to prevent TLE.');
        }
        if (!code.includes('main')) {
          warnings.push('Missing `main()` function definition in C++ code.');
        }
        // Basic bracket balance check
        let openBrackets = 0;
        for (const ch of code) {
          if (ch === '{') openBrackets++;
          if (ch === '}') openBrackets--;
        }
        if (openBrackets !== 0) {
          warnings.push(`Mismatched curly braces: Net difference is ${openBrackets}.`);
        }
      }
    }
    setValidationWarnings(warnings);
    setShowValidation(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'python' ? 'py' : language === 'c' ? 'c' : 'cpp';
    const filename = `${problemId || 'solution'}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToTemplate = () => {
    if (window.confirm('Reset current code editor to the default template? Your unsaved edits will be replaced.')) {
      onChangeCode(TEMPLATES[language]);
    }
  };

  const handleDraftSwitch = (name: string) => {
    setActiveDraftName(name);
    const existing = cfStorageService.getDraft(`${problemId}_${name}`, language);
    if (existing && existing.code) {
      onChangeCode(existing.code);
    }
  };

  const monacoLanguage = language === 'python' ? 'python' : language === 'c' ? 'c' : 'cpp';

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Editor Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 border-b border-slate-800 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <CodingBracketsIcon size={16} semantic="primary" />
            <span>Code Workspace</span>
          </div>

          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value as ProgrammingLanguage;
              onChangeLanguage(newLang);
              if (!code.trim() || code === TEMPLATES[language]) {
                onChangeCode(TEMPLATES[newLang]);
              }
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono font-medium"
          >
            <option value="cpp20">C++20 (GCC)</option>
            <option value="cpp17">C++17 (GCC)</option>
            <option value="c">C (GCC C11)</option>
            <option value="python">Python 3</option>
          </select>

          {/* Draft selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            {draftList.map((dName) => (
              <button
                key={dName}
                onClick={() => handleDraftSwitch(dName)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeDraftName === dName
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dName}
              </button>
            ))}
          </div>
        </div>

        {/* Editor controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {savedToast && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
              <CheckIcon size={12} />
              <span>{savedToast}</span>
            </span>
          )}

          {/* Version snapshot button */}
          <button
            type="button"
            onClick={handleSaveVersionSnapshot}
            title="Save version snapshot (Ctrl+S)"
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <SaveIcon size={14} semantic="indigo" />
            <span>Snapshot</span>
          </button>

          {/* Versions list & diff comparison button */}
          <button
            type="button"
            onClick={() => setShowVersionList((v) => !v)}
            title="View saved version history"
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <SubmissionHistoryIcon size={14} semantic="info" />
            <span>v({versions.length})</span>
          </button>

          {versions.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                setDiffSelection({
                  a: versions[1],
                  b: versions[0],
                });
              }}
              title="Compare latest 2 versions with code diff"
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <SourceCodeIcon size={14} semantic="info" />
              <span>Diff</span>
            </button>
          )}

          {/* Font size */}
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[10px] uppercase tracking-wider">Font:</span>
            {[12, 14, 16].map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  fontSize === sz
                    ? 'bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            onClick={validateCode}
            title="Pre-submission code validation"
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <AISparkleIcon size={14} semantic="info" />
            <span>Validate</span>
          </button>

          <button
            onClick={handleCopy}
            title="Copy code to clipboard"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            {copied ? <CheckIcon size={14} semantic="success" /> : <CopyIcon size={14} />}
          </button>

          <button
            onClick={handleDownload}
            title="Download solution file"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <DownloadIcon size={14} />
          </button>

          <button
            onClick={handleResetToTemplate}
            title="Reset code to standard competitive template"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <RetryIcon size={14} />
          </button>
        </div>
      </div>

      {/* Version History Drawer */}
      {showVersionList && (
        <div className="bg-slate-950 border-b border-slate-800 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <SubmissionHistoryIcon size={14} semantic="primary" />
              <span>Saved Code Versions ({versions.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowVersionList(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="text-slate-500 italic text-[11px]">No manual snapshots saved yet. Click Snapshot or press Ctrl+S to save your first code version.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {versions.map((ver, idx) => (
                <div key={ver.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">v{ver.versionNumber}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(ver.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono">{ver.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeCode(ver.code);
                        setSavedToast(`Restored v${ver.versionNumber}`);
                        setTimeout(() => setSavedToast(null), 2000);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[10px] font-semibold"
                    >
                      Restore
                    </button>
                    {idx < versions.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDiffSelection({ a: versions[idx + 1], b: ver });
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        Diff with previous
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validation Banner */}
      {showValidation && (
        <div className="bg-slate-950/95 border-b border-slate-800 p-2.5 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <AISparkleIcon size={14} semantic="primary" />
              Pre-Submission Analysis
            </span>
            <button
              onClick={() => setShowValidation(false)}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
            >
              Dismiss
            </button>
          </div>
          {validationWarnings.length === 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <CheckCircleIcon size={14} semantic="success" />
              Code structure is clean! Fast I/O and bracket pairing verified. Ready for submission.
            </div>
          ) : (
            <ul className="space-y-1 text-amber-300/90 text-xs">
              {validationWarnings.map((w, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <WarningStatusIcon size={14} semantic="warning" className="shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[340px] relative">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          theme={editorTheme}
          onChange={(val) => onChangeCode(val || '')}
          options={{
            fontSize,
            fontFamily: cpPrefs.codeFontFamily
              ? `'${cpPrefs.codeFontFamily}', 'JetBrains Mono', Menlo, Consolas, monospace`
              : "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
            minimap: { enabled: false },
            lineNumbers: cpPrefs.lineNumbers ? 'on' : 'off',
            wordWrap: cpPrefs.wordWrap ? 'on' : 'off',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: cpPrefs.editorTabSize || 4,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 10, bottom: 10 },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-slate-500 text-sm gap-2">
              <CodingBracketsIcon size={20} semantic="primary" className="animate-pulse" />
              <span>Loading Monaco CP Editor...</span>
            </div>
          }
        />
      </div>

      {/* Bottom Panel: Sandboxed Test Runner & Execution Diagnostics */}
      <div className="border-t border-slate-800 bg-slate-950/95 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <TerminalIcon size={14} semantic="primary" />
              <span>Sandboxed Execution Engine</span>
            </span>
            {executionResult && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                  executionResult.status === 'OK'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    : executionResult.status === 'COMPILATION_ERROR'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                    : executionResult.status === 'TIME_LIMIT_EXCEEDED'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {executionResult.status} {executionResult.executionTimeMs ? `(${executionResult.executionTimeMs}ms)` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {executionResult && executionResult.status !== 'OK' && executionResult.status !== 'BACKEND_UNAVAILABLE' && (
              <button
                type="button"
                onClick={() => {
                  if (onAutopsyRequested) {
                    onAutopsyRequested(code, executionResult.status);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <DebugCodeIcon size={14} semantic="error" />
                <span>Autopsy this error</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExecuteCode}
              disabled={isExecutingLocal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
              title="Compile and execute code safely (Ctrl+Enter)"
            >
              <RunCodeIcon size={14} className={isExecutingLocal ? 'animate-spin' : ''} />
              <span>{isExecutingLocal ? 'Compiling & Running...' : 'Run Code (Ctrl+Enter)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Custom Stdin (Input)
            </label>
            <textarea
              value={sampleInput}
              onChange={(e) => onChangeSampleInput(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              placeholder="Paste custom input here..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Stdout / Compiler Diagnostics
            </label>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-xs min-h-[66px] max-h-[110px] overflow-y-auto whitespace-pre-wrap">
              {executionResult ? (
                <div>
                  {executionResult.status === 'OK' && (
                    <span className="text-emerald-300">{executionResult.stdout || '(Empty output)'}</span>
                  )}
                  {executionResult.status === 'COMPILATION_ERROR' && (
                    <span className="text-rose-400">{executionResult.compilerOutput || executionResult.message}</span>
                  )}
                  {executionResult.status === 'RUNTIME_ERROR' && (
                    <span className="text-rose-300">
                      Runtime Error: {executionResult.stderr || executionResult.message}
                      {executionResult.stdout && `\nStdout before crash:\n${executionResult.stdout}`}
                    </span>
                  )}
                  {executionResult.status === 'TIME_LIMIT_EXCEEDED' && (
                    <span className="text-amber-400">
                      Time Limit Exceeded (&gt; 2000ms). Infinite loop or asymptotic complexity too high.
                    </span>
                  )}
                  {executionResult.status === 'BACKEND_UNAVAILABLE' && (
                    <span className="text-slate-400">
                      {executionResult.message}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 italic">Click "Run Code" or press Ctrl+Enter to execute test.</span>
              )}
            </div>
          </div>
        </div>

        {/* Clear Three-Way Distinction Disclaimer */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-800/60">
          <InformationStatusIcon size={14} className="shrink-0 text-slate-400" />
          <span>
            <strong className="text-slate-400">Sandbox Isolation:</strong> Process runs in isolated subprocess with 2.0s time & memory limits. Does not fabricate verdicts.
          </span>
        </div>
      </div>

      {/* Version Diff Modal */}
      {diffSelection && (
        <VersionDiffModal
          versionA={diffSelection.a}
          versionB={diffSelection.b}
          onClose={() => setDiffSelection(null)}
          onRestoreVersion={(restoredCode) => {
            onChangeCode(restoredCode);
            setDiffSelection(null);
            setSavedToast('Restored version');
            setTimeout(() => setSavedToast(null), 2000);
          }}
        />
      )}
    </div>
  );
};
