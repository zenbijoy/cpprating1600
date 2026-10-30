import { SupabaseClient } from '@supabase/supabase-js';
import { inAppChannel } from './inAppChannel';
import { webPushChannel } from './webPushChannel';
import { androidPushChannel } from './androidPushChannel';
import { emailChannel } from './emailChannel';
import {
  AppNotification,
  DeliveryChannel,
  NotificationCategory,
  NotificationPriority,
} from '../types';

export interface DispatchNotificationRequest {
  userId: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  data?: Record<string, any>;
  channels: DeliveryChannel[];
}

export interface DispatchNotificationResult {
  notificationId?: string;
  channelsDelivered: DeliveryChannel[];
  channelsFailed: DeliveryChannel[];
  channelErrors: Record<string, string>;
}

export class ChannelDispatcher {
  async dispatch(
    supabase: SupabaseClient,
    request: DispatchNotificationRequest
  ): Promise<DispatchNotificationResult> {
    const result: DispatchNotificationResult = {
      channelsDelivered: [],
      channelsFailed: [],
      channelErrors: {},
    };

    let createdNotificationId: string | undefined;

    // 1. In-App Delivery
    if (request.channels.includes('in_app')) {
      const inAppRes = await inAppChannel.deliver(supabase, {
        user_id: request.userId,
        type: request.type,
        category: request.category,
        priority: request.priority,
        title: request.title,
        body: request.body,
        action_url: request.actionUrl,
        data: request.data || {},
      });

      if (inAppRes.success && inAppRes.notificationId) {
        createdNotificationId = inAppRes.notificationId;
        result.notificationId = inAppRes.notificationId;
        result.channelsDelivered.push('in_app');
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'in_app', 'delivered');
      } else {
        result.channelsFailed.push('in_app');
        result.channelErrors['in_app'] = inAppRes.error || 'Failed to insert in-app notification';
        await this.logDelivery(supabase, null, request.userId, 'in_app', 'failed', null, inAppRes.error);
      }
    }

    // 2. Web Push Delivery
    if (request.channels.includes('web_push')) {
      const webRes = await webPushChannel.deliverToUser(supabase, request.userId, {
        title: request.title,
        body: request.body,
        actionUrl: request.actionUrl,
        data: request.data,
      });

      if (webRes.sentCount > 0) {
        result.channelsDelivered.push('web_push');
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'web_push', 'delivered', { sentCount: webRes.sentCount });
      } else if (webRes.failedCount > 0) {
        result.channelsFailed.push('web_push');
        result.channelErrors['web_push'] = webRes.errors.join('; ');
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'web_push', 'failed', null, webRes.errors.join('; '));
      } else {
        // No active endpoints registered
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'web_push', 'skipped', null, 'No active web push subscriptions found');
      }
    }

    // 3. Android Push Delivery
    if (request.channels.includes('android_push')) {
      const androidDeepLink = request.actionUrl
        ? `climb1600://${request.actionUrl.replace(/^\//, '')}`
        : 'climb1600://dashboard';

      const androidRes = await androidPushChannel.deliverToUser(supabase, request.userId, {
        title: request.title,
        body: request.body,
        deepLink: androidDeepLink,
        category: request.category,
        data: {
          type: request.type,
          notificationId: createdNotificationId || '',
        },
      });

      if (androidRes.sentCount > 0) {
        result.channelsDelivered.push('android_push');
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'android_push', 'delivered', { sentCount: androidRes.sentCount });
      } else if (androidRes.failedCount > 0) {
        result.channelsFailed.push('android_push');
        result.channelErrors['android_push'] = androidRes.errors.join('; ');
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'android_push', 'failed', null, androidRes.errors.join('; '));
      } else {
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'android_push', 'skipped', null, 'No active Android device tokens registered');
      }
    }

    // 4. Email Delivery
    if (request.channels.includes('email')) {
      const emailRes = await emailChannel.deliver(supabase, request.userId, {
        title: request.title,
        body: request.body,
        actionUrl: request.actionUrl,
      });

      if (emailRes.sent) {
        result.channelsDelivered.push('email');
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'email', 'delivered');
      } else {
        const status = emailRes.skippedReason ? 'skipped' : 'failed';
        if (status === 'failed') {
          result.channelsFailed.push('email');
          result.channelErrors['email'] = emailRes.error || 'Email delivery failed';
        }
        await this.logDelivery(supabase, createdNotificationId, request.userId, 'email', status, null, emailRes.error || emailRes.skippedReason);
      }
    }

    return result;
  }

  private async logDelivery(
    supabase: SupabaseClient,
    notificationId: string | null | undefined,
    userId: string,
    channel: DeliveryChannel,
    status: 'delivered' | 'failed' | 'skipped' | 'expired',
    providerResponse?: Record<string, any> | null,
    errorMessage?: string | null
  ) {
    try {
      await supabase.from('notification_delivery_logs').insert({
        notification_id: notificationId || null,
        user_id: userId,
        channel,
        status,
        provider_response: providerResponse || null,
        error_message: errorMessage || null,
      });
    } catch (err) {
      console.error('[DeliveryLog] Failed to log delivery attempt:', err);
    }
  }
}

export const channelDispatcher = new ChannelDispatcher();
