import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  tokenizeCode,
  parseProblemMetadata,
  CodeLine,
  CodeToken,
  ParsedProblemMetadata,
} from '../utils/codeTokenizer';
import {
  CopyIcon,
  CheckIcon,
  SearchIcon,
  CloseIcon,
  TerminalIcon,
  ExternalLinkIcon,
  CodingBracketsIcon,
  SplitPanelControlIcon,
  ShieldIcon,
  AISparkleIcon,
} from './icons';

export type CodeThemeId = 'cyberpunk' | 'onedark' | 'dracula' | 'monokai' | 'radiant-light';

export interface CodeTheme {
  id: CodeThemeId;
  name: string;
  isDark: boolean;
  bg: string;
  gutterBg: string;
  gutterBorder: string;
  gutterText: string;
  activeLineBg: string;
  highlightedLineBg: string;
  selectionBg: string;
  tokens: {
    directive: string;
    header: string;
    comment: string;
    commentMeta: string;
    keyword: string;
    type: string;
    function: string;
    number: string;
    string: string;
    char: string;
    operator: string;
    punctuation: string;
    plain: string;
  };
}

export const CODE_THEMES: Record<CodeThemeId, CodeTheme> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Synthwave Neon',
    isDark: true,
    bg: '#0c1020',
    gutterBg: '#080c18',
    gutterBorder: '#1e293b',
    gutterText: '#64748b',
    activeLineBg: 'rgba(99, 102, 241, 0.12)',
    highlightedLineBg: 'rgba(236, 72, 153, 0.18)',
    selectionBg: 'rgba(99, 102, 241, 0.3)',
    tokens: {
      directive: '#f43f5e',
      header: '#2dd4bf',
      comment: '#94a3b8',
      commentMeta: '#38bdf8',
      keyword: '#c084fc',
      type: '#38bdf8',
      function: '#fde047',
      number: '#fb923c',
      string: '#a3e635',
      char: '#a3e635',
      operator: '#f472b6',
      punctuation: '#cbd5e1',
      plain: '#f8fafc',
    },
  },
  onedark: {
    id: 'onedark',
    name: 'One Dark Pro',
    isDark: true,
    bg: '#1e222b',
    gutterBg: '#181b22',
    gutterBorder: '#2d3340',
    gutterText: '#5c6370',
    activeLineBg: 'rgba(255, 255, 255, 0.05)',
    highlightedLineBg: 'rgba(97, 175, 239, 0.15)',
    selectionBg: 'rgba(97, 175, 239, 0.3)',
    tokens: {
      directive: '#e06c75',
      header: '#98c379',
      comment: '#7f848e',
      commentMeta: '#e5c07b',
      keyword: '#c678dd',
      type: '#e5c07b',
      function: '#61afef',
      number: '#d19a66',
      string: '#98c379',
      char: '#98c379',
      operator: '#56b6c2',
      punctuation: '#abb2bf',
      plain: '#abb2bf',
    },
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula Midnight',
    isDark: true,
    bg: '#181a24',
    gutterBg: '#13141d',
    gutterBorder: '#282a36',
    gutterText: '#6272a4',
    activeLineBg: 'rgba(189, 147, 249, 0.1)',
    highlightedLineBg: 'rgba(255, 121, 198, 0.18)',
    selectionBg: 'rgba(189, 147, 249, 0.3)',
    tokens: {
      directive: '#ff79c6',
      header: '#50fa7b',
      comment: '#6272a4',
      commentMeta: '#8be9fd',
      keyword: '#bd93f9',
      type: '#8be9fd',
      function: '#50fa7b',
      number: '#ffb86c',
      string: '#f1fa8c',
      char: '#f1fa8c',
      operator: '#ff79c6',
      punctuation: '#f8f8f2',
      plain: '#f8f8f2',
    },
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai Pro',
    isDark: true,
    bg: '#1b1d1e',
    gutterBg: '#151617',
    gutterBorder: '#2f3335',
    gutterText: '#75715e',
    activeLineBg: 'rgba(249, 38, 114, 0.08)',
    highlightedLineBg: 'rgba(230, 219, 116, 0.15)',
    selectionBg: 'rgba(249, 38, 114, 0.25)',
    tokens: {
      directive: '#f92672',
      header: '#a6e22e',
      comment: '#75715e',
      commentMeta: '#fd971f',
      keyword: '#f92672',
      type: '#66d9ef',
      function: '#a6e22e',
      number: '#ae81ff',
      string: '#e6db74',
      char: '#e6db74',
      operator: '#f92672',
      punctuation: '#f8f8f2',
      plain: '#f8f8f2',
    },
  },
  'radiant-light': {
    id: 'radiant-light',
    name: 'Joyful Solar Light',
    isDark: false,
    bg: '#f8fafc',
    gutterBg: '#edf2f7',
    gutterBorder: '#cbd5e1',
    gutterText: '#94a3b8',
    activeLineBg: 'rgba(99, 102, 241, 0.08)',
    highlightedLineBg: 'rgba(245, 158, 11, 0.15)',
    selectionBg: 'rgba(99, 102, 241, 0.2)',
    tokens: {
      directive: '#be185d',
      header: '#047857',
      comment: '#64748b',
      commentMeta: '#0284c7',
      keyword: '#7c3aed',
      type: '#0284c7',
      function: '#b45309',
      number: '#c2410c',
      string: '#15803d',
      char: '#15803d',
      operator: '#9333ea',
      punctuation: '#334155',
      plain: '#0f172a',
    },
  },
};

