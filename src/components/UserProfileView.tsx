import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfileIcon as UserIcon,
  EditIcon as Edit3,
  EditProfileIcon as Camera,
  CheckIcon as Check,
  ShieldIcon as Shield,
  TrophyIcon as Trophy,
  ChatIcon as MessageSquare,
  ProblemStatementIcon as BookOpen,
  CodingBracketsIcon as Code2,
  CalendarIcon as Calendar,
  LockIcon as Lock,
  LanguageIcon as Globe,
  LoadingStatusIcon as Loader2,
  SaveIcon as Save,
  ProblemTagsIcon as Tag,
} from './icons';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';
import { r2StorageClient } from '../services/r2StorageClient';
import { Community } from '../services/communityClient';

interface UserProfileViewProps {
  currentProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenDirectMessage?: (targetUserId: string) => void;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentProfile,
  onUpdateProfile,
  onOpenDirectMessage,
  isAuthenticated = false,
  onOpenAuthModal,
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // User posts and activity
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'questions' | 'blogs' | 'milestones' | 'communities'>('posts');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFullProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.profile) {
        setProfileData(data.profile);
        setDisplayName(data.profile.display_name || '');
        setUsername(data.profile.username || '');
        setBio(data.profile.bio || '');
        setSkills(data.profile.skills || ['C++', 'Algorithms']);
        setInterests(data.profile.interests || ['Codeforces', 'Competitive Programming']);
        setAvatarUrl(data.profile.avatar_url || null);
        setShowOnlineStatus(data.profile.privacy_settings?.show_online_status ?? true);

        // Fetch user posts and communities
        if (data.profile.id) {
          const publicRes = await fetch(`/api/users/${data.profile.id}`);
          const pData = await publicRes.json();
          if (pData.profile) {
            setUserPosts(pData.profile.recentPosts || []);
            setUserCommunities(pData.profile.communities || []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploadingAvatar(true);

    try {
      const result = await r2StorageClient.uploadFile(file, 'avatars');
      setAvatarUrl(result.publicUrl);

      // Auto save avatar
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: result.publicUrl }),
      });

      onUpdateProfile({ avatar: result.publicUrl });
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          username: username.trim() || null,
          bio,
          skills,
          interests,
          privacySettings: {
            show_online_status: showOnlineStatus,
            profile_visibility: 'public',
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to update profile' }));
        throw new Error(err.message || 'Update failed');
      }

      const updated = await res.json();
      setProfileData(updated.profile);
      setIsEditing(false);
      onUpdateProfile({ name: displayName });
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const s = newSkillInput.trim();
      if (s && !skills.includes(s)) {
        setSkills([...skills, s]);
        setNewSkillInput('');
      }
    }
  };

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const i = newInterestInput.trim();
      if (i && !interests.includes(i)) {
        setInterests([...interests, i]);
        setNewInterestInput('');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading profile...</div>;
  }

  const filteredPosts = userPosts.filter((p) => {
    if (activeTab === 'questions') return p.content_type === 'question' || p.content_type === 'help_request';
    if (activeTab === 'blogs') return p.content_type === 'blog';
    if (activeTab === 'milestones') return p.content_type === 'milestone';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {!isAuthenticated && onOpenAuthModal && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/30">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Currently in Guest / Local Profile Mode
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sign in with Google to sync your profile, avatars, skills, and community contributions across all your devices.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
          >
            Sign In with Google
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Avatar and Basic Details */}
          <div className="flex items-start gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-2xl overflow-hidden border-2 border-indigo-500/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (displayName || 'User').slice(0, 1).toUpperCase()
                )}
              </div>

              {/* Upload Overlay */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                title="Change Avatar (Cloudflare R2)"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {displayName || 'Competitive Programmer'}
                </h1>
                {username && (
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    @{username}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                {bio || 'Aspiring 1600+ Candidate Master. Passionate about dynamic programming and graphs.'}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(profileData?.created_at || Date.now()).toLocaleDateString()}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  Target: 1600 Rating
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Action */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer shrink-0 self-start"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Edit Account & Social Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Unique Username (@handle)
                </label>
                <input
                  type="text"
                  placeholder="e.g. tour_de_force"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief introduction, current goals, and CP achievements..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>

            {/* Skills & Interests Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Programming Languages & Skills
                </label>
                <div className="flex items-center gap-1 flex-wrap p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSkills(skills.filter((x) => x !== s))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="+ add skill"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    className="p-0.5 text-xs bg-transparent focus:outline-none w-20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Interests & Topics
                </label>
                <div className="flex items-center gap-1 flex-wrap p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  {interests.map((it) => (
                    <span
                      key={it}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                    >
                      {it}
                      <button
                        type="button"
                        onClick={() => setInterests(interests.filter((x) => x !== it))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="+ add topic"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={handleAddInterest}
                    className="p-0.5 text-xs bg-transparent focus:outline-none w-20"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Show Online Status
                </p>
                <p className="text-[11px] text-slate-500">
                  Allow other community members to see when you are active on the platform.
                </p>
              </div>
              <input
                type="checkbox"
                checked={showOnlineStatus}
                onChange={(e) => setShowOnlineStatus(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Skills and Interests Badges */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Skills:
            </span>
            {skills.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Topics:
            </span>
            {interests.map((it) => (
              <span
                key={it}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                #{it}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Activity Stream */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
          {[
            { id: 'posts', label: 'All Posts' },
            { id: 'questions', label: 'Questions & Answers' },
            { id: 'blogs', label: 'Blogs' },
            { id: 'milestones', label: 'Milestones' },
            { id: 'communities', label: 'Communities' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'communities' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userCommunities.map((comm) => (
              <div
                key={comm.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {comm.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">c/{comm.slug}</p>
                </div>
                {comm.is_system && (
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    Official
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
            No published items in this category yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    {p.content_type}
                  </span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {p.title || 'Untitled Post'}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>{p.likes_count || 0} reactions</span>
                  <span>·</span>
                  <span>{p.comments_count || 0} comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
