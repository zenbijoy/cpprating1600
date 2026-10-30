import React, { useState, useMemo } from 'react';
import {
  CodingBracketsIcon as Code2,
  RefreshIcon as Shuffle,
  TerminalIcon as Terminal,
  ExternalLinkIcon as ExternalLink,
  ForwardIcon as ArrowRight,
  SplitPanelIcon as Layers,
  CheckIcon as Check,
  CopyIcon as Copy,
  TargetRatingIcon as Target,
  SearchIcon as Search,
  ChevronRightIcon as ChevronRight,
  CommunityIcon as UsersIcon,
} from './icons';
import { CFProblem, MistakeRecord, ProblemAttempt, ProgrammingLanguage, UserProfile } from '../types';
import { CodeEditor } from './CodeEditor';
import { ProblemWorkspaceModal } from './ProblemWorkspaceModal';
import { useToast } from './Toast';

interface WorkspaceViewProps {
  profile: UserProfile;
  attempts: ProblemAttempt[];
  onAttemptLogged: (attempt: ProblemAttempt) => void;
  onSaveMistake: (mistake: MistakeRecord) => void;
  activeProblem: CFProblem | null;
  onSelectProblem: (prob: CFProblem) => void;
  onAskCommunity?: (code: string, problem: CFProblem) => void;
}

