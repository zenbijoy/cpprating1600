import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, getSupabaseAdmin } from './authServer';
import { r2Storage } from './r2StorageServer';

const CreatePostSchema = z.object({
  communityId: z.string().uuid().optional().nullable(),
  contentType: z.enum([
    'general',
    'blog',
    'question',
    'help_request',
    'milestone',
    'solution',
    'resource',
    'video',
    'editorial',
  ]).default('general'),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(300).optional().nullable(),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('published'),
  problemUrl: z.string().url().optional().nullable(),
  contestId: z.number().int().optional().nullable(),
  programmingLanguage: z.string().optional().nullable(),
  codeSnippet: z.string().max(50000).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  readingTimeMinutes: z.number().int().min(1).default(1),
  questionStatus: z.enum(['open', 'unanswered', 'answered', 'accepted', 'resolved']).optional().nullable(),
  milestoneCategory: z.string().optional().nullable(),
  milestoneMetric: z.string().optional().nullable(),
  milestoneDate: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      fileType: z.enum(['image', 'video', 'pdf', 'code', 'document']),
      fileName: z.string(),
      fileSize: z.number().int(),
      mimeType: z.string(),
      r2Key: z.string(),
      url: z.string(),
    })
  ).default([]),
});

export const DEFAULT_POSTS: any[] = [
  {
    id: 'post-1',
    community_id: '00000000-0000-0000-0000-000000000001',
    author_id: 'system-coach',
    content_type: 'blog',
    title: 'Mastering Div. 2 Problem C: Binary Search on Answer Patterns',
    subtitle: 'A systematic breakdown of monotonicity checks and continuous vs discrete domains.',
    content: `When solving Codeforces Div. 2 Problem C, binary search on answer is one of the most reliable strategies.

Key Invariant:
Let $f(x)$ be the predicate function: "Can we achieve a score or configuration of at least $x$?"
If $f(x)$ is monotonic (i.e. if $f(k)$ is true, then $f(k-1)$ is also true), we can binary search for the optimal threshold in $O(\\log(\\text{Range}))$.

Remember to verify integer overflow when calculating mid = low + (high - low) / 2 with 64-bit integer limits!`,
    tags: ['binary-search', 'algorithms', 'div2'],
    status: 'published',
    problem_url: 'https://codeforces.com/problemset/problem/1352/C',
    contest_id: 1352,
    programming_language: 'cpp20',
    code_snippet: `#include <iostream>
using namespace std;

bool check(long long mid, long long n, long long k) {
    long long nonDivisible = mid - (mid / n);
    return nonDivisible >= k;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long t;
    if (cin >> t) {
        while (t--) {
            long long n, k;
            cin >> n >> k;
            long long low = 1, high = 2e9, ans = high;
            while (low <= high) {
                long long mid = low + (high - low) / 2;
                if (check(mid, n, k)) {
                    ans = mid;
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            }
            cout << ans << "\\n";
        }
    }
    return 0;
}`,
    cover_image_url: null,
    reading_time_minutes: 3,
    question_status: null,
    accepted_answer_id: null,
    milestone_category: null,
    milestone_metric: null,
    milestone_date: null,
    pinned: true,
    likes_count: 48,
    comments_count: 12,
    shares_count: 5,
    views_count: 320,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    author: {
      id: 'system-coach',
      display_name: 'Antigravity CP Coach',
      username: 'coach_alpha',
      avatar_url: null,
      preferred_language: 'cpp20',
      target_rating: 2100,
    },
    community: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Climb 1600 Official',
      slug: 'climb-1600-official',
      avatar_url: null,
      is_system: true,
    },
    attachments: [],
    userReaction: null,
    isBookmarked: false,
  },
  {
    id: 'post-2',
    community_id: '00000000-0000-0000-0000-000000000002',
    author_id: 'dp-expert',
    content_type: 'question',
    title: 'Why does 2D Prefix Sum overflow on 32-bit int in CSES / Codeforces?',
    subtitle: 'Debugging grid accumulation with $10^5$ queries.',
    content: `When calculating 2D prefix sums:
$$pref[i][j] = pref[i-1][j] + pref[i][j-1] - pref[i-1][j-1] + grid[i][j]$$

Each cell can be up to $10^9$. Sum of $1000 \\times 1000$ values easily exceeds $2^{31} - 1$. Always use long long or int64_t for prefix sums!`,
    tags: ['dp', 'prefix-sums', 'overflow'],
    status: 'published',
    problem_url: 'https://codeforces.com/problemset/problem/313/B',
    contest_id: 313,
    programming_language: 'cpp20',
    code_snippet: `vector<vector<long long>> pref(n + 1, vector<long long>(m + 1, 0));`,
    cover_image_url: null,
    reading_time_minutes: 2,
    question_status: 'answered',
    accepted_answer_id: null,
    milestone_category: null,
    milestone_metric: null,
    milestone_date: null,
    pinned: false,
    likes_count: 27,
    comments_count: 6,
    shares_count: 2,
    views_count: 195,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    author: {
      id: 'dp-expert',
      display_name: 'ByteMaster',
      username: 'bytemaster',
      avatar_url: null,
      preferred_language: 'cpp20',
      target_rating: 1800,
    },
    community: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Dynamic Programming & Memoization',
      slug: 'dynamic-programming',
      avatar_url: null,
      is_system: true,
    },
    attachments: [],
    userReaction: null,
    isBookmarked: false,
  },
];

