import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileText,
  Save,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CFProblem, ProblemAttempt, ProgrammingLanguage } from '../types';
import { storageService } from '../services/storage';
import { aiCoachService } from '../services/aiCoach';

interface ProblemWorkspaceModalProps {
  problem: CFProblem;
  onClose: () => void;
  onAttemptLogged: (attempt: ProblemAttempt) => void;
  preferredLanguage?: ProgrammingLanguage;
}

export const ProblemWorkspaceModal: React.FC<ProblemWorkspaceModalProps> = ({
  problem,
  onClose,
  onAttemptLogged,
  preferredLanguage = 'cpp20',
}) => {
  const problemId = `${problem.contestId || ''}${problem.index}`;
  const cfUrl = problem.contestId
    ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
    : `https://codeforces.com/problemset`;

  // Language & Code
  const [language, setLanguage] = useState<ProgrammingLanguage>(preferredLanguage);
  const [code, setCode] = useState<string>('');
  const [approachNotes, setApproachNotes] = useState<string>('');
  const [complexityNotes, setComplexityNotes] = useState<string>('');

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Socratic Hint Ladder
  const [hintLevel, setHintLevel] = useState<number>(0); // 0 = none, 1-5, 6 = editorial
  const [hintLoading, setHintLoading] = useState<boolean>(false);
  const [hintHistory, setHintHistory] = useState<{ level: number; text: string }[]>([]);

  // Local test runner simulation
  const [sampleInput, setSampleInput] = useState<string>('4\n1 2 3 4');
  const [sampleOutput, setSampleOutput] = useState<string | null>(null);

  // Outcome recording
  const [outcome, setOutcome] = useState<ProblemAttempt['outcome']>('solved_independently');
  const [verdict, setVerdict] = useState<ProblemAttempt['officialVerdict']>('UNSUBMITTED');
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Load draft from storage on mount
  useEffect(() => {
    const draft = storageService.getDraft(problemId);
    if (draft) {
      setCode(draft.code || '');
      setLanguage((draft.language as ProgrammingLanguage) || preferredLanguage);
      setApproachNotes(draft.notes || '');
      setComplexityNotes(draft.complexity || '');
    } else {
      // Default boilerplate
      if (preferredLanguage === 'python') {
        setCode(`import sys\n\ndef solve():\n    # Read input\n    pass\n\nif __name__ == '__main__':\n    solve()\n`);
      } else {
        setCode(`#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nvoid solve() {\n    // Write your solution here\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    solve();\n    return 0;\n}\n`);
      }
    }
  }, [problemId, preferredLanguage]);

  // Timer tick
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const handleSaveDraft = () => {
    storageService.saveDraft(problemId, {
      code,
      language,
      notes: approachNotes,
      complexity: complexityNotes,
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Request next Socratic hint
  const handleRequestNextHint = async () => {
    const nextLevel = Math.min(6, hintLevel + 1);
    setHintLoading(true);
    try {
      const response = await aiCoachService.getHint(
        `${problem.name} (${problem.contestId || ''}${problem.index})`,
        nextLevel,
        approachNotes,
        language
      );
      setHintLevel(nextLevel);
      setHintHistory((prev) => [
        ...prev,
        { level: nextLevel, text: response.message },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const handleRunSample = () => {
    // Client-side simulation & sanity guidance
    setSampleOutput(`[Local Simulation Engine]\nInputs parsed: ${sampleInput.trim().split('\n').length} lines.\nCode drafted in ${language.toUpperCase()}.\nTo verify official acceptance against hidden tests, submit on Codeforces via the external link.`);
  };

  const handleLogAttempt = () => {
    const attempt: ProblemAttempt = {
      id: `attempt_${Date.now()}`,
      problemId,
      contestId: problem.contestId,
      index: problem.index,
      name: problem.name,
      rating: problem.rating,
      tags: problem.tags,
      url: cfUrl,
      startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      timeSpentSeconds: secondsElapsed,
      hintsUsedCount: hintHistory.length,
      highestHintLevel: hintLevel,
      outcome,
      officialVerdict: verdict,
      selfReported: verdict !== 'OK',
      userCode: code,
      codeLanguage: language,
      approachNotes,
      complexityNotes,
    };

    storageService.saveAttempt(attempt);
    handleSaveDraft();
    onAttemptLogged(attempt);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-4 overflow-hidden`}>
      <div
        className={`w-full flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-200 overflow-hidden ${
          isFullscreen ? 'h-full w-full max-w-none' : 'max-w-6xl h-[92vh]'
        }`}
      >
        {/* Workspace Header */}
        <header className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
              {problem.contestId ? `${problem.contestId}${problem.index}` : problem.index}
            </span>
            <h2 className="text-base font-bold text-white truncate max-w-xs md:max-w-md">
              {problem.name}
            </h2>
            {problem.rating && (
              <span className="rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs px-2 py-0.5 font-semibold">
                Rating {problem.rating}
              </span>
            )}
            <a
              href={cfUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              <span>Codeforces</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono">
              <span className="font-bold text-slate-200">{formatTimer(secondsElapsed)}</span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                title={isTimerRunning ? 'Pause' : 'Resume'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>

            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-800 px-2.5 py-1 bg-slate-950 cursor-pointer"
            >
              <Save className="w-3 h-3 text-cyan-400" />
              <span>{isSavedToast ? 'Saved!' : 'Save Draft'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-rose-400 p-1 rounded cursor-pointer"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Workspace Body (2 Columns on Desktop) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Panel: Problem Information, Approach & Socratic Ladder */}
          <div className="lg:col-span-5 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
            {/* Step Solving Flow indicator */}
            <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-3 space-y-1 text-xs text-slate-300">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>The 10-Step Solving Method</span>
              </div>
              <p className="text-[11px] text-slate-400">
                1. Read statement &bull; 2. Constraints &bull; 3. Invariants &bull; 4. Brute force &bull; 5. Complexity &bull; 6. Optimize &bull; 7. Edge Cases &bull; 8. Implement &bull; 9. Submit &bull; 10. Reflect
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Approach Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>My Approach & Observations</span>
              </label>
              <textarea
                rows={3}
                value={approachNotes}
                onChange={(e) => setApproachNotes(e.target.value)}
                placeholder="Write your intuition here before writing code. (e.g. 'Since N <= 10^5, sort first then use two pointers...')"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Complexity Estimator */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Complexity Analysis
              </label>
              <input
                type="text"
                value={complexityNotes}
                onChange={(e) => setComplexityNotes(e.target.value)}
                placeholder="Time: O(N log N), Space: O(N)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Socratic Hint Ladder */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Socratic Hint Ladder ({hintLevel}/5)</span>
                </div>
                <span className="text-[10px] text-slate-400">Guiding hints, never spoilers</span>
              </div>

              {hintHistory.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {hintHistory.map((h, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/90 text-xs space-y-1"
                    >
                      <span className="font-bold text-indigo-400 text-[10px] uppercase">
                        {h.level === 6 ? 'Full Editorial' : `Hint ${h.level}`}
                      </span>
                      <p className="text-slate-200 whitespace-pre-line leading-relaxed">{h.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {hintLevel < 6 && (
                <button
                  type="button"
                  onClick={handleRequestNextHint}
                  disabled={hintLoading}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 py-2 px-3 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {hintLoading
                      ? 'Consulting Coach...'
                      : hintLevel === 0
                      ? 'Request Hint 1 (Core Observation)'
                      : hintLevel === 1
                      ? 'Request Hint 2 (Guiding Question)'
                      : hintLevel === 2
                      ? 'Request Hint 3 (Candidate Technique)'
                      : hintLevel === 3
                      ? 'Request Hint 4 (Algorithm Outline)'
                      : hintLevel === 4
                      ? 'Request Hint 5 (Pseudocode)'
                      : 'Show Full Editorial Explanation'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Code Editor & Verdict Submission */}
          <div className="lg:col-span-7 flex flex-col p-4 space-y-4 overflow-y-auto">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="cpp20">C++20 (G++ 11.2)</option>
                  <option value="cpp17">C++17</option>
                  <option value="python">Python 3 / PyPy3</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="flex-1 min-h-[260px] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
              <div className="bg-slate-900/60 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>solution.{language.startsWith('cpp') ? 'cpp' : 'py'}</span>
                <span>Tab / 4 spaces</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Implement your solution here..."
                spellCheck={false}
                className="w-full flex-1 p-3 bg-transparent text-slate-100 font-mono-code text-xs leading-relaxed resize-none focus:outline-none focus:ring-0"
              />
            </div>

            {/* Sample Input Test Simulator */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Sample Test Input</span>
                <button
                  type="button"
                  onClick={handleRunSample}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-cyan-400" />
                  <span>Dry Run</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-slate-200 focus:outline-none"
              />
              {sampleOutput && (
                <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                  {sampleOutput}
                </div>
              )}
            </div>

            {/* Record Official Codeforces Verdict */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Log Actual Result
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Truthful metrics only: Copy your code, submit on Codeforces, then record the actual verdict.
                  </p>
                </div>
                <a
                  href={cfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-1.5 transition-all shadow-sm"
                >
                  <span>Submit on Codeforces</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'OK' as ProblemAttempt['officialVerdict'], label: 'Accepted (OK)', color: 'text-emerald-400' },
                  { id: 'WRONG_ANSWER' as ProblemAttempt['officialVerdict'], label: 'Wrong Answer', color: 'text-rose-400' },
                  { id: 'TIME_LIMIT_EXCEEDED' as ProblemAttempt['officialVerdict'], label: 'TLE', color: 'text-amber-400' },
                  { id: 'COMPILATION_ERROR' as ProblemAttempt['officialVerdict'], label: 'Compile Error', color: 'text-purple-400' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVerdict(v.id);
                      if (v.id === 'OK') {
                        setOutcome(hintLevel === 0 ? 'solved_independently' : 'solved_with_hints');
                      } else {
                        setOutcome('attempted_gave_up');
                      }
                    }}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      verdict === v.id
                        ? 'border-indigo-500 bg-indigo-950/60 font-bold ring-1 ring-indigo-500 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={v.color}>{v.label}</span>
                  </button>
                ))}
              </div>

              {/* Log Attempt Button */}
              <button
                type="button"
                onClick={handleLogAttempt}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white font-bold py-2.5 text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Attempt & Update Training Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
