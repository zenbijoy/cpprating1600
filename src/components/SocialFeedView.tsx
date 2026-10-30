import React, { useState, useEffect, useCallback } from 'react';
import {
  AISparkleIcon as Sparkles,
  StreakIcon as Flame,
  AskAQuestionIcon as HelpCircle,
  ProblemStatementIcon as BookOpen,
  TrophyIcon as Trophy,
  BookmarkIcon as Bookmark,
  AddIcon as Plus,
  SearchIcon as Search,
  CommunityIcon as Users,
  ChatIcon as MessageSquare,
  RefreshIcon as RefreshCw,
  WarningStatusIcon as AlertCircle,
  LearningRoadmapIcon as Video,
  LearningRoadmapIcon as Compass,
  HintIcon as Lightbulb,
  CodingBracketsIcon as Code2,
  ProblemTagsIcon as Tag,
  CheckCircleIcon as CheckCircle2,
  SendMessageIcon as Send,
  LoadingStatusIcon as Loader2,
  TrendUpIcon as TrendingUp,
  ForwardIcon as ArrowRight,
  ShieldIcon as ShieldCheck,
} from './icons';
import { Post, socialFeedClient } from '../services/socialFeedClient';
import { Community, communityClient } from '../services/communityClient';
import { PostCard } from './social/PostCard';
import { PostComposerModal } from './social/PostComposerModal';
import { BlogReaderModal } from './social/BlogReaderModal';

export interface PostComposerPrefill {
  title?: string;
  content?: string;
  codeSnippet?: string;
  problemUrl?: string;
  contentType?: any;
  tags?: string[];
  communitySlug?: string;
}

export interface SocialFeedViewProps {
  currentUserId?: string;
  onOpenDirectMessage?: (targetUserId: string) => void;
  onNavigateToCommunities?: () => void;
  onOpenWorkspaceWithCode?: (code: string, problemNameOrId?: string) => void;
  initialCommunitySlug?: string;
  initialComposerPrefill?: PostComposerPrefill | null;
  onClearComposerPrefill?: () => void;
}

