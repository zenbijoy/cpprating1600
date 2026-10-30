import { SupabaseClient } from '@supabase/supabase-js';
import { AppNotification, DeliveryLog } from '../types';

export class InAppChannel {
  async deliver(
    supabase: SupabaseClient,
    notification: Omit<AppNotification, 'id' | 'created_at' | 'read' | 'archived'>
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          title: notification.title,
          body: notification.body,
          action_url: notification.action_url || null,
          data: notification.data || {},
          read: false,
          archived: false,
        })
        .select('id')
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Database insert failed' };
      }

      return { success: true, notificationId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown database error' };
    }
  }
}

export const inAppChannel = new InAppChannel();
