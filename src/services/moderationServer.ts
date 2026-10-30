import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, getSupabaseAdmin } from './authServer';

const ReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'message', 'user', 'community']),
  targetId: z.string(),
  reason: z.string().min(3).max(100),
  details: z.string().max(1000).optional().nullable(),
});

export const moderationServer = {
  // Submit content report
  async submitReport(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = ReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'ValidationFailed', details: parsed.error.issues });
    }

    const sb = getSupabaseAdmin();
    const { targetType, targetId, reason, details } = parsed.data;

    try {
      const { data: report, error } = await sb
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ status: 'OK', message: 'Report submitted successfully. Thank you for keeping the community safe.', report });
    } catch (err: any) {
      return res.status(500).json({ error: 'ReportError', message: err.message });
    }
  },

  // List reports for moderation dashboard
  async listReports(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const sb = getSupabaseAdmin();
    const { status = 'pending' } = req.query;

    try {
      const { data: reports, error } = await sb
        .from('content_reports')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return res.json({ status: 'OK', reports: reports || [] });
    } catch (err: any) {
      return res.status(500).json({ error: 'ListReportsError', message: err.message });
    }
  },

  // Action or dismiss report
  async reviewReport(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status, actionTaken } = req.body;
    const sb = getSupabaseAdmin();

    try {
      const { data: updated, error } = await sb
        .from('content_reports')
        .update({
          status: status || 'reviewed',
          action_taken: actionTaken || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ status: 'OK', report: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'ReviewError', message: err.message });
    }
  },

  // Global Unified Search across Communities, Posts, Questions, Blogs, and Users
  async globalSearch(req: Request, res: Response) {
    const { q, type = 'all' } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.json({ status: 'OK', results: { communities: [], posts: [], users: [] } });
    }

    const sb = getSupabaseAdmin();
    const queryStr = q.trim();

    try {
      let communities: any[] = [];
      let posts: any[] = [];
      let users: any[] = [];

      if (type === 'all' || type === 'communities') {
        const { data: comms } = await sb
          .from('communities')
          .select('id, name, slug, description, category, tags, avatar_url, members_count, is_system')
          .or(`name.ilike.%${queryStr}%,description.ilike.%${queryStr}%,slug.ilike.%${queryStr}%`)
          .limit(8);
        communities = comms || [];
      }

      if (type === 'all' || type === 'posts' || type === 'questions' || type === 'blogs') {
        let postQuery = sb
          .from('posts')
          .select('id, title, content_type, tags, likes_count, comments_count, created_at, author_id')
          .eq('status', 'published')
          .or(`title.ilike.%${queryStr}%,content.ilike.%${queryStr}%`);

        if (type === 'questions') postQuery = postQuery.in('content_type', ['question', 'help_request']);
        if (type === 'blogs') postQuery = postQuery.eq('content_type', 'blog');

        const { data: pList } = await postQuery.limit(10);
        posts = pList || [];
      }

      if (type === 'all' || type === 'users') {
        const { data: uList } = await sb
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio, preferred_language, target_rating')
          .or(`display_name.ilike.%${queryStr}%,username.ilike.%${queryStr}%`)
          .limit(8);
        users = uList || [];
      }

      return res.json({
        status: 'OK',
        results: {
          communities,
          posts,
          users,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'SearchError', message: err.message });
    }
  },

  // Public User Profile lookup by username or UUID
  async getUserProfile(req: Request, res: Response) {
    const { identifier } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      let query = sb
        .from('profiles')
        .select(`
          id, display_name, username, avatar_url, bio, skills, interests,
          preferred_language, target_rating, total_days, current_day,
          privacy_settings, stats, last_seen_at, created_at
        `);

      if (isUuid) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('username', identifier.toLowerCase());
      }

      const { data: profile, error } = await query.maybeSingle();
      if (error || !profile) {
        return res.status(404).json({ error: 'UserNotFound', message: 'User profile not found.' });
      }

      // Check privacy settings
      const priv = profile.privacy_settings || {};
      const hideOnline = priv.show_online_status === false;

      // Fetch user's public posts, questions, and milestones
      const { data: recentPosts } = await sb
        .from('posts')
        .select('id, title, content_type, likes_count, comments_count, created_at')
        .eq('author_id', profile.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch user's public communities
      const { data: memberRows } = await sb
        .from('community_members')
        .select('community_id, role')
        .eq('user_id', profile.id)
        .eq('status', 'active');

      let userCommunities: any[] = [];
      if (memberRows && memberRows.length > 0) {
        const commIds = memberRows.map((m) => m.community_id);
        const { data: comms } = await sb
          .from('communities')
          .select('id, name, slug, avatar_url, category, is_system')
          .in('id', commIds)
          .eq('visibility', 'public');
        userCommunities = comms || [];
      }

      return res.json({
        status: 'OK',
        profile: {
          ...profile,
          last_seen_at: hideOnline ? null : profile.last_seen_at,
          recentPosts: recentPosts || [],
          communities: userCommunities,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'ProfileQueryError', message: err.message });
    }
  },
};
