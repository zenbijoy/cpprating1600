import React, { useState, useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  HintIcon,
  WarningStatusIcon,
  CloseIcon,
  BookmarksIcon,
  ExternalLinkIcon,
  CodeFileIcon,
  ThinkingIcon,
  CodingBracketsIcon,
  SunIcon,
  MoonIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  RunCodeIcon,
  DownloadIcon,
  ListViewIcon,
  AddIcon,
  AskAQuestionIcon,
  CommunityIcon as UsersIcon,
} from './icons';
import {
  CFProblem,
  MistakeCategory,
  MistakeRecord,
  ProblemAttempt,
  ProblemDetail,
  ProblemTestCase,
  ProblemTestCaseResult,
  ProgrammingLanguage,
  SubmissionStatus,
} from '../types';
import { storageService, cfStorageService } from '../services/storage';
import { aiCoachService } from '../services/aiCoach';
import { codeforcesService } from '../services/codeforces';
import { executionService } from '../services/execution';
import { getProblemDetail } from '../data/curatedProblemDetails';
import { evaluateTestCaseResult } from '../utils/testcaseRunner';
import { useToast } from './Toast';
import { MathText } from './MathText';

interface ProblemWorkspaceModalProps {
  problem: CFProblem;
  onClose: () => void;
  onAttemptLogged: (attempt: ProblemAttempt) => void;
  preferredLanguage?: ProgrammingLanguage;
  cfHandle?: string;
  onSaveMistake?: (mistake: MistakeRecord) => void;
  allProblems?: CFProblem[];
  onSelectProblem?: (prob: CFProblem) => void;
  onAutopsyRequested?: (code: string, verdict: string, problem: CFProblem) => void;
  initialCode?: string;
  onAskCommunity?: (code: string, problem: CFProblem) => void;
}

const HINT_DESCRIPTIONS = [
  'Level 1 — Gentle Hint: Conceptual nudge pointing to the problem essence.',
  'Level 2 — Observation: An important property or invariant.',
  'Level 3 — Algorithm Direction: Suitable algorithmic technique without code.',
  'Level 4 — Pseudocode: Structured algorithm outline and loops.',
  'Level 5 — Code Review: Reviews your current editor implementation for bugs.',
  'Level 6 — Full Explanation: Masterclass complete proof, complexity, and solution.',
];

const LANGUAGE_CONFIGS: {
  id: ProgrammingLanguage;
  label: string;
  monacoLang: string;
  ext: string;
}[] = [
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript', ext: 'js' },
  { id: 'python', label: 'Python', monacoLang: 'python', ext: 'py' },
  { id: 'java', label: 'Java', monacoLang: 'java', ext: 'java' },
  { id: 'cpp20', label: 'C++', monacoLang: 'cpp', ext: 'cpp' },
];

