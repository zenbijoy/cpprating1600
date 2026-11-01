import React, { useState, useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
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
  CopyIcon,
  CheckIcon,
  SplitPanelControlIcon,
  EditorialIcon,
  ShieldIcon,
  RefreshIcon,
  CheckCircleIcon,
  TimerIcon,
  DeleteIcon,
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
} from '../types';
import { storageService, cfStorageService } from '../services/storage';
import { aiCoachService } from '../services/aiCoach';
import { executionService } from '../services/execution';
import { JoyCodeViewer } from './JoyCodeViewer';
import { getProblemDetail } from '../data/curatedProblemDetails';
import { evaluateTestCaseResult } from '../utils/testcaseRunner';
import { useToast } from './Toast';
import { MathText } from './MathText';
import { computeLineDiff } from '../utils/workspaceTools';
import { MobileCodeToolbar } from './MobileCodeToolbar';
import { ConfettiCanvas } from './common/ConfettiCanvas';
import { CodeforcesSubmissionModal } from './CodeforcesSubmissionModal';
import { isOldDefaultSolution, getDefaultTemplateForLanguage } from '../utils/codeTemplateUtils';

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
  shortLabel: string;
  monacoLang: string;
  ext: string;
}[] = [
  { id: 'cpp20', label: 'C++20 (GCC)', shortLabel: 'C++', monacoLang: 'cpp', ext: 'cpp' },
  { id: 'python', label: 'Python 3', shortLabel: 'Python', monacoLang: 'python', ext: 'py' },
  { id: 'java', label: 'Java 25', shortLabel: 'Java', monacoLang: 'java', ext: 'java' },
  { id: 'javascript', label: 'JavaScript', shortLabel: 'JS', monacoLang: 'javascript', ext: 'js' },
];

