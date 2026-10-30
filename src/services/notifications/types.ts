export type NotificationCategory =
  | 'submission'
  | 'practice'
  | 'contest'
  | 'streak'
  | 'system'
  | 'guardian'
  | 'curriculum';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryChannel = 'in_app' | 'web_push' | 'android_push' | 'email';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  action_url?: string | null;
  data: Record<string, any>;
  read: boolean;
  read_at?: string | null;
  archived: boolean;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  in_app_enabled: boolean;
  web_push_enabled: boolean;
  mobile_push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:mm format e.g. "22:00"
  quiet_hours_end: string;   // HH:mm format e.g. "08:00"
  timezone: string;          // e.g. "UTC" or "America/New_York"
  categories_enabled: Record<NotificationCategory, boolean>;
  preferred_practice_time: string; // HH:mm format e.g. "20:00"
  contest_advance_minutes: number[]; // e.g. [1440, 60, 15]
  daily_digest_enabled: boolean;
  weekly_digest_enabled: boolean;
  updated_at: string;
}

export interface UserDeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  device_name?: string | null;
  is_active: boolean;
  last_used_at?: string | null;
  created_at: string;
}

export interface WebPushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledJob {
  id: string;
  user_id?: string | null;
  job_type: string;
  idempotency_key: string;
  scheduled_for: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  next_retry_at?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryLog {
  id?: string;
  notification_id?: string | null;
  user_id?: string | null;
  channel: DeliveryChannel;
  status: 'delivered' | 'failed' | 'skipped' | 'expired';
  provider_response?: Record<string, any> | null;
  error_message?: string | null;
  created_at?: string;
}

export interface CFSyncHistoryRecord {
  id: string;
  user_id: string;
  cf_handle: string;
  last_submission_id?: number | null;
  last_sync_time: string;
  sync_status: 'success' | 'rate_limited' | 'error';
  error_details?: string | null;
  is_initial_import: boolean;
  created_at: string;
  updated_at: string;
}
