import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  Code,
  BookOpen,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { aiCoachService, CoachResponse } from '../services/aiCoach';
import { UserGoal, UserProfile } from '../types';

interface AICoachViewProps {
  goal: UserGoal;
  profile: UserProfile;
}

type CoachMode = 'concept' | 'hints' | 'review' | 'editorial' | 'checkin';

export const AICoachView: React.FC<AICoachViewProps> = ({ goal, profile }) => {
  const [activeMode, setActiveMode] = useState<CoachMode>('concept');
  const [loading, setLoading] = useState<boolean>(false);

  // Concept Teacher Inputs
  const [conceptTopic, setConceptTopic] = useState<string>('Two Pointers Technique');
  const [conceptQuestion, setConceptQuestion] = useState<string>('When should I use two pointers instead of binary search?');

  // Socratic Hint Inputs
  const [problemName, setProblemName] = useState<string>('Books (CF 279B)');
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [userApproach, setUserApproach] = useState<string>('Tried sliding window from left to right, but got confused with prefix sums.');

  // Code Reviewer Inputs
  const [codeReviewLang, setCodeReviewLang] = useState<string>('cpp20');
  const [userCode, setUserCode] = useState<string>(`#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, t;\n    cin >> n >> t;\n    vector<int> a(n);\n    for(int i = 0; i < n; i++) cin >> a[i];\n    \n    int ans = 0;\n    for(int i = 0; i < n; i++) {\n        int sum = 0;\n        for(int j = i; j < n; j++) {\n            sum += a[j];\n            if(sum <= t) ans = max(ans, j - i + 1);\n            else break;\n        }\n    }\n    cout << ans << endl;\n    return 0;\n}`);

  // Coach Output
  const [coachOutput, setCoachOutput] = useState<CoachResponse | null>(null);

  const handleAskConcept = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.askConcept(conceptTopic, conceptQuestion);
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.getHint(problemName, hintLevel, userApproach, codeReviewLang);
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCode = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.reviewCode(problemName, userCode, codeReviewLang);
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalCheckin = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.getPersonalCoachReview({
        currentDay: goal.currentDay,
        targetRating: goal.targetRating,
        streak: 3,
        weakTopic: 'Two Pointers & Time Complexity',
      });
      setCoachOutput(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">AI Coach Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personalized competitive programming tutor. Teaches intuition, provides graduated Socratic hints, and audits code for hidden edge cases.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-900/60 bg-indigo-950/30 text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Socratic AI Engine</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-900/60 p-2 border border-slate-800">
        {[
          { id: 'concept' as CoachMode, label: 'Concept Teacher', icon: BookOpen },
          { id: 'hints' as CoachMode, label: 'Socratic Hint Ladder', icon: Lightbulb },
          { id: 'review' as CoachMode, label: 'Code Reviewer', icon: Code },
          { id: 'checkin' as CoachMode, label: 'Personal Coach Review', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveMode(tab.id);
                setCoachOutput(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace (Input Form + Output Terminal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          {activeMode === 'concept' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Concept Teacher (Mode A)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Understand any algorithm from absolute basics with worked examples and a diagnostic check.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Topic / Concept
                </label>
                <input
                  type="text"
                  value={conceptTopic}
                  onChange={(e) => setConceptTopic(e.target.value)}
                  placeholder="e.g. Sieve of Eratosthenes, Binary Search on Answer"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Specific Question (Optional)
                </label>
                <textarea
                  rows={3}
                  value={conceptQuestion}
                  onChange={(e) => setConceptQuestion(e.target.value)}
                  placeholder="What specifically confuses you?"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={handleAskConcept}
                disabled={loading || !conceptTopic}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Teaching...' : 'Explain Concept'}</span>
              </button>
            </div>
          )}

          {activeMode === 'hints' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Socratic Hint Ladder (Mode B)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Never spoil a problem immediately. Advance one hint level at a time to train your own discovery process.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Problem Name / Link
                </label>
                <input
                  type="text"
                  value={problemName}
                  onChange={(e) => setProblemName(e.target.value)}
                  placeholder="e.g. Books (CF 279B) or Cut Ribbon (189A)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hint Level
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { lvl: 1, label: '1. Observation' },
                    { lvl: 2, label: '2. Question' },
                    { lvl: 3, label: '3. Technique' },
                    { lvl: 4, label: '4. Algorithm' },
                    { lvl: 5, label: '5. Pseudocode' },
                    { lvl: 6, label: '6. Full Editorial' },
                  ].map((h) => (
                    <button
                      key={h.lvl}
                      type="button"
                      onClick={() => setHintLevel(h.lvl)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        hintLevel === h.lvl
                          ? 'border-indigo-500 bg-indigo-950/60 font-bold text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  My Current Observation (What have you tried?)
                </label>
                <textarea
                  rows={2}
                  value={userApproach}
                  onChange={(e) => setUserApproach(e.target.value)}
                  placeholder="Briefly state your current idea..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={handleGetHint}
                disabled={loading || !problemName}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                <span>{loading ? 'Consulting...' : `Reveal Hint ${hintLevel}`}</span>
              </button>
            </div>
          )}

          {activeMode === 'review' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Code Reviewer (Mode C)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catch TLE complexity bugs, integer overflows, off-by-one errors, and boundary pitfalls.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Language</span>
                <select
                  value={codeReviewLang}
                  onChange={(e) => setCodeReviewLang(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white"
                >
                  <option value="cpp20">C++20</option>
                  <option value="python">Python 3</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Solution Code
                </label>
                <textarea
                  rows={8}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="Paste your C++ or Python code..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={handleReviewCode}
                disabled={loading || !userCode.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{loading ? 'Auditing Code...' : 'Audit Code for TLE & Overflow'}</span>
              </button>
            </div>
          )}

          {activeMode === 'checkin' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Personal Coach (Mode E)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Honest appraisal of your training pace, hint dependence, and consistency towards the 1600 goal.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Current Training Day:</span>
                  <span className="font-bold text-white">Day {goal.currentDay} / 180</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Codeforces Rating:</span>
                  <span className="font-bold text-cyan-400">1600</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Commitment:</span>
                  <span className="font-bold text-indigo-400">{goal.dailyMinutes} mins</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePersonalCheckin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold py-2.5 text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{loading ? 'Generating Check-in...' : 'Run Weekly Coach Check-In'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: AI Output Display */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between space-y-4 min-h-[420px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI Coach Analysis</span>
              </div>
              {coachOutput && (
                <span className="text-[10px] font-mono text-slate-400 rounded bg-slate-900 border border-slate-800 px-2 py-0.5">
                  Source: {coachOutput.source}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-xs text-slate-400">
                  Synthesizing Socratic reasoning & checking constraints...
                </p>
              </div>
            ) : coachOutput ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-200 overflow-y-auto max-h-[500px] pr-2">
                {coachOutput.warning && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{coachOutput.warning}</span>
                  </div>
                )}
                <div className="whitespace-pre-line font-sans text-xs space-y-2">
                  {coachOutput.message}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-2 text-slate-400">
                <Bot className="w-10 h-10 mx-auto text-slate-600" />
                <h4 className="text-sm font-bold text-slate-300">Coach is Ready</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Select a mode on the left and submit your query to get instant, graduated competitive programming guidance.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Powered by official Google GenAI SDK</span>
            <span>Zero hallucinated problems or ratings</span>
          </div>
        </div>
      </div>
    </div>
  );
};