export const ProblemWorkspaceModal: React.FC<ProblemWorkspaceModalProps> = ({
  problem,
  onClose,
  onAttemptLogged,
  preferredLanguage = 'javascript',
  cfHandle = '',
  onSaveMistake,
  initialCode,
  onAskCommunity,
}) => {
  const { success, error: toastError, info } = useToast();
  const problemDetail: ProblemDetail = useMemo(() => getProblemDetail(problem), [problem]);
  const problemId = `${problem.contestId || ''}${problem.index}`;

  const cfUrl = problem.contestId
    ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
    : `https://codeforces.com/problemset`;

  // Language & Code
  const [language, setLanguage] = useState<ProgrammingLanguage>(preferredLanguage || 'javascript');
  const [code, setCode] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Bookmarking
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => cfStorageService.isBookmarked(problemId));

  // Test Cases State
  const [testCases, setTestCases] = useState<ProblemTestCase[]>(() => problemDetail.testCases);
  const [testCaseResults, setTestCaseResults] = useState<ProblemTestCaseResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [editingTestCaseId, setEditingTestCaseId] = useState<number | null>(null);

  // Socratic Hint Ladder
  const [showHintsDrawer, setShowHintsDrawer] = useState<boolean>(false);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hintLoading, setHintLoading] = useState<boolean>(false);
  const [hintHistory, setHintHistory] = useState<{ level: number; text: string }[]>([]);
  const [pendingHintLevel, setPendingHintLevel] = useState<number | null>(null);
  const [showHintConfirmModal, setShowHintConfirmModal] = useState<boolean>(false);

  // Mistake Notebook Logging
  const [showMistakeModal, setShowMistakeModal] = useState<boolean>(false);
  const [mistakeCategory, setMistakeCategory] = useState<MistakeCategory>('boundary_case');
  const [mistakeWhyFailed, setMistakeWhyFailed] = useState<string>('');
  const [mistakeLesson, setMistakeLesson] = useState<string>('');

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  // Mobile active tab ('statement' | 'editor' | 'testcases' | 'hints')
  const [mobileTab, setMobileTab] = useState<'statement' | 'editor' | 'testcases' | 'hints'>('statement');

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update test cases when problem changes
  useEffect(() => {
    setTestCases(problemDetail.testCases);
    setTestCaseResults([]);
  }, [problemDetail]);

  // Load starter code or draft
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      return;
    }

    const draft = cfStorageService.getDraft(`${problemId}_${language}`, language);
    if (draft && draft.code) {
      setCode(draft.code);
      return;
    }

    if (problemDetail.starterCode?.[language]) {
      setCode(problemDetail.starterCode[language]!);
    } else {
      const templates = storageService.getSettings().competitiveProgramming?.codeTemplates;
      if (templates?.[language]) {
        setCode(templates[language]);
      } else {
        setCode('// Write your solution here\n');
      }
    }
  }, [problemId, language, initialCode, problemDetail]);

  // Auto-save draft
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      cfStorageService.saveDraft({
        problemId: `${problemId}_${language}`,
        language,
        code,
        lastUpdated: new Date().toISOString(),
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [code, problemId, language]);

  const toggleBookmark = () => {
    if (isBookmarked) {
      cfStorageService.removeBookmark(problemId);
      setIsBookmarked(false);
      info('Problem removed from bookmarks');
    } else {
      cfStorageService.saveBookmark({
        problemId,
        contestId: problem.contestId,
        index: problem.index,
        name: problem.name,
        rating: problem.rating,
        tags: problem.tags,
        savedAt: new Date().toISOString(),
      });
      setIsBookmarked(true);
      success('Problem saved to bookmarks!');
    }
  };

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    const draft = cfStorageService.getDraft(`${problemId}_${newLang}`, newLang);
    if (draft && draft.code) {
      setCode(draft.code);
    } else if (problemDetail.starterCode?.[newLang]) {
      setCode(problemDetail.starterCode[newLang]!);
    } else {
      const templates = storageService.getSettings().competitiveProgramming?.codeTemplates;
      setCode(templates?.[newLang] || '// Write your code here...\n');
    }
  };

  // Run Test Cases
  const handleRunTestCases = async () => {
    setIsRunningTests(true);
    // Set all cases to RUNNING
    setTestCaseResults(
      testCases.map((tc) => ({
        testCaseId: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        status: 'RUNNING',
      }))
    );

    try {
      const res = await executionService.executeTestCases({
        code,
        language,
        testCases,
        timeoutMs: 3000,
      });

      setTestCaseResults(res.results);
      if (res.allPassed) {
        success(`All ${res.totalCount} test cases passed!`, 'Test Run Successful');
      } else {
        toastError(`${res.passedCount} of ${res.totalCount} test cases passed. Review discrepancies.`, 'Test Cases Failed');
      }
    } catch (err: any) {
      toastError(err.message || 'Execution failed to connect to runner.');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit Solution
  const handleSubmit = async () => {
    setIsRunningTests(true);
    try {
      const res = await executionService.executeTestCases({
        code,
        language,
        testCases,
        timeoutMs: 3000,
      });
      setTestCaseResults(res.results);

      const attempt: ProblemAttempt = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        problemId,
        contestId: problem.contestId,
        index: problem.index || 'A',
        name: problem.name,
        rating: problem.rating,
        tags: problem.tags,
        url: cfUrl,
        startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        timeSpentSeconds: secondsElapsed,
        hintsUsedCount: hintLevel,
        highestHintLevel: hintLevel,
        outcome: res.allPassed ? (hintLevel === 0 ? 'solved_independently' : 'solved_with_hints') : 'attempted_gave_up',
        officialVerdict: res.allPassed ? 'OK' : 'WRONG_ANSWER',
        selfReported: false,
        userCode: code,
        codeLanguage: language,
      };

      onAttemptLogged(attempt);

      if (res.allPassed) {
        success(`Accepted! Solved in ${Math.round(secondsElapsed / 60)} minutes with verdict Pass.`, 'Submission Accepted');
      } else {
        toastError('Failed sample test cases. You can log an autopsy to your Mistake Notebook.', 'Wrong Answer');
      }
    } catch (err: any) {
      toastError(err.message || 'Submission evaluation error.');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Clear Code
  const handleClearCode = () => {
    if (problemDetail.starterCode?.[language]) {
      setCode(problemDetail.starterCode[language]!);
    } else {
      setCode('');
    }
    info('Editor reset to starter template');
  };

  // Download Code
  const handleDownloadCode = () => {
    const activeCfg = LANGUAGE_CONFIGS.find((l) => l.id === language) || LANGUAGE_CONFIGS[0];
    const filename = `${problem.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_solution.${activeCfg.ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    success(`Downloaded ${filename}`);
  };

  // Add Custom Test Case
  const handleAddTestCase = () => {
    const nextId = testCases.length > 0 ? Math.max(...testCases.map((t) => t.id)) + 1 : 1;
    const newCase: ProblemTestCase = {
      id: nextId,
      input: '',
      expectedOutput: '',
      explanation: 'Custom Test Case',
    };
    setTestCases([...testCases, newCase]);
    setEditingTestCaseId(nextId);
  };

  // Hint Ladder Request
  const handleConfirmNextHint = async () => {
    if (!pendingHintLevel) return;
    const targetLevel = pendingHintLevel;
    setShowHintConfirmModal(false);
    setHintLoading(true);
    try {
      const response = await aiCoachService.getHint(
        `${problem.name} (${problemId})`,
        targetLevel,
        code.slice(0, 500),
        language
      );
      setHintLevel(targetLevel);
      setHintHistory((prev) => [...prev, { level: targetLevel, text: response.message }]);
      setShowHintsDrawer(true);
    } catch (err: any) {
      toastError('Could not load hint: ' + err.message);
    } finally {
      setHintLoading(false);
      setPendingHintLevel(null);
    }
  };

  // Save Mistake
  const handleSaveMistakeRecord = () => {
    if (!onSaveMistake) return;
    const mistake: MistakeRecord = {
      id: `mistake_${Date.now()}`,
      problemId,
      problemName: problem.name,
      problemUrl: cfUrl,
      rating: problem.rating,
      tags: problem.tags,
      category: mistakeCategory,
      originalApproach: 'Sample test verification failure',
      whyItFailed: mistakeWhyFailed || 'Failed sample testcases during practice session.',
      correctObservation: '',
      correctApproach: '',
      personalLesson: mistakeLesson || 'Watch constraints and edge cases.',
      codeSnippet: code,
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      intervalDays: 1,
      reviewCount: 0,
      status: 'scheduled',
    };
    onSaveMistake(mistake);
    setShowMistakeModal(false);
    success('Mistake logged to Mistake Notebook for scheduled spaced revision!');
  };

  const currentLangConfig = LANGUAGE_CONFIGS.find((l) => l.id === language) || LANGUAGE_CONFIGS[0];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-sm transition-all ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`w-full h-full max-h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all ${
          isDarkMode
            ? 'bg-slate-950 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        } ${isFullscreen ? 'max-h-screen rounded-none border-none' : ''}`}
      >
        {/* Top Navbar */}
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 border-b text-xs shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight truncate">
              {problemId} · {problem.name}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] bg-slate-200/60 dark:bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0">
              ⏱ {Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                setShowHintsDrawer(true);
                setMobileTab('hints');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-[11px] sm:text-xs cursor-pointer"
            >
              <HintIcon size={13} semantic="success" />
              <span className="hidden sm:inline">Socratic Hints</span>
              <span>({hintLevel}/6)</span>
            </button>

            <button
              onClick={() => setShowMistakeModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors text-[11px] sm:text-xs cursor-pointer"
              title="Log Mistake in Notebook"
            >
              <WarningStatusIcon size={13} semantic="warning" />
              <span className="hidden sm:inline">Log Mistake</span>
            </button>

            {onAskCommunity && (
              <button
                onClick={() => onAskCommunity(code, problem)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold transition-colors cursor-pointer text-xs"
                title="Discuss this problem with the community"
              >
                <AskAQuestionIcon size={13} />
                <span>Ask Community</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Workspace"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher Bar (Visible on mobile screens) */}
        <div className="md:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-1 gap-1 shrink-0">
          <button
            onClick={() => setMobileTab('statement')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              mobileTab === 'statement'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            📋 Problem
          </button>
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              mobileTab === 'editor'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            💻 Editor
          </button>
          <button
            onClick={() => setMobileTab('testcases')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              mobileTab === 'testcases'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>🧪 Tests</span>
            {testCaseResults.length > 0 && (
              <span className={`text-[9px] px-1 rounded-full font-mono font-bold ${
                testCaseResults.every((r) => r.status === 'PASS') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {testCaseResults.filter((r) => r.status === 'PASS').length}/{testCaseResults.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setMobileTab('hints');
              setShowHintsDrawer(true);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              mobileTab === 'hints'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            💡 Hints ({hintLevel}/6)
          </button>
        </div>

        {/* Main Workspace Grid (Left Statement, Right Code Editor & Test Cases) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* ══════ LEFT PANE: Problem Statement, Constraints & Examples ══════ */}
          <div
            className={`w-full md:w-[48%] lg:w-[45%] flex flex-col border-r overflow-y-auto p-4 sm:p-5 md:p-6 space-y-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
            } ${mobileTab !== 'statement' && mobileTab !== 'hints' ? 'hidden md:flex' : 'flex'}`}
          >
            {/* Header: Title, Difficulty Tag, Bookmark */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {problemDetail.name}
                  </h1>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${
                      problemDetail.difficultyLabel === 'Easy'
                        ? 'bg-[#10b981]'
                        : problemDetail.difficultyLabel === 'Medium'
                        ? 'bg-[#ef4444]'
                        : 'bg-[#dc2626]'
                    }`}
                  >
                    {problemDetail.difficultyLabel}
                  </span>
                  <button
                    onClick={toggleBookmark}
                    className="p-1 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
                  >
                    {isBookmarked ? (
                      <BookmarksIcon size={20} semantic="primary" />
                    ) : (
                      <BookmarksIcon size={20} className="text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                {problem.rating && (
                  <div className="text-xs text-slate-500 font-medium">
                    Codeforces Rating: {problem.rating} • Index: {problem.index}
                  </div>
                )}
              </div>

              {problem.contestId && (
                <a
                  href={cfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="View on Codeforces"
                >
                  <ExternalLinkIcon size={16} />
                </a>
              )}
            </div>

            {/* Section 1: Description */}
            <div className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                <CodeFileIcon size={16} className="text-slate-500" />
                Description
              </h2>
              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-normal">
                <MathText text={problemDetail.description} inline={false} />
              </div>
            </div>

            {/* Section 2: Constraints */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Constraints
              </h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400 font-mono">
                {problemDetail.constraints.map((c, i) => (
                  <li key={i}>
                    <MathText text={c} inline />
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Examples */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Examples
              </h2>
              {problemDetail.examples.map((ex, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl font-mono text-xs space-y-1.5 border transition-all ${
                    isDarkMode
                      ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-500">Input: </span>
                    <span className="text-slate-900 dark:text-slate-100">{ex.input}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Output: </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-sans">
                      <span className="font-semibold">Explanation: </span>
                      <MathText text={ex.explanation} inline />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Socratic Hints Collapsible Card */}
            {showHintsDrawer && (
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThinkingIcon size={16} semantic="success" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Socratic AI Coach Hints
                    </span>
                  </div>
                  <button
                    onClick={() => setShowHintsDrawer(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>

                {hintHistory.length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Stuck on an invariant or algorithmic choice? Request progressive graduated hints without giving away the solution.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {hintHistory.map((h, i) => (
                      <div key={i} className="text-xs space-y-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="font-bold text-emerald-600">Level {h.level}:</span>
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          <MathText text={h.text} inline={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hintLevel < 6 && (
                  <button
                    onClick={() => {
                      setPendingHintLevel(hintLevel + 1);
                      setShowHintConfirmModal(true);
                    }}
                    disabled={hintLoading}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    {hintLoading ? 'Generating Hint...' : `Unlock Hint Level ${hintLevel + 1}`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ══════ RIGHT PANE: Language Tabs, Editor, Action Buttons, Test Cases ══════ */}
          <div
            className={`w-full md:w-[52%] lg:w-[55%] flex flex-col min-h-0 ${
              isDarkMode ? 'bg-slate-950' : 'bg-[#fcfdfd]'
            } ${mobileTab !== 'editor' && mobileTab !== 'testcases' ? 'hidden md:flex' : 'flex'}`}
          >
            {/* Top Toolbar: Language switcher pills, theme & fullscreen toggles */}
            <div
              className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${
                isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Language Pills matching Reference Image 1 */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {LANGUAGE_CONFIGS.map((lang) => {
                  const isActive = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#059669] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CodingBracketsIcon size={14} />
                      <span>{lang.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Utility Toggles: Dark/Light Mode, Fullscreen */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-1.5 rounded-lg hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle Light/Dark Workspace"
                >
                  {isDarkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <ExitFullscreenIcon size={16} /> : <FullscreenIcon size={16} />}
                </button>
              </div>
            </div>

            {/* Monaco Code Editor */}
            <div className={`flex-1 min-h-[220px] relative ${mobileTab === 'testcases' ? 'hidden md:block' : 'block'}`}>
              <Editor
                height="100%"
                language={currentLangConfig.monacoLang}
                theme={isDarkMode ? 'vs-dark' : 'light'}
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{
                  fontSize: 14,
                  lineNumbers: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 4,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                }}
              />
            </div>

            {/* Button Toolbar matching Reference Image 1 (Run, Submit, Clear, Download) */}
            <div
              className={`flex items-center justify-between px-3 sm:px-4 py-2 border-t border-b shrink-0 overflow-x-auto ${
                isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
              } ${mobileTab === 'testcases' ? 'hidden md:flex' : 'flex'}`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleRunTestCases}
                  disabled={isRunningTests}
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <RunCodeIcon size={14} className="fill-white" />
                  <span>{isRunningTests ? 'Running...' : 'Run'}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isRunningTests}
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0"
                >
                  Submit
                </button>

                {onAskCommunity && (
                  <button
                    onClick={() => onAskCommunity(code, problem)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    title="Ask the community for help with this problem"
                  >
                    <AskAQuestionIcon size={14} />
                    <span>Ask Community</span>
                  </button>
                )}

                <button
                  onClick={handleClearCode}
                  className="px-3 py-1.5 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <CloseIcon size={14} />
                  <span>Clear</span>
                </button>

                <button
                  onClick={handleDownloadCode}
                  className="px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <DownloadIcon size={14} />
                  <span>Download</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center text-xs text-slate-500 font-medium">
                {testCases.length} Test Case{testCases.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* ══════ TEST CASES RESULTS PANEL matching Reference Image 1 ══════ */}
            <div
              className={`p-3 sm:p-4 border-t flex flex-col shrink-0 ${
                mobileTab === 'testcases' ? 'flex-1 max-h-none overflow-y-auto' : 'hidden md:flex max-h-[300px] overflow-y-auto'
              } ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListViewIcon size={16} className="text-slate-600 dark:text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Test Cases
                  </h3>
                </div>

                <button
                  onClick={handleAddTestCase}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  <AddIcon size={14} />
                  <span>Add Case</span>
                </button>
              </div>

              {/* Table matching Reference Image 1: Test Case, Input, Expected Output, Result */}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b text-slate-500 dark:text-slate-400 font-semibold ${
                        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <th className="py-2.5 px-3 w-20">Test Case</th>
                      <th className="py-2.5 px-3">Input</th>
                      <th className="py-2.5 px-3">Expected Output</th>
                      <th className="py-2.5 px-3 w-24 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {testCases.map((tc, idx) => {
                      const res = testCaseResults.find((r) => r.testCaseId === tc.id);
                      return (
                        <tr
                          key={tc.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors ${
                            editingTestCaseId === tc.id ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {idx + 1}
                          </td>

                          <td className="py-2 px-3 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                            {editingTestCaseId === tc.id ? (
                              <input
                                type="text"
                                value={tc.input}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTestCases(testCases.map((t) => (t.id === tc.id ? { ...t, input: val } : t)));
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            ) : (
                              <span className="truncate block max-w-xs">{tc.input || '—'}</span>
                            )}
                          </td>

                          <td className="py-2 px-3 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                            {editingTestCaseId === tc.id ? (
                              <input
                                type="text"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTestCases(testCases.map((t) => (t.id === tc.id ? { ...t, expectedOutput: val } : t)));
                                }}
                                onBlur={() => setEditingTestCaseId(null)}
                                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            ) : (
                              <span className="truncate block max-w-xs">{tc.expectedOutput || '—'}</span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-right">
                            {res?.status === 'PASS' ? (
                              <span className="inline-block px-3 py-0.5 rounded-full bg-[#10b981] text-white text-[11px] font-bold shadow-sm">
                                Pass
                              </span>
                            ) : res?.status === 'FAIL' ? (
                              <span
                                className="inline-block px-3 py-0.5 rounded-full bg-[#ef4444] text-white text-[11px] font-bold shadow-sm cursor-help"
                                title={`Actual: ${res.actualOutput || 'none'}`}
                              >
                                Fail
                              </span>
                            ) : res?.status === 'RUNNING' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                                Running
                              </span>
                            ) : res?.status === 'COMPILATION_ERROR' ? (
                              <span
                                className="inline-block px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold cursor-help"
                                title={res.errorMessage}
                              >
                                Comp Error
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Socratic Hint Confirmation Spoiler Modal */}
      {showHintConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <HintIcon size={20} semantic="warning" />
              <span>Unlock Hint Level {pendingHintLevel}?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pendingHintLevel && HINT_DESCRIPTIONS[pendingHintLevel - 1]}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowHintConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNextHint}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Reveal Hint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mistake Notebook Modal */}
      {showMistakeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <WarningStatusIcon size={16} semantic="warning" />
                Log to Mistake Notebook
              </h3>
              <button onClick={() => setShowMistakeModal(false)}>
                <CloseIcon size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Root-Cause Classification
                </label>
                <select
                  value={mistakeCategory}
                  onChange={(e) => setMistakeCategory(e.target.value as MistakeCategory)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="boundary_case">Boundary / Edge Case</option>
                  <option value="integer_overflow">Integer Overflow (int vs long long)</option>
                  <option value="indexing_error">Indexing Error (0-based vs 1-based)</option>
                  <option value="wrong_observation">Wrong Observation</option>
                  <option value="misread_statement">Misread Statement</option>
                  <option value="wrong_complexity">Wrong Time/Space Complexity</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Why It Failed
                </label>
                <textarea
                  value={mistakeWhyFailed}
                  onChange={(e) => setMistakeWhyFailed(e.target.value)}
                  placeholder="Explain why the solution failed..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Personal Lesson & Future Prevention
                </label>
                <input
                  type="text"
                  value={mistakeLesson}
                  onChange={(e) => setMistakeLesson(e.target.value)}
                  placeholder="e.g. Always check N=1 and N=0 boundary inputs"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMistakeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMistakeRecord}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Mistake Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