/**
 * Playful micro-chime using Web Audio API for celebratory feedback
 */
function playJoyChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (joyful victory chord)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.28);
    });
  } catch {
    // Ignore restricted audio
  }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
}

export interface JoyCodeViewerProps {
  code: string;
  title?: string;
  problemId?: string;
  rating?: number | null;
  compilerStandard?: string;
  license?: string;
  author?: string;
  repository?: string;
  repositoryUrl?: string;
  commitSha?: string;
  sha256?: string;
  statementUrl?: string;
  maxHeight?: string;
  onOpenInIDE?: () => void;
  onCompare?: () => void;
  onDiscuss?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const JoyCodeViewer: React.FC<JoyCodeViewerProps> = ({
  code,
  title,
  problemId,
  rating,
  compilerStandard = 'C++20',
  license = 'MIT',
  author = 'CLIMB Master Solution Engine',
  repository,
  repositoryUrl,
  commitSha,
  sha256,
  statementUrl,
  maxHeight = '72vh',
  onOpenInIDE,
  onCompare,
  onDiscuss,
  onClose,
  isModal = true,
}) => {
  // Theme & Appearance State
  const [themeId, setThemeId] = useState<CodeThemeId>('cyberpunk');
  const [fontSize, setFontSize] = useState<number>(13);
  const [lineWrap, setLineWrap] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showStrategyHUD, setShowStrategyHUD] = useState<boolean>(true);

  // Search in Code State
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Interactive Pin / Hover Lines
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [pinnedLines, setPinnedLines] = useState<Set<number>>(new Set());

  // Copy Feedback & Celebration
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const theme = CODE_THEMES[themeId] || CODE_THEMES.cyberpunk;

  // Tokenize code memoized
  const tokenizedLines = useMemo(() => tokenizeCode(code), [code]);

  // Extract structured problem metadata
  const metadata: ParsedProblemMetadata = useMemo(() => parseProblemMetadata(code), [code]);

