-- =========================================================================
-- CLIMB 1600 — COMPREHENSIVE COMMUNITY & SOCIAL LEARNING PLATFORM SCHEMA
-- Migration: 20261103_community_social_platform.sql
-- Description: Creates communities, memberships, posts, blogs, questions,
--              milestones, comments, reactions, bookmarks, direct messaging,
--              reporting, and default community auto-provisioning with strict RLS.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. EXTEND PROFILES WITH SOCIAL & PUBLIC FIELDS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='skills') THEN
        ALTER TABLE public.profiles ADD COLUMN skills TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='interests') THEN
        ALTER TABLE public.profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='privacy_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"show_online_status": true, "profile_visibility": "public"}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='notification_preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "in_app": true, "chat": true}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stats') THEN
        ALTER TABLE public.profiles ADD COLUMN stats JSONB DEFAULT '{"posts_count": 0, "answers_count": 0, "accepted_answers_count": 0, "solutions_count": 0}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_seen_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 2. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    cover_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    join_approval TEXT NOT NULL DEFAULT 'open' CHECK (join_approval IN ('open', 'request_required', 'invite_only')),
    posting_permission TEXT NOT NULL DEFAULT 'all_members' CHECK (posting_permission IN ('all_members', 'moderators_only', 'admins_only')),
    rules TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    members_count INTEGER NOT NULL DEFAULT 0,
    posts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities (slug);
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities (category);
CREATE INDEX IF NOT EXISTS idx_communities_is_default ON public.communities (is_default);

-- 3. SEED THE THREE MANDATORY SYSTEM COMMUNITIES
INSERT INTO public.communities (name, slug, description, category, tags, visibility, join_approval, posting_permission, is_system, is_default)
VALUES 
(
    'CLIMB 1600 Global',
    'climb-1600-global',
    'General discussions, introductions, platform updates, achievements, and announcements for competitive programmers.',
    'general',
    ARRAY['welcome', 'community', 'announcements'],
    'public',
    'open',
    'all_members',
    true,
    true
),
(
    'Competitive Programming',
    'competitive-programming',
    'Algorithm discussions, data structures, problem-solving techniques, contest preparation, code reviews, and solution sharing.',
    'algorithms',
    ARRAY['algorithms', 'data-structures', 'codeforces', 'contests'],
    'public',
    'open',
    'all_members',
    true,
    true
),
(
    'Help & Doubt Solving',
    'help-doubt-solving',
    'Ask programming questions, request debugging help, explain complex concepts, and share helpful learning resources.',
    'help',
    ARRAY['debugging', 'questions', 'doubt-solving', 'c++', 'python'],
    'public',
    'open',
    'all_members',
    true,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    is_default = EXCLUDED.is_default;

-- 4. COMMUNITY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_member UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_members_comm ON public.community_members (community_id);
CREATE INDEX IF NOT EXISTS idx_comm_members_user ON public.community_members (user_id);
CREATE INDEX IF NOT EXISTS idx_comm_members_role ON public.community_members (role);

-- 5. COMMUNITY JOIN REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.community_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_join_req UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_comm ON public.community_join_requests (community_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON public.community_join_requests (user_id);

-- 6. POSTS TABLE (Unifies General, Blog, Question, Help Request, Milestone, Solution, Video, Editorial)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL DEFAULT 'general' CHECK (content_type IN ('general', 'blog', 'question', 'help_request', 'milestone', 'solution', 'resource', 'video', 'editorial')),
    title TEXT,
    subtitle TEXT,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    problem_url TEXT,
    contest_id INTEGER,
    programming_language TEXT,
    code_snippet TEXT,
    cover_image_url TEXT,
    reading_time_minutes INTEGER DEFAULT 1,
    question_status TEXT CHECK (question_status IN ('open', 'unanswered', 'answered', 'accepted', 'resolved')),
    accepted_answer_id UUID,
    milestone_category TEXT,
    milestone_metric TEXT,
    milestone_date DATE,
    pinned BOOLEAN NOT NULL DEFAULT false,
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    shares_count INTEGER NOT NULL DEFAULT 0,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_posts_comm ON public.posts (community_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts (content_type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_q_status ON public.posts (question_status);

-- 7. POST ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'code', 'document')),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_attachments_post ON public.post_attachments (post_id);

-- 8. COMMENTS & REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    code_snippet TEXT,
    is_answer BOOLEAN NOT NULL DEFAULT false,
    is_accepted BOOLEAN NOT NULL DEFAULT false,
    likes_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments (author_id);

-- 9. REACTIONS TABLE (One active reaction per user per target: post or comment)
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'care', 'celebrate', 'insightful')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_reaction UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON public.reactions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions (user_id);

-- 10. BOOKMARKS TABLE (Saved posts)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_bookmark UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks (user_id);

-- 11. POST SHARES TABLE
CREATE TABLE IF NOT EXISTS public.post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    commentary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shares_post ON public.post_shares (post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON public.post_shares (user_id);

-- 12. CONVERSATIONS TABLE (1-to-1 direct messaging)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_sender_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_conversation_pair UNIQUE (participant1_id, participant2_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_p1 ON public.conversations (participant1_id);
CREATE INDEX IF NOT EXISTS idx_conv_p2 ON public.conversations (participant2_id);
CREATE INDEX IF NOT EXISTS idx_conv_last_msg ON public.conversations (last_message_at DESC);

-- 13. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    is_muted BOOLEAN NOT NULL DEFAULT false,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_conv_user UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_part_user ON public.conversation_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_conv ON public.conversation_participants (conversation_id);

-- 14. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    code_snippet TEXT,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'edited', 'deleted')),
    is_edited BOOLEAN NOT NULL DEFAULT false,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages (created_at ASC);

-- 15. USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_block UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.user_blocks (blocked_id);

-- 16. CONTENT REPORTS TABLE (Moderation)
CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'message', 'user', 'community')),
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    action_taken TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.content_reports (status);