export const socialFeedServer = {
  // Feed query with cursor pagination and rich content filters
  async getFeed(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const sb = getSupabaseAdmin();
    const {
      filter = 'latest',
      communitySlug,
      communityId,
      contentType,
      tag,
      search,
      cursor,
      limit = '15',
    } = req.query;

    const pageSize = Math.min(Math.max(parseInt(limit as string, 10) || 15, 1), 50);

    try {
      let resolvedCommunityId = communityId as string | undefined;

      if (!resolvedCommunityId && communitySlug && typeof communitySlug === 'string') {
        const { data: comm } = await sb
          .from('communities')
          .select('id')
          .eq('slug', communitySlug)
          .maybeSingle();
        if (comm) resolvedCommunityId = comm.id;
      }

      // Base query
      let query = sb
        .from('posts')
        .select(`
          id, community_id, author_id, content_type, title, subtitle, content, tags,
          status, problem_url, contest_id, programming_language, code_snippet,
          cover_image_url, reading_time_minutes, question_status, accepted_answer_id,
          milestone_category, milestone_metric, milestone_date, pinned, likes_count,
          comments_count, shares_count, views_count, created_at, updated_at
        `)
        .eq('status', 'published');

      if (resolvedCommunityId) {
        query = query.eq('community_id', resolvedCommunityId);
      }

      if (contentType && typeof contentType === 'string') {
        query = query.eq('content_type', contentType);
      }

      if (tag && typeof tag === 'string') {
        query = query.contains('tags', [tag]);
      }

      if (search && typeof search === 'string' && search.trim()) {
        const s = search.trim();
        query = query.or(`title.ilike.%${s}%,content.ilike.%${s}%`);
      }

      // Filter handling
      if (filter === 'questions') {
        query = query.in('content_type', ['question', 'help_request']);
      } else if (filter === 'unanswered') {
        query = query.in('content_type', ['question', 'help_request']).eq('question_status', 'unanswered');
      } else if (filter === 'blogs') {
        query = query.eq('content_type', 'blog');
      } else if (filter === 'milestones') {
        query = query.eq('content_type', 'milestone');
      } else if (filter === 'videos') {
        query = query.eq('content_type', 'video');
      } else if (filter === 'popular') {
        query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
      } else if (filter === 'saved' && user) {
        // Fetch bookmarked post IDs
        const { data: bookmarks } = await sb
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', user.id);
        const bookmarkedIds = (bookmarks || []).map((b) => b.post_id);
        if (bookmarkedIds.length === 0) {
          return res.json({ status: 'OK', posts: [], nextCursor: null });
        }
        query = query.in('id', bookmarkedIds);
      } else if (filter === 'my-communities' && user) {
        const { data: mems } = await sb
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id)
          .eq('status', 'active');
        const commIds = (mems || []).map((m) => m.community_id);
        if (commIds.length === 0) {
          return res.json({ status: 'OK', posts: [], nextCursor: null });
        }
        query = query.in('community_id', commIds);
      }

      // Cursor ordering
      if (filter !== 'popular') {
        query = query.order('pinned', { ascending: false }).order('created_at', { ascending: false });
        if (cursor && typeof cursor === 'string') {
          query = query.lt('created_at', cursor);
        }
      }

      query = query.limit(pageSize + 1);

      const { data: rawPosts, error: postErr } = await query;
      if (postErr) throw postErr;

      const hasNext = (rawPosts || []).length > pageSize;
      const posts = (rawPosts || []).slice(0, pageSize);
      const nextCursor = hasNext && posts.length > 0 ? posts[posts.length - 1].created_at : null;

      if (posts.length === 0) {
        return res.json({ status: 'OK', posts: [], nextCursor: null });
      }

      // Gather author IDs and community IDs
      const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
      const commIds = Array.from(new Set(posts.map((p) => p.community_id).filter(Boolean)));
      const postIds = posts.map((p) => p.id);

      // Fetch authors
      const { data: authors } = await sb
        .from('profiles')
        .select('id, display_name, username, avatar_url, preferred_language, target_rating')
        .in('id', authorIds);
      const authorMap = new Map((authors || []).map((a) => [a.id, a]));

      // Fetch communities
      const { data: communities } = await sb
        .from('communities')
        .select('id, name, slug, avatar_url, is_system')
        .in('id', commIds);
      const commMap = new Map((communities || []).map((c) => [c.id, c]));

      // Fetch attachments for these posts
      const { data: attachments } = await sb
        .from('post_attachments')
        .select('*')
        .in('post_id', postIds);
      const attachMap = new Map<string, any[]>();
      for (const a of attachments || []) {
        if (!attachMap.has(a.post_id)) attachMap.set(a.post_id, []);
        attachMap.get(a.post_id)?.push(a);
      }

      // Fetch user's reactions & bookmarks if authenticated
      let userReactions = new Map<string, string>();
      let userBookmarks = new Set<string>();

      if (user) {
        const { data: reactions } = await sb
          .from('reactions')
          .select('target_id, reaction_type')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .in('target_id', postIds);
        for (const r of reactions || []) {
          userReactions.set(r.target_id, r.reaction_type);
        }

        const { data: bookmarks } = await sb
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        for (const b of bookmarks || []) {
          userBookmarks.add(b.post_id);
        }
      }

      let populated = posts.map((p) => ({
        ...p,
        author: authorMap.get(p.author_id) || {
          id: p.author_id,
          display_name: 'Programmer',
          username: null,
          avatar_url: null,
        },
        community: p.community_id ? commMap.get(p.community_id) || null : null,
        attachments: attachMap.get(p.id) || [],
        userReaction: userReactions.get(p.id) || null,
        isBookmarked: userBookmarks.has(p.id),
      }));

      // Fallback to default posts if feed is empty
      if (populated.length === 0) {
        populated = DEFAULT_POSTS;
        if (filter === 'questions' || filter === 'unanswered') {
          populated = populated.filter((p) => p.content_type === 'question' || p.content_type === 'help_request');
        } else if (filter === 'blogs') {
          populated = populated.filter((p) => p.content_type === 'blog');
        }
      }

      return res.json({
        status: 'OK',
        posts: populated,
        nextCursor,
      });
    } catch (err: any) {
      console.warn('[SocialFeedServer] getFeed query fallback to curated feed:', err.message);
      return res.json({
        status: 'OK',
        posts: DEFAULT_POSTS,
        nextCursor: null,
      });
    }
  },

  // Get single post with comments tree and attachments
  async getPostById(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: post, error: postErr } = await sb
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (postErr || !post) {
        const fallback = DEFAULT_POSTS.find((p) => p.id === id);
        if (fallback) {
          return res.json({
            status: 'OK',
            post: fallback,
            comments: [],
          });
        }
        return res.status(404).json({ error: 'NotFound', message: 'Post not found.' });
      }

      // Fetch author profile
      const { data: author } = await sb
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio, skills, preferred_language, target_rating')
        .eq('id', post.author_id)
        .maybeSingle();

      // Fetch community info
      let community = null;
      if (post.community_id) {
        const { data: comm } = await sb
          .from('communities')
          .select('id, name, slug, avatar_url, is_system, visibility')
          .eq('id', post.community_id)
          .maybeSingle();
        community = comm;
      }

      // Fetch attachments
      const { data: attachments } = await sb
        .from('post_attachments')
        .select('*')
        .eq('post_id', id);

      // Fetch user interaction states
      let userReaction = null;
      let isBookmarked = false;

      if (user) {
        const { data: rx } = await sb
          .from('reactions')
          .select('reaction_type')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .eq('target_id', id)
          .maybeSingle();
        if (rx) userReaction = rx.reaction_type;

        const { data: bm } = await sb
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle();
        isBookmarked = !!bm;
      }

      // Increment views count asynchronously
      sb.from('posts')
        .update({ views_count: (post.views_count || 0) + 1 })
        .eq('id', id)
        .then();

      return res.json({
        status: 'OK',
        post: {
          ...post,
          author: author || { id: post.author_id, display_name: 'Author' },
          community,
          attachments: attachments || [],
          userReaction,
          isBookmarked,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Create new post / blog / question / milestone
  async createPost(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = CreatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'ValidationFailed', details: parsed.error.issues });
    }

    const sb = getSupabaseAdmin();
    const d = parsed.data;

    try {
      // Calculate estimated reading time for long-form blogs
      const words = d.content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(words / 200));

      const initialQStatus =
        d.contentType === 'question' || d.contentType === 'help_request'
          ? d.questionStatus || 'unanswered'
          : null;

      const { data: post, error: insertErr } = await sb
        .from('posts')
        .insert({
          community_id: d.communityId || null,
          author_id: user.id,
          content_type: d.contentType,
          title: d.title || null,
          subtitle: d.subtitle || null,
          content: d.content,
          tags: d.tags,
          status: d.status,
          problem_url: d.problemUrl || null,
          contest_id: d.contestId || null,
          programming_language: d.programmingLanguage || null,
          code_snippet: d.codeSnippet || null,
          cover_image_url: d.coverImageUrl || null,
          reading_time_minutes: readingTime,
          question_status: initialQStatus,
          milestone_category: d.milestoneCategory || null,
          milestone_metric: d.milestoneMetric || null,
          milestone_date: d.milestoneDate || null,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
        })
        .select()
        .single();

      if (insertErr || !post) throw insertErr || new Error('Failed to create post');

      // Insert attachments if present
      if (d.attachments && d.attachments.length > 0) {
        const attachRows = d.attachments.map((a) => ({
          post_id: post.id,
          file_type: a.fileType,
          file_name: a.fileName,
          file_size: a.fileSize,
          mime_type: a.mimeType,
          r2_key: a.r2Key,
          url: a.url,
        }));

        await sb.from('post_attachments').insert(attachRows);
      }

      // Update community post count
      if (d.communityId) {
        try {
          await sb.rpc('increment_community_posts', { comm_id: d.communityId });
        } catch {
          const { count } = await sb.from('posts').select('*', { count: 'exact', head: true }).eq('community_id', d.communityId);
          await sb.from('communities').update({ posts_count: count || 1 }).eq('id', d.communityId);
        }
      }

      return res.status(201).json({ status: 'OK', post });
    } catch (err: any) {
      console.error('[SocialFeedServer] createPost error:', err);
      return res.status(500).json({ error: 'CreatePostError', message: err.message });
    }
  },

  // Toggle or change reaction
  async handleReaction(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { targetType, targetId, reactionType } = req.body;
    if (!['post', 'comment'].includes(targetType) || !['like', 'care', 'celebrate', 'insightful'].includes(reactionType)) {
      return res.status(400).json({ error: 'InvalidReaction', message: 'Invalid targetType or reactionType' });
    }

    const sb = getSupabaseAdmin();

    try {
      // Check existing reaction
      const { data: existing } = await sb
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      let action: 'added' | 'removed' | 'updated';
      let activeReaction: string | null = null;

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Toggle off
          await sb.from('reactions').delete().eq('id', existing.id);
          action = 'removed';
          activeReaction = null;
        } else {
          // Change reaction type
          await sb.from('reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
          action = 'updated';
          activeReaction = reactionType;
        }
      } else {
        // Add new reaction
        await sb.from('reactions').insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType,
        });
        action = 'added';
        activeReaction = reactionType;
      }

      // Recompute and persist likes/reactions count on target
      const { count } = await sb
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      const newCount = count || 0;
      if (targetType === 'post') {
        await sb.from('posts').update({ likes_count: newCount }).eq('id', targetId);
      } else if (targetType === 'comment') {
        await sb.from('comments').update({ likes_count: newCount }).eq('id', targetId);
      }

      return res.json({
        status: 'OK',
        action,
        activeReaction,
        likesCount: newCount,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'ReactionError', message: err.message });
    }
  },

  // Toggle bookmark
  async toggleBookmark(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: postId } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: existing } = await sb
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (existing) {
        await sb.from('bookmarks').delete().eq('id', existing.id);
        return res.json({ status: 'OK', isBookmarked: false });
      } else {
        await sb.from('bookmarks').insert({ user_id: user.id, post_id: postId });
        return res.json({ status: 'OK', isBookmarked: true });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'BookmarkError', message: err.message });
    }
  },

  // Mark answer as accepted
  async acceptAnswer(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: postId } = req.params;
    const { commentId } = req.body;
    const sb = getSupabaseAdmin();

    try {
      const { data: post, error: postErr } = await sb.from('posts').select('*').eq('id', postId).single();
      if (postErr || !post) return res.status(404).json({ error: 'PostNotFound' });

      // Only author can accept answer
      if (post.author_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only the question author can accept an answer.' });
      }

      // Mark comment accepted
      await sb.from('comments').update({ is_accepted: false }).eq('post_id', postId);
      await sb.from('comments').update({ is_accepted: true }).eq('id', commentId);

      // Update post status
      await sb
        .from('posts')
        .update({
          accepted_answer_id: commentId,
          question_status: 'accepted',
        })
        .eq('id', postId);

      return res.json({ status: 'OK', message: 'Answer marked as accepted!' });
    } catch (err: any) {
      return res.status(500).json({ error: 'AcceptAnswerError', message: err.message });
    }
  },

  // Comments for a post
  async getComments(req: Request, res: Response) {
    const { id: postId } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: comments, error } = await sb
        .from('comments')
        .select(`
          id, post_id, author_id, parent_id, content, code_snippet,
          is_answer, is_accepted, likes_count, status, created_at, updated_at
        `)
        .eq('post_id', postId)
        .neq('status', 'hidden')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch authors
      const authorIds = Array.from(new Set((comments || []).map((c) => c.author_id)));
      const { data: authors } = await sb
        .from('profiles')
        .select('id, display_name, username, avatar_url, target_rating')
        .in('id', authorIds);
      const authorMap = new Map((authors || []).map((a) => [a.id, a]));

      const populated = (comments || []).map((c) => ({
        ...c,
        author: authorMap.get(c.author_id) || { id: c.author_id, display_name: 'Coder' },
      }));

      return res.json({ status: 'OK', comments: populated });
    } catch (err: any) {
      return res.status(500).json({ error: 'CommentsQueryError', message: err.message });
    }
  },

  // Add comment / reply
  async createComment(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { postId, parentId, content, codeSnippet, isAnswer } = req.body;
    if (!postId || !content || !content.trim()) {
      return res.status(400).json({ error: 'BadRequest', message: 'postId and content are required.' });
    }

    const sb = getSupabaseAdmin();

    try {
      const { data: comment, error } = await sb
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_id: parentId || null,
          content: content.trim(),
          code_snippet: codeSnippet || null,
          is_answer: !!isAnswer,
          is_accepted: false,
          likes_count: 0,
          status: 'active',
        })
        .select()
        .single();

      if (error || !comment) throw error || new Error('Failed to create comment');

      // Update post comments count and question status
      const { data: post } = await sb.from('posts').select('content_type, question_status, comments_count').eq('id', postId).single();
      if (post) {
        const updatePayload: Record<string, any> = {
          comments_count: (post.comments_count || 0) + 1,
        };
        if (
          (post.content_type === 'question' || post.content_type === 'help_request') &&
          post.question_status === 'unanswered'
        ) {
          updatePayload.question_status = 'answered';
        }
        await sb.from('posts').update(updatePayload).eq('id', postId);
      }

      // Fetch author profile
      const { data: author } = await sb
        .from('profiles')
        .select('id, display_name, username, avatar_url, target_rating')
        .eq('id', user.id)
        .maybeSingle();

      return res.status(201).json({
        status: 'OK',
        comment: {
          ...comment,
          author: author || { id: user.id, display_name: 'Coder' },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'CreateCommentError', message: err.message });
    }
  },

  // Delete post (author, community owner/admin/mod)
  async deletePost(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: post, error } = await sb
        .from('posts')
        .select('id, author_id, community_id')
        .eq('id', id)
        .maybeSingle();

      if (error || !post) return res.status(404).json({ error: 'NotFound', message: 'Post not found' });

      let canDelete = post.author_id === user.id;

      if (!canDelete && post.community_id) {
        const { data: mem } = await sb
          .from('community_members')
          .select('role')
          .eq('community_id', post.community_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (mem && ['owner', 'admin', 'moderator'].includes(mem.role)) {
          canDelete = true;
        }
      }

      if (!canDelete) {
        return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to delete this post.' });
      }

      // Cleanup attachments from R2/local storage
      const { data: attachs } = await sb.from('post_attachments').select('r2_key').eq('post_id', id);
      if (attachs && attachs.length > 0) {
        for (const a of attachs) {
          if (a.r2_key) {
            try {
              await r2Storage.deleteFile(a.r2_key);
            } catch {}
          }
        }
      }

      await sb.from('posts').delete().eq('id', id);

      if (post.community_id) {
        const { data: comm } = await sb.from('communities').select('posts_count').eq('id', post.community_id).single();
        if (comm) {
          await sb.from('communities').update({ posts_count: Math.max(0, comm.posts_count - 1) }).eq('id', post.community_id);
        }
      }

      return res.json({ status: 'OK', message: 'Post deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Delete comment
  async deleteComment(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: comment, error } = await sb
        .from('comments')
        .select('id, author_id, post_id')
        .eq('id', id)
        .maybeSingle();

      if (error || !comment) return res.status(404).json({ error: 'NotFound', message: 'Comment not found' });

      let canDelete = comment.author_id === user.id;

      if (!canDelete) {
        const { data: post } = await sb.from('posts').select('community_id').eq('id', comment.post_id).maybeSingle();
        if (post?.community_id) {
          const { data: mem } = await sb
            .from('community_members')
            .select('role')
            .eq('community_id', post.community_id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (mem && ['owner', 'admin', 'moderator'].includes(mem.role)) {
            canDelete = true;
          }
        }
      }

      if (!canDelete) {
        return res.status(403).json({ error: 'Forbidden', message: 'Cannot delete comment' });
      }

      await sb.from('comments').delete().eq('id', id);

      const { data: post } = await sb.from('posts').select('comments_count').eq('id', comment.post_id).single();
      if (post) {
        await sb.from('posts').update({ comments_count: Math.max(0, post.comments_count - 1) }).eq('id', comment.post_id);
      }

      return res.json({ status: 'OK', message: 'Comment deleted' });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },
};
