import React, { useState, useEffect } from 'react';
import {
  ChatIcon as MessageSquare,
  SendMessageIcon as Send,
  CheckCircleIcon as CheckCircle2,
  ForwardIcon as CornerDownRight,
  CodingBracketsIcon as Code,
  ShieldIcon as ShieldCheck,
  DeleteIcon as Trash2,
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
} from '../icons';
import { Comment, socialFeedClient } from '../../services/socialFeedClient';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CommentsSectionProps {
  postId: string;
  isQuestionAuthor?: boolean;
  onAnswerAccepted?: () => void;
  currentUserId?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  isQuestionAuthor = false,
  onAnswerAccepted,
  currentUserId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, boolean>>({});

  const fetchComments = async () => {
    try {
      const list = await socialFeedClient.getComments(postId);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to live comments for this post
    const unsub = socialFeedClient.subscribeToComments(postId, {
      onInsert: (newComment) => {
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
      },
      onDelete: (deletedId) => {
        setComments((prev) => prev.filter((c) => c.id !== deletedId));
      },
    });

    return unsub;
  }, [postId]);

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await socialFeedClient.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const toggleThreadCollapse = (commentId: string) => {
    setCollapsedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await socialFeedClient.createComment({
        postId,
        parentId: replyToId,
        content: newCommentText.trim(),
        codeSnippet: newCodeSnippet.trim() || null,
        isAnswer: isQuestionAuthor ? false : true,
      });

      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      setNewCodeSnippet('');
      setShowCodeInput(false);
      setReplyToId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (commentId: string) => {
    if (!confirm('Mark this answer as the accepted solution for this question?')) return;
    try {
      await socialFeedClient.acceptAnswer(postId, commentId);
      setComments((prev) =>
        prev.map((c) => ({
          ...c,
          is_accepted: c.id === commentId,
        }))
      );
      if (onAnswerAccepted) onAnswerAccepted();
    } catch (err: any) {
      alert(err.message || 'Failed to accept answer');
    }
  };

  // Group top-level and replies
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      if (!repliesMap.has(c.parent_id)) repliesMap.set(c.parent_id, []);
      repliesMap.get(c.parent_id)?.push(c);
    }
  }

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>Discussion & Answers ({comments.length})</span>
        </h4>
      </div>

      {/* Comment Composer */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        {replyToId && (
          <div className="flex items-center justify-between px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-600 dark:text-indigo-400">
            <span className="flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5" /> Replying to comment
            </span>
            <button
              type="button"
              onClick={() => setReplyToId(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-start gap-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={replyToId ? 'Write your reply...' : 'Share your perspective, answer, or debugging advice...'}
            rows={2}
            className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Code Snippet Toggle */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showCodeInput ? 'Hide Code Snippet' : 'Attach Code Snippet'}</span>
          </button>
        </div>

        {showCodeInput && (
          <textarea
            value={newCodeSnippet}
            onChange={(e) => setNewCodeSnippet(e.target.value)}
            placeholder="// Paste C++ or Python code snippet here..."
            rows={4}
            className="w-full p-2.5 rounded-xl font-mono text-xs bg-slate-950 text-emerald-300 border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
          />
        )}
      </form>

      {/* Comments List */}
      {loading ? (
        <p className="text-xs text-slate-400 py-2">Loading discussion...</p>
      ) : topLevel.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No comments yet. Be the first to share an answer or insight!</p>
      ) : (
        <div className="space-y-3 pt-1">
          {topLevel.map((comment) => {
            const replies = repliesMap.get(comment.id) || [];
            return (
              <div
                key={comment.id}
                className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                  comment.is_accepted
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] overflow-hidden">
                      {comment.author.avatar_url ? (
                        <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.author.display_name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {comment.author.display_name}
                    </span>
                    {comment.author.target_rating && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                        {comment.author.target_rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {comment.is_accepted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Accepted Answer
                      </span>
                    )}
                    {isQuestionAuthor && !comment.is_accepted && (
                      <button
                        type="button"
                        onClick={() => handleAcceptAnswer(comment.id)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-sm"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Mark Accepted
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <MarkdownRenderer content={comment.content} />

                {/* Optional code snippet */}
                {comment.code_snippet && (
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 p-2.5">
                    <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto">
                      <code>{comment.code_snippet}</code>
                    </pre>
                  </div>
                )}

                {/* Reply & Delete actions */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => setReplyToId(comment.id)}
                      className="hover:text-indigo-500 font-semibold transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                    {replies.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleThreadCollapse(comment.id)}
                        className="hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        {collapsedThreads[comment.id] ? (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>Show {replies.length} replies</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Collapse thread</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {(currentUserId === comment.author_id || isQuestionAuthor) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Delete comment"
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Nested Replies */}
                {replies.length > 0 && !collapsedThreads[comment.id] && (
                  <div className="pl-4 ml-2 border-l-2 border-indigo-200 dark:border-indigo-900/50 space-y-2 mt-2">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/60 space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {reply.author.display_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {(currentUserId === reply.author_id || isQuestionAuthor) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(reply.id)}
                              title="Delete reply"
                              className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <MarkdownRenderer content={reply.content} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
