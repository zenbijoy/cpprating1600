import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, getSupabaseAdmin } from './authServer';

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  codeSnippet: z.string().max(30000).optional().nullable(),
  replyToMessageId: z.string().uuid().optional().nullable(),
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

export const chatServer = {
  // List all 1-to-1 conversations for current user
  async listConversations(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const sb = getSupabaseAdmin();

    try {
      // Find all conversations where user is participant1 or participant2
      const { data: convs, error } = await sb
        .from('conversations')
        .select(`
          id, participant1_id, participant2_id, last_message_text,
          last_message_at, last_message_sender_id, created_at, updated_at
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (!convs || convs.length === 0) {
        return res.json({ status: 'OK', conversations: [] });
      }

      // Identify other participant IDs
      const otherUserIds = convs.map((c) =>
        c.participant1_id === user.id ? c.participant2_id : c.participant1_id
      );

      // Fetch profiles of other participants
      const { data: profiles } = await sb
        .from('profiles')
        .select('id, display_name, username, avatar_url, last_seen_at, privacy_settings')
        .in('id', otherUserIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Fetch participant settings (muted, last_read_at)
      const convIds = convs.map((c) => c.id);
      const { data: participantData } = await sb
        .from('conversation_participants')
        .select('conversation_id, last_read_at, is_muted')
        .eq('user_id', user.id)
        .in('conversation_id', convIds);
      const partMap = new Map((participantData || []).map((p) => [p.conversation_id, p]));

      // Fetch unread count per conversation
      const enriched = await Promise.all(
        convs.map(async (c) => {
          const otherUserId = c.participant1_id === user.id ? c.participant2_id : c.participant1_id;
          const otherProfile = profileMap.get(otherUserId) || {
            id: otherUserId,
            display_name: 'User',
            username: null,
            avatar_url: null,
            last_seen_at: null,
          };

          const pInfo = partMap.get(c.id);
          const lastRead = pInfo?.last_read_at || '1970-01-01T00:00:00Z';

          // Count messages sent by other user after lastRead
          const { count: unreadCount } = await sb
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .gt('created_at', lastRead);

          return {
            id: c.id,
            otherUser: otherProfile,
            lastMessage: {
              text: c.last_message_text,
              timestamp: c.last_message_at,
              senderId: c.last_message_sender_id,
            },
            isMuted: pInfo?.is_muted || false,
            unreadCount: unreadCount || 0,
            updatedAt: c.updated_at,
          };
        })
      );

      return res.json({ status: 'OK', conversations: enriched });
    } catch (err: any) {
      console.error('[ChatServer] listConversations error:', err);
      return res.status(500).json({ error: 'ConversationsError', message: err.message });
    }
  },

  // Get or create 1-to-1 conversation with another user
  async getOrCreateConversation(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId } = req.body;
    if (!targetUserId || targetUserId === user.id) {
      return res.status(400).json({ error: 'BadRequest', message: 'Valid target user ID required.' });
    }

    const sb = getSupabaseAdmin();

    try {
      // Check if target user has blocked current user or vice versa
      const { data: block } = await sb
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId})`)
        .maybeSingle();

      if (block) {
        return res.status(403).json({ error: 'Blocked', message: 'Unable to start conversation due to privacy/blocking settings.' });
      }

      // Check existing conversation (either ordering)
      const { data: existing } = await sb
        .from('conversations')
        .select('*')
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${targetUserId}),and(participant1_id.eq.${targetUserId},participant2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) {
        // Fetch target profile
        const { data: targetProfile } = await sb
          .from('profiles')
          .select('id, display_name, username, avatar_url, last_seen_at')
          .eq('id', targetUserId)
          .maybeSingle();

        return res.json({
          status: 'OK',
          conversation: {
            id: existing.id,
            otherUser: targetProfile,
            lastMessage: {
              text: existing.last_message_text,
              timestamp: existing.last_message_at,
              senderId: existing.last_message_sender_id,
            },
            isNew: false,
          },
        });
      }

      // Order UUIDs deterministically to respect unique constraint
      const p1 = user.id < targetUserId ? user.id : targetUserId;
      const p2 = user.id < targetUserId ? targetUserId : user.id;

      const { data: newConv, error: createErr } = await sb
        .from('conversations')
        .insert({
          participant1_id: p1,
          participant2_id: p2,
          last_message_text: null,
          last_message_at: null,
        })
        .select()
        .single();

      if (createErr || !newConv) throw createErr || new Error('Failed to create conversation');

      // Create participant records
      await sb.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: targetUserId },
      ]);

      const { data: targetProfile } = await sb
        .from('profiles')
        .select('id, display_name, username, avatar_url, last_seen_at')
        .eq('id', targetUserId)
        .maybeSingle();

      return res.status(201).json({
        status: 'OK',
        conversation: {
          id: newConv.id,
          otherUser: targetProfile,
          lastMessage: null,
          isNew: true,
        },
      });
    } catch (err: any) {
      console.error('[ChatServer] getOrCreateConversation error:', err);
      return res.status(500).json({ error: 'CreateConvError', message: err.message });
    }
  },

  // Get message history for conversation
  async getMessages(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: conversationId } = req.params;
    const { cursor, limit = '40' } = req.query;
    const pageSize = Math.min(Math.max(parseInt(limit as string, 10) || 40, 1), 100);
    const sb = getSupabaseAdmin();

    try {
      // Verify user is a participant
      const { data: conv, error: convErr } = await sb
        .from('conversations')
        .select('id, participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (convErr || !conv || (conv.participant1_id !== user.id && conv.participant2_id !== user.id)) {
        return res.status(403).json({ error: 'Forbidden', message: 'You are not a participant in this conversation.' });
      }

      let query = sb
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (cursor && typeof cursor === 'string') {
        query = query.lt('created_at', cursor);
      }

      query = query.limit(pageSize + 1);

      const { data: rawMessages, error: msgErr } = await query;
      if (msgErr) throw msgErr;

      const hasNext = (rawMessages || []).length > pageSize;
      const msgs = (rawMessages || []).slice(0, pageSize);
      // Return in chronological order for display
      msgs.reverse();

      const nextCursor = hasNext && msgs.length > 0 ? msgs[0].created_at : null;

      // Update user's last_read_at
      sb.from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .then();

      return res.json({
        status: 'OK',
        messages: msgs,
        nextCursor,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'MessagesError', message: err.message });
    }
  },

  // Send message
  async sendMessage(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'ValidationFailed', details: parsed.error.issues });
    }

    const sb = getSupabaseAdmin();
    const { conversationId, content, codeSnippet, replyToMessageId, attachments } = parsed.data;

    try {
      // 1. Verify user is participant
      const { data: conv } = await sb
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (!conv || (conv.participant1_id !== user.id && conv.participant2_id !== user.id)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Not a conversation participant.' });
      }

      const recipientId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;

      // 2. Check blocks
      const { data: block } = await sb
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId})`)
        .maybeSingle();

      if (block) {
        return res.status(403).json({ error: 'Blocked', message: 'Cannot send message to this user.' });
      }

      // 3. Insert message
      const { data: msg, error: insertErr } = await sb
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          code_snippet: codeSnippet || null,
          reply_to_message_id: replyToMessageId || null,
          attachments: attachments || [],
          status: 'sent',
        })
        .select()
        .single();

      if (insertErr || !msg) throw insertErr || new Error('Failed to insert message');

      // 4. Update conversation's last message snippet and timestamp
      const snippet = content.length > 80 ? content.slice(0, 80) + '...' : content;
      await sb
        .from('conversations')
        .update({
          last_message_text: snippet,
          last_message_at: msg.created_at,
          last_message_sender_id: user.id,
          updated_at: msg.created_at,
        })
        .eq('id', conversationId);

      // 5. Update sender's last_read_at
      await sb
        .from('conversation_participants')
        .update({ last_read_at: msg.created_at })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return res.status(201).json({ status: 'OK', message: msg });
    } catch (err: any) {
      console.error('[ChatServer] sendMessage error:', err);
      return res.status(500).json({ error: 'SendMessageError', message: err.message });
    }
  },

  // Mark conversation as read
  async markAsRead(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: conversationId } = req.params;
    const sb = getSupabaseAdmin();

    try {
      await sb
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return res.json({ status: 'OK' });
    } catch (err: any) {
      return res.status(500).json({ error: 'MarkReadError', message: err.message });
    }
  },

  // Block/unblock user
  async toggleBlockUser(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId } = req.body;
    const sb = getSupabaseAdmin();

    try {
      const { data: existing } = await sb
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle();

      if (existing) {
        await sb.from('user_blocks').delete().eq('id', existing.id);
        return res.json({ status: 'OK', isBlocked: false, message: 'User unblocked' });
      } else {
        await sb.from('user_blocks').insert({ blocker_id: user.id, blocked_id: targetUserId });
        return res.json({ status: 'OK', isBlocked: true, message: 'User blocked' });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'BlockUserError', message: err.message });
    }
  },
};
