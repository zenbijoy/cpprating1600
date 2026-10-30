import React, { useState, useEffect, useCallback } from 'react';
import {
  CodingBracketsIcon,
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  SourceCodeIcon,
  ShieldIcon,
  TerminalIcon,
  SplitPanelControlIcon,
  RefreshIcon,
  WarningStatusIcon,
  CodeFileIcon,
  ProblemTagsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditorialIcon,
  MedalIcon,
  AISparkleIcon,
  CloseIcon,
  CommunityIcon,
} from './icons';
import { EmptySavedState, RocketLoading } from './assets';
import { useToast } from './Toast';

export interface SolutionItemSummary {
  id: string;
  problem_id: string | null;
  contest_id: number | null;
  problem_index: string | null;
  problem_name: string | null;
  rating: number | null;
  tags: string[];
  language: string;
  compiler_standard: string;
  validation_status: string;
  mapping_confidence: string;
  source_repository: string;
  source_file_path: string;
  original_author: string;
  license_spdx: string;
  statement_url?: string;
}

export interface DetailedSolution extends SolutionItemSummary {
  source_code: string;
  source_sha256: string;
  normalized_sha256: string;
  source_repository_url: string;
  source_commit: string;
  validation_notes?: string;
  provenance: Array<{
    source_repository: string;
    source_repository_url: string;
    source_commit: string;
    source_file_path: string;
    original_author: string;
    license_spdx: string;
    imported_at: string;
  }>;
}

interface SolutionLibraryViewProps {
  initialProblemId?: string;
  onOpenWorkspaceWithCode?: (code: string, problemName?: string) => void;
  onShareToCommunity?: (code: string, problemName?: string, problemUrl?: string) => void;
}

