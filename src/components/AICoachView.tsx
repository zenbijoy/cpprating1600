import React, { useState } from 'react';
import {
  AIAssistantBotIcon,
  AISparkleIcon,
  GenerateExplanationIcon,
  HintIcon,
  DebugCodeIcon,
  SuggestOptimizationIcon,
  WeakTopicIcon,
  GenerateTestCasesIcon,
  TargetRatingIcon,
  ProgressIcon,
  CodingBracketsIcon,
  TimerIcon,
  TrendUpIcon,
  CheckIcon,
  CopyIcon,
  WarningStatusIcon,
  CloseIcon,
  CheckCircleIcon,
  ShieldAlertIcon,
} from './icons';
import { aiCoachService, CoachResponse } from '../services/aiCoach';
import { MistakeRecord, ProblemAttempt, UserGoal, UserProfile } from '../types';
import {
  detectWeaknesses,
  evaluateComplexityEstimation,
  evaluateContestDecisions,
  generatePreContestChecklist,
} from '../utils/adaptiveEngine';
import { compute30DayStreak } from '../utils/streak';
import { getTopicForDay } from '../utils/roadmap';
import { AIAssistantCompanion } from './assets';
import { useToast } from './Toast';
import { MathText } from './MathText';

interface AICoachViewProps {
  goal: UserGoal;
  profile: UserProfile;
  mistakes?: MistakeRecord[];
  recentAttempts?: ProblemAttempt[];
}

type CoachMode = 'concept' | 'hints' | 'review' | 'complexity' | 'weakness' | 'precontest' | 'decisions' | 'checkin';

const SOCRATIC_HINT_LEVELS: {
  level: number;
  title: string;
  shortDesc: string;
  detailedDesc: string;
}[] = [
  {
    level: 1,
    title: '1. Big-O & Invariant',
    shortDesc: 'Complexity bounds & mathematical property',
    detailedDesc: 'Reveals the target time/space complexity derived from constraints and the fundamental mathematical invariant. No algorithm spoilers.',
  },
  {
    level: 2,
    title: '2. Key Problem Observation',
    shortDesc: 'Symmetry, monotonicity, or state invariant',
    detailedDesc: 'Highlights the critical observation or simplification (e.g. sorting by endpoint, parity, prefix sums) without revealing the final algorithm.',
  },
  {
    level: 3,
    title: '3. Algorithmic Choice',
    shortDesc: 'Correct paradigm & data structure',
    detailedDesc: 'Specifies which algorithmic paradigm applies (e.g. Two Pointers, Binary Search on Answer, DP, Monotonic Queue) and why others fail.',
  },
  {
    level: 4,
    title: '4. Structured Pseudocode',
    shortDesc: 'Step-by-step logic without syntax',
    detailedDesc: 'Provides structured pseudocode showing loop bounds, transition invariants, and corner case checks. You implement the actual code.',
  },
  {
    level: 5,
    title: '5. Full Reference Solution',
    shortDesc: 'Complete solution & autopsy review',
    detailedDesc: 'Presents the optimal reference implementation with edge case verification. Use this only after genuine struggle to cement the pattern.',
  },
];

