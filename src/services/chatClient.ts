import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  code_snippet?: string | null;
  reply_to_message_id?: string | null;
  status: 'sent' | 'delivered' | 'read' | 'edited' | 'deleted';
  is_edited: boolean;
  attachments?: Array<{
    fileType: 'image' | 'video' | 'pdf' | 'code' | 'document';
    fileName: string;
    fileSize: number;
    mimeType: string;
    r2Key: string;
    url: string;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    display_name: string;
    username?: string | null;
    avatar_url?: string | null;
    last_seen_at?: string | null;
  };
  lastMessage?: {
    text: string | null;
    timestamp: string | null;
    senderId: string | null;
  } | null;
  isMuted: boolean;
  unreadCount: number;
  updatedAt: string;
}

export class ChatClient {
  private activeChannels = new Map<string, RealtimeChannel>();
  private presenceChannel: RealtimeChannel | null = null;
  private onlineUsers = new Set<string>();

  async getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async listConversations(): Promise<Conversation[]> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/chat/conversations', { headers });
    if (!res.ok) throw new Error('Failed to load conversations');
    const data = await res.json();
    return data.conversations || [];
  }

  async getOrCreateConversation(targetUserId: string): Promise<Conversation> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create conversation' }));
      throw new Error(err.message || 'Creation failed');
    }
    const data = await res.json();
    return data.conversation;
  }

  async getMessages(conversationId: string, cursor?: string): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
    const headers = await this.getAuthHeaders();
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const res = await fetch(`/api/chat/conversations/${conversationId}/messages${query}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  }

  async sendMessage(payload: {
    conversationId: string;
    content: string;
    codeSnippet?: string | null;
    replyToMessageId?: string | null;
    attachments?: any[];
  }): Promise<ChatMessage> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to send message' }));
      throw new Error(err.message || 'Send failed');
    }
    const data = await res.json();
    return data.message;
  }

  async markAsRead(conversationId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await fetch(`/api/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      headers,
    });
  }

  async toggleBlockUser(targetUserId: string): Promise<{ isBlocked: boolean }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/chat/block', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) throw new Error('Failed to block/unblock user');
    return res.json();
  }

  /**
   * Subscribe to live messages and typing broadcast on a conversation channel
   */
  subscribeToConversation(
    conversationId: string,
    onNewMessage: (msg: ChatMessage) => void,
    onTyping?: (event: { userId: string; isTyping: boolean }) => void
  ): () => void {
    const channelName = `conversation:${conversationId}`;

    if (this.activeChannels.has(channelName)) {
      this.activeChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            onNewMessage(payload.new as ChatMessage);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (onTyping && payload) {
          onTyping(payload as { userId: string; isTyping: boolean });
        }
      })
      .subscribe();

    this.activeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.activeChannels.delete(channelName);
    };
  }

  /**
   * Broadcast ephemeral typing indicator to the conversation channel
   */
  sendTypingIndicator(conversationId: string, currentUserId: string, isTyping: boolean) {
    const channelName = `conversation:${conversationId}`;
    let channel = this.activeChannels.get(channelName);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping },
      });
    }
  }

  /**
   * Track global online presence
   */
  startPresence(currentUserId: string, onPresenceChange?: (onlineIds: string[]) => void): () => void {
    if (this.presenceChannel) {
      this.presenceChannel.unsubscribe();
    }

    const channel = supabase.channel('online_presence', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = Object.keys(state);
        this.onlineUsers = new Set(activeIds);
        if (onPresenceChange) onPresenceChange(activeIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.presenceChannel = channel;

    return () => {
      channel.unsubscribe();
      this.presenceChannel = null;
    };
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}

export const chatClient = new ChatClient();