-- 17. AUTOMATIC ONBOARDING MEMBERSHIP PROVISIONING FUNCTION & TRIGGER
CREATE OR REPLACE FUNCTION public.provision_default_community_memberships(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.community_members (community_id, user_id, role, status)
    SELECT c.id, target_user_id, 'member', 'active'
    FROM public.communities c
    WHERE c.is_default = true
    ON CONFLICT (community_id, user_id) DO NOTHING;

    -- Update member counts
    UPDATE public.communities c
    SET members_count = (
        SELECT COUNT(*) FROM public.community_members cm 
        WHERE cm.community_id = c.id AND cm.status = 'active'
    )
    WHERE c.is_default = true;
END;
$$;

-- Trigger to automatically assign default memberships upon profile creation
CREATE OR REPLACE FUNCTION public.trg_auto_join_default_communities()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM public.provision_default_community_memberships(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_join_default_communities ON public.profiles;
CREATE TRIGGER on_profile_created_join_default_communities
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_auto_join_default_communities();

-- Backfill any existing profiles into the default communities immediately
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM public.profiles LOOP
        PERFORM public.provision_default_community_memberships(u.id);
    END LOOP;
END $$;

-- 18. ENABLE REALTIME PUBLICATION FOR LIVE CHAT & NOTIFICATIONS
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
END $$;

-- 19. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Communities RLS
DROP POLICY IF EXISTS "Public communities are viewable by everyone" ON public.communities;
CREATE POLICY "Public communities are viewable by everyone"
    ON public.communities FOR SELECT
    USING (visibility = 'public' OR auth.uid() IN (
        SELECT user_id FROM public.community_members 
        WHERE community_id = id AND status = 'active'
    ));

DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities"
    ON public.communities FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Community owners and admins can update community" ON public.communities;
CREATE POLICY "Community owners and admins can update community"
    ON public.communities FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (
        SELECT user_id FROM public.community_members 
        WHERE community_id = id AND role IN ('owner', 'admin')
    ));

-- Community Members RLS
DROP POLICY IF EXISTS "Community members viewable for active communities" ON public.community_members;
CREATE POLICY "Community members viewable for active communities"
    ON public.community_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can join public open communities" ON public.community_members;
CREATE POLICY "Authenticated users can join public open communities"
    ON public.community_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave or admins update members" ON public.community_members;
CREATE POLICY "Users can leave or admins update members"
    ON public.community_members FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM public.community_members 
        WHERE community_id = community_members.community_id AND role IN ('owner', 'admin')
    ));

-- Posts RLS
DROP POLICY IF EXISTS "Posts viewable according to community visibility" ON public.posts;
CREATE POLICY "Posts viewable according to community visibility"
    ON public.posts FOR SELECT
    USING (
        status = 'published' AND (
            community_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.communities c
                WHERE c.id = community_id AND (
                    c.visibility = 'public' OR
                    EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = c.id AND cm.user_id = auth.uid() AND cm.status = 'active')
                )
            )
        )
    );

DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
CREATE POLICY "Members can create posts"
    ON public.posts FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND (
            community_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.community_members cm 
                WHERE cm.community_id = posts.community_id AND cm.user_id = auth.uid() AND cm.status = 'active'
            )
        )
    );

DROP POLICY IF EXISTS "Authors or community admins can update posts" ON public.posts;
CREATE POLICY "Authors or community admins can update posts"
    ON public.posts FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM public.community_members cm 
            WHERE cm.community_id = posts.community_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Authors or community admins can delete posts" ON public.posts;
CREATE POLICY "Authors or community admins can delete posts"
    ON public.posts FOR DELETE
    TO authenticated
    USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM public.community_members cm 
            WHERE cm.community_id = posts.community_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
        )
    );

-- Comments RLS
DROP POLICY IF EXISTS "Comments viewable by anyone who can view the post" ON public.comments;
CREATE POLICY "Comments viewable by anyone who can view the post"
    ON public.comments FOR SELECT
    USING (status != 'hidden');

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments;
CREATE POLICY "Authors can update own comments"
    ON public.comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own comments" ON public.comments;
CREATE POLICY "Authors can delete own comments"
    ON public.comments FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- Reactions RLS
DROP POLICY IF EXISTS "Reactions viewable by all" ON public.reactions;
CREATE POLICY "Reactions viewable by all"
    ON public.reactions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users manage own reactions" ON public.reactions;
CREATE POLICY "Users manage own reactions"
    ON public.reactions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Bookmarks RLS
DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage own bookmarks"
    ON public.bookmarks FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Conversations RLS
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Conversation Participants RLS
DROP POLICY IF EXISTS "Participants can view and update own participant row" ON public.conversation_participants;
CREATE POLICY "Participants can view and update own participant row"
    ON public.conversation_participants FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Messages RLS
DROP POLICY IF EXISTS "Participants can read messages in their conversation" ON public.messages;
CREATE POLICY "Participants can read messages in their conversation"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Senders can edit or delete own messages" ON public.messages;
CREATE POLICY "Senders can edit or delete own messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id);

-- Content Reports RLS
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.content_reports;
CREATE POLICY "Authenticated users can submit reports"
    ON public.content_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

-- User Blocks RLS
DROP POLICY IF EXISTS "Users can view and manage own blocks" ON public.user_blocks;
CREATE POLICY "Users can view and manage own blocks"
    ON public.user_blocks FOR ALL
    TO authenticated
    USING (auth.uid() = blocker_id)
    WITH CHECK (auth.uid() = blocker_id);
