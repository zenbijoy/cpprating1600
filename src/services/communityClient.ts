import { supabase } from './supabase';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tags: string[];
  avatar_url: string | null;
  cover_url: string | null;
  visibility: 'public' | 'private';
  join_approval: 'open' | 'request_required' | 'invite_only';
  posting_permission: 'all_members' | 'moderators_only' | 'admins_only';
  rules: string | null;
  is_system: boolean;
  is_default: boolean;
  members_count: number;
  posts_count: number;
  created_at: string;
  isMember?: boolean;
  myRole?: 'owner' | 'admin' | 'moderator' | 'member' | null;
  myMembershipStatus?: 'active' | 'pending' | 'banned' | null;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'active' | 'banned' | 'pending';
  joined_at: string;
  updated_at: string;
  profile: {
    id: string;
    username?: string | null;
    display_name: string;
    avatar_url?: string | null;
    preferred_language?: string;
    target_rating?: number;
  };
  cfAccount?: {
    user_id?: string;
    cf_handle?: string;
    cf_rating?: number;
    cf_rank?: string;
  } | null;
}

export interface CommunityJoinRequest {
  id: string;
  community_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profile: {
    id: string;
    username?: string | null;
    display_name: string;
    avatar_url?: string | null;
  };
  cfAccount?: {
    user_id?: string;
    cf_handle?: string;
    cf_rating?: number;
    cf_rank?: string;
  } | null;
}

export interface CreateCommunityPayload {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  tags?: string[];
  avatarUrl?: string | null;
  coverUrl?: string | null;
  visibility?: 'public' | 'private';
  joinApproval?: 'open' | 'request_required' | 'invite_only';
  postingPermission?: 'all_members' | 'moderators_only' | 'admins_only';
  rules?: string | null;
}

export const communityClient = {
  async getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async listCommunities(params?: { category?: string; search?: string; filter?: 'all' | 'joined' }): Promise<Community[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.filter) query.set('filter', params.filter);

    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities?${query.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to load communities');
    const data = await res.json();
    return data.communities || [];
  },

  async getCommunityBySlug(slug: string): Promise<{ community: Community; myMembership: any; pendingRequest: boolean; isPrivateRestricted?: boolean }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${slug}`, { headers });
    if (!res.ok) throw new Error('Community not found');
    return res.json();
  },

  async createCommunity(payload: CreateCommunityPayload): Promise<Community> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create community' }));
      throw new Error(err.message || 'Creation failed');
    }
    const data = await res.json();
    return data.community;
  },

  async joinCommunity(id: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${id}/join`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to join community' }));
      throw new Error(err.message || 'Failed to join');
    }
    return res.json();
  },

  async leaveCommunity(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${id}/leave`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to leave community' }));
      throw new Error(err.message || 'Failed to leave');
    }
  },

  async deleteCommunity(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete community' }));
      throw new Error(err.message || 'Failed to delete');
    }
  },

  async provisionDefaults(): Promise<void> {
    const headers = await this.getAuthHeaders();
    await fetch('/api/communities/provision-defaults', {
      method: 'POST',
      headers,
    });
  },

  async listCommunityMembers(
    id: string,
    params?: { role?: string; search?: string; status?: string }
  ): Promise<CommunityMember[]> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);

    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${id}/members?${query.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to load community members');
    const data = await res.json();
    return data.members || [];
  },

  async updateMemberRole(
    communityId: string,
    userId: string,
    role: 'admin' | 'moderator' | 'member'
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}/members/${userId}/role`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update role' }));
      throw new Error(err.message || 'Failed to update role');
    }
    return res.json();
  },

  async removeMember(communityId: string, userId: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to remove member' }));
      throw new Error(err.message || 'Failed to remove member');
    }
    return res.json();
  },

  async banMember(communityId: string, userId: string, action: 'ban' | 'unban' = 'ban'): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}/members/${userId}/ban`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to ban/unban member' }));
      throw new Error(err.message || 'Failed to update ban status');
    }
    return res.json();
  },

  async listJoinRequests(communityId: string): Promise<CommunityJoinRequest[]> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}/join-requests`, { headers });
    if (!res.ok) throw new Error('Failed to load join requests');
    const data = await res.json();
    return data.requests || [];
  },

  async reviewJoinRequest(
    communityId: string,
    requestId: string,
    action: 'approve' | 'reject'
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}/join-requests/${requestId}/review`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to review join request' }));
      throw new Error(err.message || 'Failed to review join request');
    }
    return res.json();
  },

  async updateCommunity(communityId: string, updates: Partial<CreateCommunityPayload>): Promise<Community> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update community' }));
      throw new Error(err.message || 'Update failed');
    }
    const data = await res.json();
    return data.community;
  },

  async transferOwnership(communityId: string, newOwnerUserId: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/communities/${communityId}/transfer-ownership`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ newOwnerUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to transfer ownership' }));
      throw new Error(err.message || 'Transfer failed');
    }
    return res.json();
  },

  // Real-time listener for community member or request updates
  subscribeToCommunity(
    communityId: string,
    callback: () => void
  ): () => void {
    const channel = supabase
      .channel(`comm-realtime:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          callback();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_join_requests',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
