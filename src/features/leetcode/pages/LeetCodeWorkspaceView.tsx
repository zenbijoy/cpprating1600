import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  CodingBracketsIcon,
  ExternalLinkIcon,
  BookmarksIcon,
  CheckCircleIcon,
  TimerIcon,
  RunCodeIcon,
  AISparkleIcon,
  InformationStatusIcon,
  CopyIcon,
  CheckIcon,
  RetryIcon,
  ChevronRightIcon,
  CloseIcon,
  SparklesIcon,
} from '../../../components/icons';
import {
  LeetCodeProblem,
  LeetCodeExample,
  UserLeetCodeProgress,
} from '../types/leetcode.types';
import { ProgrammingLanguage } from '../../../types';
import { leetCodeClient } from '../services/leetcodeClient';
import { executionService } from '../../../services/execution';
import { aiCoachService, CoachResponse } from '../../../services/aiCoach';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';

interface LeetCodeWorkspaceViewProps {
  activeProblem?: LeetCodeProblem | null;
  onSelectProblem?: (prob: LeetCodeProblem) => void;
  onBackToExplorer?: () => void;
}

const SUPPORTED_LANGUAGES: { id: ProgrammingLanguage; label: string; monacoLang: string }[] = [
  { id: 'cpp20', label: 'C++ (C++20)', monacoLang: 'cpp' },
  { id: 'python', label: 'Python (3.11)', monacoLang: 'python' },
  { id: 'java', label: 'Java (OpenJDK)', monacoLang: 'java' },
  { id: 'javascript', label: 'JavaScript (Node.js)', monacoLang: 'javascript' },
];