export const SocialFeedView: React.FC<SocialFeedViewProps> = ({
  currentUserId,
  onOpenDirectMessage,
  onNavigateToCommunities,
  onOpenWorkspaceWithCode,
  initialCommunitySlug,
  initialComposerPrefill,
  onClearComposerPrefill,
}) => {
  const [filter, setFilter] = useState<string>('latest');
  const [communitySlug, setCommunitySlug] = useState<string | undefined>(initialCommunitySlug);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [composerDefaultType, setComposerDefaultType] = useState<any>('general');
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('spam');
  const [readingBlog, setReadingBlog] = useState<Post | null>(null);

  // Real-time unread/new posts banner indicator
  const [newPostsAvailableCount, setNewPostsAvailableCount] = useState(0);

  // Sync external prefill triggers (e.g. from Workspace, Playground, Solutions)
  useEffect(() => {
    if (initialComposerPrefill) {
      if (initialComposerPrefill.contentType) {
        setComposerDefaultType(initialComposerPrefill.contentType);
      }
      if (initialComposerPrefill.communitySlug) {
        setCommunitySlug(initialComposerPrefill.communitySlug);
      }
      setShowComposer(true);
    }
  }, [initialComposerPrefill]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load communities list
  const loadCommunities = useCallback(async () => {
    try {
      const list = await communityClient.listCommunities();
      setCommunities(list);
    } catch (err) {
      console.error('Failed to load communities:', err);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  // Load feed posts
  const loadFeed = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setError(null);
        setNewPostsAvailableCount(0);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await socialFeedClient.getFeed({
          filter,
          communitySlug,
          tag: selectedTag,
          search: debouncedSearch || undefined,
          cursor: reset ? undefined : nextCursor || undefined,
          limit: 15,
        });

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }
        setNextCursor(data.nextCursor);
      } catch (err: any) {
        setError(err.message || 'Failed to load social feed. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, communitySlug, selectedTag, debouncedSearch, nextCursor]
  );

  useEffect(() => {
    loadFeed(true);
  }, [filter, communitySlug, selectedTag, debouncedSearch]);

  // Real-time Supabase Subscription for new posts, updates, and deletes
  useEffect(() => {
    const unsubscribe = socialFeedClient.subscribeToFeed({
      onInsert: (newPost) => {
        // If matches active community filter or no community filter active
        if (!communitySlug || newPost.community?.slug === communitySlug) {
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
          setNewPostsAvailableCount((c) => c + 1);
        }
      },
      onUpdate: (updatedPostPartial) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === updatedPostPartial.id ? { ...p, ...updatedPostPartial } : p
          )
        );
      },
      onDelete: (deletedPostId) => {
        setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
      },
    });

    return unsubscribe;
  }, [communitySlug]);

  // Join Community Quick Action
  const handleQuickJoin = async (comm: Community) => {
    if (!currentUserId) {
      alert('Please sign in to join communities.');
      return;
    }
    try {
      await communityClient.joinCommunity(comm.id);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === comm.id
            ? { ...c, isMember: true, members_count: c.members_count + 1 }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to join');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPostId) return;

    try {
      const { data } = await import('../services/supabase').then((m) =>
        m.supabase.auth.getSession()
      );
      const token = data.session?.access_token;
      if (!token) {
        alert('Please sign in to report content');
        return;
      }

      await fetch('/api/moderation/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: 'post',
          targetId: reportPostId,
          reason: reportReason,
        }),
      });

      alert('Report submitted for moderator review. Thank you for keeping our community safe!');
      setReportPostId(null);
    } catch {
      alert('Failed to submit report');
    }
  };

  const navFilters = [
    { id: 'latest', label: 'Home Feed', icon: <Compass className="w-4 h-4" /> },
    { id: 'popular', label: 'Trending & Hot', icon: <Flame className="w-4 h-4" /> },
    { id: 'my-communities', label: 'My Communities', icon: <Users className="w-4 h-4" /> },
    { id: 'questions', label: 'Questions & Doubts', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'unanswered', label: 'Unanswered Questions', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'blogs', label: 'Editorials & Blogs', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'milestones', label: 'Milestones & Wins', icon: <Trophy className="w-4 h-4" /> },
    { id: 'videos', label: 'Video Walkthroughs', icon: <Video className="w-4 h-4" /> },
    { id: 'saved', label: 'Saved Bookmarks', icon: <Bookmark className="w-4 h-4" /> },
  ];

  const popularTags = [
    'dynamic-programming',
    'binary-search',
    'graphs',
    'greedy',
    'trees',
    'two-pointers',
    'number-theory',
    'segment-tree',
    'codeforces-div2',
    'data-structures',
  ];

  const systemCommunities = communities.filter((c) => c.is_system);
  const joinedCommunities = communities.filter((c) => c.isMember && !c.is_system);
  const unjoinedCommunities = communities.filter((c) => !c.isMember && !c.is_system).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-20">
      {/* 3-COLUMN REDDIT / FACEBOOK LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Navigation Drawer & Joined Communities          */}
        {/* ============================================================ */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-6">
          {/* Feed Channels & Views Navigation */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm space-y-1">
            <h3 className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Feeds & Channels
            </h3>
            {navFilters.map((tab) => {
              const isActive = filter === tab.id && !communitySlug;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id);
                    setCommunitySlug(undefined);
                    setSelectedTag(undefined);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Official System Communities Shortcuts */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Official Communities
              </h3>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            </div>

            <div className="space-y-1">
              {systemCommunities.map((c) => {
                const isSelected = communitySlug === c.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCommunitySlug(c.slug);
                      setSelectedTag(undefined);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">c/{c.slug}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {c.members_count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* User Joined Communities */}
            {joinedCommunities.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <h4 className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Your Circles
                </h4>
                {joinedCommunities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCommunitySlug(c.slug);
                      setSelectedTag(undefined);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      communitySlug === c.slug
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {c.members_count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Browse / Create Community Link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToCommunities}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Explore / Create Circles</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN: Feed, Quick-Composer, and Discussions Stream */}
        {/* ============================================================ */}
        <main className="col-span-12 lg:col-span-6 space-y-4 min-w-0">
          {/* Quick-Composer Box (Facebook / Reddit style) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                +
              </div>
              <div
                onClick={() => {
                  setComposerDefaultType('general');
                  setShowComposer(true);
                }}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer select-none"
              >
                {communitySlug
                  ? `Write an algorithm update or question in c/${communitySlug}...`
                  : "Share a Codeforces insight, ask doubt, or write blog..."}
              </div>
            </div>

            {/* Quick-Actions Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setComposerDefaultType('question');
                  setShowComposer(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Ask Question</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerDefaultType('solution');
                  setShowComposer(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Code2 className="w-4 h-4 text-cyan-500" />
                <span>Share Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerDefaultType('blog');
                  setShowComposer(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Write Blog</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerDefaultType('milestone');
                  setShowComposer(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span>Milestone</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search solutions, editorials, questions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => loadFeed(true)}
              title="Refresh Feed"
              className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Mobile Feed Channels Carousel (Visible on mobile only) */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {navFilters.map((tab) => {
              const isActive = filter === tab.id && !communitySlug;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id);
                    setCommunitySlug(undefined);
                    setSelectedTag(undefined);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Indicators Banner */}
          {(communitySlug || selectedTag) && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-500 font-bold">Filtered:</span>
              {communitySlug && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>c/{communitySlug}</span>
                  <button
                    type="button"
                    onClick={() => setCommunitySlug(undefined)}
                    className="hover:text-rose-500 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>#{selectedTag}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTag(undefined)}
                    className="hover:text-rose-500 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Real-time New Posts Available Banner */}
          {newPostsAvailableCount > 0 && (
            <div
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setNewPostsAvailableCount(0);
              }}
              className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center cursor-pointer shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 animate-bounce"
            >
              <Sparkles className="w-4 h-4" />
              <span>{newPostsAvailableCount} new update{newPostsAvailableCount > 1 ? 's' : ''} in feed — Click to view</span>
            </div>
          )}

          {/* Stream of Posts */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                type="button"
                onClick={() => loadFeed(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No discussions found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filter === 'saved'
                    ? "You haven't bookmarked any posts yet. Click the bookmark icon on any post to save it for quick reference."
                    : 'Be the first to share an algorithmic insight, ask a question, or celebrate a milestone in this section!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Start a Discussion</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onFilterCommunity={(slug) => setCommunitySlug(slug)}
                  onFilterTag={(tag) => setSelectedTag(tag)}
                  onReport={(id) => setReportPostId(id)}
                  onOpenBlogReader={(p) => setReadingBlog(p)}
                  onOpenDirectMessage={onOpenDirectMessage}
                  onOpenWorkspaceWithCode={onOpenWorkspaceWithCode}
                  onPostDeleted={(deletedId) =>
                    setPosts((prev) => prev.filter((p) => p.id !== deletedId))
                  }
                />
              ))}

              {/* Load More Pagination Button */}
              {nextCursor && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => loadFeed(false)}
                    className="px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading older discussions...' : 'Load More Discussions'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: CP Daily Tip, Trending Tags, and Top Solvers   */}
        {/* ============================================================ */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-6">
          {/* Tactical Invariant Focus of the Day */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-5 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Lightbulb className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                1600 Invariant Focus
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Binary Search On The Answer
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When asked to "minimize the maximum" or "maximize the minimum" and verifying a candidate $X$ is monotonic $O(N)$, binary search on the answer range $[1, 10^9]$.
            </p>
          </div>

          {/* Trending Topics & Tags Cloud */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 px-1 text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Trending Topics</h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isSelected) setSelectedTag(undefined);
                      else setSelectedTag(tag);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommended Circles To Join */}
          {unjoinedCommunities.length > 0 && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Recommended Circles
                </h3>
                <Users className="w-3.5 h-3.5 text-indigo-500" />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {unjoinedCommunities.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {c.members_count} coders
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickJoin(c)}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all shrink-0"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Post Composer Modal */}
      {showComposer && (
        <PostComposerModal
          isOpen={showComposer}
          onClose={() => {
            setShowComposer(false);
            if (onClearComposerPrefill) onClearComposerPrefill();
          }}
          onPostCreated={() => {
            setShowComposer(false);
            if (onClearComposerPrefill) onClearComposerPrefill();
            loadFeed(true);
          }}
          communities={communities}
          initialCommunitySlug={initialComposerPrefill?.communitySlug || communitySlug}
          initialContentType={initialComposerPrefill?.contentType || composerDefaultType}
          initialTitle={initialComposerPrefill?.title}
          initialContent={initialComposerPrefill?.content}
          initialCodeSnippet={initialComposerPrefill?.codeSnippet}
          initialProblemUrl={initialComposerPrefill?.problemUrl}
          initialTags={initialComposerPrefill?.tags}
        />
      )}

      {/* Blog / Longform Editorial Reader Modal */}
      {readingBlog && (
        <BlogReaderModal
          post={readingBlog}
          onClose={() => setReadingBlog(null)}
          currentUserId={currentUserId}
          onOpenDirectMessage={onOpenDirectMessage}
        />
      )}

      {/* Moderation Content Report Modal */}
      {reportPostId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Report Content to Moderators
            </h3>
            <p className="text-xs text-slate-500">
              Please help us maintain a safe, clean, and productive competitive programming community.
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reason for reporting:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="spam">Spam or self-promotion</option>
                  <option value="harassment">Harassment or rude behavior</option>
                  <option value="inappropriate_content">Inappropriate code or media</option>
                  <option value="cheating_contest">Contest cheating or live round leak</option>
                  <option value="other">Other policy violation</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportPostId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