export const AICoachView: React.FC<AICoachViewProps> = ({
  goal,
  profile,
  mistakes = [],
  recentAttempts = [],
}) => {
  const { success, info: toastInfo } = useToast();
  const [copied, setCopied] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<CoachMode>('concept');
  const [loading, setLoading] = useState<boolean>(false);
  const [coachLang, setCoachLang] = useState<'en' | 'bn'>('en');

  // Spoiler Guard Modal State
  const [showHintConfirmModal, setShowHintConfirmModal] = useState<boolean>(false);
  const [pendingHintLevel, setPendingHintLevel] = useState<number | null>(null);

  // Derive real current topic and streak
  const currentTopic = getTopicForDay(goal.currentDay);
  const streakData = compute30DayStreak(recentAttempts);
  const weaknessReport = detectWeaknesses(mistakes);
  const realWeakTopic = weaknessReport.weaknesses[0]?.title || currentTopic.title;
  const targetRating = goal?.targetRating || 1600;

  // Concept Teacher Inputs
  const [conceptTopic, setConceptTopic] = useState<string>(currentTopic.title);
  const [conceptQuestion, setConceptQuestion] = useState<string>(
    `What are the most common edge cases and optimal approach for ${currentTopic.title}?`
  );

  // Socratic Hint Inputs
  const initialProblem = recentAttempts[0]?.name || currentTopic.recommendedProblems[0]?.name || 'Watermelon (CF 4A)';
  const [problemName, setProblemName] = useState<string>(initialProblem);
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [userApproach, setUserApproach] = useState<string>('Attempted greedy iteration, need insight on invariant.');

  // Code Reviewer Inputs
  const [codeReviewLang, setCodeReviewLang] = useState<string>(profile.preferredLanguage || 'cpp20');
  const [userCode, setUserCode] = useState<string>(
    recentAttempts[0]?.userCode ||
      `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    int n;\n    if (cin >> n) {\n        // Solution logic\n    }\n    return 0;\n}`
  );

  // Complexity Coach Inputs
  const [maxN, setMaxN] = useState<number>(100000);
  const [estimatedTime, setEstimatedTime] = useState<string>('O(N log N)');
  const [estimatedSpace, setEstimatedSpace] = useState<string>('O(N)');

  // Pre-Contest Checklist Items
  const [checklistContest, setChecklistContest] = useState<string>('Codeforces Round (Div. 2)');
  const [checklistItems, setChecklistItems] = useState(() =>
    generatePreContestChecklist('Codeforces Round (Div. 2)', mistakes).items
  );

  // Contest Decision Coach Inputs
  const [contestTotalMinutes, setContestTotalMinutes] = useState<number>(120);
  const [problemDecisions, setProblemDecisions] = useState([
    { index: 'A', timeSpentMinutes: 12, solved: true },
    { index: 'B', timeSpentMinutes: 40, solved: false },
    { index: 'C', timeSpentMinutes: 25, solved: false },
  ]);

  // Coach Output
  const [coachOutput, setCoachOutput] = useState<CoachResponse | null>(null);

  const handleAskConcept = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.askConcept(conceptTopic, conceptQuestion, coachLang);
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHintWithGuard = (level: number) => {
    setPendingHintLevel(level);
    setShowHintConfirmModal(true);
  };

  const handleConfirmHintReveal = async () => {
    if (!pendingHintLevel) return;
    setShowHintConfirmModal(false);
    setHintLevel(pendingHintLevel);
    setLoading(true);
    try {
      const res = await aiCoachService.getHint(problemName, pendingHintLevel, userApproach, codeReviewLang, coachLang);
      setCoachOutput(res);
      toastInfo(`Unlocked Socratic Hint Level ${pendingHintLevel}. Try to make the next connection yourself!`, 'Hint Revealed');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCode = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.reviewCode(problemName, userCode, codeReviewLang, undefined, coachLang);
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateComplexity = () => {
    const res = evaluateComplexityEstimation(maxN, estimatedTime, estimatedSpace);
    const passIndicator = res.isValid ? '✅ PASSES TIME & MEMORY LIMITS' : '⚠️ HIGH RISK OF TLE / MLE';
    const msg = `### Complexity Verification (Codeforces $10^8$ Operations Limit)\n\n**Verdict:** ${passIndicator}\n\n- **Maximum Input Size (N):** ${maxN.toLocaleString()}\n- **Expected Complexity Range:** ${res.expectedComplexity}\n- **Allowed Operations in 1.0s:** ~100,000,000 (10^8)\n- **Time Complexity:** \`${estimatedTime}\`\n- **Space Complexity:** \`${estimatedSpace}\`\n\n**Coach Analysis:**\n${res.feedback}\n\n**Recommendation:**\n${
      res.isValid
        ? 'Your theoretical complexity is safely within limits. Proceed to implementation, keeping an eye on constant factors and fast I/O.'
        : 'This complexity exceeds the 1-second limit. Seek an observation that lowers the complexity by a factor of N or allows binary search / two pointers.'
    }`;
    setCoachOutput({
      success: true,
      mode: 'complexity_coach',
      source: 'algorithmic_heuristics',
      message: msg,
    });
  };

  const handleRunWeaknessDetection = () => {
    const report = detectWeaknesses(mistakes);
    let msg = `### Weakness Diagnostic Report\n\n`;
    if (report.weaknesses.length === 0) {
      msg += `Great news! No severe error clustering detected yet across your logged attempts. Keep up disciplined mistake logging in your notebook to maintain this.`;
    } else {
      msg += `Based on your logged mistake autopsies, here are your primary friction patterns:\n\n`;
      report.weaknesses.forEach((w, i) => {
        msg += `**${i + 1}. ${w.title} (${w.frequency} recorded)**\n- *Impact:* ${w.impact.toUpperCase()}\n- *Prescription:* ${w.recommendedAction}\n\n`;
      });
      msg += `**Coach Strategy:** Dedicate your next 3 sessions specifically to practicing problems with these exact boundary constraints.`;
    }
    setCoachOutput({
      success: true,
      mode: 'weakness_detector',
      source: 'mistake_notebook_analysis',
      message: msg,
    });
  };

  const handleEvaluateDecisions = () => {
    const { pacingAdvice, upsolvingPriority } = evaluateContestDecisions(contestTotalMinutes, problemDecisions);
    let msg = `### Contest Pacing & Strategy Debrief\n\n`;
    msg += `**Contest Duration:** ${contestTotalMinutes} minutes\n\n`;
    msg += `**Pacing Analysis:**\n${pacingAdvice}\n\n`;
    if (upsolvingPriority.length > 0) {
      msg += `**Upsolving Priorities:**\n`;
      upsolvingPriority.forEach((p) => {
        msg += `- ${p}\n`;
      });
    }
    msg += `\n**Golden Rule for 1600:** Never spend more than 25 minutes on Problem A or B without stepping back, re-reading constraints, or writing out 3 small examples by hand.`;
    setCoachOutput({
      success: true,
      mode: 'contest_decisions',
      source: 'pacing_heuristics',
      message: msg,
    });
  };

  const handlePersonalCheckin = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.getPersonalCoachReview({
        currentDay: goal.currentDay,
        targetRating,
        streak: streakData.currentStreak,
        weakTopic: realWeakTopic,
      }, coachLang);
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* =========================================================================
          TOP HEADER: Brand, Subtitle, Language Switcher
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <AIAssistantBotIcon size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                AI Coach Studio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Personalized competitive programming tutor. Teaches intuition, provides progressive Socratic hints with spoiler guards, audits complexity, and eliminates contest blunders.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCoachLang('en')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  coachLang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setCoachLang('bn')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  coachLang === 'bn'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                বাংলা
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <AISparkleIcon size={14} semantic="success" />
              <span>Socratic Reasoning</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs (Horizontal swipeable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {[
            { id: 'concept' as CoachMode, label: 'Concept Teacher', icon: GenerateExplanationIcon },
            { id: 'hints' as CoachMode, label: 'Socratic Hint Ladder', icon: HintIcon },
            { id: 'review' as CoachMode, label: 'Code Reviewer', icon: DebugCodeIcon },
            { id: 'complexity' as CoachMode, label: 'Complexity Coach', icon: SuggestOptimizationIcon },
            { id: 'weakness' as CoachMode, label: 'Weakness Detector', icon: WeakTopicIcon },
            { id: 'precontest' as CoachMode, label: 'Pre-Contest Checklist', icon: GenerateTestCasesIcon },
            { id: 'decisions' as CoachMode, label: 'Contest Decision Coach', icon: TargetRatingIcon },
            { id: 'checkin' as CoachMode, label: 'Weekly Coach Review', icon: ProgressIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveMode(tab.id);
                  setCoachOutput(null);
                  if (tab.id === 'weakness') handleRunWeaknessDetection();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE GRID: Left Input Panel + Right Coach Terminal
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm">
          {/* Mode 1: Concept Teacher */}
          {activeMode === 'concept' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Concept Teacher</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Grasp algorithmic invariants, edge cases, and proofs from first principles.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Topic / Concept
                </label>
                <input
                  type="text"
                  value={conceptTopic}
                  onChange={(e) => setConceptTopic(e.target.value)}
                  placeholder="e.g. Sieve of Eratosthenes, Two Pointers, Monotonic Stack"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Specific Question (Optional)
                </label>
                <textarea
                  rows={3}
                  value={conceptQuestion}
                  onChange={(e) => setConceptQuestion(e.target.value)}
                  placeholder="What specifically confuses you about this invariant?"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Concept Question Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400">Common Diagnostic Inquiries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { t: 'Integer Overflow', q: 'How to reliably prevent 32-bit signed integer overflow in C++?' },
                    { t: 'Binary Search Predicate', q: 'What is the invariant condition for binary search on monotonic answers?' },
                    { t: 'Two Pointers vs Window', q: 'When should I use Two Pointers instead of Sliding Window or Hash Map?' },
                    { t: 'Prefix Sums Invariant', q: 'How to construct 2D prefix sums for matrix range queries without off-by-one errors?' },
                  ].map((chip) => (
                    <button
                      key={chip.t}
                      type="button"
                      onClick={() => {
                        setConceptTopic(chip.t);
                        setConceptQuestion(chip.q);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {chip.t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAskConcept}
                disabled={loading || !conceptTopic}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <AISparkleIcon size={14} className="text-white" />
                <span>{loading ? 'Teaching...' : 'Explain Concept & Invariants'}</span>
              </button>
            </div>
          )}

          {/* Mode 2: Socratic Hint Ladder with Progressive Confirmation */}
          {activeMode === 'hints' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Socratic Hint Ladder with Anti-Spoiler Guard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Unlock hints sequentially. Each level requires explicit confirmation to preserve your independent problem-solving struggle.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Problem Name / Codeforces URL
                </label>
                <input
                  type="text"
                  value={problemName}
                  onChange={(e) => setProblemName(e.target.value)}
                  placeholder="e.g. Books (CF 279B) or Cut Ribbon (189A)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Socratic Hint Levels */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Select Progressive Hint Level
                </label>
                <div className="space-y-2">
                  {SOCRATIC_HINT_LEVELS.map((h) => {
                    const isSelected = hintLevel === h.level;
                    return (
                      <div
                        key={h.level}
                        onClick={() => setHintLevel(h.level)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-200'}`}>
                            {h.title}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Level {h.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {h.shortDesc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  My Current Observation & Hypothesis
                </label>
                <textarea
                  rows={2}
                  value={userApproach}
                  onChange={(e) => setUserApproach(e.target.value)}
                  placeholder="What have you observed so far, and where are you stuck?"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRequestHintWithGuard(hintLevel)}
                disabled={loading || !problemName}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <HintIcon size={16} className="text-white" />
                <span>Request Hint Level {hintLevel} (Confirmation Required)</span>
              </button>
            </div>
          )}

          {/* Mode 3: Code Reviewer */}
          {activeMode === 'review' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Code Reviewer & Complexity Auditor</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Static analysis for integer overflows, TLE complexity bugs, and off-by-one fencepost errors.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Language
                </span>
                <select
                  value={codeReviewLang}
                  onChange={(e) => setCodeReviewLang(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                >
                  <option value="cpp20">C++20</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java 25</option>
                  <option value="javascript">JavaScript / Node.js</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Solution Code
                </label>
                <textarea
                  rows={8}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="Paste your competitive programming solution..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleReviewCode}
                disabled={loading || !userCode.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <CodingBracketsIcon size={14} className="text-white" />
                <span>{loading ? 'Auditing Solution...' : 'Audit Code for TLE & Overflow'}</span>
              </button>
            </div>
          )}

          {/* Mode 4: Complexity Coach */}
          {activeMode === 'complexity' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Complexity & Constraint Coach</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify your time and space complexity against Codeforces $10^8$ operations limits before coding.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Maximum Input Size (N)
                </label>
                <input
                  type="number"
                  value={maxN}
                  onChange={(e) => setMaxN(Number(e.target.value))}
                  placeholder="e.g. 100000 or 2000"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estimated Time Complexity
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g. O(N log N) or O(N^2)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estimated Space Complexity
                </label>
                <input
                  type="text"
                  value={estimatedSpace}
                  onChange={(e) => setEstimatedSpace(e.target.value)}
                  placeholder="e.g. O(N) or O(1)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleEvaluateComplexity}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer"
              >
                <TimerIcon size={14} className="text-white" />
                <span>Validate Against 10^8 Operations Limit</span>
              </button>
            </div>
          )}

          {/* Mode 5: Pre-Contest Checklist */}
          {activeMode === 'precontest' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pre-Contest Prevention Checklist</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify habits synthesized directly from your active Mistake Notebook before starting a contest round.
                </p>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.verified}
                      onChange={() => {
                        setChecklistItems((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, verified: !i.verified } : i))
                        );
                      }}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.rule}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">{item.rationale}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Mode 6: Contest Decisions Coach */}
          {activeMode === 'decisions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contest Decision & Pacing Coach</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Analyze problem time allocations, penalty risks, and skip thresholds.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {problemDecisions.map((p, idx) => (
                  <div key={p.index} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="font-bold text-slate-900 dark:text-slate-200">Problem {p.index}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={p.timeSpentMinutes}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProblemDecisions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, timeSpentMinutes: val } : item))
                          );
                        }}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right font-mono"
                      />
                      <span className="text-slate-500">mins</span>
                      <button
                        type="button"
                        onClick={() => {
                          setProblemDecisions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, solved: !item.solved } : item))
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          p.solved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {p.solved ? 'SOLVED' : 'UNSOLVED'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleEvaluateDecisions}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer"
              >
                <TargetRatingIcon size={14} className="text-white" />
                <span>Evaluate Pacing & Upsolving Priorities</span>
              </button>
            </div>
          )}

          {/* Mode 7: Weekly Check-In */}
          {activeMode === 'checkin' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Coach Review</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Honest appraisal of your training consistency, hint dependency, and rating trajectory toward {targetRating}.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Current Training Day:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Day {goal.currentDay} / 180</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Target Rating:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{targetRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Daily Commitment:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{goal.dailyMinutes} mins</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePersonalCheckin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <TrendUpIcon size={14} className="text-white" />
                <span>{loading ? 'Evaluating Progress...' : 'Run Weekly Coach Check-In'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: AI Output Terminal Display */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 min-h-[460px] shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <AIAssistantBotIcon size={16} semantic="primary" />
                <span>Coach Diagnostic & Guidance</span>
              </div>
              {coachOutput && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(coachOutput.message);
                      setCopied(true);
                      success('Coach response copied to clipboard!', 'Copied');
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {copied ? <CheckIcon size={12} className="text-emerald-600" /> : <CopyIcon size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5">
                    Source: {coachOutput.source}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
                <AIAssistantCompanion
                  state="thinking"
                  size={120}
                  speechBubble="Synthesizing Socratic reasoning & auditing algorithmic constraints..."
                />
              </div>
            ) : coachOutput ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200 overflow-y-auto max-h-[500px] pr-2">
                {coachOutput.warning && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                    <WarningStatusIcon size={16} semantic="warning" className="shrink-0" />
                    <span>{coachOutput.warning}</span>
                  </div>
                )}
                <div className="whitespace-pre-line font-sans text-xs space-y-2 leading-relaxed">
                  <MathText text={coachOutput.message} inline={false} />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 text-slate-400 flex flex-col items-center justify-center">
                <AIAssistantCompanion
                  state="idle"
                  size={120}
                  speechBubble="Select any coaching mode on the left! I'll guide your problem solving step-by-step toward 1600."
                />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                  AI Coach Ready
                </h4>
                <p className="text-xs max-w-sm mx-auto text-slate-500 dark:text-slate-400">
                  Concept teaching, progressive Socratic hints with spoiler guards, code reviews, and weakness analysis.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by official Google GenAI SDK & CP Heuristics</span>
            <span>Zero hallucinated problems or fake guarantees</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SOCRATIC HINT CONFIRMATION SPOILER GUARD MODAL
          ========================================================================= */}
      {showHintConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldAlertIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm">Confirm Hint Unlock: Level {pendingHintLevel}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {pendingHintLevel && SOCRATIC_HINT_LEVELS[pendingHintLevel - 1]?.detailedDesc}
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
              <p className="font-semibold">⚠️ 15-Minute Struggle Rule:</p>
              <p className="mt-0.5">
                We strongly advise at least 15 minutes of uninterrupted struggle on paper before peeking at hints. This cements the 1600 invariant discovery reflex.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowHintConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Struggling
              </button>
              <button
                type="button"
                onClick={handleConfirmHintReveal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
              >
                Reveal Hint Level {pendingHintLevel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
