import { supabase } from './supabase';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class WebPushService {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  getPermissionState(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      console.error('[WebPushService] Service worker registration failed:', err);
      return null;
    }
  }

  async getVapidPublicKey(): Promise<string | null> {
    try {
      const res = await fetch('/api/notifications/web-push/public-key');
      if (!res.ok) return null;
      const data = await res.json();
      return data.publicKey;
    } catch (err) {
      console.error('[WebPushService] Failed to fetch VAPID key:', err);
      return null;
    }
  }

  async subscribeUser(): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Push is not supported by your browser.' };
    }

    if (Notification.permission === 'denied') {
      return { success: false, error: 'Notification permission is blocked in your browser settings.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was not granted.' };
    }

    const registration = await this.registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'Could not initialize service worker.' };
    }

    const vapidKey = await this.getVapidPublicKey();
    if (!vapidKey) {
      return { success: false, error: 'Server VAPID public key unavailable.' };
    }

    try {
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Must be authenticated to register push notifications.' };
      }

      const rawSub = subscription.toJSON();
      const payload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: rawSub.keys?.p256dh,
          auth: rawSub.keys?.auth,
        },
      };

      const res = await fetch('/api/notifications/web-push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Failed to save subscription on server.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[WebPushService] Subscription failed:', err);
      return { success: false, error: err.message || 'Push subscription error' };
    }
  }
}

export const webPushService = new WebPushService();
