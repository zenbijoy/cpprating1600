import React, { useState } from 'react';
import {
  FeedbackPositiveIcon as ThumbsUp,
  FeedbackPositiveIcon as Heart,
  AISparkleIcon as Sparkles,
  HintIcon as Lightbulb,
  ChatIcon as MessageSquare,
  BookmarkIcon as Bookmark,
  ShareIcon as Share2,
  ExternalLinkIcon as ExternalLink,
  MilestoneIcon as Flag,
  CodeFileIcon as FileText,
  LearningRoadmapIcon as VideoIcon,
  TrophyIcon as Trophy,
  AskAQuestionIcon as HelpCircle,
  ProblemStatementIcon as BookOpen,
  CodingBracketsIcon as Code2,
  DeleteIcon as Trash2,
  MoreVerticalIcon as MoreVertical,
  CloseIcon as X,
  SendMessageIcon as Send,
} from '../icons';
import { Post, socialFeedClient } from '../../services/socialFeedClient';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CommentsSection } from './CommentsSection';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onFilterCommunity?: (slug: string) => void;
  onFilterTag?: (tag: string) => void;
  onReport?: (postId: string) => void;
  onOpenBlogReader?: (post: Post) => void;
  onOpenDirectMessage?: (authorId: string) => void;
  onOpenWorkspaceWithCode?: (code: string, problemNameOrId?: string) => void;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onFilterCommunity,
  onFilterTag,
  onReport,
  onOpenBlogReader,
  onOpenDirectMessage,
  onOpenWorkspaceWithCode,
  onPostDeleted,
}) => {
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isReacting, setIsReacting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = currentUserId && (currentUserId === post.author_id);

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
    setIsDeleting(true);
    try {
      await socialFeedClient.deletePost(post.id);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleReaction = async (type: 'like' | 'care' | 'celebrate' | 'insightful') => {
    if (!currentUserId) {
      alert('Please sign in to react to posts.');
      return;
    }

    if (isReacting) return;
    setIsReacting(true);

    // Optimistic UI update
    const prevReaction = userReaction;
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
    } catch (err) {
      // Rollback on failure
      setUserReaction(prevReaction);
      setLikesCount(prevCount);
    } finally {
      setIsReacting(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId) {
      alert('Please sign in to save posts.');
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

  const handleShare = () => {
    const postUrl = `${window.location.origin}/?tab=feed&post=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Content type badge styling
  const getTypeBadge = () => {
    switch (post.content_type) {
      case 'question':
      case 'help_request':
        return {
          icon: <HelpCircle className="w-3 h-3 text-amber-500" />,
          label: post.content_type === 'question' ? 'Question' : 'Help Request',
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        };
      case 'blog':
      case 'editorial':
        return {
          icon: <BookOpen className="w-3 h-3 text-indigo-500" />,
          label: post.content_type === 'blog' ? 'Blog' : 'Editorial',
          bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        };
      case 'milestone':
        return {
          icon: <Trophy className="w-3 h-3 text-emerald-500" />,
          label: 'Milestone',
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        };
      case 'solution':
        return {
          icon: <Code2 className="w-3 h-3 text-cyan-500" />,
          label: 'Solution',
          bg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
        };
      case 'video':
        return {
          icon: <VideoIcon className="w-3 h-3 text-purple-500" />,
          label: 'Video',
          bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        };
      default:
        return {
          icon: <FileText className="w-3 h-3 text-slate-400" />,
          label: 'Post',
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  const badge = getTypeBadge();

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Author avatar */}
          <button
            type="button"
            onClick={() => onOpenDirectMessage && onOpenDirectMessage(post.author_id)}
            className="w-10 h-10 rounded-full bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm overflow-hidden shrink-0 cursor-pointer border border-indigo-500/20 hover:scale-105 transition-transform"
            title="View profile / Send message"
          >
            {post.author.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (post.author.display_name || 'U').slice(0, 1).toUpperCase()
            )}
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {post.author.display_name}
              </span>
              {post.author.username && (
                <span className="text-xs text-slate-400">@{post.author.username}</span>
              )}
              {post.author.target_rating && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                  CF {post.author.target_rating}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              {post.community && (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => onFilterCommunity && onFilterCommunity(post.community!.slug)}
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    c/{post.community.name}
                  </button>
                </>
              )}
              {post.reading_time_minutes && post.reading_time_minutes > 1 && (
                <>
                  <span>·</span>
                  <span>{post.reading_time_minutes} min read</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Type Badge & Post Actions Menu */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="More post options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-20 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleShare();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleToggleBookmark();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Post'}</span>
                </button>

                {onOpenDirectMessage && post.author_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDirectMessage(post.author_id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Message Author</span>
                  </button>
                )}

                {onReport && (
                  <button
                    type="button"
                    onClick={() => {
                      onReport(post.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report Post</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeletePost}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Subtitle */}
      {post.title && (
        <div>
          <h3
            onClick={() => post.content_type === 'blog' && onOpenBlogReader && onOpenBlogReader(post)}
            className={`text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight ${
              post.content_type === 'blog' ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors' : ''
            }`}
          >
            {post.title}
          </h3>
          {post.subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{post.subtitle}</p>
          )}
        </div>
      )}

      {/* Problem URL or Contest Pill */}
      {post.problem_url && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-slate-500">Problem:</span>
          <a
            href={post.problem_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline max-w-xs truncate"
          >
            {post.problem_url}
          </a>
        </div>
      )}

      {/* Milestone Card Presentation */}
      {post.content_type === 'milestone' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {post.milestone_category || 'Rating Achievement'}
            </span>
            <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {post.milestone_metric || '1600 Target Cleared!'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/40">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      )}

      {/* Question Status Badge */}
      {(post.content_type === 'question' || post.content_type === 'help_request') && post.question_status && (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
              post.question_status === 'accepted' || post.question_status === 'resolved'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : post.question_status === 'answered'
                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}
          >
            Status: {post.question_status.toUpperCase()}
          </span>
        </div>
      )}

      {/* Post Content */}
      <MarkdownRenderer content={post.content} />

      {/* Code Snippet */}
      {post.code_snippet && (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <span>{post.programming_language || 'C++'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(post.code_snippet!);
                  alert('Code snippet copied to clipboard!');
                }}
                className="hover:text-emerald-400 transition-colors cursor-pointer text-[11px]"
              >
                Copy Code
              </button>
              {onOpenWorkspaceWithCode && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspaceWithCode(
                      post.code_snippet!,
                      post.title || (post.problem_url ? post.problem_url.split('/').pop() : undefined)
                    )
                  }
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Open in IDE</span>
                </button>
              )}
            </div>
          </div>
          <pre className="pt-2 text-xs font-mono text-emerald-300 overflow-x-auto">
            <code>{post.code_snippet}</code>
          </pre>
        </div>
      )}

      {/* Attachments Preview (Images, Videos, PDFs) */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="space-y-2 pt-1">
          {post.attachments.map((att, idx) => {
            if (att.fileType === 'image') {
              return (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(att.url)}
                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 cursor-zoom-in group relative"
                >
                  <img src={att.url} alt={att.fileName} className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              );
            }
            if (att.fileType === 'video') {
              return (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-black">
                  <video src={att.url} controls preload="metadata" className="w-full max-h-96" />
                </div>
              );
            }
            return (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 hover:underline max-w-sm"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">{att.fileName}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {post.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onFilterTag && onFilterTag(tag)}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Action Footer: Reactions, Comments, Bookmark, Share */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        {/* Reactions Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleReaction('like')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              userReaction === 'like'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Like"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleReaction('care')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              userReaction === 'care'
                ? 'bg-rose-500/15 text-rose-500 font-bold'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Care"
          >
            <Heart className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleReaction('celebrate')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              userReaction === 'celebrate'
                ? 'bg-amber-500/15 text-amber-500 font-bold'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Celebrate"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleReaction('insightful')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              userReaction === 'insightful'
                ? 'bg-emerald-500/15 text-emerald-500 font-bold'
                : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Insightful"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>

        {/* Comments & Sharing */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Saved' : 'Save post'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Copy share link"
          >
            <Share2 className="w-4 h-4" />
            {copiedLink && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
          </button>
        </div>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          isQuestionAuthor={currentUserId === post.author_id}
          currentUserId={currentUserId}
          onAnswerAccepted={() => setCommentsCount((prev) => prev)}
        />
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </article>
  );
};
