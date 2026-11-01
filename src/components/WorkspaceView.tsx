import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  RefreshIcon,
  FilterIcon,
  ProblemsIcon,
} from './icons';
import { CFProblem, MistakeRecord, ProblemAttempt, UserProfile } from '../types';
import { codeforcesService } from '../services/codeforces';
import { useToast } from './Toast';
import { AnimeViewCompanionBanner } from './common/AnimeViewCompanionBanner';

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
  { contestId: 4, index: 'A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
  { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
  { contestId: 231, index: 'A', name: 'Team', rating: 800, tags: ['implementation', 'greedy'] },
  { contestId: 282, index: 'A', name: 'Bit++', rating: 800, tags: ['implementation'] },
  { contestId: 158, index: 'A', name: 'Next Round', rating: 800, tags: ['implementation'] },
  { contestId: 112, index: 'A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
  { contestId: 236, index: 'A', name: 'Boy or Girl', rating: 800, tags: ['strings', 'brute force'] },
  { contestId: 339, index: 'A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'strings'] },
  { contestId: 546, index: 'A', name: 'Soldier and Bananas', rating: 800, tags: ['math', 'brute force'] },
  { contestId: 617, index: 'A', name: 'Elephant', rating: 800, tags: ['math'] },
  { contestId: 791, index: 'A', name: 'Bear and Big Brother', rating: 800, tags: ['implementation'] },
  { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers', 'binary search'] },
  { contestId: 706, index: 'B', name: 'Interesting drink', rating: 1100, tags: ['binary search', 'dp'] },
  { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
  { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
  { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
  { contestId: 580, index: 'C', name: 'Kefa and Park', rating: 1500, tags: ['dfs and similar', 'trees'] },
];

const POPULAR_CF_TAGS = [
  'all',
  'implementation',
  'math',
  'greedy',
  'dp',
  'data structures',
  'graphs',
  'binary search',
  'trees',
  'strings',
  'number theory',
  'brute force',
  'constructive algorithms',
  'two pointers',
  'sortings',
  'combinatorics',
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

function getRatingColor(rating?: number): string {
  if (!rating) return 'text-slate-400';
  if (rating < 1200) return 'text-slate-300';
  if (rating < 1400) return 'text-emerald-400';
  if (rating < 1600) return 'text-cyan-400';
  if (rating < 1900) return 'text-blue-400';
  if (rating < 2100) return 'text-purple-400';
  if (rating < 2400) return 'text-amber-400';
  return 'text-red-400';
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  profile,
  attempts,
  onAttemptLogged,
  onSaveMistake,
  activeProblem,
  onSelectProblem,
  onAskCommunity,
}) => {
  const { success, error, info } = useToast();
  const [selectedProblem, setSelectedProblem] = useState<CFProblem>(
    activeProblem || RECOMMENDED_STARTER_PROBLEMS[0]
  );
  const [queueMode, setQueueMode] = useState<'codeforces' | 'starter'>('codeforces');
  const [cfProblems, setCfProblems] = useState<CFProblem[]>([]);
  const [isLoadingCf, setIsLoadingCf] = useState<boolean>(false);
  const [cfTotal, setCfTotal] = useState<number>(11481);
  const [cfSource, setCfSource] = useState<string>('codeforces');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(24);
  const [quickInput, setQuickInput] = useState<string>('');
  const [isQuickLoading, setIsQuickLoading] = useState<boolean>(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const problem = activeProblem || selectedProblem;
  const problemId = `${problem.contestId || ''}${problem.index}`;

  // Fetch all/unlimited Codeforces problems on mount or refresh
  const loadCodeforcesProblems = useCallback(async () => {
    setIsLoadingCf(true);
    try {
      const list = await codeforcesService.getProblems({
        limit: 'all',
      });
      setCfProblems(list);
      setCfTotal((list as any).total || list.length);
      setCfSource((list as any).source || 'catalog');
    } catch (err: any) {
      console.warn('Could not fetch Codeforces problemset:', err.message);
      // Fallback gracefully to starter list
      setCfProblems(RECOMMENDED_STARTER_PROBLEMS);
    } finally {
      setIsLoadingCf(false);
    }
  }, []);

  useEffect(() => {
    loadCodeforcesProblems();
  }, [loadCodeforcesProblems]);

  // Filter problems according to active mode and filters
  const filteredProblems = useMemo(() => {
    const pool = queueMode === 'starter' ? RECOMMENDED_STARTER_PROBLEMS : cfProblems;

    return pool.filter((p) => {
      // 1. Search Query
      const q = searchFilter.trim().toLowerCase();
      const pid = `${p.contestId || ''}${p.index || ''}`.toLowerCase();
      const matchesSearch =
        q === '' ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        pid.includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      // 2. Rating filter
      const r = p.rating || 0;
      if (ratingFilter === '800-1000' && (r < 800 || r > 1000)) return false;
      if (ratingFilter === '1100-1300' && (r < 1100 || r > 1300)) return false;
      if (ratingFilter === '1400-1600' && (r < 1400 || r > 1600)) return false;
      if (ratingFilter === '1600-1900' && (r < 1600 || r > 1900)) return false;
      if (ratingFilter === '2000+' && r < 2000) return false;

      // 3. Tag filter (applicable in Codeforces mode)
      if (queueMode === 'codeforces' && selectedTag !== 'all') {
        if (!Array.isArray(p.tags) || !p.tags.includes(selectedTag)) return false;
      }

      return true;
    });
  }, [queueMode, cfProblems, searchFilter, ratingFilter, selectedTag]);

  // Sliced problems for display
  const displayedProblems = useMemo(() => {
    return filteredProblems.slice(0, displayLimit);
  }, [filteredProblems, displayLimit]);

  const hasMore = displayedProblems.length < filteredProblems.length;

  const handleCopySnippet = (snippet: CPSnippet) => {
    navigator.clipboard.writeText(snippet.code);
    setCopiedSnippetId(snippet.id);
    success(`"${snippet.title}" copied to clipboard!`, 'Code Snippet');
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handlePickRandomProblem = async () => {
    if (queueMode === 'starter') {
      const list = filteredProblems.length > 0 ? filteredProblems : RECOMMENDED_STARTER_PROBLEMS;
      const chosen = list[Math.floor(Math.random() * list.length)];
      setSelectedProblem(chosen);
      onSelectProblem(chosen);
      success(`Selected ${chosen.contestId}${chosen.index} — ${chosen.name}`, 'Starter Problem Loaded');
    } else {
      if (filteredProblems.length > 0) {
        const chosen = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
        setSelectedProblem(chosen);
        onSelectProblem(chosen);
        success(`Selected ${chosen.contestId}${chosen.index} — ${chosen.name}`, 'Codeforces Problem Loaded');
      } else {
        try {
          const chosen = await codeforcesService.getRandomProblem();
          setSelectedProblem(chosen);
          onSelectProblem(chosen);
          success(`Selected ${chosen.contestId}${chosen.index} — ${chosen.name}`, 'Codeforces Problem Loaded');
        } catch {
          const chosen = RECOMMENDED_STARTER_PROBLEMS[0];
          setSelectedProblem(chosen);
          onSelectProblem(chosen);
        }
      }
    }
  };

  // Quick load any Codeforces problem by ID (e.g. "4A", "1850E", "2060A")
  const handleQuickLoadProblem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = quickInput.trim();
    if (!raw) return;

    setIsQuickLoading(true);
    try {
      const found = await codeforcesService.getProblemById(raw);
      if (found) {
        setSelectedProblem(found);
        onSelectProblem(found);
        success(`Loaded ${found.contestId}${found.index}: ${found.name}`, 'Problem Loaded');
        setQuickInput('');
      } else {
        const match = raw.match(/^(\d+)([a-zA-Z]\d*)$/);
        if (match) {
          const customProb: CFProblem = {
            contestId: parseInt(match[1], 10),
            index: match[2].toUpperCase(),
            name: `Codeforces Problem ${raw.toUpperCase()}`,
            rating: 1200,
            tags: ['implementation'],
          };
          setSelectedProblem(customProb);
          onSelectProblem(customProb);
          success(`Loaded Problem ${raw.toUpperCase()} into Workspace`, 'Workspace Updated');
          setQuickInput('');
        } else {
          error(`Could not locate Codeforces problem "${raw}". Try format like "4A" or "1850E".`);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to load problem');
    } finally {
      setIsQuickLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Anime Coding Companion Banner */}
      <AnimeViewCompanionBanner
        screenTitle="Battleground Code Editor &amp; Workspace"
        subtitle="Write clean, performant algorithms with Monaco Editor syntax highlighting, sample I/O execution, and instant verdict telemetry!"
        badgeText="Battle Terminal"
        badgeIcon="💻"
        stickerType="zero_bugs"
      />

      {/* Workspace Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Pick a random problem from Codeforces"
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{problem.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {problem.rating && (
                  <span className={`font-semibold ${getRatingColor(problem.rating)}`}>
                    ⚡ Rating {problem.rating}
                  </span>
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

      {/* Direct Codeforces Problem Quick-Loader */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <form onSubmit={handleQuickLoadProblem} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Load ANY Codeforces problem by ID (e.g. 4A, 71A, 158B, 1850E, 2060A)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isQuickLoading || !quickInput.trim()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
          >
            {isQuickLoading ? (
              <>
                <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Loading CF...</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5" />
                <span>Load & Solve in Workspace</span>
              </>
            )}
          </button>
        </form>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          <span className="text-slate-500">Popular Quick Jumps:</span>
          {['4A', '71A', '231A', '158B', '455A', '1850E', '2060A'].map((id) => (
            <button
              key={id}
              onClick={() => {
                setQuickInput(id);
                codeforcesService.getProblemById(id).then((p) => {
                  if (p) {
                    setSelectedProblem(p);
                    onSelectProblem(p);
                    success(`Loaded ${p.contestId}${p.index}: ${p.name}`, 'Problem Loaded');
                  }
                });
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] border border-slate-700/60 transition-colors cursor-pointer"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* CP Algorithm & Snippet Quick-Reference Drawer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Competitive Programming Snippet Toolbox</h3>
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
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 text-slate-700 dark:text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm group"
                >
                  {copiedSnippetId === snippet.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400 group-hover:text-white" />
                      <span className="text-[11px]">Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Codeforces Problem Queue & Unlimited Explorer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ProblemsIcon className="w-4 h-4 text-indigo-400" />
                <span>
                  {queueMode === 'codeforces'
                    ? 'Codeforces Problemset Queue'
                    : 'Curated 1600 Starter Queue'}
                </span>
              </h3>
              <span className="text-xs text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full">
                {isLoadingCf
                  ? 'Loading catalog...'
                  : `${filteredProblems.length.toLocaleString()} available`}
              </span>
              {queueMode === 'codeforces' && (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  ⚡ Unlimited CF Catalog ({cfTotal.toLocaleString()} total)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {queueMode === 'codeforces'
                ? `Showing ${displayedProblems.length} of ${filteredProblems.length.toLocaleString()} filtered problems from Codeforces.`
                : '17 foundational milestone problems designed for rapid 1600 rating advancement.'}
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setQueueMode('codeforces');
                  setDisplayLimit(24);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  queueMode === 'codeforces'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Codeforces Full Problemset</span>
                <span className="text-[10px] bg-indigo-800/80 px-1.5 py-0.2 rounded font-mono">11k+</span>
              </button>
              <button
                onClick={() => {
                  setQueueMode('starter');
                  setDisplayLimit(24);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  queueMode === 'starter'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>1600 Starter Queue</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono">17</span>
              </button>
            </div>

            {queueMode === 'codeforces' && (
              <button
                onClick={loadCodeforcesProblems}
                disabled={isLoadingCf}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                title="Refresh Codeforces problemset"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${isLoadingCf ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating Filter Pills */}
            <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
              {[
                { label: 'All', val: 'all' },
                { label: '800-1000', val: '800-1000' },
                { label: '1100-1300', val: '1100-1300' },
                { label: '1400-1600', val: '1400-1600' },
                { label: '1600-1900', val: '1600-1900' },
                { label: '2000+', val: '2000+' },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => {
                    setRatingFilter(f.val);
                    setDisplayLimit(24);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    ratingFilter === f.val
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tag Selector (Codeforces mode) */}
            {queueMode === 'codeforces' && (
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => {
                    setSelectedTag(e.target.value);
                    setDisplayLimit(24);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer capitalize font-medium"
                >
                  {POPULAR_CF_TAGS.map((tag) => (
                    <option key={tag} value={tag} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {tag === 'all' ? 'All Tags & Topics' : tag}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or tag..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setDisplayLimit(24);
              }}
              className="w-full sm:w-56 pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Problems Grid */}
        {isLoadingCf && cfProblems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <RefreshIcon className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Loading Codeforces Problemset...</p>
            <p className="text-xs text-slate-500">Connecting to official Codeforces catalog (11,481+ problems)...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No problems match the current filter criteria</p>
            <p className="text-xs text-slate-500">
              Try adjusting the rating range, clearing the search query, or switching tag filters.
            </p>
            <button
              onClick={() => {
                setRatingFilter('all');
                setSelectedTag('all');
                setSearchFilter('');
              }}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedProblems.map((p) => {
              const pid = `${p.contestId}${p.index}`;
              const isCurrent = pid === problemId;
              return (
                <div
                  key={pid}
                  onClick={() => {
                    setSelectedProblem(p);
                    onSelectProblem(p);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-indigo-950/50 border-indigo-500/80 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {pid}
                      </span>
                      {p.rating ? (
                        <span className={`font-bold text-xs ${getRatingColor(p.rating)}`}>
                          ⚡ {p.rating}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Unrated</span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate">
                      {p.name}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] text-slate-400 capitalize truncate max-w-[150px]">
                      {Array.isArray(p.tags) && p.tags.length > 0
                        ? p.tags.slice(0, 2).join(', ')
                        : 'general'}
                    </span>
                    <span className="text-indigo-400 font-medium flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                      Open Solver <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unlimited Pagination Controls */}
        {hasMore && (
          <div className="flex items-center justify-center gap-3 pt-4 pb-2">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 48)}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:border-indigo-500/50"
            >
              Load More (+48 Problems)
            </button>
            <button
              onClick={() => setDisplayLimit(filteredProblems.length)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <span>Load Unlimited ({filteredProblems.length.toLocaleString()} Total)</span>
            </button>
          </div>
        )}

        {!hasMore && filteredProblems.length > 0 && (
          <div className="text-center pt-3 text-xs text-slate-500 font-mono">
            ✓ All {filteredProblems.length.toLocaleString()} matching Codeforces problems loaded in queue
          </div>
        )}
      </div>
    </div>
  );
};
