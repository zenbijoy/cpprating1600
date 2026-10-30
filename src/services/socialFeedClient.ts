import { supabase } from './supabase';

export type PostContentType =
  | 'general'
  | 'blog'
  | 'question'
  | 'help_request'
  | 'milestone'
  | 'solution'
  | 'resource'
  | 'video'
  | 'editorial';

export type QuestionStatus = 'open' | 'unanswered' | 'answered' | 'accepted' | 'resolved';

export interface PostAttachment {
  id?: string;
  fileType: 'image' | 'video' | 'pdf' | 'code' | 'document';
  fileName: string;
  fileSize: number;
  mimeType: string;
  r2Key: string;
  url: string;
}

export interface PostAuthor {
  id: string;
  display_name: string;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  skills?: string[];
  preferred_language?: string;
  target_rating?: number;
}

export interface PostCommunity {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string | null;
  is_system?: boolean;
}

export interface Post {
  id: string;
  community_id?: string | null;
  author_id: string;
  content_type: PostContentType;
  title?: string | null;
  subtitle?: string | null;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived' | 'deleted';
  problem_url?: string | null;
  contest_id?: number | null;
  programming_language?: string | null;
  code_snippet?: string | null;
  cover_image_url?: string | null;
  reading_time_minutes?: number;
  question_status?: QuestionStatus | null;
  accepted_answer_id?: string | null;
  milestone_category?: string | null;
  milestone_metric?: string | null;
  milestone_date?: string | null;
  pinned: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  updated_at?: string;
  author: PostAuthor;
  community?: PostCommunity | null;
  attachments?: PostAttachment[];
  userReaction?: 'like' | 'care' | 'celebrate' | 'insightful' | null;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string | null;
  content: string;
  code_snippet?: string | null;
  is_answer: boolean;
  is_accepted: boolean;
  likes_count: number;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
  author: PostAuthor;
}

export interface CreatePostPayload {
  communityId?: string | null;
  contentType: PostContentType;
  title?: string | null;
  subtitle?: string | null;
  content: string;
  tags?: string[];
  status?: 'draft' | 'published';
  problemUrl?: string | null;
  contestId?: number | null;
  programmingLanguage?: string | null;
  codeSnippet?: string | null;
  coverImageUrl?: string | null;
  questionStatus?: QuestionStatus | null;
  milestoneCategory?: string | null;
  milestoneMetric?: string | null;
  milestoneDate?: string | null;
  attachments?: PostAttachment[];
}

export const socialFeedClient = {
  async getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async getFeed(params?: {
    filter?: string;
    communitySlug?: string;
    communityId?: string;
    contentType?: string;
    tag?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ posts: Post[]; nextCursor: string | null }> {
    const query = new URLSearchParams();
    if (params?.filter) query.set('filter', params.filter);
    if (params?.communitySlug) query.set('communitySlug', params.communitySlug);
    if (params?.communityId) query.set('communityId', params.communityId);
    if (params?.contentType) query.set('contentType', params.contentType);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', params.limit.toString());

    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/posts?${query.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch feed');
    return res.json();
  },

  async getPostById(id: string): Promise<Post> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/posts/${id}`, { headers });
    if (!res.ok) throw new Error('Post not found');
    const data = await res.json();
    return data.post;
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/social/posts', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create post' }));
      throw new Error(err.message || 'Creation failed');
    }
    const data = await res.json();
    return data.post;
  },

  async handleReaction(
    targetType: 'post' | 'comment',
    targetId: string,
    reactionType: 'like' | 'care' | 'celebrate' | 'insightful'
  ): Promise<{ action: string; activeReaction: string | null; likesCount: number }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/social/reactions', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, reactionType }),
    });
    if (!res.ok) throw new Error('Failed to submit reaction');
    return res.json();
  },

  async toggleBookmark(postId: string): Promise<{ isBookmarked: boolean }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/posts/${postId}/bookmark`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to toggle bookmark');
    return res.json();
  },

  async acceptAnswer(postId: string, commentId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/posts/${postId}/accept-answer`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    if (!res.ok) throw new Error('Failed to accept answer');
  },

  async getComments(postId: string): Promise<Comment[]> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/posts/${postId}/comments`, { headers });
    if (!res.ok) throw new Error('Failed to fetch comments');
    const data = await res.json();
    return data.comments || [];
  },

  async createComment(payload: {
    postId: string;
    parentId?: string | null;
    content: string;
    codeSnippet?: string | null;
    isAnswer?: boolean;
  }): Promise<Comment> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/social/comments', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to post comment');
    const data = await res.json();
    return data.comment;
  },

  async deletePost(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/posts/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete post' }));
      throw new Error(err.message || 'Delete failed');
    }
  },

  async deleteComment(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/social/comments/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete comment' }));
      throw new Error(err.message || 'Delete comment failed');
    }
  },

  // Real-time subscription to global or community feed
  subscribeToFeed(callbacks: {
    onInsert?: (post: Post) => void;
    onUpdate?: (postPartial: Partial<Post>) => void;
    onDelete?: (postId: string) => void;
  }): () => void {
    const channel = supabase
      .channel('realtime:social-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          if (callbacks.onInsert && payload.new?.id) {
            try {
              const full = await socialFeedClient.getPostById(payload.new.id);
              callbacks.onInsert(full);
            } catch {
              // fallback
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          if (callbacks.onUpdate && payload.new) {
            callbacks.onUpdate(payload.new as any);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          if (callbacks.onDelete && payload.old?.id) {
            callbacks.onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Real-time comments listener for a specific post
  subscribeToComments(
    postId: string,
    callbacks: {
      onInsert?: (comment: Comment) => void;
      onDelete?: (commentId: string) => void;
    }
  ): () => void {
    const channel = supabase
      .channel(`realtime:post-comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          if (callbacks.onInsert && payload.new) {
            try {
              // Fetch user profile info
              const { data: author } = await supabase
                .from('profiles')
                .select('id, display_name, username, avatar_url, target_rating')
                .eq('id', payload.new.author_id)
                .maybeSingle();

              callbacks.onInsert({
                ...payload.new,
                author: author || { id: payload.new.author_id, display_name: 'Coder' },
              } as any);
            } catch {
              callbacks.onInsert(payload.new as any);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          if (callbacks.onDelete && payload.old?.id) {
            callbacks.onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
