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
  RefreshCw,
  BookOpen,
  ListChecks,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CFProblem, MistakeCategory, MistakeRecord, ProblemAttempt, ProgrammingLanguage } from '../types';
import { storageService } from '../services/storage';
import { aiCoachService } from '../services/aiCoach';
import { codeforcesService } from '../services/codeforces';

interface ProblemWorkspaceModalProps {
  problem: CFProblem;
  onClose: () => void;
  onAttemptLogged: (attempt: ProblemAttempt) => void;
  preferredLanguage?: ProgrammingLanguage;
  cfHandle?: string;
  onSaveMistake?: (mistake: MistakeRecord) => void;
}

const SOLVING_STEPS = [
  { step: 1, label: 'Read Statement Carefully', desc: 'Identify exact input/output rules and what is asked.' },
  { step: 2, label: 'Check Constraints & Types', desc: 'Note N, M limits; watch for int overflow if product > 2*10^9.' },
  { step: 3, label: 'Trace Small Examples', desc: 'Work through sample testcases by hand on paper.' },
  { step: 4, label: 'Find Invariant / Monotonicity', desc: 'Does sorting help? Is the property monotonic (Binary Search)?' },
  { step: 5, label: 'Time Complexity Gate', desc: 'Usually 10^8 ops/sec. N<=10^5 requires O(N log N) or O(N).' },
  { step: 6, label: 'Structure Algorithm Outline', desc: 'Break down subroutines, edge condition checks, and loops.' },
  { step: 7, label: 'Edge Cases Checklist', desc: 'N=1, 0, duplicates, all negatives, maximum constraints.' },
  { step: 8, label: 'Clean Implementation', desc: 'Write fast I/O, clean variable names, correct indexing.' },
  { step: 9, label: 'Verify & Submit', desc: 'Run dry tests on boundary cases, then submit on Codeforces.' },
  { step: 10, label: 'Debrief & Log', desc: 'Catalog lessons learned or record mistake if WA/TLE.' },
];

