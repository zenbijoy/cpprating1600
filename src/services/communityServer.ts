import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, getSupabaseAdmin } from './authServer';

const CreateCommunitySchema = z.object({
  name: z.string().min(3).max(80),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
  category: z.string().max(40).default('general'),
  tags: z.array(z.string()).default([]),
  avatarUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  visibility: z.enum(['public', 'private']).default('public'),
  joinApproval: z.enum(['open', 'request_required', 'invite_only']).default('open'),
  postingPermission: z.enum(['all_members', 'moderators_only', 'admins_only']).default('all_members'),
  rules: z.string().max(2000).optional().nullable(),
});

const UpdateCommunitySchema = z.object({
  name: z.string().min(3).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(40).optional(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  visibility: z.enum(['public', 'private']).optional(),
  joinApproval: z.enum(['open', 'request_required', 'invite_only']).optional(),
  postingPermission: z.enum(['all_members', 'moderators_only', 'admins_only']).optional(),
  rules: z.string().max(2000).optional().nullable(),
});

async function resolveCommunityId(sb: any, idOrSlug: string): Promise<string | null> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug;
  }
  const { data } = await sb.from('communities').select('id').eq('slug', idOrSlug).maybeSingle();
  return data?.id || null;
}

export const communityServer = {
  // List communities with optional search, category, or user membership filter
  async listCommunities(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const sb = getSupabaseAdmin();
    const { category, search, filter } = req.query;

    try {
      let query = sb
        .from('communities')
        .select(`
          id, name, slug, description, category, tags, avatar_url, cover_url,
          visibility, join_approval, posting_permission, rules, is_system, is_default,
          members_count, posts_count, created_at
        `)
        .order('is_system', { ascending: false })
        .order('members_count', { ascending: false });

      if (category && typeof category === 'string' && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search && typeof search === 'string' && search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`);
      }

      const { data: communities, error } = await query;
      if (error) throw error;

      // If user is authenticated, attach their membership status
      let userMemberships = new Map<string, { role: string; status: string }>();
      if (user) {
        const { data: mems } = await sb
          .from('community_members')
          .select('community_id, role, status')
          .eq('user_id', user.id);

        if (mems) {
          for (const m of mems) {
            userMemberships.set(m.community_id, { role: m.role, status: m.status });
          }
        }
      }

      let results = (communities || []).map((c) => ({
        ...c,
        isMember: userMemberships.has(c.id) && userMemberships.get(c.id)?.status === 'active',
        myRole: userMemberships.get(c.id)?.role || null,
        myMembershipStatus: userMemberships.get(c.id)?.status || null,
      }));

      // Filter by "joined" if requested
      if (filter === 'joined' && user) {
        results = results.filter((c) => c.isMember);
      }

      return res.json({ status: 'OK', communities: results });
    } catch (err: any) {
      console.error('[CommunityServer] listCommunities error:', err);
      return res.status(500).json({ error: 'Failed to list communities', message: err.message });
    }
  },

  // Get single community details by slug
  async getCommunityBySlug(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const { slug } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: community, error } = await sb
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !community) {
        return res.status(404).json({ error: 'NotFound', message: 'Community not found.' });
      }

      let myMembership = null;
      let pendingRequest = false;

      if (user) {
        const { data: mem } = await sb
          .from('community_members')
          .select('*')
          .eq('community_id', community.id)
          .eq('user_id', user.id)
          .maybeSingle();
        myMembership = mem;

        if (!mem && community.join_approval === 'request_required') {
          const { data: reqData } = await sb
            .from('community_join_requests')
            .select('*')
            .eq('community_id', community.id)
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .maybeSingle();
          pendingRequest = !!reqData;
        }
      }

      // Check private community access
      if (community.visibility === 'private' && (!myMembership || myMembership.status !== 'active')) {
        return res.json({
          status: 'OK',
          community: {
            id: community.id,
            name: community.name,
            slug: community.slug,
            description: community.description,
            visibility: 'private',
            members_count: community.members_count,
            avatar_url: community.avatar_url,
            is_system: community.is_system,
          },
          isPrivateRestricted: true,
          myMembership: null,
          pendingRequest,
        });
      }

      return res.json({
        status: 'OK',
        community,
        myMembership,
        pendingRequest,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Create a new community and atomically assign the creator as owner
  async createCommunity(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = CreateCommunitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'ValidationFailed', details: parsed.error.issues });
    }

    const sb = getSupabaseAdmin();
    const data = parsed.data;

    try {
      // Check slug availability
      const { data: existing } = await sb
        .from('communities')
        .select('id')
        .eq('slug', data.slug)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'Conflict', message: `The community slug '${data.slug}' is already taken.` });
      }

      // Insert community
      const { data: community, error: commErr } = await sb
        .from('communities')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          category: data.category,
          tags: data.tags,
          avatar_url: data.avatarUrl || null,
          cover_url: data.coverUrl || null,
          visibility: data.visibility,
          join_approval: data.joinApproval,
          posting_permission: data.postingPermission,
          rules: data.rules || null,
          is_system: false,
          is_default: false,
          created_by: user.id,
          members_count: 1,
          posts_count: 0,
        })
        .select()
        .single();

      if (commErr || !community) {
        throw commErr || new Error('Failed to create community');
      }

      // Assign creator as Owner
      const { error: memErr } = await sb
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        });

      if (memErr) {
        console.error('[CommunityServer] Failed to assign creator owner role:', memErr);
      }

      return res.status(201).json({ status: 'OK', community });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Join or request to join a community
  async joinCommunity(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: community, error: commErr } = await sb
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'NotFound', message: 'Community not found.' });
      }

      // Check existing membership
      const { data: existing } = await sb
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'banned') {
          return res.status(403).json({ error: 'Forbidden', message: 'You have been banned from this community.' });
        }
        return res.json({ status: 'OK', message: 'Already a member', membership: existing });
      }

      if (community.join_approval === 'request_required') {
        const { data: reqData, error: reqErr } = await sb
          .from('community_join_requests')
          .upsert({
            community_id: id,
            user_id: user.id,
            status: 'pending',
          })
          .select()
          .single();

        if (reqErr) throw reqErr;
        return res.json({ status: 'OK', message: 'Join request submitted', request: reqData });
      } else {
        // Open join
        const { data: newMem, error: joinErr } = await sb
          .from('community_members')
          .insert({
            community_id: id,
            user_id: user.id,
            role: 'member',
            status: 'active',
          })
          .select()
          .single();

        if (joinErr) throw joinErr;

        // Increment count
        try {
          await sb.rpc('increment_community_members', { comm_id: id });
        } catch {
          await sb.from('communities')
            .update({ members_count: community.members_count + 1 })
            .eq('id', id);
        }

        return res.json({ status: 'OK', message: 'Successfully joined community', membership: newMem });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Leave a community
  async leaveCommunity(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: community } = await sb
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (community?.is_system) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Default system communities are core to CLIMB 1600 and cannot be left.',
        });
      }

      const { data: mem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (mem?.role === 'owner') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Community owner cannot leave without transferring ownership or deleting the community.',
        });
      }

      const { error: delErr } = await sb
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id);

      if (delErr) throw delErr;

      if (community) {
        await sb
          .from('communities')
          .update({ members_count: Math.max(0, community.members_count - 1) })
          .eq('id', id);
      }

      return res.json({ status: 'OK', message: 'Successfully left community' });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Ensure default communities membership for current user (idempotent onboarding endpoint)
  async provisionDefaultsHandler(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const sb = getSupabaseAdmin();
    try {
      // 1. Get default communities
      const { data: defaults, error } = await sb
        .from('communities')
        .select('id, name, slug')
        .eq('is_default', true);

      if (error || !defaults) throw error || new Error('No default communities found');

      for (const c of defaults) {
        await sb
          .from('community_members')
          .upsert(
            { community_id: c.id, user_id: user.id, role: 'member', status: 'active' },
            { onConflict: 'community_id,user_id' }
          );
      }

      return res.json({ status: 'OK', message: 'Default community memberships provisioned', communities: defaults });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Delete a community (only owner, system communities protected)
  async deleteCommunity(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const { data: comm, error } = await sb.from('communities').select('*').eq('id', id).single();
      if (error || !comm) return res.status(404).json({ error: 'NotFound' });

      if (comm.is_system) {
        return res.status(403).json({ error: 'Forbidden', message: 'System communities cannot be deleted.' });
      }

      // Check if user is owner
      const { data: mem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mem || mem.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden', message: 'Only the community owner can delete the community.' });
      }

      await sb.from('communities').delete().eq('id', id);
      return res.json({ status: 'OK', message: 'Community successfully deleted' });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // List community members with user profiles and CF ratings
  async listCommunityMembers(req: Request, res: Response) {
    const { id } = req.params;
    const { role, search, status = 'active' } = req.query;
    const sb = getSupabaseAdmin();

    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      let query = sb
        .from('community_members')
        .select('id, community_id, user_id, role, status, joined_at, updated_at')
        .eq('community_id', communityId);

      if (status && typeof status === 'string' && status !== 'all') {
        query = query.eq('status', status);
      }
      if (role && typeof role === 'string' && role !== 'all') {
        query = query.eq('role', role);
      }

      const { data: members, error } = await query.order('joined_at', { ascending: true });
      if (error) throw error;

      if (!members || members.length === 0) {
        return res.json({ status: 'OK', members: [] });
      }

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await sb
        .from('profiles')
        .select('id, username, display_name, avatar_url, preferred_language, target_rating')
        .in('id', userIds);

      const { data: cfAccounts } = await sb
        .from('user_cf_accounts')
        .select('user_id, cf_handle, cf_rating, cf_rank')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const cfMap = new Map((cfAccounts || []).map((c) => [c.user_id, c]));

      let results = members.map((m) => {
        const prof = profileMap.get(m.user_id) as any;
        const cf = cfMap.get(m.user_id) as any;
        return {
          ...m,
          profile: prof || { id: m.user_id, display_name: 'Member', username: null, avatar_url: null },
          cfAccount: cf || null,
        };
      });

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        results = results.filter(
          (r: any) =>
            r.profile?.display_name?.toLowerCase().includes(q) ||
            r.profile?.username?.toLowerCase().includes(q) ||
            r.cfAccount?.cf_handle?.toLowerCase().includes(q)
        );
      }

      return res.json({ status: 'OK', members: results });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Update a member's role (owner can promote/demote admin/mod; admin can promote/demote mod/member)
  async updateMemberRole(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: 'InvalidRole', message: 'Role must be admin, moderator, or member.' });
    }

    const sb = getSupabaseAdmin();
    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      // Check caller's role
      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || !['owner', 'admin'].includes(callerMem.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only owners and admins can update member roles.' });
      }

      // Target member
      const { data: targetMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!targetMem) {
        return res.status(404).json({ error: 'MemberNotFound', message: 'User is not a member of this community.' });
      }

      if (targetMem.role === 'owner') {
        return res.status(400).json({ error: 'CannotDemoteOwner', message: 'Cannot change the owner role. Use ownership transfer instead.' });
      }

      if (callerMem.role === 'admin' && (targetMem.role === 'admin' || role === 'admin')) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can manage admin roles.' });
      }

      const { data: updated, error } = await sb
        .from('community_members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ status: 'OK', message: 'Member role updated successfully', member: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Kick / Remove member from community
  async removeMember(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id, userId } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || !['owner', 'admin'].includes(callerMem.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only owners and admins can remove members.' });
      }

      const { data: targetMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!targetMem) {
        return res.status(404).json({ error: 'NotFound', message: 'Member not found.' });
      }

      if (targetMem.role === 'owner') {
        return res.status(400).json({ error: 'BadRequest', message: 'Cannot kick the community owner.' });
      }

      if (callerMem.role === 'admin' && targetMem.role === 'admin') {
        return res.status(403).json({ error: 'Forbidden', message: 'Admins cannot remove other admins.' });
      }

      await sb.from('community_members').delete().eq('community_id', communityId).eq('user_id', userId);

      const { data: comm } = await sb.from('communities').select('members_count').eq('id', communityId).single();
      if (comm) {
        await sb.from('communities').update({ members_count: Math.max(0, comm.members_count - 1) }).eq('id', communityId);
      }

      return res.json({ status: 'OK', message: 'Member removed from community' });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Ban or Unban member
  async banMember(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id, userId } = req.params;
    const { action = 'ban' } = req.body; // 'ban' or 'unban'
    const sb = getSupabaseAdmin();

    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || !['owner', 'admin'].includes(callerMem.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only owners and admins can ban or unban members.' });
      }

      const { data: targetMem } = await sb
        .from('community_members')
        .select('role, status')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!targetMem) return res.status(404).json({ error: 'NotFound', message: 'Member not found' });
      if (targetMem.role === 'owner') return res.status(400).json({ error: 'BadRequest', message: 'Cannot ban the owner' });
      if (callerMem.role === 'admin' && targetMem.role === 'admin') return res.status(403).json({ error: 'Forbidden' });

      const newStatus = action === 'unban' ? 'active' : 'banned';
      await sb
        .from('community_members')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('community_id', communityId)
        .eq('user_id', userId);

      const { data: comm } = await sb.from('communities').select('members_count').eq('id', communityId).single();
      if (comm) {
        if (action === 'ban' && targetMem.status === 'active') {
          await sb.from('communities').update({ members_count: Math.max(0, comm.members_count - 1) }).eq('id', communityId);
        } else if (action === 'unban' && targetMem.status === 'banned') {
          await sb.from('communities').update({ members_count: comm.members_count + 1 }).eq('id', communityId);
        }
      }

      return res.json({ status: 'OK', message: `Member has been ${newStatus}` });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // List pending join requests
  async listJoinRequests(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || !['owner', 'admin', 'moderator'].includes(callerMem.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to view join requests.' });
      }

      const { data: requests, error } = await sb
        .from('community_join_requests')
        .select('*')
        .eq('community_id', communityId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!requests || requests.length === 0) {
        return res.json({ status: 'OK', requests: [] });
      }

      const userIds = requests.map((r) => r.user_id);
      const { data: profiles } = await sb.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds);
      const { data: cfAccounts } = await sb.from('user_cf_accounts').select('user_id, cf_handle, cf_rating, cf_rank').in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const cfMap = new Map((cfAccounts || []).map((c) => [c.user_id, c]));

      const enriched = requests.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id) || { id: r.user_id, display_name: 'Applicant' },
        cfAccount: cfMap.get(r.user_id) || null,
      }));

      return res.json({ status: 'OK', requests: enriched });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Review (approve or reject) a join request
  async reviewJoinRequest(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id, requestId } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'InvalidAction', message: 'Action must be approve or reject.' });
    }

    const sb = getSupabaseAdmin();
    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || !['owner', 'admin', 'moderator'].includes(callerMem.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permission to review join requests.' });
      }

      const { data: joinReq, error: reqErr } = await sb
        .from('community_join_requests')
        .select('*')
        .eq('id', requestId)
        .eq('community_id', communityId)
        .single();

      if (reqErr || !joinReq) {
        return res.status(404).json({ error: 'NotFound', message: 'Join request not found.' });
      }

      const now = new Date().toISOString();
      if (action === 'approve') {
        await sb.from('community_members').upsert(
          {
            community_id: communityId,
            user_id: joinReq.user_id,
            role: 'member',
            status: 'active',
          },
          { onConflict: 'community_id,user_id' }
        );

        await sb
          .from('community_join_requests')
          .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: now,
          })
          .eq('id', requestId);

        const { data: comm } = await sb.from('communities').select('members_count').eq('id', communityId).single();
        if (comm) {
          await sb.from('communities').update({ members_count: comm.members_count + 1 }).eq('id', communityId);
        }

        return res.json({ status: 'OK', message: 'Join request approved' });
      } else {
        await sb
          .from('community_join_requests')
          .update({
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: now,
          })
          .eq('id', requestId);

        return res.json({ status: 'OK', message: 'Join request rejected' });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Update community details and rules (Owner or Admin)
  async updateCommunity(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const sb = getSupabaseAdmin();

    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || !['owner', 'admin'].includes(callerMem.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only owners and admins can update community settings.' });
      }

      const parsed = UpdateCommunitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'ValidationFailed', details: parsed.error.issues });
      }

      const d = parsed.data;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (d.name !== undefined) updates.name = d.name;
      if (d.description !== undefined) updates.description = d.description;
      if (d.category !== undefined) updates.category = d.category;
      if (d.tags !== undefined) updates.tags = d.tags;
      if (d.avatarUrl !== undefined) updates.avatar_url = d.avatarUrl;
      if (d.coverUrl !== undefined) updates.cover_url = d.coverUrl;
      if (d.visibility !== undefined) updates.visibility = d.visibility;
      if (d.joinApproval !== undefined) updates.join_approval = d.joinApproval;
      if (d.postingPermission !== undefined) updates.posting_permission = d.postingPermission;
      if (d.rules !== undefined) updates.rules = d.rules;

      const { data: updated, error } = await sb
        .from('communities')
        .update(updates)
        .eq('id', communityId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ status: 'OK', community: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },

  // Transfer ownership of community to another active member
  async transferOwnership(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { newOwnerUserId } = req.body;
    if (!newOwnerUserId) {
      return res.status(400).json({ error: 'BadRequest', message: 'newOwnerUserId is required.' });
    }

    const sb = getSupabaseAdmin();
    try {
      const communityId = await resolveCommunityId(sb, id);
      if (!communityId) return res.status(404).json({ error: 'Community not found' });

      const { data: callerMem } = await sb
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMem || callerMem.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden', message: 'Only the current owner can transfer ownership.' });
      }

      const { data: targetMem } = await sb
        .from('community_members')
        .select('role, status')
        .eq('community_id', communityId)
        .eq('user_id', newOwnerUserId)
        .maybeSingle();

      if (!targetMem || targetMem.status !== 'active') {
        return res.status(400).json({ error: 'BadRequest', message: 'Target user must be an active member of this community.' });
      }

      await sb.from('community_members').update({ role: 'owner', updated_at: new Date().toISOString() }).eq('community_id', communityId).eq('user_id', newOwnerUserId);
      await sb.from('community_members').update({ role: 'admin', updated_at: new Date().toISOString() }).eq('community_id', communityId).eq('user_id', user.id);

      return res.json({ status: 'OK', message: 'Ownership successfully transferred' });
    } catch (err: any) {
      return res.status(500).json({ error: 'InternalError', message: err.message });
    }
  },
};
