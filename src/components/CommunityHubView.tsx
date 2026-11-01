import React, { useState, useEffect } from 'react';
import {
  CommunityIcon as Users,
  AddIcon as Plus,
  SearchIcon as Search,
  ShieldIcon as ShieldCheck,
  LockIcon as Lock,
  LanguageIcon as Globe,
  ForwardIcon as ArrowRight,
  CheckCircleIcon as CheckCircle2,
  LoadingStatusIcon as Loader2,
} from './icons';
import { Community, communityClient, CreateCommunityPayload } from '../services/communityClient';
import { CommunityDetailView } from './CommunityDetailView';
import { AnimeViewCompanionBanner } from './common/AnimeViewCompanionBanner';

interface CommunityHubViewProps {
  currentUserId?: string;
  onSelectCommunityFeed?: (communitySlug: string) => void;
  onOpenDirectMessage?: (userId: string) => void;
  onOpenWorkspaceWithCode?: (code: string, problemNameOrId?: string) => void;
  initialSelectedCommunitySlug?: string;
}

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({
  currentUserId,
  onSelectCommunityFeed,
  onOpenDirectMessage,
  onOpenWorkspaceWithCode,
  initialSelectedCommunitySlug,
}) => {
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(
    initialSelectedCommunitySlug || null
  );
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterMode, setFilterMode] = useState<'all' | 'joined'>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isJoiningId, setIsJoiningId] = useState<string | null>(null);

  // Community creation form state
  const [newCommunity, setNewCommunity] = useState<CreateCommunityPayload>({
    name: '',
    slug: '',
    description: '',
    category: 'algorithms',
    tags: ['codeforces', 'algorithms'],
    visibility: 'public',
    joinApproval: 'open',
    postingPermission: 'all_members',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const list = await communityClient.listCommunities({
        category: selectedCategory,
        search: searchQuery,
        filter: filterMode,
      });
      setCommunities(list);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory, searchQuery, filterMode]);

  const handleJoin = async (comm: Community) => {
    if (!currentUserId) {
      alert('Please sign in to join communities.');
      return;
    }

    setIsJoiningId(comm.id);
    try {
      if (comm.isMember) {
        if (comm.is_system) {
          alert('Default system communities are fundamental to CLIMB 1600 and cannot be left.');
          return;
        }
        await communityClient.leaveCommunity(comm.id);
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === comm.id
              ? { ...c, isMember: false, members_count: Math.max(0, c.members_count - 1) }
              : c
          )
        );
      } else {
        await communityClient.joinCommunity(comm.id);
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === comm.id
              ? { ...c, isMember: true, members_count: c.members_count + 1 }
              : c
          )
        );
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setIsJoiningId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunity.name.trim() || !newCommunity.slug.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await communityClient.createCommunity(newCommunity);
      setCommunities((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewCommunity({
        name: '',
        slug: '',
        description: '',
        category: 'algorithms',
        tags: ['codeforces'],
        visibility: 'public',
        joinApproval: 'open',
        postingPermission: 'all_members',
      });
      alert(`Community '${created.name}' created successfully! You are now the Owner.`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create community');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAutoSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setNewCommunity((prev) => ({ ...prev, name, slug }));
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'general', label: 'General & News' },
    { id: 'algorithms', label: 'Algorithms & Data Structures' },
    { id: 'help', label: 'Help & Doubt Solving' },
    { id: 'contests', label: 'Contest Preparation' },
    { id: 'math', label: 'Number Theory & Combinatorics' },
  ];

  const defaultCommunities = communities.filter((c) => c.is_system);
  const otherCommunities = communities.filter((c) => !c.is_system);

  if (selectedCommunitySlug) {
    return (
      <CommunityDetailView
        communitySlug={selectedCommunitySlug}
        currentUserId={currentUserId}
        onBack={() => {
          setSelectedCommunitySlug(null);
          fetchCommunities();
        }}
        onOpenDirectMessage={onOpenDirectMessage}
        onOpenWorkspaceWithCode={onOpenWorkspaceWithCode}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Anime Guildmaster Companion Banner */}
      <AnimeViewCompanionBanner
        screenTitle="Adventurer Guilds &amp; Study Circles"
        subtitle="Form study parties, discuss post-contest upsolving strategies, trade algorithmic spells, and tackle difficult Codeforces problems with friends!"
        badgeText="Coding Guilds"
        badgeIcon="🏰"
        stickerType="climb_champ"
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Communities Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Programming Communities & Circles
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              Connect with fellow coders, share contest strategies, ask doubt questions, and build targeted topic study circles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Community</span>
          </button>
        </div>
      </div>

      {/* Mandatory Three System Communities Showcase */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Official System Communities (Default Membership)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {defaultCommunities.map((comm) => (
            <div
              key={comm.id}
              className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/40 via-white to-transparent dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20 uppercase tracking-wider">
                    ★ Official
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {comm.members_count} members
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {comm.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {comm.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Enrolled
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedCommunitySlug(comm.slug)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>Enter Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* Community Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : otherCommunities.length === 0 ? (
        <div className="p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No user-created communities found matching this filter.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Create the First Community
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherCommunities.map((comm) => (
            <div
              key={comm.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {comm.visibility === 'public' ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className="capitalize">{comm.visibility}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {comm.members_count} members
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {comm.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {comm.description || 'A community for competitive programmers.'}
                </p>

                {comm.tags && comm.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {comm.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  disabled={isJoiningId === comm.id}
                  onClick={() => handleJoin(comm)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    comm.isMember
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {isJoiningId === comm.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : comm.isMember ? (
                    comm.myRole === 'owner' ? 'Owner' : 'Leave'
                  ) : (
                    'Join'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCommunitySlug(comm.slug)}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  <span>Enter Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Create New Community
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  Community Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Programming Study Circle"
                  value={newCommunity.name}
                  onChange={(e) => handleAutoSlug(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  URL Slug (c/{newCommunity.slug || 'slug'})
                </label>
                <input
                  type="text"
                  placeholder="dp-study-circle"
                  value={newCommunity.slug}
                  onChange={(e) =>
                    setNewCommunity({ ...newCommunity, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
                  }
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is the purpose of this community? Who is it for?"
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    Category
                  </label>
                  <select
                    value={newCommunity.category}
                    onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="algorithms">Algorithms</option>
                    <option value="general">General</option>
                    <option value="help">Doubt Solving</option>
                    <option value="contests">Contest Prep</option>
                    <option value="math">Math & Combinatorics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    Visibility
                  </label>
                  <select
                    value={newCommunity.visibility}
                    onChange={(e) => setNewCommunity({ ...newCommunity, visibility: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="public">Public (Open for anyone)</option>
                    <option value="private">Private (Restricted members only)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Community</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