export const ProblemWorkspaceModal: React.FC<ProblemWorkspaceModalProps> = ({
  problem,
  onClose,
  onAttemptLogged,
  preferredLanguage = 'cpp20',
  cfHandle = '',
  onSaveMistake,
  initialCode,
  onAskCommunity,
  onAutopsyRequested,
}) => {
  const { success, error: toastError, info } = useToast();
  const problemDetail: ProblemDetail = useMemo(() => getProblemDetail(problem), [problem]);
  const problemId = `${problem.contestId || ''}${problem.index}`;

  const cfUrl = problem.contestId
    ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
    : `https://codeforces.com/problemset`;

  // Language & Code
  const [language, setLanguage] = useState<ProgrammingLanguage>(preferredLanguage || 'cpp20');
  const [code, setCode] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');

  // Monaco Editor Ref
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  // Bookmarking
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => cfStorageService.isBookmarked(problemId));

  // Test Cases State
  const [testCases, setTestCases] = useState<ProblemTestCase[]>(() => problemDetail.testCases);
  const [testCaseResults, setTestCaseResults] = useState<ProblemTestCaseResult[]>([]);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [isEditingTestCase, setIsEditingTestCase] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

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
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Active view tab for mobile / desktop
  // 'problem' | 'code' | 'tests' | 'hints'
  const [activeTab, setActiveTab] = useState<'problem' | 'code' | 'tests' | 'hints'>('problem');

  // Mobile overflow more menu
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showProblemMetaModal, setShowProblemMetaModal] = useState<boolean>(false);

  // Codeforces Solution Modal
  const [showSolutionModal, setShowSolutionModal] = useState<boolean>(false);
  const [solutionLoading, setSolutionLoading] = useState<boolean>(false);
  const [solutionData, setSolutionData] = useState<any | null>(null);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const [solutionCopied, setSolutionCopied] = useState<boolean>(false);
  const [showDiffComparison, setShowDiffComparison] = useState<boolean>(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState<boolean>(false);

  // Codeforces Official Submission & Live Judge Modal
  const [showCfSubmitModal, setShowCfSubmitModal] = useState<boolean>(false);

  // Desktop Split mode: 'split' (side-by-side) | 'code-focus' | 'problem-focus'
  const [desktopLayout, setDesktopLayout] = useState<'split' | 'code-focus'>('split');

  // Timer Interval
  useEffect(() => {
    if (!isTimerRunning) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Update test cases when problem changes
  useEffect(() => {
    setTestCases(problemDetail.testCases);
    setTestCaseResults([]);
    setActiveTestCaseIndex(0);
  }, [problemDetail]);

  // Load starter code or draft (guaranteed NO pre-filled full solutions!)
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      return;
    }

    const draft = cfStorageService.getDraft(`${problemId}_${language}`, language);
    if (draft && draft.code) {
      if (isOldDefaultSolution(problemId, draft.code)) {
        cfStorageService.removeDraft(`${problemId}_${language}`, language);
      } else {
        setCode(draft.code);
        return;
      }
    }

    if (problemDetail.starterCode?.[language] && !isOldDefaultSolution(problemId, problemDetail.starterCode[language]!)) {
      setCode(problemDetail.starterCode[language]!);
    } else {
      setCode(getDefaultTemplateForLanguage(language));
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
    if (draft && draft.code && !isOldDefaultSolution(problemId, draft.code)) {
      setCode(draft.code);
    } else if (problemDetail.starterCode?.[newLang] && !isOldDefaultSolution(problemId, problemDetail.starterCode[newLang]!)) {
      setCode(problemDetail.starterCode[newLang]!);
    } else {
      setCode(getDefaultTemplateForLanguage(newLang));
    }
  };

  const handleOpenSolutionModal = async () => {
    setShowSolutionModal(true);
    setShowMobileMenu(false);
    if (solutionData && (solutionData.problem_id === problemId || solutionData.contest_id === problem.contestId)) {
      return;
    }
    setSolutionLoading(true);
    setSolutionError(null);
    try {
      const res = await fetch(`/api/solutions/problem/${encodeURIComponent(problemId)}`);
      const data = await res.json();
      if (data.success && data.solutions && data.solutions.length > 0) {
        setSolutionData(data.solutions[0]);
      } else {
        setSolutionError('No verified Codeforces solution indexed for this problem yet.');
      }
    } catch (err: any) {
      setSolutionError('Unable to load solution: ' + (err.message || 'Network error'));
    } finally {
      setSolutionLoading(false);
    }
  };

  const handleCopySolutionCode = () => {
    if (!solutionData?.source_code) return;
    navigator.clipboard.writeText(solutionData.source_code);
    setSolutionCopied(true);
    info('Solution code copied to clipboard!');
    setTimeout(() => setSolutionCopied(false), 2000);
  };

  const handleApplySolutionToEditor = () => {
    if (!solutionData?.source_code) return;
    setCode(solutionData.source_code);
    setLanguage('cpp20');
    setShowReplaceConfirm(false);
    setShowSolutionModal(false);
    setActiveTab('code');
    info('Solution loaded into your editor!');
  };

  // Run Test Cases
  const handleRunTestCases = async () => {
    setIsRunningTests(true);
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
        toastError(`${res.passedCount} of ${res.totalCount} test cases passed. Check test details.`, 'Test Cases Failed');
      }
      // If on mobile, offer quick view
      if (window.innerWidth < 768 && activeTab === 'code') {
        setActiveTab('tests');
      }
    } catch (err: any) {
      toastError(err.message || 'Execution failed to connect to runner.');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit Solution to Codeforces & Live Judge Tracking
  const handleSubmit = async () => {
    setIsRunningTests(true);
    try {
      // 1. Run local sample test cases for immediate validation
      const res = await executionService.executeTestCases({
        code,
        language,
        testCases,
        timeoutMs: 3000,
      });
      setTestCaseResults(res.results);

      // 2. Open Codeforces Official Submission & Live Judge modal
      setShowCfSubmitModal(true);

      if (res.allPassed) {
        success('Sample tests passed! Opening Codeforces submission...', 'Sample Tests Passed');
      } else {
        info('Some sample test cases failed. You can still test or submit on Codeforces.', 'Sample Test Warning');
      }
    } catch (err: any) {
      toastError(err.message || 'Sample test evaluation error. Opening submission modal...');
      setShowCfSubmitModal(true);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCfVerifiedSubmission = (attempt: ProblemAttempt, submission: any) => {
    onAttemptLogged(attempt);
    if (submission.verdict === 'OK') {
      setShowConfetti(true);
      success(`Accepted on Codeforces! Solved in ${Math.round(secondsElapsed / 60)} minutes.`, 'Codeforces Solved');
    } else {
      toastError(
        `Codeforces Verdict: ${submission.verdict || 'REJECTED'}. You can inspect the failed test and log an autopsy.`,
        'Codeforces Result'
      );
    }
  };

  // Clear Code (resets to clean starter template without any full solution)
  const handleClearCode = () => {
    setShowMobileMenu(false);
    cfStorageService.removeDraft(`${problemId}_${language}`, language);
    setCode(getDefaultTemplateForLanguage(language));
    info('Editor reset to clean starter template');
  };

  // Download Code
  const handleDownloadCode = () => {
    setShowMobileMenu(false);
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
    setActiveTestCaseIndex(testCases.length);
    setIsEditingTestCase(true);
  };

  // Delete Test Case
  const handleDeleteTestCase = (id: number) => {
    if (testCases.length <= 1) {
      toastError('Cannot delete the only test case.');
      return;
    }
    const filtered = testCases.filter((tc) => tc.id !== id);
    setTestCases(filtered);
    setActiveTestCaseIndex((prev) => Math.min(prev, filtered.length - 1));
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
      setActiveTab('hints');
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
    setShowMobileMenu(false);
    success('Mistake logged to Mistake Notebook for spaced repetition!');
  };

  const handleFormatCode = () => {
    try {
      editorRef.current?.getAction('editor.action.formatDocument')?.run();
    } catch {}
  };

  const currentLangConfig = LANGUAGE_CONFIGS.find((l) => l.id === language) || LANGUAGE_CONFIGS[0];
  const passedTestsCount = testCaseResults.filter((r) => r.status === 'PASS').length;
  const currentActiveTestCase = testCases[activeTestCaseIndex] || testCases[0];
  const currentTestCaseResult = testCaseResults.find((r) => r.testCaseId === currentActiveTestCase?.id);

  // Format Elapsed Seconds
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all ${
        isFullscreen ? 'p-0' : 'p-0 md:p-3 lg:p-4'
      }`}
    >
      <div
        className={`w-full h-full flex flex-col overflow-hidden transition-all safe-area-overlay ${
          isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
        } ${
          isFullscreen
            ? 'h-[100dvh] rounded-none border-none'
            : 'md:h-[94vh] md:max-h-[950px] md:rounded-2xl md:border md:border-slate-800 md:shadow-2xl'
        }`}
      >
        {/* ════════════════ TOP APP-BAR / HEADER ════════════════ */}
        <header
          className={`flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b shrink-0 select-none ${
            isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {/* Left: Back/Close & Problem Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
              title="Close Workspace"
            >
              <CloseIcon size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowProblemMetaModal(true)}
              className="flex items-center gap-1.5 text-left min-w-0 group hover:opacity-90"
              title="Click to view problem details & tags"
            >
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 shrink-0">
                {problemId}
              </span>
              <span className="font-bold text-xs sm:text-sm tracking-tight truncate max-w-[130px] sm:max-w-[240px] md:max-w-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {problem.name}
              </span>
              {problem.rating && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0 hidden xs:inline-block">
                  ★ {problem.rating}
                </span>
              )}
            </button>
          </div>

          {/* Right: Stopwatch Timer, Language Pill, Hints, More Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Timer Pill */}
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                isTimerRunning
                  ? 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800'
              }`}
              title={isTimerRunning ? 'Pause Practice Timer' : 'Resume Timer'}
            >
              <TimerIcon size={13} semantic={isTimerRunning ? 'inherit' : 'warning'} />
              <span>{timerDisplay}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
                className="bg-slate-800 text-slate-200 hover:bg-slate-750 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-700/80 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-5"
              >
                {LANGUAGE_CONFIGS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.shortLabel}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Socratic Hints Badge */}
            <button
              type="button"
              onClick={() => {
                setShowHintsDrawer(true);
                setActiveTab('hints');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                hintLevel > 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                  : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
              }`}
              title="Socratic Guidance & Hints"
            >
              <HintIcon size={13} semantic={hintLevel > 0 ? 'success' : 'inherit'} />
              <span className="hidden sm:inline">Hints</span>
              <span className="text-[10px] font-mono">({hintLevel}/6)</span>
            </button>

            {/* Desktop Solution Button */}
            <button
              type="button"
              onClick={handleOpenSolutionModal}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-800/60 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60 font-semibold text-xs transition-colors cursor-pointer"
              title="View canonical C++20 solution & algorithmic proof"
            >
              <CodeFileIcon size={13} semantic="primary" />
              <span>Solution</span>
            </button>

            {/* Desktop Theme Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </button>

            {/* Desktop Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <ExitFullscreenIcon size={15} /> : <FullscreenIcon size={15} />}
            </button>

            {/* More / Overflow Menu Button (Mobile & Desktop) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer font-bold text-sm leading-none"
                title="More Actions"
              >
                ⋮
              </button>

              {/* Overflow Menu Dropdown */}
              {showMobileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs text-slate-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <button
                    type="button"
                    onClick={handleOpenSolutionModal}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-blue-300 font-semibold"
                  >
                    <CodeFileIcon size={14} semantic="primary" />
                    <span>View Canonical Solution</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMistakeModal(true)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-amber-300 font-semibold"
                  >
                    <WarningStatusIcon size={14} semantic="warning" />
                    <span>Log to Mistake Notebook</span>
                  </button>

                  {onAskCommunity && (
                    <button
                      type="button"
                      onClick={() => onAskCommunity(code, problem)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-indigo-300 font-semibold"
                    >
                      <AskAQuestionIcon size={14} />
                      <span>Ask Community for Help</span>
                    </button>
                  )}

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={handleClearCode}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-rose-300"
                  >
                    <RefreshIcon size={14} />
                    <span>Reset to Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCode}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                  >
                    <DownloadIcon size={14} />
                    <span>Download Source File</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleBookmark}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-purple-300"
                  >
                    <BookmarksIcon size={14} semantic="primary" />
                    <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}</span>
                  </button>

                  <a
                    href={cfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-400"
                  >
                    <ExternalLinkIcon size={14} />
                    <span>Open on Codeforces</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ════════════════ MOBILE SEGMENTED TAB BAR ════════════════ */}
        <nav className="md:hidden flex border-b border-slate-800 bg-slate-900/95 shrink-0 px-1 py-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('problem')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'problem'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span>
            <span>Problem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💻</span>
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'tests'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🧪</span>
            <span>Tests</span>
            {testCaseResults.length > 0 && (
              <span
                className={`text-[10px] px-1 rounded-full font-mono font-bold ${
                  passedTestsCount === testCases.length
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {passedTestsCount}/{testCases.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('hints');
              setShowHintsDrawer(true);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'hints'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💡</span>
            <span>Hints</span>
            <span className="text-[10px] font-mono">({hintLevel})</span>
          </button>
        </nav>

        {/* ════════════════ MAIN WORKSPACE BODY ════════════════ */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
          {/* ══════ LEFT PANEL: PROBLEM STATEMENT & HINTS ══════ */}
          <div
            className={`w-full md:w-[48%] lg:w-[45%] flex flex-col border-r overflow-y-auto p-4 sm:p-5 md:p-6 space-y-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
            } ${
              // On mobile: show when activeTab is 'problem' or 'hints'
              activeTab === 'problem' || activeTab === 'hints'
                ? 'flex flex-1'
                : 'hidden md:flex'
            }`}
          >
            {/* Header: Title, Tags, Rating */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {problemDetail.name}
                    </h1>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs ${
                        problemDetail.difficultyLabel === 'Easy'
                          ? 'bg-emerald-600'
                          : problemDetail.difficultyLabel === 'Medium'
                          ? 'bg-amber-600'
                          : 'bg-rose-600'
                      }`}
                    >
                      {problemDetail.difficultyLabel}
                    </span>
                    {problem.rating && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                        Rating: {problem.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Contest {problem.contestId || 'General'} • Index {problem.index}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={toggleBookmark}
                    className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-950/40 transition-colors"
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
                  >
                    {isBookmarked ? <BookmarksIcon size={18} semantic="primary" /> : <BookmarksIcon size={18} className="text-slate-500" />}
                  </button>
                  <a
                    href={cfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="View on Codeforces"
                  >
                    <ExternalLinkIcon size={16} />
                  </a>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {problem.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Socratic Hints Ladder Section (Shown when activeTab === 'hints' or drawer open) */}
            {(showHintsDrawer || activeTab === 'hints') && (
              <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThinkingIcon size={16} semantic="success" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Socratic AI Hints ({hintLevel}/6)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHintsDrawer(false);
                      if (activeTab === 'hints') setActiveTab('problem');
                    }}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>

                {hintHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stuck on an observation or algorithmic choice? Progressive graduated hints help you discover the key invariant without giving away the full code.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {hintHistory.map((h, i) => (
                      <div
                        key={i}
                        className="text-xs space-y-1 p-3 rounded-lg bg-slate-900 border border-emerald-900/50"
                      >
                        <span className="font-bold text-emerald-400 block">Hint Level {h.level}:</span>
                        <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          <MathText text={h.text} inline={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hintLevel < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingHintLevel(hintLevel + 1);
                      setShowHintConfirmModal(true);
                    }}
                    disabled={hintLoading}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    {hintLoading ? 'Generating Hint...' : `Unlock Hint Level ${hintLevel + 1}`}
                  </button>
                )}
              </div>
            )}

            {/* Section 1: Description */}
            <div className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <CodeFileIcon size={14} className="text-slate-400" />
                Problem Statement
              </h2>
              <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line font-normal overflow-x-auto">
                <MathText text={problemDetail.description} inline={false} />
              </div>
            </div>

            {/* Section 2: Constraints */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Constraints &amp; Limits
              </h2>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono">
                  {problemDetail.constraints.map((c, i) => (
                    <li key={i}>
                      <MathText text={c} inline />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Section 3: Examples */}
            <div className="space-y-3 pb-6">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sample Test Examples
              </h2>
              {problemDetail.examples.map((ex, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl font-mono text-xs space-y-2 border border-slate-800 bg-slate-900/60"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-slate-300">Example {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ex.input);
                        success('Sample input copied!');
                      }}
                      className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
                    >
                      <CopyIcon size={12} />
                      <span>Copy Input</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Input:</span>
                    <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap break-all">
                      {ex.input}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Output:</span>
                    <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold whitespace-pre-wrap break-all">
                      {ex.output}
                    </pre>
                  </div>

                  {ex.explanation && (
                    <div className="text-xs text-slate-400 pt-1 font-sans">
                      <span className="font-semibold text-slate-300">Explanation: </span>
                      <MathText text={ex.explanation} inline />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ══════ RIGHT PANEL: CODE EDITOR & TEST CASES ══════ */}
          <div
            className={`w-full md:w-[52%] lg:w-[55%] flex flex-col min-h-0 bg-slate-950 ${
              // On mobile: show when activeTab is 'code' or 'tests'
              activeTab === 'code' || activeTab === 'tests'
                ? 'flex flex-1'
                : 'hidden md:flex'
            }`}
          >
            {/* ── Desktop Tab Switcher (Code vs Test cases or Split) ── */}
            <div className="hidden md:flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/70 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-400 font-semibold">
                  solution.{currentLangConfig.ext}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 text-[11px]">
                  {code.split('\n').length} lines
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWordWrap((w) => (w === 'on' ? 'off' : 'on'))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    wordWrap === 'on'
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Word Wrap"
                >
                  Wrap: {wordWrap === 'on' ? 'ON' : 'OFF'}
                </button>

                <div className="flex items-center gap-1 bg-slate-800/80 px-1 py-0.5 rounded">
                  <span className="text-[10px] text-slate-400">Font:</span>
                  {[12, 14, 16].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`px-1 rounded text-[10px] font-mono ${
                        fontSize === sz ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleFormatCode}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  title="Format Code"
                >
                  Format
                </button>
              </div>
            </div>

            {/* ── Monaco Code Editor Container ── */}
            <div
              className={`flex-1 min-h-[220px] relative ${
                // On mobile: hide editor when tests tab is active
                activeTab === 'tests' ? 'hidden md:block' : 'block'
              }`}
            >
              <Editor
                height="100%"
                language={currentLangConfig.monacoLang}
                theme={isDarkMode ? 'vs-dark' : 'light'}
                value={code}
                onChange={(v) => setCode(v || '')}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;
                }}
                options={{
                  fontSize,
                  lineNumbers: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap,
                  tabSize: 4,
                  automaticLayout: true,
                  padding: { top: 10, bottom: 10 },
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                  bracketPairColorization: { enabled: true },
                  matchBrackets: 'always',
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                }}
                loading={
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2">
                    <CodingBracketsIcon size={16} semantic="primary" className="animate-pulse" />
                    <span>Loading Monaco Code Editor...</span>
                  </div>
                }
              />
            </div>

            {/* ── Mobile Accessory / CP Shortcuts Toolbar ── */}
            <div className={`md:hidden ${activeTab === 'tests' ? 'hidden' : 'block'}`}>
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

            {/* ══════ TEST CASES & RESULTS SECTION ══════ */}
            <div
              className={`border-t border-slate-800 bg-slate-950 flex flex-col ${
                // On mobile: take full container when activeTab is 'tests', else hidden
                activeTab === 'tests'
                  ? 'flex-1 overflow-y-auto p-3'
                  : 'hidden md:flex max-h-[280px] overflow-y-auto p-3'
              }`}
            >
              {/* Header: Test Case Pills & Add Case */}
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {testCases.map((tc, idx) => {
                    const res = testCaseResults.find((r) => r.testCaseId === tc.id);
                    const isActive = activeTestCaseIndex === idx;

                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => {
                          setActiveTestCaseIndex(idx);
                          setIsEditingTestCase(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-slate-800 text-slate-900 dark:text-white border border-slate-600 shadow-xs'
                            : 'bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>Case {idx + 1}</span>
                        {res?.status === 'PASS' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                        {res?.status === 'FAIL' && (
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                        )}
                        {res?.status === 'RUNNING' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/60 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Add Custom Test Case"
                  >
                    <AddIcon size={12} />
                    <span>Add</span>
                  </button>
                </div>

                {/* Overall Pass/Fail Counter Badge */}
                {testCaseResults.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        passedTestsCount === testCases.length
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {passedTestsCount}/{testCases.length} Passed
                    </span>
                  </div>
                )}
              </div>

              {/* Active Test Case Detail Card (Touch-Friendly) */}
              {currentActiveTestCase && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">
                        Test Case {activeTestCaseIndex + 1}
                      </span>
                      {currentTestCaseResult?.status === 'PASS' && (
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                          ✓ Passed
                        </span>
                      )}
                      {currentTestCaseResult?.status === 'FAIL' && (
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-rose-950 text-rose-300 font-bold border border-rose-800">
                          ✗ Wrong Answer
                        </span>
                      )}
                      {currentTestCaseResult?.status === 'COMPILATION_ERROR' && (
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-rose-950 text-rose-300 font-bold border border-rose-800">
                          ✗ Compilation Error
                        </span>
                      )}
                      {currentTestCaseResult?.status === 'RUNNING' && (
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-amber-950 text-amber-300 font-bold animate-pulse border border-amber-800">
                          ⏳ Running...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingTestCase(!isEditingTestCase)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        {isEditingTestCase ? 'Done Editing' : 'Edit Input/Output'}
                      </button>

                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTestCase(currentActiveTestCase.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="Delete this test case"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input & Expected Output (Side-by-side or stacked) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Input:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentActiveTestCase.input);
                            info('Input copied!');
                          }}
                          className="hover:text-slate-200 cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      {isEditingTestCase ? (
                        <textarea
                          value={currentActiveTestCase.input}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestCases(
                              testCases.map((t) =>
                                t.id === currentActiveTestCase.id ? { ...t, input: val } : t
                              )
                            );
                          }}
                          rows={3}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap break-all min-h-[48px]">
                          {currentActiveTestCase.input || '(empty)'}
                        </pre>
                      )}
                    </div>

                    {/* Expected Output */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Expected Output:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentActiveTestCase.expectedOutput);
                            info('Expected output copied!');
                          }}
                          className="hover:text-slate-200 cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      {isEditingTestCase ? (
                        <textarea
                          value={currentActiveTestCase.expectedOutput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestCases(
                              testCases.map((t) =>
                                t.id === currentActiveTestCase.id
                                  ? { ...t, expectedOutput: val }
                                  : t
                              )
                            );
                          }}
                          rows={3}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 font-semibold whitespace-pre-wrap break-all min-h-[48px]">
                          {currentActiveTestCase.expectedOutput || '(empty)'}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Actual Output (if test was executed) */}
                  {currentTestCaseResult && currentTestCaseResult.status !== 'RUNNING' && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-semibold text-slate-300 block">
                        Your Program Output:
                      </span>
                      <pre
                        className={`p-2.5 rounded-lg border font-mono text-xs whitespace-pre-wrap break-all leading-relaxed ${
                          currentTestCaseResult.status === 'PASS'
                            ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-800 text-rose-300'
                        }`}
                      >
                        {currentTestCaseResult.errorMessage ||
                          currentTestCaseResult.actualOutput ||
                          '(No stdout produced)'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ════════════════ STICKY BOTTOM ACTION DOCK ════════════════ */}
            <div
              className={`p-2.5 md:p-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2 shrink-0 ${
                // On mobile: show on 'code' or 'tests' tab
                activeTab === 'code' || activeTab === 'tests' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Run Test Cases Button */}
                <button
                  type="button"
                  onClick={handleRunTestCases}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <RunCodeIcon size={15} className="fill-white" />
                  <span>{isRunningTests ? 'Running Tests...' : 'Run Tests'}</span>
                </button>

                {/* Submit Solution Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                >
                  <CheckIcon size={15} />
                  <span>Submit</span>
                </button>
              </div>

              {/* Status Indicator or Switcher Pill */}
              <div className="flex items-center gap-2">
                {testCaseResults.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'tests' ? 'code' : 'tests')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{activeTab === 'tests' ? '← Back to Code' : 'View Test Results →'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {testCases.length} sample case{testCases.length !== 1 ? 's' : ''} loaded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ Problem Meta / Tags Modal (Mobile Friendly) ══════ */}
      {showProblemMetaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{problemId}</span>
                <span>Problem Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProblemMetaModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Problem Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{problem.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Codeforces Rating</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {problem.rating ? `★ ${problem.rating}` : 'Unrated'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Contest ID</span>
                  <span className="font-bold text-slate-200 text-sm">{problem.contestId || 'General'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5">Algorithmic Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <a
                href={cfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <ExternalLinkIcon size={13} />
                <span>Open Codeforces</span>
              </a>
              <button
                type="button"
                onClick={() => setShowProblemMetaModal(false)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Socratic Hint Confirmation Modal ══════ */}
      {showHintConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <HintIcon size={20} semantic="warning" />
              <span>Unlock Hint Level {pendingHintLevel}?</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {pendingHintLevel && HINT_DESCRIPTIONS[pendingHintLevel - 1]}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHintConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNextHint}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Reveal Hint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Mistake Notebook Modal ══════ */}
      {showMistakeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <WarningStatusIcon size={16} semantic="warning" />
                Log to Mistake Notebook
              </h3>
              <button
                type="button"
                onClick={() => setShowMistakeModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Root-Cause Classification
                </label>
                <select
                  value={mistakeCategory}
                  onChange={(e) => setMistakeCategory(e.target.value as MistakeCategory)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Personal Lesson &amp; Future Prevention
                </label>
                <input
                  type="text"
                  value={mistakeLesson}
                  onChange={(e) => setMistakeLesson(e.target.value)}
                  placeholder="e.g. Always check N=1 and N=0 boundary inputs"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMistakeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMistakeRecord}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Save Mistake Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Codeforces Canonical Solution Modal ══════ */}
      {showSolutionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {problemId}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <span>{problem.name}</span>
                    {problem.rating && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800 font-semibold shrink-0">
                        ★ {problem.rating}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Verified C++20 Solution • MIT License
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDiffComparison(!showDiffComparison)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    showDiffComparison
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-purple-950/40 text-purple-300 border-purple-800 hover:bg-purple-900/40'
                  }`}
                  title="Compare with your current code"
                >
                  <SplitPanelControlIcon size={13} />
                  <span className="hidden sm:inline">Diff</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySolutionCode}
                  disabled={!solutionData?.source_code}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {solutionCopied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                  <span>{solutionCopied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReplaceConfirm(true)}
                  disabled={!solutionData?.source_code}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Load solution directly into the code editor"
                >
                  <CodingBracketsIcon size={13} />
                  <span className="hidden sm:inline">Load to Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSolutionModal(false);
                    setShowDiffComparison(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {solutionLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="inline-block animate-spin text-blue-500">
                    <RefreshIcon size={32} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Loading verified Codeforces C++ solution...
                  </p>
                </div>
              ) : solutionError ? (
                <div className="p-6 rounded-xl bg-red-950/30 border border-red-900/50 text-center space-y-2">
                  <WarningStatusIcon size={24} semantic="error" className="mx-auto" />
                  <p className="text-xs font-semibold text-red-400">{solutionError}</p>
                  <button
                    type="button"
                    onClick={handleOpenSolutionModal}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : solutionData ? (
                <>
                  {showDiffComparison ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">
                          Comparing Current Code vs Solution
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-2 h-2 rounded bg-emerald-500" />
                            <span>In Solution (+)</span>
                          </span>
                          <span className="flex items-center gap-1 text-rose-400">
                            <span className="w-2 h-2 rounded bg-rose-500" />
                            <span>In Your Code (-)</span>
                          </span>
                        </div>
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#0d1117] p-3 font-mono text-xs">
                        {computeLineDiff(code, solutionData.source_code || '').map((line, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start px-2 py-0.5 rounded leading-relaxed ${
                              line.type === 'added'
                                ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                                : line.type === 'removed'
                                ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                                : 'text-slate-300 hover:bg-slate-900/50'
                            }`}
                          >
                            <span className="w-8 shrink-0 text-slate-500 select-none text-right pr-2 text-[10px]">
                              {line.lineNumberA || line.lineNumberB || idx + 1}
                            </span>
                            <span className="w-4 shrink-0 font-bold select-none">
                              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                            </span>
                            <pre className="flex-1 font-mono whitespace-pre-wrap break-all">{line.text || ' '}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl border border-slate-800 overflow-hidden shadow-inner joy-code-container" data-joy-code="true">
                      <JoyCodeViewer
                        code={solutionData.source_code || ''}
                        problemId={problemId}
                        title={problem.name || solutionData.problem_name}
                        author={solutionData.original_author}
                        repository={solutionData.source_repository}
                        compilerStandard={solutionData.compiler_standard}
                        license={solutionData.license_spdx}
                        sha256={solutionData.source_sha256}
                        isModal={false}
                        maxHeight="52vh"
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-500 hidden sm:inline">
                Studying solutions builds deep algorithmic pattern recognition.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowSolutionModal(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Confirmation to Load Solution into Editor ══════ */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-950/60 text-amber-500 border border-amber-800">
                <WarningStatusIcon size={20} semantic="warning" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Load Solution into Editor?</h4>
                <p className="text-xs text-slate-400">
                  This will replace your current code with the canonical solution.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReplaceConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Keep My Code
              </button>
              <button
                type="button"
                onClick={handleApplySolutionToEditor}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Yes, Load Solution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Codeforces Official Submission & Live Judge Streaming */}
      <CodeforcesSubmissionModal
        isOpen={showCfSubmitModal}
        onClose={() => setShowCfSubmitModal(false)}
        problem={problem}
        code={code}
        language={language}
        onVerifiedSubmission={handleCfVerifiedSubmission}
        onOpenAutopsy={onAutopsyRequested}
      />

      {/* Confetti Celebration on Accepted Verdict */}
      <ConfettiCanvas active={showConfetti} onDone={() => setShowConfetti(false)} />
    </div>
  );
};
