import { supabase } from './supabase';
import { AppNotification, NotificationCategory, UserNotificationPreferences } from './notifications/types';

export interface NotificationInboxResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NotificationClient {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async getNotifications(options: {
    page?: number;
    limit?: number;
    category?: NotificationCategory | 'all';
    unreadOnly?: boolean;
  } = {}): Promise<NotificationInboxResponse> {
    const token = await this.getAuthToken();
    if (!token) {
      return { notifications: [], total: 0, unreadCount: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.category && options.category !== 'all') params.set('category', options.category);
    if (options.unreadOnly) params.set('unreadOnly', 'true');

    const res = await fetch(`/api/notifications?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to load notifications: ${res.statusText}`);
    }

    return await res.json();
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }

  async markAllAsRead(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }

  async dismissNotification(notificationId: string): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }

  async dismissAll(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    const res = await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }

  async getPreferences(): Promise<UserNotificationPreferences | null> {
    const token = await this.getAuthToken();
    if (!token) return null;

    const res = await fetch('/api/notifications/preferences', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.preferences;
  }

  async updatePreferences(updates: Partial<UserNotificationPreferences>): Promise<UserNotificationPreferences | null> {
    const token = await this.getAuthToken();
    if (!token) return null;

    const res = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update preferences');
    }
    const json = await res.json();
    return json.preferences;
  }

  async sendTestNotification(): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Authentication required for test notification');

    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Test notification failed');
    }
    return await res.json();
  }
}

export const notificationClient = new NotificationClient();
