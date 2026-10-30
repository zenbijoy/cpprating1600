import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CommunityIcon as Users,
  ShieldIcon as ShieldCheck,
  TrophyIcon as Crown,
  SettingsIcon as Settings,
  BackIcon as ArrowLeft,
  AddIcon as Plus,
  SearchIcon as Search,
  LockIcon as Lock,
  LanguageIcon as Globe,
  CheckCircleIcon as CheckCircle2,
  WarningStatusIcon as AlertCircle,
  CodeFileIcon as FileText,
  DeleteIcon as Trash2,
  DeleteAccountIcon as UserX,
  CheckCircleIcon as UserCheck,
  UploadIcon as Upload,
  ChatIcon as MessageSquare,
  AISparkleIcon as Sparkles,
  LoadingStatusIcon as Loader2,
  CalendarIcon as Calendar,
  ShareIcon as Share2,
  CheckIcon as Check,
  ShieldAlertIcon as ShieldAlert,
  StreakIcon as Flame,
  AskAQuestionIcon as HelpCircle,
  TrophyIcon as Trophy,
  LearningRoadmapIcon as Video,
} from './icons';
import {
  Community,
  CommunityMember,
  CommunityJoinRequest,
  communityClient,
} from '../services/communityClient';
import { Post, socialFeedClient } from '../services/socialFeedClient';
import { r2StorageClient } from '../services/r2StorageClient';
import { PostCard } from './social/PostCard';
import { PostComposerModal } from './social/PostComposerModal';

interface CommunityDetailViewProps {
  communitySlug: string;
  currentUserId?: string;
  onBack: () => void;
  onOpenDirectMessage?: (userId: string) => void;
  onOpenWorkspaceWithCode?: (code: string, problemNameOrId?: string) => void;
  onNavigateToCommunities?: () => void;
}

