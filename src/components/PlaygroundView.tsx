import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import {
  RunCodeIcon,
  StopGenerationIcon,
  CodingBracketsIcon,
  AISparkleIcon,
  RefreshIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  TerminalIcon,
  WarningStatusIcon,
  CheckCircleIcon,
  TimerIcon,
  SaveIcon,
  BookmarksIcon,
  CloseIcon,
  CodeFileIcon,
  EyeIcon,
  EyeOffIcon,
  FullscreenIcon,
  ExitFullscreenIcon,
  SubmissionHistoryIcon,
  DeleteIcon,
  SettingsIcon,
  HelpCircleControlIcon,
  SplitPanelIcon,
  StreakIcon,
  InformationStatusIcon,
  CommunityIcon,
} from './icons';
import {
  ProgrammingLanguage,
  PlaygroundExecutionResult,
  AiDebugResponse,
  PlaygroundSnippet,
} from '../types';
import { playgroundApi } from '../services/playgroundApi';
import { MobileCodeToolbar } from './MobileCodeToolbar';

// ─── Default Language Starter Templates ─────────────────────────────────────

const STARTER_TEMPLATES: Record<ProgrammingLanguage, string> = {
  cpp20: `// C++20 Competitive Programming Starter
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <map>
#include <set>
#include <queue>

using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    // Sample calculation
    long long sum = 0;
    for (auto val : a) sum += val;
    
    cout << sum << "\\n";
}

int main() {
    // Fast I/O for CP
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t; // Uncomment if multiple test cases
    while (t--) {
        solve();
    }
    return 0;
}
`,
  cpp17: `// C++17 Competitive Programming Starter
#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    
    long long total = accumulate(a.begin(), a.end(), 0LL);
    cout << total << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}
`,
  c: `// C (C11) Competitive Programming Starter
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve() {
    int n;
    if (scanf("%d", &n) != 1) return;
    
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        long long val;
        scanf("%lld", &val);
        sum += val;
    }
    
    printf("%lld\\n", sum);
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
  python: `# Python 3 Competitive Programming Starter
import sys

def solve():
    # Read all whitespace-delimited tokens from stdin
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    
    print(sum(nums))

if __name__ == '__main__':
    solve()
`,
  javascript: `// JavaScript (Node.js) Competitive Programming Starter
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    
    // Process problem logic
    console.log(input.join(' '));
}

solve();
`,
  java: `// Java Competitive Programming Starter
import java.io.*;
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

const LANGUAGE_DETAILS: Record<
  ProgrammingLanguage,
  { label: string; monacoLang: string; version: string; ext: string; compiler: string }
> = {
  cpp20: { label: 'C++20', monacoLang: 'cpp', version: 'C++20 (GCC)', ext: 'cpp', compiler: 'g++ -O2 -std=c++17/20' },
  cpp17: { label: 'C++17', monacoLang: 'cpp', version: 'C++17 (GCC)', ext: 'cpp', compiler: 'g++ -O2 -std=c++17' },
  c:     { label: 'C (C11)', monacoLang: 'c', version: 'C11 (GCC)', ext: 'c', compiler: 'gcc -O2 -std=c11' },
  python:{ label: 'Python 3', monacoLang: 'python', version: 'Python 3.13', ext: 'py', compiler: 'python -u' },
  javascript: { label: 'JavaScript', monacoLang: 'javascript', version: 'Node.js 24', ext: 'js', compiler: 'node' },
  java: { label: 'Java', monacoLang: 'java', version: 'Java 25', ext: 'java', compiler: 'javac / java' },
};

interface ExecutionHistoryItem {
  id: string;
  language: ProgrammingLanguage;
  codePreview: string;
  codeFull: string;
  stdinUsed: string;
  status: string;
  durationMs?: number;
  timestamp: string;
}