export const ProblemWorkspaceModal: React.FC<ProblemWorkspaceModalProps> = ({
  problem,
  onClose,
  onAttemptLogged,
  preferredLanguage = 'cpp20',
  cfHandle,
  onSaveMistake,
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

  // 10-Step Solving Method Checklist
  const [showMethodChecklist, setShowMethodChecklist] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([1, 2]));

  // Local test runner simulation
  const [sampleInput, setSampleInput] = useState<string>('4\n1 2 3 4');
  const [sampleOutput, setSampleOutput] = useState<string | null>(null);

  // Live Codeforces Verification
  const [activeHandle, setActiveHandle] = useState<string>(cfHandle || '');
  const [verifyingCf, setVerifyingCf] = useState<boolean>(false);
  const [cfVerificationMsg, setCfVerificationMsg] = useState<string | null>(null);
  const [verifiedSubmissionId, setVerifiedSubmissionId] = useState<number | null>(null);

  // Outcome & Verdict
  const [outcome, setOutcome] = useState<ProblemAttempt['outcome']>('solved_independently');
  const [verdict, setVerdict] = useState<ProblemAttempt['officialVerdict']>('UNSUBMITTED');
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Inline Mistake Cataloging Form
  const [showMistakeForm, setShowMistakeForm] = useState<boolean>(false);
  const [mistakeCategory, setMistakeCategory] = useState<MistakeCategory>('boundary_case');
  const [mistakeWhyFailed, setMistakeWhyFailed] = useState<string>('');
  const [mistakeLesson, setMistakeLesson] = useState<string>('');
  const [mistakeSavedNotice, setMistakeSavedNotice] = useState<boolean>(false);

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

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
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
    setSampleOutput(
      `[Local Dry-Run Engine]\nInputs parsed: ${sampleInput.trim().split('\n').length} lines.\nCode drafted in ${language.toUpperCase()}.\nTo verify official acceptance against hidden tests, submit on Codeforces via the external link.`
    );
  };

  // Live verification against official Codeforces API
  const handleVerifyFromCodeforces = async () => {
    if (!activeHandle.trim()) {
      setCfVerificationMsg('Please provide your Codeforces handle first.');
      return;
    }

    setVerifyingCf(true);
    setCfVerificationMsg(null);

    try {
      const submissions = await codeforcesService.getUserSubmissions(activeHandle.trim(), 15);
      // Find submission matching this problem
      const match = submissions.find((sub) => {
        const cMatch = !problem.contestId || sub.contestId === problem.contestId || sub.problem.contestId === problem.contestId;
        const iMatch = sub.problem.index.toUpperCase() === problem.index.toUpperCase();
        return cMatch && iMatch;
      });

      if (!match) {
        setCfVerificationMsg(`No recent submission found on Codeforces for ${problemId} under handle "${activeHandle}". Make sure you submitted!`);
      } else {
        setVerifiedSubmissionId(match.id);
        const cfVerdict = match.verdict;

        if (cfVerdict === 'OK') {
          setVerdict('OK');
          setOutcome(hintLevel === 0 ? 'solved_independently' : 'solved_with_hints');
          setCfVerificationMsg(`✓ Verified! Codeforces submission #${match.id}: Accepted (OK). All ${match.passedTestCount || 0} tests passed (${match.timeConsumedMillis || 0}ms)!`);
        } else if (cfVerdict === 'WRONG_ANSWER') {
          setVerdict('WRONG_ANSWER');
          setOutcome('attempted_gave_up');
          setCfVerificationMsg(`✗ Codeforces submission #${match.id}: Wrong Answer on test ${(match.passedTestCount || 0) + 1}.`);
          setShowMistakeForm(true);
        } else if (cfVerdict === 'TIME_LIMIT_EXCEEDED') {
          setVerdict('TIME_LIMIT_EXCEEDED');
          setOutcome('attempted_gave_up');
          setCfVerificationMsg(`⏱ Codeforces submission #${match.id}: Time Limit Exceeded on test ${(match.passedTestCount || 0) + 1}.`);
          setShowMistakeForm(true);
        } else if (cfVerdict === 'COMPILATION_ERROR') {
          setVerdict('COMPILATION_ERROR');
          setCfVerificationMsg(`⚠ Codeforces submission #${match.id}: Compilation Error.`);
        } else {
          setVerdict('UNSUBMITTED');
          setCfVerificationMsg(`Codeforces submission #${match.id}: ${cfVerdict || 'Pending verdict'}.`);
        }
      }
    } catch (err: any) {
      setCfVerificationMsg(err.message || 'Failed to query Codeforces API. Please self-report verdict below.');
    } finally {
      setVerifyingCf(false);
    }
  };

  // Save mistake to notebook
  const handleSaveMistakeToNotebook = () => {
    if (!onSaveMistake) return;

    const newMistake: MistakeRecord = {
      id: `m_${Date.now()}`,
      problemId: problemId.toUpperCase(),
      problemName: problem.name,
      problemUrl: cfUrl,
      rating: problem.rating,
      tags: problem.tags,
      category: mistakeCategory,
      originalApproach: approachNotes || 'Drafted in workspace',
      whyItFailed: mistakeWhyFailed || 'Failed official testcase',
      correctObservation: '',
      correctApproach: '',
      personalLesson: mistakeLesson || 'Be vigilant regarding constraints and edge cases.',
      codeSnippet: code.slice(0, 1000),
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 day
      intervalDays: 1,
      reviewCount: 0,
      status: 'scheduled',
    };

    onSaveMistake(newMistake);
    setMistakeSavedNotice(true);
    setTimeout(() => setMistakeSavedNotice(false), 2500);
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
      selfReported: verifiedSubmissionId === null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-4 overflow-hidden">
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

          <div className="flex items-center gap-2.5">
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

            {/* 10-Step Solving Method Toggle */}
            <button
              type="button"
              onClick={() => setShowMethodChecklist(!showMethodChecklist)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                showMethodChecklist
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">10-Step Method ({completedSteps.size}/10)</span>
            </button>

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

        {/* 10-Step Method Collapsible Banner */}
        {showMethodChecklist && (
          <div className="bg-[#0b0f19] border-b border-indigo-900/40 p-4 shrink-0 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-4 h-4" />
                <span>The 10-Step Problem Solving Routine</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowMethodChecklist(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close Checklist
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {SOLVING_STEPS.map((s) => {
                const done = completedSteps.has(s.step);
                return (
                  <div
                    key={s.step}
                    onClick={() => toggleStep(s.step)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      done
                        ? 'border-emerald-600/50 bg-emerald-950/30 text-emerald-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {done ? '✓' : s.step}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </div>
                    <p className="text-[10px] opacity-75 line-clamp-1">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Workspace Body (2 Columns on Desktop) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Panel: Problem Information, Approach & Socratic Ladder */}
          <div className="lg:col-span-5 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
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
                      ? 'Request Hint 1 (Key Observation)'
                      : hintLevel === 1
                      ? 'Request Hint 2 (Guiding Question)'
                      : hintLevel === 2
                      ? 'Request Hint 3 (Algorithm Paradigm)'
                      : hintLevel === 3
                      ? 'Request Hint 4 (Step Breakdown)'
                      : hintLevel === 4
                      ? 'Request Hint 5 (Pseudocode)'
                      : 'Unlock Full Editorial (Hint 6)'}
                  </span>
                </button>
              )}
            </div>

            {/* Inline Mistake Notebook Cataloger (if WA/TLE or requested) */}
            {showMistakeForm && (
              <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <BookOpen className="w-4 h-4" />
                    <span>Catalog Mistake in Spaced Repetition Notebook</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMistakeForm(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Hide
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Mistake Category
                    </label>
                    <select
                      value={mistakeCategory}
                      onChange={(e) => setMistakeCategory(e.target.value as MistakeCategory)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white"
                    >
                      <option value="boundary_case">Boundary Case (N=1, 0, extremes)</option>
                      <option value="integer_overflow">Integer Overflow (int vs long long)</option>
                      <option value="wrong_complexity">Wrong Complexity / TLE</option>
                      <option value="indexing_error">Indexing Error (0 vs 1 based)</option>
                      <option value="wrong_observation">Wrong Observation / Premise</option>
                      <option value="misread_statement">Misread Problem Statement</option>
                      <option value="implementation_bug">Implementation Bug</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Why It Failed
                    </label>
                    <input
                      type="text"
                      value={mistakeWhyFailed}
                      onChange={(e) => setMistakeWhyFailed(e.target.value)}
                      placeholder="e.g. Multiplied two ints exceeding 2*10^9"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Personal Takeaway / Rule to Remember
                    </label>
                    <input
                      type="text"
                      value={mistakeLesson}
                      onChange={(e) => setMistakeLesson(e.target.value)}
                      placeholder="e.g. Always cast (long long) before multiplying"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMistakeToNotebook}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 text-xs transition-all cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{mistakeSavedNotice ? '✓ Saved to Mistakes Deck!' : 'Save Mistake Flashcard'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Code Editor, Dry Run & Live CF Submission Check */}
          <div className="lg:col-span-7 flex flex-col p-4 space-y-3 bg-[#0d121f] overflow-y-auto">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Code Editor</span>
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="cpp20">C++20 (GCC)</option>
                  <option value="cpp17">C++17 (GCC)</option>
                  <option value="python">Python 3.10</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-800 px-2.5 py-1 bg-slate-900 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Textarea */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 flex flex-col min-h-[220px] max-h-[300px]">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-[10px] text-slate-500 font-mono">
                <span>{language === 'python' ? 'solution.py' : 'solution.cpp'}</span>
                <span>Tab / 4 spaces</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Implement your solution here..."
                spellCheck={false}
                className="w-full flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0"
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

            {/* Live Codeforces Verification & Submission Result */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Official Codeforces Verification</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Submit your solution on Codeforces, then verify automatically via the official API.
                  </p>
                </div>
                <a
                  href={cfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-1.5 transition-all shadow-sm self-start sm:self-auto shrink-0"
                >
                  <span>Open & Submit on Codeforces</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Handle input & Live API Query */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={activeHandle}
                  onChange={(e) => setActiveHandle(e.target.value)}
                  placeholder="Codeforces Handle"
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1"
                />
                <button
                  type="button"
                  onClick={handleVerifyFromCodeforces}
                  disabled={verifyingCf}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingCf ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{verifyingCf ? 'Querying API...' : 'Verify from CF'}</span>
                </button>
              </div>

              {cfVerificationMsg && (
                <div
                  className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                    verdict === 'OK'
                      ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                      : verdict === 'UNSUBMITTED'
                      ? 'border-slate-800 bg-slate-900/60 text-slate-400'
                      : 'border-rose-900/40 bg-rose-950/30 text-rose-300'
                  }`}
                >
                  {cfVerificationMsg}
                </div>
              )}

              {/* Manual Verdict Selector as fallback */}
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  Or Self-Report Verdict:
                </span>
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
                          setShowMistakeForm(true);
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
              </div>

              {/* Log Attempt Final Button */}
              <button
                type="button"
                onClick={handleLogAttempt}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white font-bold py-2.5 text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer mt-2"
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