export const SolutionLibraryView: React.FC<SolutionLibraryViewProps> = ({
  initialProblemId,
  onOpenWorkspaceWithCode,
  onShareToCommunity,
}) => {
  const toast = useToast();
  const [solutions, setSolutions] = useState<SolutionItemSummary[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>(initialProblemId || '');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(800);
  const [maxRating, setMaxRating] = useState<number>(2400);
  const [sortBy, setSortBy] = useState<string>('rating-asc');

  // Selected solution for code modal
  const [selectedSolution, setSelectedSolution] = useState<DetailedSolution | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Comparison State
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [compareSol1, setCompareSol1] = useState<DetailedSolution | null>(null);
  const [compareSol2, setCompareSol2] = useState<DetailedSolution | null>(null);
  const [compareMetrics, setCompareMetrics] = useState<any>(null);

  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
      });

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedTag !== 'all') params.set('tag', selectedTag);
      if (selectedRepo !== 'all') params.set('repo', selectedRepo);
      if (minRating > 800) params.set('minRating', String(minRating));
      if (maxRating < 2400) params.set('maxRating', String(maxRating));

      const res = await fetch(`/api/solutions?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setSolutions(data.results);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        throw new Error(data.error || 'Failed to fetch solutions');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to solutions server');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, selectedTag, selectedRepo, minRating, maxRating, sortBy]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  const handleOpenSolution = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/solutions/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSolution(data.solution);
      }
    } catch (e: any) {
      console.error('Failed to load solution code:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.show('Solution code copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInWorkspaceDirect = async (id: string, name?: string | null) => {
    try {
      const res = await fetch(`/api/solutions/${id}`);
      const data = await res.json();
      if (data.success && data.solution?.source_code && onOpenWorkspaceWithCode) {
        onOpenWorkspaceWithCode(data.solution.source_code, name || data.solution.problem_name || undefined);
        toast.show('Loaded solution directly into IDE Workspace!', 'success');
      }
    } catch {
      toast.show('Failed to fetch solution code', 'error');
    }
  };

  const handleStartCompare = async (sol: DetailedSolution) => {
    setCompareSol1(sol);
    // Fetch alternative solutions for the same problem
    if (sol.problem_id) {
      try {
        const res = await fetch(`/api/solutions/problem/${sol.problem_id}`);
        const data = await res.json();
        if (data.success && data.solutions.length > 1) {
          const alt = data.solutions.find((s: any) => s.id !== sol.id) || data.solutions[0];
          setCompareSol2(alt);

          // Get metrics
          const compRes = await fetch(`/api/solutions/compare?id1=${sol.id}&id2=${alt.id}`);
          const compData = await compRes.json();
          if (compData.success) {
            setCompareMetrics(compData.metrics);
          }
        }
      } catch (err) {
        console.error('Compare fetch error:', err);
      }
    }
    setCompareModalOpen(true);
  };

  // Helper for Rating Colors
  const getRatingBadgeClass = (rating: number | null) => {
    if (!rating) return 'bg-slate-800 text-slate-400 border-slate-700';
    if (rating < 1200) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (rating < 1400) return 'bg-emerald-950/60 text-emerald-400 border-emerald-800';
    if (rating < 1600) return 'bg-cyan-950/60 text-cyan-400 border-cyan-800';
    if (rating < 1900) return 'bg-blue-950/60 text-blue-400 border-blue-800';
    if (rating < 2100) return 'bg-purple-950/60 text-purple-400 border-purple-800';
    if (rating < 2400) return 'bg-amber-950/60 text-amber-400 border-amber-800';
    return 'bg-red-950/60 text-red-400 border-red-800';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TerminalIcon size={120} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
            <ShieldIcon size={14} semantic="primary" />
            <span>5,000+ Verified & Permissively Licensed C++ Solutions</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Codeforces C++ Solution Library</h1>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            Search, study, and compare verified Modern C++ implementations across 11,000+ Codeforces problems.
            Fully compliant with MIT and Apache-2.0 open-source licensing with complete source attribution.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <EditorialIcon size={14} semantic="primary" />
              <span>Catalog: <strong className="text-slate-200">{total.toLocaleString()}</strong> Unique Solutions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MedalIcon size={14} semantic="success" />
              <span>Standards: <strong className="text-slate-200">GNU C++17 / C++20</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <SourceCodeIcon size={14} semantic="primary" />
              <span>Multi-Source Provenance & Deduplication Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Problem ID (e.g. 4A, 1000A), title, tag, or author..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <CloseIcon size={16} />
              </button>
            )}
          </div>

          {/* Tag Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedTag}
              onChange={(e) => {
                setSelectedTag(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Topics / Tags</option>
              <option value="implementation">Implementation</option>
              <option value="math">Math</option>
              <option value="greedy">Greedy</option>
              <option value="dp">Dynamic Programming</option>
              <option value="data structures">Data Structures</option>
              <option value="binary search">Binary Search</option>
              <option value="strings">Strings</option>
              <option value="dfs and similar">DFS / BFS</option>
              <option value="graphs">Graphs</option>
              <option value="two pointers">Two Pointers</option>
              <option value="number theory">Number Theory</option>
              <option value="constructive algorithms">Constructive</option>
            </select>
          </div>

          {/* Source Repo Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedRepo}
              onChange={(e) => {
                setSelectedRepo(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Repositories</option>
              <option value="DionysiosB">DionysiosB (MIT)</option>
              <option value="Shah-Shishir">Shah-Shishir (Apache-2.0)</option>
              <option value="cbarnson">cbarnson (MIT)</option>
              <option value="Alif-Riasat">Alif-Riasat (MIT)</option>
              <option value="almuzahidseyam">almuzahidseyam (Apache-2.0)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-44">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="rating-asc">Difficulty (Low → High)</option>
              <option value="rating-desc">Difficulty (High → Low)</option>
              <option value="contest-desc">Contest (Newest First)</option>
              <option value="contest-asc">Contest (Oldest First)</option>
            </select>
          </div>
        </div>

        {/* Rating Range Selector */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
          <span className="font-medium text-slate-300">Rating Filter:</span>
          {[
            { label: 'All Ratings', min: 800, max: 2400 },
            { label: '800-1100 (Newbie)', min: 800, max: 1100 },
            { label: '1200-1399 (Pupil)', min: 1200, max: 1399 },
            { label: '1400-1599 (Specialist Target)', min: 1400, max: 1599 },
            { label: '1600-1899 (Expert)', min: 1600, max: 1899 },
            { label: '1900+ (Candidate Master+)', min: 1900, max: 2400 },
          ].map((preset) => {
            const isActive = minRating === preset.min && maxRating === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setMinRating(preset.min);
                  setMaxRating(preset.max);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md border transition-all ${
                  isActive
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Solutions Grid */}
      {loading ? (
        <div className="py-16">
          <RocketLoading size={130} label="Querying Verified Solution Library..." />
        </div>
      ) : error ? (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 text-center text-red-400 space-y-2">
          <WarningStatusIcon size={32} semantic="error" className="mx-auto" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchSolutions}
            className="mt-3 px-4 py-1.5 bg-red-900/40 hover:bg-red-800/60 border border-red-700 rounded-lg text-xs font-medium text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : solutions.length === 0 ? (
        <EmptySavedState
          title="No Matching Solutions Found"
          description="Try adjusting your search query, difficulty range, or topic tag filters."
          actionText="Reset Search Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedTag('all');
            setSelectedRepo('all');
            setPage(1);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/70 border border-slate-800/90 hover:border-blue-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-lg group"
            >
              <div>
                {/* Header row: Problem ID, Rating, License */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                      {item.problem_id || 'Review'}
                    </span>
                    {item.rating ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getRatingBadgeClass(item.rating)}`}>
                        ★ {item.rating}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-800 text-slate-400 border-slate-700">
                        Unrated
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {item.license_spdx}
                  </span>
                </div>

                {/* Problem Title */}
                <h3 className="font-semibold text-slate-100 text-base group-hover:text-blue-300 transition-colors line-clamp-1">
                  {item.problem_name || `Contest ${item.contest_id} Problem ${item.problem_index}`}
                </h3>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {item.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-slate-950/70 text-slate-400 border border-slate-800/80 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[10px] text-slate-500 px-1 py-0.5">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Provenance Metadata */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Author:</span>
                    <span className="font-medium text-slate-300">{item.original_author}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Repository:</span>
                    <span className="font-mono text-[11px] text-slate-400 truncate max-w-[170px]" title={item.source_repository}>
                      {item.source_repository}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {item.statement_url && (
                  <a
                    href={item.statement_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <ExternalLinkIcon size={13} />
                    <span>Problem</span>
                  </a>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  {onOpenWorkspaceWithCode && (
                    <button
                      onClick={() => handleOpenInWorkspaceDirect(item.id, item.problem_name || item.problem_id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      title="Load solution directly into IDE workspace"
                    >
                      <TerminalIcon size={13} />
                      <span>IDE</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenSolution(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <CodingBracketsIcon size={14} />
                    <span>View C++ Code</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-sm text-slate-400">
          <div>
            Showing <strong className="text-slate-200">{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-200">{Math.min(page * pageSize, total)}</strong> of{' '}
            <strong className="text-slate-200">{total.toLocaleString()}</strong> verified solutions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 transition-colors"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <span className="px-3 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 transition-colors"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Code Viewer Modal */}
      {selectedSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {selectedSolution.problem_id || 'Codeforces'}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedSolution.problem_name || selectedSolution.source_file_path}
                    {selectedSolution.rating && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getRatingBadgeClass(selectedSolution.rating)}`}>
                        ★ {selectedSolution.rating}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Standard: <span className="text-slate-200 font-mono">{selectedSolution.compiler_standard}</span> | License:{' '}
                    <span className="text-slate-200 font-mono">{selectedSolution.license_spdx}</span> | Author:{' '}
                    <span className="text-slate-200">{selectedSolution.original_author}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCompare(selectedSolution)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
                  title="Compare with another solution for this problem"
                >
                  <SplitPanelControlIcon size={14} />
                  <span>Compare</span>
                </button>

                <button
                  onClick={() => handleCopyCode(selectedSolution.source_code, selectedSolution.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  {copiedId === selectedSolution.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  <span>{copiedId === selectedSolution.id ? 'Copied!' : 'Copy Code'}</span>
                </button>

                {onOpenWorkspaceWithCode && (
                  <button
                    onClick={() => {
                      onOpenWorkspaceWithCode(selectedSolution.source_code, selectedSolution.problem_name || selectedSolution.problem_id || undefined);
                      setSelectedSolution(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <TerminalIcon size={14} />
                    <span>Open in IDE</span>
                  </button>
                )}

                {onShareToCommunity && (
                  <button
                    onClick={() => {
                      onShareToCommunity(
                        selectedSolution.source_code,
                        selectedSolution.problem_name || selectedSolution.problem_id || undefined,
                        selectedSolution.statement_url
                      );
                      setSelectedSolution(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    title="Share and discuss this solution with the community"
                  >
                    <CommunityIcon size={14} />
                    <span>Discuss</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedSolution(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed">
              <pre className="overflow-x-auto whitespace-pre">
                <code>
                  {selectedSolution.source_code.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row">
                      <span className="table-cell pr-4 text-slate-600 select-none text-right w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell">{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* Modal Footer: Provenance notice */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldIcon size={14} semantic="success" />
                <span>
                  Attribution: Originally authored by <strong>{selectedSolution.original_author}</strong> in{' '}
                  <a
                    href={selectedSolution.source_repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    {selectedSolution.source_repository}
                  </a>
                  {' '}(SHA: <code className="text-slate-300">{selectedSolution.source_commit?.slice(0, 8)}</code>)
                </span>
              </div>
              <span className="text-slate-500">
                SHA-256: <code className="text-slate-400">{selectedSolution.source_sha256?.slice(0, 12)}...</code>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && compareSol1 && compareSol2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <SplitPanelControlIcon size={20} semantic="primary" />
                <div>
                  <h2 className="text-base font-bold text-white">Side-by-Side C++ Implementation Comparison</h2>
                  <p className="text-xs text-slate-400">
                    Comparing two distinct solutions for problem <strong className="text-slate-200">{compareSol1.problem_id}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Metrics Header */}
            {compareMetrics && (
              <div className="grid grid-cols-2 bg-slate-950 px-6 py-2.5 border-b border-slate-800 text-xs text-slate-300">
                <div className="border-r border-slate-800 pr-4 flex items-center justify-between">
                  <span>Author: <strong className="text-blue-300">{compareMetrics.solution1.author}</strong></span>
                  <span>Lines: <strong className="text-slate-100">{compareMetrics.solution1.lines}</strong> | Chars: <strong className="text-slate-100">{compareMetrics.solution1.chars}</strong></span>
                </div>
                <div className="pl-4 flex items-center justify-between">
                  <span>Author: <strong className="text-purple-300">{compareMetrics.solution2.author}</strong></span>
                  <span>Lines: <strong className="text-slate-100">{compareMetrics.solution2.lines}</strong> | Chars: <strong className="text-slate-100">{compareMetrics.solution2.chars}</strong></span>
                </div>
              </div>
            )}

            {/* Split Screen Code */}
            <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800 overflow-hidden bg-slate-950">
              <div className="overflow-auto p-4 font-mono text-xs text-slate-200">
                <div className="text-[11px] font-semibold text-blue-400 mb-2 pb-1 border-b border-slate-800">
                  Solution 1 ({compareSol1.source_repository})
                </div>
                <pre className="whitespace-pre">
                  <code>{compareSol1.source_code}</code>
                </pre>
              </div>

              <div className="overflow-auto p-4 font-mono text-xs text-slate-200">
                <div className="text-[11px] font-semibold text-purple-400 mb-2 pb-1 border-b border-slate-800">
                  Solution 2 ({compareSol2.source_repository})
                </div>
                <pre className="whitespace-pre">
                  <code>{compareSol2.source_code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
