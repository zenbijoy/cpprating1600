import express, { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, verifyAuth, getSupabaseAdmin } from '../authServer';
import { jobProcessor } from './jobProcessor';
import { getVapidPublicKey, webPushChannel } from './channels/webPushChannel';
import { channelDispatcher } from './channels/channelDispatcher';
import { cfActivityTracker } from './cfActivityTracker';
import { practiceReminderScheduler } from './practiceReminderScheduler';

export const notificationRouter = express.Router();

// Helper to get supabase client
function getSb() {
  return getSupabaseAdmin();
}

// ----------------------------------------------------------------------------
// 1. In-App Notifications Inbox
// ----------------------------------------------------------------------------

// GET /api/notifications (paginated inbox with unread count and category filters)
notificationRouter.get('/', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
  const offset = (page - 1) * limit;
  const category = req.query.category ? String(req.query.category) : undefined;
  const unreadOnly = req.query.unreadOnly === 'true';

  try {
    let query = sb
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, count, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get exact unread count
    const { count: unreadCount } = await sb
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .eq('archived', false);

    return res.json({
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/:id/read (mark single notification as read)
notificationRouter.post('/:id/read', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  const id = req.params.id;

  try {
    const { data, error } = await sb
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ status: 'OK', notification: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/read-all (mark all user notifications as read)
notificationRouter.post('/read-all', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  try {
    const { error } = await sb
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: 'OK', message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id (archive/dismiss a notification)
notificationRouter.delete('/:id', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  const id = req.params.id;

  try {
    const { error } = await sb
      .from('notifications')
      .update({ archived: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: 'OK', message: 'Notification dismissed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications (archive all notifications)
notificationRouter.delete('/', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  try {
    const { error } = await sb
      .from('notifications')
      .update({ archived: true })
      .eq('user_id', user.id)
      .eq('archived', false);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: 'OK', message: 'All notifications dismissed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. Preferences Management
// ----------------------------------------------------------------------------

const PreferencesUpdateSchema = z.object({
  in_app_enabled: z.boolean().optional(),
  web_push_enabled: z.boolean().optional(),
  mobile_push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quiet_hours_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  timezone: z.string().min(1).optional(),
  categories_enabled: z.record(z.string(), z.boolean()).optional(),
  preferred_practice_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  contest_advance_minutes: z.array(z.number().positive()).optional(),
  daily_digest_enabled: z.boolean().optional(),
  weekly_digest_enabled: z.boolean().optional(),
});

// GET /api/notifications/preferences
notificationRouter.get('/preferences', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  try {
    const prefs = await jobProcessor.getUserPreferences(sb, user.id);
    return res.json({ status: 'OK', preferences: prefs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/preferences
notificationRouter.put('/preferences', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parseResult = PreferencesUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid preferences payload',
      details: parseResult.error.issues,
    });
  }

  const updates = {
    ...parseResult.data,
    updated_at: new Date().toISOString(),
  };

  const sb = getSb();
  try {
    const { data, error } = await sb
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: 'OK', preferences: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. Web Push & Device Registration
// ----------------------------------------------------------------------------

// GET /api/notifications/web-push/public-key
notificationRouter.get('/web-push/public-key', (_req: Request, res: Response) => {
  const key = getVapidPublicKey();
  return res.json({ publicKey: key });
});

// POST /api/notifications/web-push/subscribe
const WebPushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

notificationRouter.post('/web-push/subscribe', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = WebPushSubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid Web Push subscription payload' });
  }

  const sb = getSb();
  try {
    const { data, error } = await sb
      .from('user_web_push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        user_agent: parsed.data.userAgent || req.headers['user-agent'] || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,endpoint' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Ensure web_push_enabled is true in preferences
    await sb
      .from('user_notification_preferences')
      .update({ web_push_enabled: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return res.json({ status: 'OK', subscriptionId: data.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/devices/register (Android/Mobile token registration)
const DeviceRegisterSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
  deviceName: z.string().optional(),
});

notificationRouter.post('/devices/register', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = DeviceRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid device registration payload' });
  }

  const sb = getSb();
  try {
    const { data, error } = await sb
      .from('user_device_tokens')
      .upsert({
        user_id: user.id,
        token: parsed.data.token,
        platform: parsed.data.platform,
        device_name: parsed.data.deviceName || null,
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'user_id,token' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: 'OK', deviceId: data.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/devices/:token
notificationRouter.delete('/devices/:token', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  try {
    await sb
      .from('user_device_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('token', req.params.token);

    return res.json({ status: 'OK', message: 'Device token deactivated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. Test Notification Action
// ----------------------------------------------------------------------------

notificationRouter.post('/test', verifyAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const sb = getSb();
  try {
    const prefs = await jobProcessor.getUserPreferences(sb, user.id);
    const channels: any[] = ['in_app'];
    if (prefs.web_push_enabled) channels.push('web_push');
    if (prefs.mobile_push_enabled) channels.push('android_push');
    if (prefs.email_enabled) channels.push('email');

    const result = await channelDispatcher.dispatch(sb, {
      userId: user.id,
      type: 'system.announcement',
      category: 'system',
      priority: 'high',
      title: 'CLIMB 1600 Test Notification',
      body: 'Your notification channels are successfully connected and verified!',
      actionUrl: '/settings',
      channels,
      data: { isTest: true },
    });

    return res.json({
      status: 'OK',
      message: 'Test notification triggered successfully',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 5. Admin & Observability Routes (Protected)
// ----------------------------------------------------------------------------

function verifyAdminAuth(req: Request, res: Response, next: express.NextFunction) {
  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = req.headers['x-admin-key'] || req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ error: 'Forbidden: Admin authorization required' });
  }

  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : String(authHeader);

  if (adminSecret && token === adminSecret) {
    return next();
  }

  // Alternatively check if authenticated user has admin role
  const authUser = (req as AuthenticatedRequest).user;
  if (authUser?.app_metadata?.role === 'admin') {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden: Invalid admin credentials' });
}

// GET /api/admin/notifications/health
notificationRouter.get('/admin/health', verifyAdminAuth, async (_req: Request, res: Response) => {
  const sb = getSb();
  try {
    // 1. Queue depth by status
    const { data: queueCounts } = await sb
      .from('scheduled_notification_jobs')
      .select('status');

    const queueByStatus: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    (queueCounts || []).forEach((row) => {
      queueByStatus[row.status] = (queueByStatus[row.status] || 0) + 1;
    });

    // 2. Delivery counts by status
    const { data: deliveryLogs } = await sb
      .from('notification_delivery_logs')
      .select('status, channel');

    const deliveryByChannel: Record<string, { delivered: number; failed: number; skipped: number }> = {};
    (deliveryLogs || []).forEach((row) => {
      if (!deliveryByChannel[row.channel]) {
        deliveryByChannel[row.channel] = { delivered: 0, failed: 0, skipped: 0 };
      }
      if (row.status === 'delivered') deliveryByChannel[row.channel].delivered++;
      if (row.status === 'failed') deliveryByChannel[row.channel].failed++;
      if (row.status === 'skipped') deliveryByChannel[row.channel].skipped++;
    });

    // 3. Last CF Sync status
    const { data: syncHistory } = await sb
      .from('cf_sync_history')
      .select('cf_handle, last_sync_time, sync_status, error_details')
      .order('last_sync_time', { ascending: false })
      .limit(5);

    // 4. Inactive / expired tokens count
    const { count: inactiveDeviceTokens } = await sb
      .from('user_device_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', false);

    const { count: inactiveWebSubs } = await sb
      .from('user_web_push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', false);

    return res.json({
      status: 'OK',
      workerInstanceId: jobProcessor.getInstanceId(),
      timestamp: new Date().toISOString(),
      queueDepth: queueByStatus,
      deliveryStats: deliveryByChannel,
      recentSyncs: syncHistory || [],
      expiredTokens: {
        inactiveDeviceTokens: inactiveDeviceTokens || 0,
        inactiveWebPushSubscriptions: inactiveWebSubs || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/notifications/sync-cf-now
notificationRouter.post('/admin/sync-cf-now', verifyAdminAuth, async (_req: Request, res: Response) => {
  const sb = getSb();
  try {
    const result = await cfActivityTracker.runSyncCycle(sb);
    return res.json({ status: 'OK', result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/notifications/process-queue-now
notificationRouter.post('/admin/process-queue-now', verifyAdminAuth, async (_req: Request, res: Response) => {
  const sb = getSb();
  try {
    const result = await jobProcessor.runDueJobsBatch(sb, 25);
    return res.json({ status: 'OK', result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