// ─── Status Badge ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ result: PlaygroundExecutionResult | null }> = ({ result }) => {
  if (!result) return null;
  const styles: Record<string, string> = {
    OK: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    COMPILATION_ERROR: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    RUNTIME_ERROR: 'bg-orange-950/80 text-orange-300 border-orange-700/60',
    TIME_LIMIT_EXCEEDED: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    MEMORY_LIMIT_EXCEEDED: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    CANCELLED: 'bg-slate-900 text-slate-400 border-slate-700',
    BACKEND_UNAVAILABLE: 'bg-slate-900 text-slate-400 border-slate-700',
    PROVIDER_ERROR: 'bg-red-950/80 text-red-300 border-red-700/60',
  };
  const labels: Record<string, string> = {
    OK: '✓ Accepted (Exit 0)',
    COMPILATION_ERROR: '✗ Compilation Error',
    RUNTIME_ERROR: '✗ Runtime Error',
    TIME_LIMIT_EXCEEDED: '⏱ Time Limit Exceeded',
    MEMORY_LIMIT_EXCEEDED: '📦 Memory Limit Exceeded',
    CANCELLED: '⊘ Cancelled',
    BACKEND_UNAVAILABLE: '⚠ Service Unavailable',
    PROVIDER_ERROR: '✗ Provider Error',
  };
  const cls = styles[result.status] || 'bg-slate-900 text-slate-400 border-slate-700';
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${cls}`}>
      {labels[result.status] || result.status}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

interface PlaygroundViewProps {
  isAuthenticated?: boolean;
  preferredLanguage?: ProgrammingLanguage;
  onShareToCommunity?: (code: string, language: string) => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  isAuthenticated = false,
  preferredLanguage = 'cpp17',
  onShareToCommunity,
}) => {
  // Language & Drafts per language
  const [language, setLanguage] = useState<ProgrammingLanguage>(preferredLanguage);
  const [drafts, setDrafts] = useState<Record<ProgrammingLanguage, string>>(() => {
    const saved = localStorage.getItem('climb1600_pg_drafts');
    if (saved) {
      try {
        return { ...STARTER_TEMPLATES, ...JSON.parse(saved) };
      } catch {}
    }
    return { ...STARTER_TEMPLATES };
  });

  const code = drafts[language] || STARTER_TEMPLATES[language];
  const setCode = (newCode: string) => {
    setDrafts((prev) => {
      const next = { ...prev, [language]: newCode };
      localStorage.setItem('climb1600_pg_drafts', JSON.stringify(next));
      return next;
    });
  };

  // I/O & Execution state
  const [stdin, setStdin] = useState<string>('5\n10 20 30 40 50\n');
  const [expectedOutput, setExpectedOutput] = useState<string>('150\n');
  const [ignoreTrailingWhitespace, setIgnoreTrailingWhitespace] = useState<boolean>(true);
  const [result, setResult] = useState<PlaygroundExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeoutMs, setTimeoutMs] = useState<number>(3000);

  // Editor settings
  const [fontSize, setFontSize] = useState<number>(14);
  const [tabSize, setTabSize] = useState<2 | 4>(4);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // UI Panels
  const [mobileTab, setMobileTab] = useState<'editor' | 'input' | 'output' | 'diagnostics'>('editor');
  const [showAiDebug, setShowAiDebug] = useState<boolean>(false);
  const [showSnippets, setShowSnippets] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState<boolean>(false);

  // Notifications / feedback
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Execution History
  const [history, setHistory] = useState<ExecutionHistoryItem[]>(() => {
    const h = localStorage.getItem('climb1600_pg_history');
    if (h) {
      try { return JSON.parse(h); } catch {}
    }
    return [];
  });

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoInstanceRef = useRef<typeof Monaco | null>(null);

  // Save history helper
  const addHistoryItem = (res: PlaygroundExecutionResult) => {
    const item: ExecutionHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      language,
      codePreview: code.slice(0, 150).replace(/\n/g, ' '),
      codeFull: code,
      stdinUsed: stdin,
      status: res.status,
      durationMs: res.executionTimeMs,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setHistory((prev) => {
      const next = [item, ...prev.slice(0, 19)];
      localStorage.setItem('climb1600_pg_history', JSON.stringify(next));
      return next;
    });
  };

  // Toast helper
  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  // ── Run Code Execution
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResult(null);

    try {
      const res = await playgroundApi.execute({
        code,
        language,
        stdin,
        timeoutMs,
      });
      setResult(res);
      addHistoryItem(res);

      // On mobile automatically switch to output tab
      if (window.innerWidth < 1024) {
        setMobileTab('output');
      }

      // Add Monaco diagnostics error markers if compiler output contains line/col
      if (editorRef.current && monacoInstanceRef.current) {
        const monaco = monacoInstanceRef.current;
        const model = editorRef.current.getModel();
        if (model) {
          const markers: Monaco.editor.IMarkerData[] = [];
          if (res.status === 'COMPILATION_ERROR' && res.compilerOutput) {
            // Regex to find "solution.cpp:12:5: error: ..." or "solution.c:15:10: error:"
            const errorRegex = /(?:solution\.(?:cpp|c|py)):(\d+):(?:(\d+):)?\s*(error|warning):\s*(.*)/gi;
            let match;
            while ((match = errorRegex.exec(res.compilerOutput)) !== null) {
              const line = parseInt(match[1], 10);
              const col = match[2] ? parseInt(match[2], 10) : 1;
              const severity = match[3].toLowerCase() === 'warning'
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Error;
              const message = match[4];

              markers.push({
                startLineNumber: line,
                startColumn: col,
                endLineNumber: line,
                endColumn: col + 5,
                message,
                severity,
              });
            }
          }
          monaco.editor.setModelMarkers(model, 'compiler', markers);
        }
      }
    } catch (err: any) {
      setResult({
        status: 'BACKEND_UNAVAILABLE',
        message: err.message || 'Execution runner failed to start.',
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, stdin, timeoutMs, isRunning]);

  // Keyboard Shortcuts: Ctrl+Enter / Cmd+Enter to Run, Ctrl+S to Save Snippet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSnippets(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  // Language switch with draft preservation
  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    setResult(null);
    triggerToast(`Switched to ${LANGUAGE_DETAILS[newLang].label}`);
  };

  const handleResetToTemplate = () => {
    if (window.confirm(`Reset current ${LANGUAGE_DETAILS[language].label} code to the starter template?`)) {
      setCode(STARTER_TEMPLATES[language]);
      setResult(null);
      triggerToast('Reset to default starter template');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    triggerToast('Source code copied to clipboard');
  };

  const handleDownloadCode = () => {
    const ext = LANGUAGE_DETAILS[language].ext;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded solution.${ext}`);
  };

  const handleFormatCode = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
    triggerToast('Code formatted');
  };

  // Expected vs Actual comparison
  const normalizeOutput = (str: string) => {
    if (ignoreTrailingWhitespace) {
      return str
        .split('\n')
        .map((l) => l.trimEnd())
        .join('\n')
        .trim();
    }
    return str;
  };

  const actualOutputNormalized = result?.stdout !== undefined ? normalizeOutput(result.stdout) : null;
  const expectedOutputNormalized = expectedOutput ? normalizeOutput(expectedOutput) : null;
  const hasExpectedComparison = expectedOutput.trim().length > 0 && actualOutputNormalized !== null;
  const isOutputMatching = hasExpectedComparison && actualOutputNormalized === expectedOutputNormalized;

  return (
    <div className={`flex flex-col h-full bg-[#0b0f19] text-slate-100 keep-white ${isFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#0b0f19]' : ''}`}>
      {/* ── Top Workspace Toolbar ── */}
      <header className="flex items-center justify-between px-3 py-2 bg-slate-950/95 border-b border-slate-800 text-xs flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm">
            <CodingBracketsIcon size={16} semantic="primary" />
            <span className="hidden sm:inline">Online Playground</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="cpp20">C++20 (GCC)</option>
            <option value="cpp17">C++17 (GCC)</option>
            <option value="c">C (GCC C11)</option>
            <option value="python">Python 3</option>
          </select>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 font-mono hidden md:inline">
            {LANGUAGE_DETAILS[language].compiler}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {statusToast && (
            <span className="text-[11px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
              <CheckIcon size={12} semantic="success" />
              <span>{statusToast}</span>
            </span>
          )}

          {/* AI Debug Assistant */}
          <button
            onClick={() => setShowAiDebug(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 transition-all cursor-pointer"
          >
            <AISparkleIcon size={14} semantic="warning" />
            <span className="hidden xs:inline">AI Debug</span>
          </button>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            title="Compile & Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <StopGenerationIcon size={14} />
            ) : (
              <RunCodeIcon size={14} />
            )}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          {/* Desktop-only Quick Tools */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* Editor Preferences */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-1.5 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">Font:</span>
              {[12, 14, 16].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                    fontSize === sz ? 'text-indigo-300 font-bold bg-indigo-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditorTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))}
              title="Toggle Dark / Light Editor Theme"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              {editorTheme === 'vs-dark' ? '🌙' : '☀️'}
            </button>

            <button
              onClick={handleFormatCode}
              title="Format Code (Shift+Alt+F)"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <CodeFileIcon size={14} />
            </button>

            <button
              onClick={handleCopyCode}
              title="Copy Source Code"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              {copiedCode ? <CheckIcon size={14} semantic="success" /> : <CopyIcon size={14} />}
            </button>

            <button
              onClick={handleDownloadCode}
              title="Download Solution File"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <DownloadIcon size={14} />
            </button>

            <button
              onClick={handleResetToTemplate}
              title="Reset to Starter Template"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
            >
              <RefreshIcon size={14} />
            </button>

            <div className="w-px h-4 bg-slate-800 mx-0.5" />

            {/* Snippets / Cloud Save */}
            <button
              onClick={() => setShowSnippets(true)}
              title="Saved Snippets & Cloud Storage (Ctrl+S)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <BookmarksIcon size={14} semantic="primary" />
              <span className="font-medium">Snippets</span>
            </button>

            {/* Execution History */}
            <button
              onClick={() => setShowHistory(true)}
              title="Recent Execution History"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <SubmissionHistoryIcon size={14} semantic="primary" />
              <span>({history.length})</span>
            </button>

            {/* Share with Community */}
            {onShareToCommunity && (
              <button
                onClick={() => onShareToCommunity(code, language)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-all cursor-pointer"
                title="Share snippet with the community feed"
              >
                <CommunityIcon size={14} />
                <span>Share</span>
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen((v) => !v)}
              title={isFullscreen ? 'Exit Distraction-Free Fullscreen' : 'Enter Distraction-Free Fullscreen'}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              {isFullscreen ? <ExitFullscreenIcon size={14} /> : <FullscreenIcon size={14} />}
            </button>
          </div>

          {/* Mobile More Actions Menu (Dropdown) */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-sm cursor-pointer"
              title="More Playground Options"
            >
              ⋮
            </button>

            {showMobileMoreMenu && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs text-slate-200"
                onClick={() => setShowMobileMoreMenu(false)}
              >
                <button
                  type="button"
                  onClick={handleFormatCode}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                >
                  <CodeFileIcon size={14} />
                  <span>Format Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSnippets(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-indigo-300"
                >
                  <BookmarksIcon size={14} semantic="primary" />
                  <span>Saved Snippets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                >
                  <SubmissionHistoryIcon size={14} semantic="primary" />
                  <span>Execution History ({history.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                >
                  <CopyIcon size={14} />
                  <span>Copy Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCode}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                >
                  <DownloadIcon size={14} />
                  <span>Download File</span>
                </button>

                {onShareToCommunity && (
                  <button
                    type="button"
                    onClick={() => onShareToCommunity(code, language)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-indigo-300"
                  >
                    <CommunityIcon size={14} />
                    <span>Share to Feed</span>
                  </button>
                )}

                <div className="h-px bg-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => setEditorTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-400"
                >
                  <span>{editorTheme === 'vs-dark' ? '☀️ Switch to Light Theme' : '🌙 Switch to Dark Theme'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToTemplate}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-rose-400"
                >
                  <RefreshIcon size={14} />
                  <span>Reset to Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-400"
                >
                  {isFullscreen ? <ExitFullscreenIcon size={14} /> : <FullscreenIcon size={14} />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Tabs ── */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-950 shrink-0">
        {(['editor', 'input', 'output', 'diagnostics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
              mobileTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-950/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
            {tab === 'output' && result && (
              <span
                className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${
                  result.status === 'OK' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Monaco Code Editor */}
        <div
          className={`flex-1 flex flex-col min-w-0 border-r border-slate-800 ${
            mobileTab !== 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex-1 min-h-[350px] relative">
            <Editor
              height="100%"
              language={LANGUAGE_DETAILS[language].monacoLang}
              value={code}
              theme={editorTheme}
              onChange={(val) => setCode(val || '')}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoInstanceRef.current = monaco;
              }}
              options={{
                fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize,
                insertSpaces: true,
                wordWrap,
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                formatOnType: false,
                matchBrackets: 'always',
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                folding: true,
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 10, bottom: 10 },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
              loading={
                <div className="flex items-center justify-center h-full text-slate-500 text-sm gap-2">
                  <CodingBracketsIcon size={20} semantic="primary" className="animate-pulse" />
                  <span>Loading Monaco Code Editor...</span>
                </div>
              }
            />
          </div>

          {/* Mobile Accessory / CP Shortcuts Toolbar */}
          <div className="lg:hidden">
            <MobileCodeToolbar
              editorRef={editorRef}
              language={language}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              wordWrap={wordWrap}
              onToggleWordWrap={() => setWordWrap((w) => (w === 'on' ? 'off' : 'on'))}
              onFormatCode={handleFormatCode}
            />
          </div>

          {/* Desktop Bottom Input Drawer */}
          <div className="hidden lg:flex flex-col border-t border-slate-800 bg-slate-950/90 p-3 shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <TerminalIcon size={14} semantic="primary" />
                <span>Standard Input (stdin)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStdin('5\n10 20 30 40 50\n')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Example Input
                </button>
                <button
                  onClick={() => setStdin('')}
                  className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={3}
              placeholder="Supply standard input here for cin / scanf / sys.stdin..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Right Side: Output Console, Diagnostics, Expected Comparison */}
        <div
          className={`w-full lg:w-[480px] flex flex-col bg-slate-950/95 overflow-hidden shrink-0 ${
            mobileTab === 'editor' ? 'hidden lg:flex' : 'flex flex-1'
          }`}
        >
          {/* Mobile Stdin Tab */}
          {mobileTab === 'input' && (
            <div className="lg:hidden flex-1 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Custom Standard Input</span>
                <button onClick={() => setStdin('')} className="text-slate-400 text-xs">
                  Clear
                </button>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                rows={12}
                placeholder="Enter input here..."
                className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          {/* Output Console & Status Panel */}
          {(mobileTab === 'output' || window.innerWidth >= 1024) && (
            <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TerminalIcon size={14} semantic="primary" />
                  <span className="font-semibold text-slate-200">Execution Output</span>
                  <StatusBadge result={result} />
                </div>

                <div className="flex items-center gap-2">
                  {result && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {result.isCachedCompilation && (
                        <span className="text-amber-300 font-bold bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-700/60 flex items-center gap-1">
                          <StreakIcon size={12} semantic="warning" />
                          <span>0ms Build Cache</span>
                        </span>
                      )}
                      {result.compileTimeMs !== undefined && result.compileTimeMs > 0 && (
                        <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          compile: {result.compileTimeMs}ms
                        </span>
                      )}
                      {result.executionTimeMs !== undefined && (
                        <span className="text-emerald-300 font-semibold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                          <TimerIcon size={12} semantic="success" />
                          <span>exec: {result.executionTimeMs}ms</span>
                        </span>
                      )}
                    </div>
                  )}
                  {result?.stdout && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.stdout || '');
                        setCopiedOutput(true);
                        setTimeout(() => setCopiedOutput(false), 2000);
                      }}
                      title="Copy Output"
                      className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {copiedOutput ? <CheckIcon size={14} semantic="success" /> : <CopyIcon size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Output Content */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs select-text">
                {!result ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-1 py-10">
                    <RunCodeIcon size={24} className="text-slate-700" />
                    <p>Press "Run Code" or hit Ctrl+Enter to execute.</p>
                  </div>
                ) : result.status === 'OK' ? (
                  result.stdout ? (
                    <pre className="text-emerald-300 whitespace-pre-wrap break-all leading-relaxed">
                      {result.stdout}
                    </pre>
                  ) : (
                    <p className="text-slate-500 italic">Program successfully completed with exit code 0. (No stdout generated)</p>
                  )
                ) : result.status === 'COMPILATION_ERROR' ? (
                  <div className="space-y-2">
                    <div className="text-rose-400 font-bold flex items-center gap-1">
                      <WarningStatusIcon size={16} semantic="error" />
                      <span>Compilation Error</span>
                    </div>
                    <pre className="text-rose-300/90 whitespace-pre-wrap break-all bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
                      {result.compilerOutput || result.message}
                    </pre>
                  </div>
                ) : result.status === 'RUNTIME_ERROR' ? (
                  <div className="space-y-2">
                    <div className="text-orange-400 font-bold flex items-center gap-1">
                      <WarningStatusIcon size={16} semantic="warning" />
                      <span>Runtime Error (Crash / Non-zero exit {result.exitCode ?? ''})</span>
                    </div>
                    {result.stdout && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Stdout before crash:</span>
                        <pre className="text-slate-300 whitespace-pre-wrap break-all bg-slate-900 p-2 rounded mt-1">
                          {result.stdout}
                        </pre>
                      </div>
                    )}
                    <pre className="text-orange-300/90 whitespace-pre-wrap break-all bg-orange-950/20 p-2.5 rounded-lg border border-orange-900/40">
                      {result.stderr || result.message}
                    </pre>
                  </div>
                ) : result.status === 'TIME_LIMIT_EXCEEDED' ? (
                  <div className="text-amber-400 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <TimerIcon size={16} semantic="warning" />
                      <span>Time Limit Exceeded (&gt; {timeoutMs}ms)</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      The program exceeded the allocated wall-clock time limit. Check for infinite loops or high asymptotic time complexity.
                    </p>
                  </div>
                ) : (
                  <pre className="text-slate-400 whitespace-pre-wrap break-all">{result.message}</pre>
                )}
              </div>

              {/* Expected Output Comparison Panel */}
              <div className="border-t border-slate-800 bg-slate-950/80 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <CheckCircleIcon size={14} semantic="primary" />
                    <span>Expected Output Comparison</span>
                  </span>
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ignoreTrailingWhitespace}
                      onChange={(e) => setIgnoreTrailingWhitespace(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                    <span>Ignore trailing whitespace</span>
                  </label>
                </div>

                <textarea
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  rows={2}
                  placeholder="Paste expected output to compare against actual program results..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />

                {hasExpectedComparison && (
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold border ${
                      isOutputMatching
                        ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/70 border-rose-800 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isOutputMatching ? <CheckCircleIcon size={16} semantic="success" /> : <WarningStatusIcon size={16} semantic="error" />}
                      <span>{isOutputMatching ? 'Outputs Match Perfectly' : 'Output Mismatch Detected'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compiler Diagnostics Panel */}
          {(mobileTab === 'diagnostics' || window.innerWidth >= 1024) && (
            <div className="h-44 border-t border-slate-800 flex flex-col bg-slate-950/90 shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <WarningStatusIcon size={14} semantic="warning" />
                  <span>Compiler &amp; Runtime Diagnostics</span>
                </span>
                {result && result.status !== 'OK' && (
                  <button
                    onClick={() => setShowAiDebug(true)}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    Ask AI to analyze this error →
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                {result?.compilerOutput ? (
                  <pre className="text-amber-300/90 whitespace-pre-wrap break-all">{result.compilerOutput}</pre>
                ) : result?.stderr ? (
                  <pre className="text-orange-300/90 whitespace-pre-wrap break-all">{result.stderr}</pre>
                ) : (
                  <p className="text-slate-500 italic">No diagnostic errors reported for the current build.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <footer className="hidden lg:flex items-center justify-between px-3 py-1 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Runner: Local Subprocess Sandbox</span>
          </span>
          <span>|</span>
          <span>Max Execution: {timeoutMs / 1000}s</span>
          <span>|</span>
          <span>Max Output: 64KB</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <HelpCircleControlIcon size={14} />
            <span>Keyboard Shortcuts</span>
          </button>
          <span>Ctrl+Enter to Run</span>
          <span>Ctrl+S to Save</span>
        </div>
      </footer>

      {/* ── AI Debugger Modal ── */}
      {showAiDebug && (
        <AiDebugModal
          isOpen={showAiDebug}
          onClose={() => setShowAiDebug(false)}
          code={code}
          language={language}
          result={result}
          stdin={stdin}
          expectedOutput={expectedOutput}
          onApplyFix={(fixedCode) => {
            setCode(fixedCode);
            triggerToast('AI fix applied to editor! Review and run code to verify.');
          }}
        />
      )}

      {/* ── Saved Snippets Modal ── */}
      {showSnippets && (
        <SavedSnippetsModal
          isOpen={showSnippets}
          onClose={() => setShowSnippets(false)}
          isAuthenticated={isAuthenticated}
          currentCode={code}
          currentLanguage={language}
          onLoadSnippet={(snipCode, snipLang) => {
            setLanguage(snipLang);
            setCode(snipCode);
            triggerToast('Snippet loaded into workspace');
          }}
        />
      )}

      {/* ── Execution History Drawer ── */}
      {showHistory && (
        <ExecutionHistoryDrawer
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={history}
          onClearHistory={() => {
            setHistory([]);
            localStorage.removeItem('climb1600_pg_history');
          }}
          onRestore={(item) => {
            setLanguage(item.language);
            setCode(item.codeFull);
            setStdin(item.stdinUsed);
            setShowHistory(false);
            triggerToast('Restored code and inputs from history');
          }}
        />
      )}

      {/* ── Keyboard Shortcuts Modal ── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Playground Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-300">Run / Compile Code</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">Ctrl + Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-300">Save Snippet</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">Ctrl + S</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-300">Format Code Document</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">Shift + Alt + F</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-300">Find / Replace</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">Ctrl + F</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-300">Toggle Line Comment</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">Ctrl + /</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-Component: AI Debugger Modal ──────────────────────────────────────

interface AiDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: ProgrammingLanguage;
  result: PlaygroundExecutionResult | null;
  stdin: string;
  expectedOutput: string;
  onApplyFix: (code: string) => void;
}

const AiDebugModal: React.FC<AiDebugModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
  result,
  stdin,
  expectedOutput,
  onApplyFix,
}) => {
  const [userDescription, setUserDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugResponse, setDebugResponse] = useState<AiDebugResponse | null>(null);
  const [showDiffPreview, setShowDiffPreview] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleRequestDebug = async () => {
    setIsLoading(true);
    setDebugResponse(null);
    try {
      const resp = await playgroundApi.aiDebug({
        code,
        language,
        compilerOutput: result?.compilerOutput || (result?.status === 'COMPILATION_ERROR' ? result.message : ''),
        stderr: result?.stderr || (result?.status === 'RUNTIME_ERROR' ? result.message : ''),
        stdout: result?.stdout || '',
        stdin,
        expectedOutput,
        userDescription,
        executionTimeMs: result?.executionTimeMs,
      });
      setDebugResponse(resp);
    } catch (err: any) {
      setDebugResponse({
        success: false,
        summary: 'Failed to contact AI service.',
        errorCategory: 'PROVIDER_ERROR',
        evidence: '',
        rootCause: err.message,
        suggestedFix: 'Please check your internet connection or Gemini API credentials.',
        confidence: 'low',
        disclaimer: 'AI service request failure.',
        source: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <AISparkleIcon size={18} semantic="warning" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">AI Compiler &amp; Runtime Debugger</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 font-semibold border border-violet-700/50">
              Gemini Powered
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Debug Request Inputs */}
          <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Optional: Describe the bug or where you suspect the issue is
              </label>
              <input
                type="text"
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                placeholder="e.g. 'Segment tree query returns wrong sum on single-element ranges' or 'Index out of bounds on test 3'"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
              <span>
                Sending: Code ({code.length} bytes), Diagnostics ({result?.status || 'No run yet'})
              </span>
              <button
                onClick={handleRequestDebug}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-violet-600/30 cursor-pointer"
              >
                {isLoading ? <StopGenerationIcon size={14} className="animate-spin" /> : <AISparkleIcon size={14} />}
                <span>{isLoading ? 'Analyzing Diagnostics...' : 'Analyze Code & Diagnostics'}</span>
              </button>
            </div>
          </div>

          {/* AI Response Display */}
          {debugResponse && (
            <div className="space-y-4 pt-2">
              {/* Problem Summary & Category */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{debugResponse.summary}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-950 text-violet-300 border border-violet-800">
                      Category: {debugResponse.errorCategory}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Confidence: <strong className="text-slate-900 dark:text-white capitalize">{debugResponse.confidence}</strong>
                    </span>
                  </div>
                </div>

                {debugResponse.evidence && (
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Diagnostic Evidence:</span>
                    <pre className="mt-1 font-mono text-[11px] bg-slate-950 p-2 rounded text-rose-300/90 whitespace-pre-wrap">
                      {debugResponse.evidence}
                    </pre>
                  </div>
                )}
              </div>

              {/* Root Cause & Suggested Fix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Likely Root Cause</span>
                  <p className="text-slate-300 leading-relaxed">{debugResponse.rootCause}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Suggested Fix</span>
                  <p className="text-slate-300 leading-relaxed">{debugResponse.suggestedFix}</p>
                </div>
              </div>

              {/* Corrected Code Preview */}
              {debugResponse.correctedCode && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CodingBracketsIcon size={16} semantic="success" />
                      <span>Suggested Corrected Solution</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(debugResponse.correctedCode || '');
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                      >
                        {copiedCode ? <CheckIcon size={14} semantic="success" /> : <CopyIcon size={14} />}
                        <span>Copy Code</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Apply the AI-corrected code directly to the active editor? This replaces your current code.')) {
                            onApplyFix(debugResponse.correctedCode!);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer"
                      >
                        <AISparkleIcon size={14} />
                        <span>Apply to Editor</span>
                      </button>
                    </div>
                  </div>

                  {debugResponse.correctedCodeExplanation && (
                    <p className="text-slate-400 text-xs leading-relaxed italic">
                      {debugResponse.correctedCodeExplanation}
                    </p>
                  )}

                  <pre className="font-mono text-xs bg-slate-950 p-3 rounded-lg text-emerald-300/90 whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800">
                    {debugResponse.correctedCode}
                  </pre>
                </div>
              )}

              {/* Additional Edge-Case Tests */}
              {debugResponse.additionalTests && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-cyan-400 uppercase text-[10px] tracking-wide">
                    Targeted Edge-Case Verification Tests
                  </span>
                  <pre className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded whitespace-pre-wrap">
                    {debugResponse.additionalTests}
                  </pre>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400">
                <InformationStatusIcon size={14} semantic="primary" className="shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> {debugResponse.disclaimer} Always verify logic and execute against the real compiler.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-Component: Saved Snippets Modal ───────────────────────────────────

interface SavedSnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  currentCode: string;
  currentLanguage: ProgrammingLanguage;
  onLoadSnippet: (code: string, language: ProgrammingLanguage) => void;
}

const SavedSnippetsModal: React.FC<SavedSnippetsModalProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  currentCode,
  currentLanguage,
  onLoadSnippet,
}) => {
  const [snippets, setSnippets] = useState<PlaygroundSnippet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadSnippets = async () => {
    if (!isAuthenticated) {
      // Load guest snippets from localStorage
      const local = localStorage.getItem('climb1600_pg_local_snippets');
      if (local) {
        try { setSnippets(JSON.parse(local)); } catch {}
      }
      return;
    }
    setIsLoading(true);
    try {
      const data = await playgroundApi.listSnippets();
      setSnippets(data.snippets);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSnippets();
    }
  }, [isOpen, isAuthenticated]);

  const handleSaveSnippet = async () => {
    if (!newTitle.trim()) {
      setErrorMsg('Please enter a snippet title.');
      return;
    }
    setErrorMsg(null);

    if (!isAuthenticated) {
      // Save locally
      const localItem: PlaygroundSnippet = {
        id: `local_${Date.now()}`,
        userId: 'guest',
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        language: currentLanguage,
        code: currentCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [localItem, ...snippets];
      setSnippets(updated);
      localStorage.setItem('climb1600_pg_local_snippets', JSON.stringify(updated));
      setNewTitle('');
      setNewDesc('');
      return;
    }

    try {
      const resp = await playgroundApi.saveSnippet({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        language: currentLanguage,
        code: currentCode,
      });
      setSnippets((prev) => [resp.snippet, ...prev]);
      setNewTitle('');
      setNewDesc('');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return;
    if (!isAuthenticated) {
      const updated = snippets.filter((s) => s.id !== id);
      setSnippets(updated);
      localStorage.setItem('climb1600_pg_local_snippets', JSON.stringify(updated));
      return;
    }
    try {
      await playgroundApi.deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const filtered = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <BookmarksIcon size={18} semantic="primary" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Saved Code Snippets</h2>
            {!isAuthenticated && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                Local Guest Storage
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Save Current Code Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h3 className="font-bold text-slate-200">Save Active Workspace as Snippet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Snippet Title (e.g. DSU with Rollback)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={120}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Description or problem tag (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                maxLength={500}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            {errorMsg && <p className="text-rose-400 text-xs">{errorMsg}</p>}
            <button
              onClick={handleSaveSnippet}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <SaveIcon size={14} />
              <span>Save Current Code ({LANGUAGE_DETAILS[currentLanguage].label})</span>
            </button>
          </div>

          {/* Search / Filter */}
          <input
            type="text"
            placeholder="Search saved snippets by title or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />

          {/* Snippet List */}
          <div className="space-y-2.5">
            {isLoading ? (
              <p className="text-slate-500 text-center py-6">Loading snippets...</p>
            ) : filtered.length === 0 ? (
              <p className="text-slate-500 text-center py-6 italic">No saved snippets found.</p>
            ) : (
              filtered.map((snip) => (
                <div
                  key={snip.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">{snip.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                        {snip.language}
                      </span>
                    </div>
                    {snip.description && <p className="text-slate-400 text-[11px] truncate">{snip.description}</p>}
                    <span className="text-slate-600 text-[10px]">
                      Updated: {new Date(snip.updatedAt || snip.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadSnippet(snip.code, snip.language);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold border border-indigo-500/30 text-xs cursor-pointer"
                    >
                      Load into Editor
                    </button>
                    <button
                      onClick={() => handleDeleteSnippet(snip.id)}
                      title="Delete snippet"
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <DeleteIcon size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-Component: Execution History Drawer ───────────────────────────────

interface ExecutionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExecutionHistoryItem[];
  onClearHistory: () => void;
  onRestore: (item: ExecutionHistoryItem) => void;
}

const ExecutionHistoryDrawer: React.FC<ExecutionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onRestore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full sm:w-[420px] bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <SubmissionHistoryIcon size={16} semantic="primary" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Execution History</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-slate-400 hover:text-rose-400 text-xs cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          {history.length === 0 ? (
            <p className="text-slate-500 text-center py-10 italic">No execution runs recorded in this session.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-3 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-indigo-300 uppercase">{item.language}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        item.status === 'OK'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <span className="text-slate-500">{item.timestamp}</span>
                </div>

                <pre className="font-mono text-[10px] bg-slate-950 p-1.5 rounded text-slate-400 truncate">
                  {item.codePreview}
                </pre>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    {item.durationMs ? `${item.durationMs}ms` : ''}
                  </span>
                  <button
                    onClick={() => onRestore(item)}
                    className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold cursor-pointer"
                  >
                    Restore Code
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