export const LeetCodeWorkspaceView: React.FC<LeetCodeWorkspaceViewProps> = ({
  activeProblem: initialProblem,
  onSelectProblem,
  onBackToExplorer,
}) => {
  // Fallback to Two Sum if no problem is currently selected
  const [problem, setProblem] = useState<LeetCodeProblem>(
    () => initialProblem || CURATED_LEETCODE_PROBLEMS[0]
  );

  useEffect(() => {
    if (initialProblem) setProblem(initialProblem);
  }, [initialProblem]);

  const [language, setLanguage] = useState<ProgrammingLanguage>('cpp20');
  const [code, setCode] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const [status, setStatus] = useState<'unsolved' | 'attempted' | 'solved'>('unsolved');

  // Progressive Hint Ladder (Hints 1 to 5)
  const [revealedHintLevel, setRevealedHintLevel] = useState<number>(0);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sampleInput, setSampleInput] = useState<string>('');
  const [executionOutput, setExecutionOutput] = useState<{
    stdout?: string;
    stderr?: string;
    compilerOutput?: string;
    executionTimeMs?: number;
    status?: string;
  } | null>(null);

  // AI Coach drawer state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<{ action: string; message: string } | null>(null);
  const [aiLanguage, setAiLanguage] = useState<'en' | 'bn'>('en');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Load existing code / notes when problem or language changes
  useEffect(() => {
    const prog = leetCodeClient.getProgress(problem.titleSlug);
    if (prog) {
      setIsBookmarked(prog.bookmark);
      setStatus(prog.status);
      setPersonalNotes(prog.personalNotes || '');
      if (prog.userCode && prog.codeLanguage === language) {
        setCode(prog.userCode);
      } else {
        setCode(problem.starterCode?.[language] || getDefaultTemplate(language));
      }
    } else {
      setIsBookmarked(false);
      setStatus('unsolved');
      setPersonalNotes('');
      setCode(problem.starterCode?.[language] || getDefaultTemplate(language));
    }

    // Set initial sample input from first example
    if (problem.examples && problem.examples.length > 0) {
      setSampleInput(problem.examples[0].input);
    } else {
      setSampleInput('');
    }

    setRevealedHintLevel(0);
    setExecutionOutput(null);
    setAiResponse(null);
  }, [problem, language]);

  function getDefaultTemplate(lang: ProgrammingLanguage): string {
    if (lang === 'cpp20') return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    return 0;\n}';
    if (lang === 'python') return 'class Solution:\n    # Write your solution here\n    pass';
    if (lang === 'java') return 'class Solution {\n    // Write your solution here\n}';
    return '// Write your solution here';
  }

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    const next = await leetCodeClient.toggleBookmark(problem.titleSlug);
    setIsBookmarked(next);
  };

  // Handle status update
  const handleUpdateStatus = async (newStatus: 'unsolved' | 'attempted' | 'solved') => {
    setStatus(newStatus);
    await leetCodeClient.saveProgress({
      problemSlug: problem.titleSlug,
      status: newStatus,
      bookmark: isBookmarked,
      userCode: code,
      codeLanguage: language,
      personalNotes,
      selfReported: true,
    });
  };

  // Save notes
  const handleSaveNotes = async () => {
    await leetCodeClient.saveProgress({
      problemSlug: problem.titleSlug,
      status,
      bookmark: isBookmarked,
      userCode: code,
      codeLanguage: language,
      personalNotes,
    });
  };

  // Run Sample Code locally
  const handleRunSample = async () => {
    setIsRunning(true);
    setExecutionOutput(null);

    try {
      const res = await executionService.executeCode({
        code,
        language,
        stdin: sampleInput,
        timeoutMs: 3000,
      });

      setExecutionOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        compilerOutput: res.compilerOutput,
        executionTimeMs: res.executionTimeMs,
        status: res.status,
      });

      // Automatically mark as attempted if not already solved
      if (status === 'unsolved') {
        handleUpdateStatus('attempted');
      }
    } catch (err: any) {
      setExecutionOutput({
        stderr: err.message || 'Execution failed',
        status: 'ERROR',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // AI Coach Action Trigger
  const handleAiAction = async (action: string) => {
    setAiLoading(true);
    setAiResponse(null);

    try {
      let res: CoachResponse;
      if (action.startsWith('hint_')) {
        const lvl = parseInt(action.replace('hint_', ''), 10);
        res = await aiCoachService.getHint(problem.title, lvl, undefined, language, aiLanguage);
      } else if (action === 'explain_problem') {
        res = await aiCoachService.explainProblem(problem.title, problem.description, aiLanguage);
      } else if (action === 'suggest_algorithm') {
        res = await aiCoachService.suggestAlgorithm(problem.title, problem.description, undefined, aiLanguage);
      } else if (action === 'explain_complexity') {
        res = await aiCoachService.explainComplexity(problem.title, code, language, aiLanguage);
      } else if (action === 'generate_examples') {
        res = await aiCoachService.generateExamples(problem.title, problem.description, aiLanguage);
      } else if (action === 'edge_cases') {
        res = await aiCoachService.explainEdgeCases(problem.title, problem.description, aiLanguage);
      } else if (action === 'create_revision_card') {
        res = await aiCoachService.createRevisionCard(problem.title, personalNotes || 'Review problem', aiLanguage);
      } else {
        res = await aiCoachService.reviewCode(problem.title, code, language, undefined, aiLanguage);
      }

      setAiResponse({
        action,
        message: res.message,
      });
    } catch (err: any) {
      setAiResponse({
        action,
        message: err.message || 'Failed to reach AI Coach. Please try again.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const difficultyColors = {
    Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  }[problem.difficulty];

  const currentMonacoLang =
    SUPPORTED_LANGUAGES.find((l) => l.id === language)?.monacoLang || 'cpp';

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] max-w-[1920px] mx-auto p-2 sm:p-4 gap-3 overflow-hidden">
      {/* Top Workspace Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBackToExplorer && (
            <button
              type="button"
              onClick={onBackToExplorer}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mr-1"
            >
              ← Back to Explorer
            </button>
          )}
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold shrink-0">
            #{problem.frontendQuestionId}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate">
            {problem.title}
          </h2>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${difficultyColors} shrink-0`}>
            {problem.difficulty}
          </span>
        </div>

        {/* Header Right Actions: Solve on LeetCode + Status + Bookmark */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Selector */}
          <select
            value={status}
            onChange={(e) => handleUpdateStatus(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="unsolved">Status: Unsolved</option>
            <option value="attempted">Status: Attempted</option>
            <option value="solved">Status: Solved (Self-Reported)</option>
          </select>

          {/* Bookmark Toggle */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-2 rounded-lg border transition-colors ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Add to Bookmarks'}
          >
            <BookmarksIcon size={15} />
          </button>

          {/* Primary Action: Official LeetCode Link */}
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ExternalLinkIcon size={14} />
            <span>Solve on LeetCode</span>
          </a>
        </div>
      </div>

      {/* Main Two-Panel Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* =========================================================
            LEFT PANEL: Statement, Examples, Hints Ladder, Notes (5 cols)
           ========================================================= */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden min-h-0">
          {/* Left panel tabs/scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-sm text-slate-300">
            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Problem Statement
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {problem.description || 'Description not available offline. Please use the "Solve on LeetCode" link.'}
              </div>
            </div>

            {/* Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sample Examples
                </h3>
                <div className="space-y-3">
                  {problem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 font-mono text-xs space-y-1.5"
                    >
                      <div className="text-slate-400">
                        <strong className="text-slate-200 font-sans">Example {idx + 1}:</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Input: </span>
                        <span className="text-indigo-300">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Output: </span>
                        <span className="text-emerald-300">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="text-slate-400 font-sans text-[11px] pt-1">
                          <em>Explanation:</em> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Constraints
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-mono">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progressive Socratic Hints Ladder */}
            {problem.hints && problem.hints.length > 0 && (
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/15">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SparklesIcon size={16} className="text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Socratic Hint Ladder ({problem.hints.length} hints)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Progressive disclosure</span>
                </div>

                <div className="space-y-2">
                  {problem.hints.map((hintText, idx) => {
                    const hintNum = idx + 1;
                    const isRevealed = revealedHintLevel >= hintNum;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border transition-all text-xs ${
                          isRevealed
                            ? 'bg-slate-900 border-indigo-500/30 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-indigo-400">
                            Hint {hintNum}
                          </span>
                          {!isRevealed ? (
                            <button
                              type="button"
                              onClick={() => setRevealedHintLevel(hintNum)}
                              className="px-2 py-0.5 rounded text-[11px] bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30 cursor-pointer"
                            >
                              Reveal Hint {hintNum}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Revealed</span>
                          )}
                        </div>

                        {isRevealed && (
                          <div className="mt-2 text-slate-300 font-sans leading-relaxed whitespace-pre-line border-t border-slate-800/60 pt-2">
                            {hintText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Personal Notes & Spaced Repetition Logger */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Personal Notes & Trap Reminders
                </h3>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-2.5 py-1 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Save Notes
                </button>
              </div>
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Log tricky edge cases, why an approach failed, or key mental checks for future revision..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT PANEL: Monaco Editor, Run Sample, AI Coach (7 cols)
           ========================================================= */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden min-h-0">
          {/* Editor Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-slate-950/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
                className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Right Controls: AI Coach Menu + Run Sample */}
            <div className="flex items-center gap-2">
              {/* AI Language Toggle */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-800/80 p-0.5 rounded-md border border-slate-700">
                <button
                  type="button"
                  onClick={() => setAiLanguage('en')}
                  className={`px-1.5 py-0.5 rounded ${aiLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setAiLanguage('bn')}
                  className={`px-1.5 py-0.5 rounded ${aiLanguage === 'bn' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  বাংলা
                </button>
              </div>

              {/* AI Actions Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAiAction(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={aiLoading}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs text-purple-200 focus:outline-none cursor-pointer"
              >
                <option value="">✨ AI Coach Actions...</option>
                <option value="explain_problem">Explain Problem in Simple Terms</option>
                <option value="suggest_algorithm">Suggest Algorithmic Paradigm</option>
                <option value="hint_1">Hint 1 (Core Observation)</option>
                <option value="hint_2">Hint 2 (Guiding Question)</option>
                <option value="hint_3">Hint 3 (Technique)</option>
                <option value="review_code">Analyze My Current Code</option>
                <option value="explain_complexity">Explain Time & Space Complexity</option>
                <option value="generate_examples">Generate 3 Practice Test Cases</option>
                <option value="edge_cases">Detect Critical Edge Cases</option>
                <option value="create_revision_card">Create Mistake Revision Flashcard</option>
              </select>

              {/* Run Sample Tests Button */}
              <button
                type="button"
                onClick={handleRunSample}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                <RunCodeIcon size={14} className={isRunning ? 'animate-spin' : ''} />
                <span>{isRunning ? 'Running...' : 'Run Sample'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[280px] w-full bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={currentMonacoLang}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                tabSize: 4,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>

          {/* Bottom Execution & AI Drawer (collapsible / responsive) */}
          <div className="h-48 border-t border-slate-800 bg-slate-950 flex flex-col shrink-0">
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-200">Test Execution & Output</span>
                {executionOutput?.executionTimeMs != null && (
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {executionOutput.executionTimeMs} ms
                  </span>
                )}
                {executionOutput?.status && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      executionOutput.status === 'OK'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {executionOutput.status}
                  </span>
                )}
              </div>

              <span className="text-[11px] text-slate-400 italic">
                Local sample run (not official submission)
              </span>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-purple-300 font-sans py-4">
                  <SparklesIcon size={16} className="animate-spin text-purple-400" />
                  <span>AI Coach is analyzing...</span>
                </div>
              ) : aiResponse ? (
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-200 font-sans text-xs whitespace-pre-line leading-relaxed">
                  <div className="flex items-center justify-between text-[11px] text-purple-400 font-semibold mb-1">
                    <span>✨ AI COACH ADVICE</span>
                    <button
                      type="button"
                      onClick={() => setAiResponse(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                  {aiResponse.message}
                </div>
              ) : executionOutput ? (
                <div className="space-y-2">
                  {executionOutput.stdout && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">STDOUT:</span>
                      <pre className="text-slate-200 whitespace-pre-wrap">{executionOutput.stdout}</pre>
                    </div>
                  )}
                  {executionOutput.stderr && (
                    <div>
                      <span className="text-rose-400 block text-[11px]">STDERR / ERRORS:</span>
                      <pre className="text-rose-300 whitespace-pre-wrap">{executionOutput.stderr}</pre>
                    </div>
                  )}
                  {executionOutput.compilerOutput && (
                    <div>
                      <span className="text-amber-400 block text-[11px]">COMPILER OUTPUT:</span>
                      <pre className="text-amber-300 whitespace-pre-wrap">{executionOutput.compilerOutput}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 font-sans text-xs flex flex-col justify-center h-full">
                  Click "Run Sample" to execute your code against sample input, or use "AI Coach Actions" for hints & code reviews.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