  // Search match count
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches(0);
      return;
    }
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = (code.match(regex) || []).length;
    setSearchMatches(matches);
  }, [searchQuery, code]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Confetti / Particle animation handler
  const triggerCelebration = () => {
    playJoyChime();
    const colors = ['#f43f5e', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 60;
      newParticles.push({
        id: Date.now() + i,
        x: 0,
        y: 0,
        color: colors[i % colors.length],
        size: Math.random() * 6 + 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    triggerCelebration();
    setTimeout(() => setCopied(false), 2400);
  };

  const handleCopySingleLine = (text: string, lineNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedLine(lineNum);
    setTimeout(() => setCopiedLine(null), 1500);
  };

  const togglePinLine = (lineNum: number) => {
    setPinnedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Helper for Rating Colors
  const getRatingBadge = (r: number | null | undefined) => {
    if (!r) return { text: 'Unrated', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    if (r < 1200) return { text: `★ ${r}`, bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60' };
    if (r < 1400) return { text: `★ ${r}`, bg: 'bg-teal-950/70 text-teal-300 border-teal-700/60' };
    if (r < 1600) return { text: `★ ${r}`, bg: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60' };
    if (r < 1900) return { text: `★ ${r}`, bg: 'bg-blue-950/70 text-blue-300 border-blue-700/60' };
    if (r < 2100) return { text: `★ ${r}`, bg: 'bg-purple-950/70 text-purple-300 border-purple-700/60' };
    if (r < 2400) return { text: `★ ${r}`, bg: 'bg-amber-950/70 text-amber-300 border-amber-700/60' };
    return { text: `★ ${r}`, bg: 'bg-rose-950/70 text-rose-300 border-rose-700/60' };
  };

  const ratingInfo = getRatingBadge(rating || (metadata.difficulty ? parseInt(metadata.difficulty, 10) : null));
  const effectiveProbId = problemId || metadata.problemId || 'Codeforces';
  const effectiveTitle = title || metadata.problemName || 'C++ Solution';

  // Render Token with Search Highlight
  const renderToken = (token: CodeToken, idx: number) => {
    let color = theme.tokens.plain;
    let fontWeight = 'normal';
    let fontStyle = 'normal';

    switch (token.type) {
      case 'directive':
        color = theme.tokens.directive;
        fontWeight = 'bold';
        break;
      case 'header':
        color = theme.tokens.header;
        fontWeight = 'bold';
        break;
      case 'comment':
        color = theme.tokens.comment;
        fontStyle = 'italic';
        break;
      case 'comment-meta':
        color = theme.tokens.commentMeta;
        fontWeight = 'bold';
        break;
      case 'keyword':
        color = theme.tokens.keyword;
        fontWeight = 'bold';
        break;
      case 'type':
        color = theme.tokens.type;
        fontWeight = '600';
        break;
      case 'function':
        color = theme.tokens.function;
        fontWeight = '600';
        break;
      case 'number':
        color = theme.tokens.number;
        break;
      case 'string':
      case 'char':
        color = theme.tokens.string;
        break;
      case 'operator':
        color = theme.tokens.operator;
        fontWeight = '600';
        break;
      case 'punctuation':
        color = theme.tokens.punctuation;
        break;
      case 'plain':
      default:
        color = theme.tokens.plain;
    }

    // Apply search query highlight if active
    if (searchQuery.trim() && token.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      const parts = token.text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return (
        <span key={idx} style={{ color, fontWeight, fontStyle }}>
          {parts.map((part, pIdx) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark
                key={pIdx}
                className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded-xs shadow-xs"
              >
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    }

    return (
      <span key={idx} style={{ color, fontWeight, fontStyle }}>
        {token.text}
      </span>
    );
  };

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-slate-950 w-screen h-screen'
    : 'w-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 transition-all duration-200';

  return (
    <div
      className={containerClasses}
      style={{
        backgroundColor: theme.bg,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(99, 102, 241, 0.15)',
      }}
    >
      {/* Radiant Top Accent Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-pink-500 shrink-0" />

      {/* Top Header Bar */}
      <div
        className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b shrink-0"
        style={{
          backgroundColor: theme.gutterBg,
          borderColor: theme.gutterBorder,
        }}
      >
        {/* Left: Problem Badge, Title, Standard */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs shrink-0 tracking-wider">
            {effectiveProbId}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight flex items-center gap-2">
                {effectiveTitle}
              </h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${ratingInfo.bg}`}>
                {ratingInfo.text}
              </span>
              {statementUrl && (
                <a
                  href={statementUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 hover:underline ml-1"
                  title="Open Problem on Codeforces"
                >
                  <ExternalLinkIcon size={12} />
                  <span>Problem</span>
                </a>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                Standard: <strong className="font-mono text-slate-200">{compilerStandard}</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                License: <strong className="font-mono text-emerald-400">{license}</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                Author: <strong className="text-slate-300">{author}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Joyful Actions & Controls */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Compare Button */}
          {onCompare && (
            <button
              onClick={onCompare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all hover:scale-102 cursor-pointer shadow-xs"
              title="Compare with another solution"
            >
              <SplitPanelControlIcon size={14} />
              <span>Compare</span>
            </button>
          )}

          {/* Copy Code with Confetti Particles */}
          <div className="relative">
            <button
              ref={copyButtonRef}
              onClick={handleCopyCode}
              className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md ${
                copied
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
              }`}
            >
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span>{copied ? '✨ Copied to Clipboard!' : 'Copy Code'}</span>
            </button>

            {/* Particle Burst Render */}
            {particles.length > 0 && (
              <div className="absolute top-1/2 left-1/2 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30">
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      backgroundColor: p.color,
                      transform: `translate(${p.vx}px, ${p.vy}px)`,
                      transition: 'all 0.7s cubic-bezier(0.1, 0.8, 0.3, 1)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Open in IDE */}
          {onOpenInIDE && (
            <button
              onClick={onOpenInIDE}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition-all hover:scale-102 cursor-pointer shadow-xs"
              title="Load directly into Monaco IDE workspace"
            >
              <TerminalIcon size={14} />
              <span>Open in IDE</span>
            </button>
          )}

          {/* Discuss */}
          {onDiscuss && (
            <button
              onClick={onDiscuss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all hover:scale-102 cursor-pointer shadow-xs"
              title="Discuss with Community"
            >
              <CodingBracketsIcon size={14} />
              <span>Discuss</span>
            </button>
          )}

          {/* Close Modal */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <CloseIcon size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Joy Toolbar: Themes, Strategy HUD toggle, Font size, Search, Fullscreen */}
      <div
        className="px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 border-b text-xs shrink-0"
        style={{
          backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: theme.gutterBorder,
        }}
      >
        {/* Left side: Themes & Strategy Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">Theme:</span>
            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value as CodeThemeId)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="cyberpunk">🌌 Synthwave Neon</option>
              <option value="onedark">🎨 One Dark Pro</option>
              <option value="dracula">🧛 Dracula Midnight</option>
              <option value="monokai">⚡ Monokai Pro</option>
              <option value="radiant-light">☀️ Joyful Solar Light</option>
            </select>
          </div>

          {/* Strategy HUD Toggle */}
          {(metadata.strategy || metadata.timeComplexity) && (
            <button
              type="button"
              onClick={() => setShowStrategyHUD((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                showStrategyHUD
                  ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/50 shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <AISparkleIcon size={13} semantic="primary" />
              <span>{showStrategyHUD ? 'Hide Strategy HUD' : 'Show Strategy HUD'}</span>
            </button>
          )}

          {/* Quick Stats Pill */}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-400 border border-slate-700/60 hidden sm:inline-block">
            {tokenizedLines.length} lines • {code.length.toLocaleString()} chars
          </span>
        </div>

        {/* Right side: Search, Font size, Wrap, Fullscreen */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Trigger */}
          {searchOpen ? (
            <div className="relative flex items-center">
              <SearchIcon size={13} className="absolute left-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in code..."
                className="bg-slate-900 border border-indigo-500/80 rounded-md pl-7 pr-16 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none w-44"
              />
              <span className="absolute right-6 text-[10px] text-indigo-400 font-mono">
                {searchMatches} match
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="absolute right-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-0.5 cursor-pointer"
              >
                <CloseIcon size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Search in code (Find)"
            >
              <SearchIcon size={13} />
              <span className="hidden sm:inline">Find</span>
            </button>
          )}

          {/* Font Size Adjusters */}
          <div className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/90 overflow-hidden">
            <button
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              disabled={fontSize <= 11}
              className="px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="px-1.5 text-[10px] font-mono text-slate-400 select-none border-x border-slate-700">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(18, s + 1))}
              disabled={fontSize >= 18}
              className="px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Line Wrap Toggle */}
          <button
            onClick={() => setLineWrap((w) => !w)}
            className={`px-2 py-1 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              lineWrap
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Line Wrap"
          >
            Wrap
          </button>

          {/* Fullscreen Expand/Compress */}
          {isModal && (
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title={isFullscreen ? 'Collapse to standard modal' : 'Expand to full screen'}
            >
              {isFullscreen ? '↙ Standard' : '↗ Fullscreen'}
            </button>
          )}
        </div>
      </div>

      {/* Algorithmic Strategy & Insights HUD (Aha! Moment Card) */}
      {showStrategyHUD && (metadata.strategy || metadata.timeComplexity || metadata.invariants.length > 0) && (
        <div
          className="px-5 py-3 border-b text-xs transition-all shrink-0 animate-in fade-in slide-in-from-top-1"
          style={{
            backgroundColor: theme.isDark ? 'rgba(30, 27, 75, 0.45)' : '#e0e7ff',
            borderColor: theme.gutterBorder,
          }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[280px]">
              {metadata.strategy && (
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-indigo-400 uppercase tracking-wide text-[11px] shrink-0">
                    💡 Strategy:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">
                    {metadata.strategy}
                  </span>
                </div>
              )}

              {metadata.strategyDetails.length > 0 && (
                <div className="text-slate-300 text-[11px] pl-5 space-y-0.5">
                  {metadata.strategyDetails.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {metadata.invariants.length > 0 && (
                <div className="flex items-start gap-2 pt-0.5">
                  <span className="font-bold text-emerald-400 uppercase tracking-wide text-[10px] shrink-0">
                    🎯 Invariant:
                  </span>
                  <span className="text-emerald-200 text-xs italic font-medium">
                    {metadata.invariants.join(' • ')}
                  </span>
                </div>
              )}
            </div>

            {/* Complexity Badges HUD */}
            <div className="flex items-center gap-2 flex-wrap self-center">
              {metadata.timeComplexity && (
                <div className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-700/60 shadow-xs">
                  <span className="text-[10px] text-blue-400 font-semibold block uppercase">Time</span>
                  <code className="text-xs font-mono font-bold text-blue-200">
                    {metadata.timeComplexity}
                  </code>
                </div>
              )}
              {metadata.spaceComplexity && (
                <div className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-700/60 shadow-xs">
                  <span className="text-[10px] text-purple-400 font-semibold block uppercase">Space</span>
                  <code className="text-xs font-mono font-bold text-purple-200">
                    {metadata.spaceComplexity}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Code View Canvas */}
      <div
        className="flex-1 overflow-auto p-0 font-mono leading-relaxed select-text"
        style={{
          maxHeight: isFullscreen ? 'calc(100vh - 145px)' : maxHeight,
          fontSize: `${fontSize}px`,
        }}
      >
        <div className="min-w-full inline-block py-2">
          {tokenizedLines.map((line) => {
            const isHovered = hoveredLine === line.lineNumber;
            const isPinned = pinnedLines.has(line.lineNumber);
            const isJustCopied = copiedLine === line.lineNumber;

            let rowBg = 'transparent';
            if (isPinned) rowBg = theme.highlightedLineBg;
            else if (isHovered) rowBg = theme.activeLineBg;

            return (
              <div
                key={line.lineNumber}
                onMouseEnter={() => setHoveredLine(line.lineNumber)}
                onMouseLeave={() => setHoveredLine(null)}
                className="group relative flex items-stretch hover:transition-colors duration-75"
                style={{ backgroundColor: rowBg }}
              >
                {/* Gutter: Line Number + Pin & Copy buttons on hover */}
                {showLineNumbers && (
                  <div
                    onClick={() => togglePinLine(line.lineNumber)}
                    className="select-none flex items-center justify-end pr-3 pl-2 shrink-0 border-r text-right cursor-pointer group-hover:text-indigo-400 transition-colors"
                    style={{
                      width: '3.6rem',
                      backgroundColor: theme.gutterBg,
                      borderColor: theme.gutterBorder,
                      color: isPinned ? '#f43f5e' : theme.gutterText,
                    }}
                    title="Click line number to pin / highlight"
                  >
                    <span className="text-[11px] font-mono">
                      {isPinned ? '★ ' : ''}
                      {line.lineNumber}
                    </span>
                  </div>
                )}

                {/* Line Code Tokens */}
                <div
                  className={`flex-1 pl-4 pr-12 font-mono ${
                    lineWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                  }`}
                  style={{
                    lineHeight: `${fontSize * 1.55}px`,
                  }}
                >
                  {line.tokens.length > 0 ? (
                    line.tokens.map((token, tIdx) => renderToken(token, tIdx))
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>

                {/* Hover Quick Action: Copy Single Line */}
                {isHovered && (
                  <button
                    onClick={() => handleCopySingleLine(line.rawText, line.lineNumber)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-700 text-[10px] font-sans font-semibold border border-slate-700 transition-all cursor-pointer opacity-90 shadow-xs"
                    title="Copy this line"
                  >
                    {isJustCopied ? '✓ Copied' : 'Copy'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Footer: Provenance notice & Attribution */}
      <div
        className="px-5 py-3 border-t text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 shrink-0"
        style={{
          backgroundColor: theme.gutterBg,
          borderColor: theme.gutterBorder,
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldIcon size={14} semantic="success" />
          <span>
            Attribution: Originally authored by <strong className="text-slate-200">{author}</strong>
            {repository && (
              <>
                {' in '}
                {repositoryUrl ? (
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-semibold"
                  >
                    {repository}
                  </a>
                ) : (
                  <strong className="text-slate-300">{repository}</strong>
                )}
              </>
            )}
            {commitSha && (
              <span className="ml-1 text-slate-400">
                (SHA:{' '}
                <code className="text-indigo-300 font-bold bg-slate-900/80 px-1 py-0.5 rounded border border-slate-700/60">
                  {commitSha.slice(0, 8)}
                </code>
                )
              </span>
            )}
          </span>
        </div>

        {sha256 && (
          <div className="flex items-center gap-1.5 text-slate-400 ml-auto font-mono text-[10px]">
            <span>SHA-256:</span>
            <code className="text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
              {sha256.slice(0, 16)}...
            </code>
          </div>
        )}
      </div>
    </div>
  );
};
