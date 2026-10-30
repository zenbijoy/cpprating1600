import webpush from 'web-push';
import { SupabaseClient } from '@supabase/supabase-js';

// Global VAPID key pair state
let vapidInitialized = false;
let currentVapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
let currentVapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@climb1600.app';

export function initializeVapid(): { publicKey: string } {
  if (!vapidInitialized) {
    if (!currentVapidPublicKey || !currentVapidPrivateKey) {
      // Auto-generate stable key pair for current server run if not explicitly in .env
      const keys = webpush.generateVAPIDKeys();
      currentVapidPublicKey = keys.publicKey;
      currentVapidPrivateKey = keys.privateKey;
    }

    try {
      webpush.setVapidDetails(
        vapidSubject,
        currentVapidPublicKey,
        currentVapidPrivateKey
      );
      vapidInitialized = true;
    } catch (err) {
      console.error('[WebPush] Error setting VAPID details:', err);
    }
  }

  return { publicKey: currentVapidPublicKey };
}

export function getVapidPublicKey(): string {
  if (!vapidInitialized) {
    initializeVapid();
  }
  return currentVapidPublicKey;
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export class WebPushChannel {
  constructor() {
    initializeVapid();
  }

  async deliverToUser(
    supabase: SupabaseClient,
    userId: string,
    payload: WebPushPayload
  ): Promise<{ sentCount: number; failedCount: number; errors: string[] }> {
    // 1. Fetch all active subscriptions for the user
    const { data: subs, error } = await supabase
      .from('user_web_push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !subs || subs.length === 0) {
      return { sentCount: 0, failedCount: 0, errors: [] };
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const stringifiedPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/dashboard_progress_ring.png',
      badge: payload.badge || '/dashboard_progress_ring.png',
      actionUrl: payload.actionUrl || '/',
      data: payload.data || {},
    });

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, stringifiedPayload, {
          TTL: 86400, // 24 hours
        });
        sentCount++;
      } catch (err: any) {
        failedCount++;
        const statusCode = err.statusCode;
        errors.push(`Endpoint error (${statusCode}): ${err.message}`);

        // If subscription is 404 or 410 (Gone), mark subscription as inactive
        if (statusCode === 404 || statusCode === 410) {
          console.warn(`[WebPush] Subscription expired or unsubscribed (${statusCode}). Deactivating endpoint:`, sub.endpoint);
          await supabase
            .from('user_web_push_subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', sub.id);
        }
      }
    }

    return { sentCount, failedCount, errors };
  }
}

export const webPushChannel = new WebPushChannel();