export const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  communitySlug,
  currentUserId,
  onBack,
  onOpenDirectMessage,
  onOpenWorkspaceWithCode,
}) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [myMembership, setMyMembership] = useState<{ role: string; status: string } | null>(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'members' | 'settings'>('feed');

  // Posts Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [feedFilter, setFeedFilter] = useState<string>('latest');
  const [showComposer, setShowComposer] = useState(false);

  // Members State
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [membersLoading, setMembersLoading] = useState(false);

  // Join Requests State
  const [joinRequests, setJoinRequests] = useState<CommunityJoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Join/Leave action loading
  const [isJoining, setIsJoining] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    category: 'algorithms',
    tags: [] as string[],
    avatarUrl: '',
    coverUrl: '',
    visibility: 'public' as 'public' | 'private',
    joinApproval: 'open' as 'open' | 'request_required' | 'invite_only',
    postingPermission: 'all_members' as 'all_members' | 'moderators_only' | 'admins_only',
    rules: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Transfer Ownership State
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // File upload refs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const canManage =
    myMembership && (myMembership.role === 'owner' || myMembership.role === 'admin');
  const isOwner = myMembership && myMembership.role === 'owner';

  // 1. Load Community Details
  const loadCommunity = useCallback(async () => {
    try {
      const data = await communityClient.getCommunityBySlug(communitySlug);
      setCommunity(data.community);
      setMyMembership(data.myMembership);
      setPendingRequest(data.pendingRequest);
      setIsPrivateRestricted(!!data.isPrivateRestricted);

      setSettingsForm({
        name: data.community.name || '',
        description: data.community.description || '',
        category: data.community.category || 'algorithms',
        tags: data.community.tags || [],
        avatarUrl: data.community.avatar_url || '',
        coverUrl: data.community.cover_url || '',
        visibility: data.community.visibility || 'public',
        joinApproval: data.community.join_approval || 'open',
        postingPermission: data.community.posting_permission || 'all_members',
        rules: data.community.rules || '',
      });
    } catch (err: any) {
      setError(err.message || 'Community not found');
    } finally {
      setLoading(false);
    }
  }, [communitySlug]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  // 2. Real-time updates subscription for community changes
  useEffect(() => {
    if (!community?.id) return;
    const unsubscribe = communityClient.subscribeToCommunity(community.id, () => {
      loadCommunity();
      if (activeTab === 'members') loadMembers();
      if (activeTab === 'settings') loadJoinRequests();
    });
    return unsubscribe;
  }, [community?.id, activeTab, loadCommunity]);

  // 3. Load Community Feed
  const loadFeed = useCallback(async () => {
    if (!community?.slug || isPrivateRestricted) return;
    setPostsLoading(true);
    try {
      const data = await socialFeedClient.getFeed({
        communitySlug: community.slug,
        filter: feedFilter,
        limit: 25,
      });
      setPosts(data.posts);
    } catch (err) {
      console.error('Failed to load community feed:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [community?.slug, feedFilter, isPrivateRestricted]);

  useEffect(() => {
    if (community) {
      loadFeed();
    }
  }, [community, feedFilter, loadFeed]);

  // Real-time listener for posts in this community
  useEffect(() => {
    const unsub = socialFeedClient.subscribeToFeed({
      onInsert: (newPost) => {
        if (newPost.community_id === community?.id || newPost.community?.slug === community?.slug) {
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      },
      onUpdate: (updated) => {
        setPosts((prev) =>
          prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
        );
      },
      onDelete: (deletedId) => {
        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
      },
    });
    return unsub;
  }, [community?.id, community?.slug]);

  // 4. Load Members
  const loadMembers = useCallback(async () => {
    if (!community?.id || isPrivateRestricted) return;
    setMembersLoading(true);
    try {
      const list = await communityClient.listCommunityMembers(community.id, {
        role: memberRoleFilter,
        search: memberSearch,
      });
      setMembers(list);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [community?.id, memberRoleFilter, memberSearch, isPrivateRestricted]);

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab, loadMembers]);

  // 5. Load Join Requests (if Manager/Admin)
  const loadJoinRequests = useCallback(async () => {
    if (!community?.id || !canManage) return;
    setRequestsLoading(true);
    try {
      const reqs = await communityClient.listJoinRequests(community.id);
      setJoinRequests(reqs);
    } catch (err) {
      console.error('Failed to load join requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [community?.id, canManage]);

  useEffect(() => {
    if (activeTab === 'settings' && canManage) {
      loadJoinRequests();
    }
  }, [activeTab, canManage, loadJoinRequests]);

  // Handle Join / Leave
  const handleJoinOrLeave = async () => {
    if (!currentUserId) {
      alert('Please sign in to join communities.');
      return;
    }
    if (!community) return;

    setIsJoining(true);
    try {
      if (myMembership) {
        if (community.is_system) {
          alert('Default system communities are fundamental to CLIMB 1600 and cannot be left.');
          return;
        }
        if (myMembership.role === 'owner') {
          alert('As the Owner, you must transfer ownership or delete the community before leaving.');
          return;
        }
        if (!confirm(`Are you sure you want to leave ${community.name}?`)) return;

        await communityClient.leaveCommunity(community.id);
        setMyMembership(null);
        setCommunity((prev) =>
          prev ? { ...prev, members_count: Math.max(0, prev.members_count - 1), isMember: false } : null
        );
      } else {
        const res = await communityClient.joinCommunity(community.id);
        if (res.request) {
          setPendingRequest(true);
          alert('Your request to join has been submitted for review by community moderators!');
        } else {
          setMyMembership(res.membership);
          setCommunity((prev) =>
            prev ? { ...prev, members_count: prev.members_count + 1, isMember: true } : null
          );
        }
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Member Role Update
  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (!community) return;
    try {
      await communityClient.updateMemberRole(community.id, targetUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  // Handle Kick Member
  const handleKickMember = async (targetUserId: string, displayName: string) => {
    if (!community) return;
    if (!confirm(`Are you sure you want to remove ${displayName} from ${community.name}?`)) return;
    try {
      await communityClient.removeMember(community.id, targetUserId);
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
      setCommunity((prev) =>
        prev ? { ...prev, members_count: Math.max(0, prev.members_count - 1) } : null
      );
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  // Handle Ban / Unban
  const handleBanToggle = async (targetUserId: string, currentStatus: string, displayName: string) => {
    if (!community) return;
    const action = currentStatus === 'banned' ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} ${displayName}?`)) return;

    try {
      await communityClient.banMember(community.id, targetUserId, action);
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === targetUserId ? { ...m, status: action === 'ban' ? 'banned' : 'active' } : m
        )
      );
    } catch (err: any) {
      alert(err.message || `Failed to ${action} member`);
    }
  };

  // Handle Join Request Review
  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!community) return;
    try {
      await communityClient.reviewJoinRequest(community.id, requestId, action);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (action === 'approve') {
        setCommunity((prev) =>
          prev ? { ...prev, members_count: prev.members_count + 1 } : null
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to review request');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setIsSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const updated = await communityClient.updateCommunity(community.id, {
        name: settingsForm.name,
        description: settingsForm.description,
        category: settingsForm.category,
        tags: settingsForm.tags,
        avatarUrl: settingsForm.avatarUrl || null,
        coverUrl: settingsForm.coverUrl || null,
        visibility: settingsForm.visibility,
        joinApproval: settingsForm.joinApproval,
        postingPermission: settingsForm.postingPermission,
        rules: settingsForm.rules || null,
      });
      setCommunity(updated);
      setSettingsSuccess('Community settings saved successfully!');
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Transfer Ownership
  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !transferTargetId) return;
    const targetMember = members.find((m) => m.user_id === transferTargetId);
    const targetName = targetMember?.profile.display_name || 'selected member';

    if (
      !confirm(
        `DANGER: Are you absolutely sure you want to transfer ownership of ${community.name} to ${targetName}? You will be demoted to Admin and cannot undo this action.`
      )
    ) {
      return;
    }

    setIsTransferring(true);
    try {
      await communityClient.transferOwnership(community.id, transferTargetId);
      setMyMembership((prev) => (prev ? { ...prev, role: 'admin' } : null));
      setTransferTargetId('');
      alert(`Ownership of ${community.name} has been transferred to ${targetName}.`);
      loadCommunity();
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle Upload Cover via Cloudflare R2
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !community) return;
    setUploadingCover(true);
    try {
      const res = await r2StorageClient.uploadFile(file, 'covers');
      setSettingsForm((prev) => ({ ...prev, coverUrl: res.publicUrl }));
      const updated = await communityClient.updateCommunity(community.id, { coverUrl: res.publicUrl });
      setCommunity(updated);
    } catch (err: any) {
      alert(err.message || 'Cover upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle Upload Avatar via Cloudflare R2
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !community) return;
    setUploadingAvatar(true);
    try {
      const res = await r2StorageClient.uploadFile(file, 'avatars');
      setSettingsForm((prev) => ({ ...prev, avatarUrl: res.publicUrl }));
      const updated = await communityClient.updateCommunity(community.id, { avatarUrl: res.publicUrl });
      setCommunity(updated);
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Loading community...</p>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Community Not Found
        </h2>
        <p className="text-sm text-slate-500">
          {error || 'This community does not exist or may have been deleted.'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500"
        >
          Return to Communities
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back button & top navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Communities</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Link Copied!' : 'Share Community'}</span>
        </button>
      </div>

      {/* Hero Banner & Community Profile Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-indigo-900 via-indigo-700 to-sky-600 overflow-hidden">
          {community.cover_url ? (
            <img
              src={community.cover_url}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}

          {canManage && (
            <div className="absolute top-4 right-4">
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
              >
                {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Change Cover</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Card Overlay */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar & Community Info */}
            <div className="flex items-end gap-4 min-w-0">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-slate-900 bg-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-xl overflow-hidden">
                  {community.avatar_url ? (
                    <img
                      src={community.avatar_url}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{community.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                {canManage && (
                  <>
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={uploadingAvatar}
                      title="Update Avatar"
                      className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    >
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 truncate">
                    {community.name}
                  </h1>
                  {community.is_system && (
                    <span
                      title="Official System Community"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold"
                    >
                      <ShieldCheck className="w-3 h-3 text-indigo-500" />
                      <span>Official</span>
                    </span>
                  )}
                  {community.visibility === 'private' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Private</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      <span>Public</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-500">c/{community.slug}</p>
              </div>
            </div>

            {/* Action Buttons: Join, Leave, Create Post */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {!isPrivateRestricted && (
                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </button>
              )}

              {community.join_approval === 'request_required' && pendingRequest ? (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Request Pending</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isJoining}
                  onClick={handleJoinOrLeave}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    myMembership
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 dark:border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {isJoining ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : myMembership ? (
                    myMembership.role === 'owner' ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Owner</span>
                      </span>
                    ) : (
                      <span>Leave</span>
                    )
                  ) : (
                    <span>{community.join_approval === 'request_required' ? 'Request to Join' : 'Join Community'}</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bio & Stats Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
            <p className="text-slate-700 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
              {community.description || 'Welcome to this competitive programming community!'}
            </p>

            <div className="flex items-center gap-6 shrink-0 font-medium">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {community.members_count}
                </span>
                <span>members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {community.posts_count}
                </span>
                <span>posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussions ({community.posts_count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>About & Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({community.members_count})</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all cursor-pointer ml-auto ${
                activeTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin & Settings</span>
              {joinRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Restricted Private Community Notice */}
      {isPrivateRestricted && (
        <div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            This Community is Private
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Only approved members can access posts, discussion threads, and member lists in this community.
          </p>
          {pendingRequest ? (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Your join request is currently under review by community moderators.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleJoinOrLeave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Request to Join Community
            </button>
          )}
        </div>
      )}

      {/* TAB 1: Discussions (Feed) */}
      {!isPrivateRestricted && activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Composer Trigger Card */}
            <div
              onClick={() => setShowComposer(true)}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3 cursor-pointer hover:border-indigo-500/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                +
              </div>
              <div className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                Post an algorithm insight, question, or editorial in {community.name}...
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'latest', label: 'Latest', icon: <Sparkles className="w-3 h-3" /> },
                { id: 'popular', label: 'Trending', icon: <Flame className="w-3 h-3" /> },
                { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-3 h-3" /> },
                { id: 'milestones', label: 'Milestones', icon: <Trophy className="w-3 h-3" /> },
                { id: 'videos', label: 'Videos', icon: <Video className="w-3 h-3" /> },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFeedFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    feedFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.icon}
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Posts Stream */}
            {postsLoading ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Loading discussions...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center space-y-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  No Discussions Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Be the first coder to start a discussion or share a problem solution in this community!
                </p>
                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onOpenDirectMessage={onOpenDirectMessage}
                    onOpenWorkspaceWithCode={onOpenWorkspaceWithCode}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Info Widget */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>About Community</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {community.description || 'Dedicated to competitive programming and algorithmic mastery.'}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Created
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(community.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Total Members
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {community.members_count}
                  </span>
                </div>
              </div>

              {community.rules && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                    Community Rules
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line line-clamp-6">
                    {community.rules}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: About & Rules */}
      {!isPrivateRestricted && activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Community Guidelines & Purpose</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {community.description || 'No description provided.'}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 text-slate-500">
                <span>Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {community.category}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-500">
                <span>Join Approval</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {community.join_approval.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-500">
                <span>Posting Permission</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {community.posting_permission.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Code of Conduct & Rules</span>
            </h3>
            {community.rules ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {community.rules}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Standard CLIMB 1600 community guidelines apply: Be constructive, respect fellow problem solvers, preserve academic integrity during live contests, and tag spoilers appropriately.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Members Roster */}
      {!isPrivateRestricted && activeTab === 'members' && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Community Members ({community.members_count})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Coders and problem solvers participating in this community.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
                <option value="member">Members</option>
              </select>
            </div>
          </div>

          {membersLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500">Loading roster...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No members match the current search filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {members.map((mem) => {
                const isTargetOwner = mem.role === 'owner';
                const isTargetAdmin = mem.role === 'admin';
                const canModifyThisMember =
                  canManage &&
                  mem.user_id !== currentUserId &&
                  !isTargetOwner &&
                  (!isTargetAdmin || isOwner);

                return (
                  <div
                    key={mem.id}
                    className="py-3 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 overflow-hidden shrink-0">
                        {mem.profile.avatar_url ? (
                          <img
                            src={mem.profile.avatar_url}
                            alt={mem.profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{mem.profile.display_name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {mem.profile.display_name}
                          </span>

                          {mem.role === 'owner' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>Owner</span>
                            </span>
                          )}
                          {mem.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                              <ShieldCheck className="w-3 h-3 text-indigo-500" />
                              <span>Admin</span>
                            </span>
                          )}
                          {mem.role === 'moderator' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[10px]">
                              <span>Mod</span>
                            </span>
                          )}

                          {mem.status === 'banned' && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold text-[10px]">
                              Banned
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          {mem.profile.username && <span>@{mem.profile.username}</span>}
                          {mem.cfAccount?.cf_handle && (
                            <span className="text-indigo-500 font-bold">
                              CF: {mem.cfAccount.cf_handle} ({mem.cfAccount.cf_rating || 0})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Controls (Promote, Demote, Kick, Ban) */}
                    <div className="flex items-center gap-2">
                      {onOpenDirectMessage && mem.user_id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => onOpenDirectMessage(mem.user_id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Message
                        </button>
                      )}

                      {canModifyThisMember && (
                        <>
                          <select
                            value={mem.role}
                            onChange={(e) =>
                              handleRoleChange(mem.user_id, e.target.value as any)
                            }
                            className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            {isOwner && <option value="admin">Admin</option>}
                            <option value="moderator">Moderator</option>
                            <option value="member">Member</option>
                          </select>

                          <button
                            type="button"
                            title="Remove / Kick Member"
                            onClick={() =>
                              handleKickMember(mem.user_id, mem.profile.display_name)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title={mem.status === 'banned' ? 'Unban Member' : 'Ban Member'}
                            onClick={() =>
                              handleBanToggle(
                                mem.user_id,
                                mem.status,
                                mem.profile.display_name
                              )
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              mem.status === 'banned'
                                ? 'text-emerald-500 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {mem.status === 'banned' ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Admin & Settings (Owners and Admins Only) */}
      {canManage && activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Join Requests Section */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <span>Pending Join Requests ({joinRequests.length})</span>
            </h3>

            {requestsLoading ? (
              <div className="py-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : joinRequests.length === 0 ? (
              <p className="text-xs text-slate-500">
                No pending join requests waiting for review.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                        {req.profile.avatar_url ? (
                          <img
                            src={req.profile.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{req.profile.display_name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {req.profile.display_name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {req.cfAccount?.cf_handle && `CF: ${req.cfAccount.cf_handle}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReviewRequest(req.id, 'approve')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewRequest(req.id, 'reject')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-700 dark:text-slate-300 hover:text-rose-600 font-bold text-xs cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Community Edit Settings Form */}
          <form
            onSubmit={handleSaveSettings}
            className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
          >
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              <span>Community Configuration</span>
            </h3>

            {settingsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                {settingsSuccess}
              </div>
            )}
            {settingsError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
                {settingsError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Community Name
              </label>
              <input
                type="text"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Description
              </label>
              <textarea
                rows={3}
                value={settingsForm.description}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, description: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Category
                </label>
                <select
                  value={settingsForm.category}
                  onChange={(e) => setSettingsForm({ ...settingsForm, category: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="algorithms">Algorithms</option>
                  <option value="general">General</option>
                  <option value="help">Doubt Solving</option>
                  <option value="contests">Contest Prep</option>
                  <option value="math">Math & Combinatorics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Visibility
                </label>
                <select
                  value={settingsForm.visibility}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, visibility: e.target.value as any })
                  }
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Join Approval
                </label>
                <select
                  value={settingsForm.joinApproval}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, joinApproval: e.target.value as any })
                  }
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="open">Open for Anyone</option>
                  <option value="request_required">Requires Approval</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Posting Permissions
              </label>
              <select
                value={settingsForm.postingPermission}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, postingPermission: e.target.value as any })
                }
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="all_members">All Active Members</option>
                <option value="moderators_only">Moderators & Admins Only</option>
                <option value="admins_only">Admins Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Community Rules
              </label>
              <textarea
                rows={4}
                value={settingsForm.rules}
                onChange={(e) => setSettingsForm({ ...settingsForm, rules: e.target.value })}
                placeholder="1. Keep discussions relevant to algorithms&#10;2. Format all code blocks&#10;3. Never share live contest solutions"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Settings</span>
              </button>
            </div>
          </form>

          {/* Transfer Ownership & Danger Zone (Owner Only) */}
          {isOwner && !community.is_system && (
            <div className="p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 space-y-4">
              <h3 className="font-black text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Crown className="w-4 h-4 text-rose-500" />
                <span>Transfer Ownership</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Transfer full ownership of this community to another member. You will automatically retain an Admin role.
              </p>

              <form onSubmit={handleTransferOwnership} className="flex items-center gap-3">
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs"
                >
                  <option value="">Select a member...</option>
                  {members
                    .filter((m) => m.user_id !== currentUserId && m.status === 'active')
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile.display_name} (@{m.profile.username || 'user'}) - {m.role}
                      </option>
                    ))}
                </select>

                <button
                  type="submit"
                  disabled={!transferTargetId || isTransferring}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Post Composer Modal */}
      {showComposer && (
        <PostComposerModal
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          onPostCreated={() => {
            setShowComposer(false);
            loadFeed();
          }}
          communities={[community]}
          initialCommunitySlug={community.slug}
        />
      )}
    </div>
  );
};