const RECOMMENDED_STARTER_PROBLEMS: CFProblem[] = [
  { index: '1', name: 'Two Sum', rating: 900, tags: ['array', 'hash table', 'two pointers'] },
  { contestId: 4, index: 'A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
  { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
  { contestId: 231, index: 'A', name: 'Team', rating: 800, tags: ['implementation'] },
  { contestId: 158, index: 'A', name: 'Next Round', rating: 800, tags: ['implementation'] },
  { contestId: 282, index: 'A', name: 'Bit++', rating: 800, tags: ['implementation'] },
  { contestId: 112, index: 'A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
  { contestId: 339, index: 'A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'strings'] },
  { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers', 'binary search'] },
  { contestId: 706, index: 'B', name: 'Interesting drink', rating: 1100, tags: ['binary search', 'dp'] },
  { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
  { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
  { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
  { contestId: 580, index: 'C', name: 'Kefa and Park', rating: 1500, tags: ['dfs and similar', 'trees'] },
];

interface CPSnippet {
  id: string;
  title: string;
  category: string;
  description: string;
  code: string;
}

const CP_SNIPPETS: CPSnippet[] = [
  {
    id: 'fastio',
    title: 'Fast I/O & Boilerplate',
    category: 'Setup',
    description: 'Bypasses C stdio sync for high-speed input/output on Codeforces',
    code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Code here
    return 0;
}`,
  },
  {
    id: 'binpow',
    title: 'Modular Exponentiation (binpow)',
    category: 'Math',
    description: 'Computes (a^b) % mod in O(log b) time',
    code: `long long binpow(long long a, long long b, long long mod = 1e9 + 7) {
    long long res = 1;
    a %= mod;
    while (b > 0) {
        if (b & 1) res = (res * a) % mod;
        a = (a * a) % mod;
        b >>= 1;
    }
    return res;
}`,
  },
  {
    id: 'binary_search',
    title: 'Binary Search on Answer',
    category: 'Search',
    description: 'Finds optimal monotonic threshold in O(log(range))',
    code: `long long low = 1, high = 1e18, ans = -1;
auto check = [&](long long mid) -> bool {
    // Return true if condition is met
    return true;
};

while (low <= high) {
    long long mid = low + (high - low) / 2;
    if (check(mid)) {
        ans = mid;
        high = mid - 1; // Or low = mid + 1 depending on monotonicity
    } else {
        low = mid + 1;
    }
}`,
  },
  {
    id: 'dsu',
    title: 'Disjoint Set Union (DSU / Union-Find)',
    category: 'Data Structures',
    description: 'Nearly O(1) connected component tracking with path compression & rank',
    code: `struct DSU {
    vector<int> parent, rank;
    DSU(int n) : parent(n + 1), rank(n + 1, 0) {
        for (int i = 0; i <= n; i++) parent[i] = i;
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]);
    }
    bool unite(int i, int j) {
        int rootI = find(i), rootJ = find(j);
        if (rootI != rootJ) {
            if (rank[rootI] < rank[rootJ]) swap(rootI, rootJ);
            parent[rootJ] = rootI;
            if (rank[rootI] == rank[rootJ]) rank[rootI]++;
            return true;
        }
        return false;
    }
};`,
  },
  {
    id: 'sieve',
    title: 'Sieve of Eratosthenes',
    category: 'Number Theory',
    description: 'Generates primes up to MAXN in O(N log log N)',
    code: `const int MAXN = 1e6 + 5;
vector<bool> is_prime(MAXN, true);
void sieve() {
    is_prime[0] = is_prime[1] = false;
    for (int p = 2; p * p < MAXN; p++) {
        if (is_prime[p]) {
            for (int i = p * p; i < MAXN; i += p)
                is_prime[i] = false;
        }
    }
}`,
  },
  {
    id: 'grid_directions',
    title: '2D Grid BFS/DFS Directions',
    category: 'Graphs',
    description: 'Cardinal (4-way) & 8-way traversal offsets',
    code: `// 4-directional
const int dx[4] = {-1, 1, 0, 0};
const int dy[4] = {0, 0, -1, 1};

// 8-directional
const int dx8[8] = {-1, -1, -1, 0, 0, 1, 1, 1};
const int dy8[8] = {-1, 0, 1, -1, 1, -1, 0, 1};`,
  },
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  profile,
  attempts,
  onAttemptLogged,
  onSaveMistake,
  activeProblem,
  onSelectProblem,
  onAskCommunity,
}) => {
  const { success } = useToast();
  const [selectedProblem, setSelectedProblem] = useState<CFProblem>(
    activeProblem || RECOMMENDED_STARTER_PROBLEMS[0]
  );
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const problem = activeProblem || selectedProblem;
  const problemId = `${problem.contestId || ''}${problem.index}`;

  const filteredStarterProblems = useMemo(() => {
    return RECOMMENDED_STARTER_PROBLEMS.filter((p) => {
      const matchesSearch =
        searchFilter === '' ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        `${p.contestId}${p.index}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()));

      const r = p.rating || 800;
      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === '800-1000' && r <= 1000) ||
        (ratingFilter === '1100-1300' && r >= 1100 && r <= 1300) ||
        (ratingFilter === '1400+' && r >= 1400);

      return matchesSearch && matchesRating;
    });
  }, [ratingFilter, searchFilter]);

  const handleCopySnippet = (snippet: CPSnippet) => {
    navigator.clipboard.writeText(snippet.code);
    setCopiedSnippetId(snippet.id);
    success(`"${snippet.title}" copied to clipboard!`, 'Code Snippet');
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handlePickRandomProblem = () => {
    const list = filteredStarterProblems.length > 0 ? filteredStarterProblems : RECOMMENDED_STARTER_PROBLEMS;
    const randomIndex = Math.floor(Math.random() * list.length);
    const chosen = list[randomIndex];
    setSelectedProblem(chosen);
    onSelectProblem(chosen);
    success(`Selected ${chosen.contestId}${chosen.index} — ${chosen.name}`, 'Problem Loaded');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Workspace Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            Competitive Coding Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Full 3-panel IDE with Monaco Editor, C++20 fast I/O, local sample dry-run, and official Codeforces submission sync.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePickRandomProblem}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 transition-all cursor-pointer"
            title="Pick a random starter problem"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Random Problem</span>
          </button>
          <button
            onClick={() => onSelectProblem(problem)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch Problem Solver</span>
          </button>
        </div>
      </div>

      {/* Active Problem Quick Selector Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
              {problemId}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{problem.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {problem.rating && (
                  <span className="font-semibold text-amber-400">⚡ Rating {problem.rating}</span>
                )}
                <span>·</span>
                <span>Contest {problem.contestId || 'General'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <span>Codeforces Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {onAskCommunity && (
              <button
                onClick={() => onAskCommunity('', problem)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-all cursor-pointer"
                title="Discuss this problem with the community"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                <span>Discuss</span>
              </button>
            )}
            <button
              onClick={() => onSelectProblem(problem)}
              className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-all cursor-pointer"
            >
              <span>Solve Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {problem.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-slate-300"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* CP Algorithm & Snippet Quick-Reference Drawer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Competitive Programming Snippet Toolbox</h3>
          </div>
          <span className="text-[11px] text-slate-400">1-click copy verified algorithms for your solver</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CP_SNIPPETS.map((snippet) => (
            <div
              key={snippet.id}
              className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                    {snippet.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300 font-medium shrink-0">
                    {snippet.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {snippet.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">C++20</span>
                <button
                  onClick={() => handleCopySnippet(snippet)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  {copiedSnippetId === snippet.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-white" />
                      <span className="text-[11px]">Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended 1600 Climb Problems Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Recommended Problems in Workspace Queue</span>
            <span className="text-xs text-slate-400 font-normal">({filteredStarterProblems.length} available)</span>
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="flex p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              {[
                { label: 'All', val: 'all' },
                { label: '800-1000', val: '800-1000' },
                { label: '1100-1300', val: '1100-1300' },
                { label: '1400+', val: '1400+' },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setRatingFilter(f.val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    ratingFilter === f.val
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter queue..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32 sm:w-40"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStarterProblems.map((p) => {
            const pid = `${p.contestId}${p.index}`;
            const isCurrent = pid === problemId;
            return (
              <div
                key={pid}
                onClick={() => {
                  setSelectedProblem(p);
                  onSelectProblem(p);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-semibold text-slate-400">{pid}</span>
                    <span className="font-bold text-amber-400">⚡ {p.rating}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 truncate">
                    {p.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 capitalize truncate max-w-[150px]">
                    {p.tags.slice(0, 2).join(', ')}
                  </span>
                  <span className="text-indigo-400 font-medium flex items-center gap-1 text-[11px]">
                    Open Workspace <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
