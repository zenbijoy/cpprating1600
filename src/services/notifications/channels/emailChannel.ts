import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailPayload {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class EmailChannel {
  private isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER));
  }

  async deliver(
    supabase: SupabaseClient,
    userId: string,
    payload: { title: string; body: string; actionUrl?: string }
  ): Promise<{ sent: boolean; skippedReason?: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        sent: false,
        skippedReason: 'Email provider is not configured in environment (RESEND_API_KEY or SMTP credentials missing).',
      };
    }

    // If configured, fetch user's email
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', userId)
        .maybeSingle();

      if (!profile || !profile.email) {
        return { sent: false, error: 'User does not have a confirmed email address.' };
      }

      // If Resend is configured:
      if (process.env.RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'CLIMB 1600 <notifications@climb1600.app>',
            to: profile.email,
            subject: payload.title,
            text: `${payload.body}\n\nView details: ${process.env.APP_URL || 'http://localhost:3000'}${payload.actionUrl || ''}`,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          return { sent: false, error: `Resend error: ${err}` };
        }

        return { sent: true };
      }

      return { sent: false, skippedReason: 'SMTP delivery not fully initialized.' };
    } catch (err: any) {
      return { sent: false, error: err.message };
    }
  }
}

export const emailChannel = new EmailChannel();
