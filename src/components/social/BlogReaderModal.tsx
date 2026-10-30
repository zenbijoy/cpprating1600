import React, { useState } from 'react';
import {
  CloseIcon as X,
  ProblemStatementIcon as BookOpen,
  CalendarIcon as Calendar,
  ClockStatusIcon as Clock,
  ShareIcon as Share2,
  BookmarkIcon as Bookmark,
  FeedbackPositiveIcon as ThumbsUp,
  FeedbackPositiveIcon as Heart,
  AISparkleIcon as Sparkles,
  ExternalLinkIcon as ExternalLink,
  ChatIcon as MessageSquare,
  CheckIcon as Check,
} from '../icons';
import { Post, socialFeedClient } from '../../services/socialFeedClient';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CommentsSection } from './CommentsSection';

interface BlogReaderModalProps {
  post: Post | null;
  onClose: () => void;
  currentUserId?: string;
  onOpenDirectMessage?: (authorId: string) => void;
}

export const BlogReaderModal: React.FC<BlogReaderModalProps> = ({
  post,
  onClose,
  currentUserId,
  onOpenDirectMessage,
}) => {
  if (!post) return null;

  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleReaction = async (type: 'like' | 'care' | 'celebrate') => {
    if (!currentUserId) {
      alert('Please sign in to react.');
      return;
    }

    const prev = userReaction;
    const prevCount = likesCount;

    if (userReaction === type) {
      setUserReaction(null);
      setLikesCount(Math.max(0, likesCount - 1));
    } else {
      if (!userReaction) setLikesCount(likesCount + 1);
      setUserReaction(type);
    }

    try {
      const res = await socialFeedClient.handleReaction('post', post.id, type);
      setLikesCount(res.likesCount);
      setUserReaction(res.activeReaction as any);
    } catch {
      setUserReaction(prev);
      setLikesCount(prevCount);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId) {
      alert('Please sign in to save.');
      return;
    }
    setIsBookmarked(!isBookmarked);
    try {
      const res = await socialFeedClient.toggleBookmark(post.id);
      setIsBookmarked(res.isBookmarked);
    } catch {
      setIsBookmarked(isBookmarked);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="capitalize">{post.content_type}</span>
            </span>
            {post.community && (
              <span className="text-xs font-semibold text-slate-500">
                in c/{post.community.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy share link"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleToggleBookmark}
              title="Save article"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isBookmarked
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close reader"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Cover Image */}
        {post.cover_image_url && (
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950 shrink-0">
            <img
              src={post.cover_image_url}
              alt={post.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="p-6 sm:p-10 space-y-6 flex-1">
          {/* Header Metadata */}
          <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {post.title || 'Untitled Editorial'}
            </h1>

            {post.subtitle && (
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">
                {post.subtitle}
              </p>
            )}

            {/* Author card & stats */}
            <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => onOpenDirectMessage && onOpenDirectMessage(post.author_id)}
                  className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center overflow-hidden cursor-pointer shadow-sm"
                >
                  {post.author.avatar_url ? (
                    <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    post.author.display_name.slice(0, 1).toUpperCase()
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {post.author.display_name}
                    </span>
                    {post.author.username && (
                      <span className="text-xs text-slate-400">@{post.author.username}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.reading_time_minutes || 2} min read
                    </span>
                  </div>
                </div>
              </div>

              {post.problem_url && (
                <a
                  href={post.problem_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100 transition-colors"
                >
                  <span>Open Problem</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Longform Prose */}
          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-base leading-relaxed">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Code Snippet */}
          {post.code_snippet && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>{post.programming_language || 'C++'}</span>
              </div>
              <pre className="pt-3 text-sm font-mono text-emerald-300 overflow-x-auto">
                <code>{post.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-4">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Feedback Bar */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleReaction('like')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userReaction === 'like'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{likesCount} Likes</span>
              </button>

              <button
                type="button"
                onClick={() => handleReaction('care')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  userReaction === 'care'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500'
                }`}
              >
                <Heart className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleReaction('celebrate')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  userReaction === 'celebrate'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showComments ? 'Hide Comments' : 'Comments & Discussion'}</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="pt-4">
              <CommentsSection
                postId={post.id}
                isQuestionAuthor={currentUserId === post.author_id}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
