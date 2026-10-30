import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Safe environment variable resolution with fallback
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://ptwrscbantaseijldwgt.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface UserCfAccount {
  id: string;
  user_id: string;
  cf_handle: string;
  normalized_handle: string;
  verification_status: 'unverified' | 'pending_verification' | 'verified';
  verified_at?: string | null;
  cf_rating?: number | null;
  cf_max_rating?: number | null;
  cf_rank?: string | null;
  cf_max_rank?: string | null;
  cf_avatar?: string | null;
  cf_solved_count?: number | null;
  synced_data?: any;
  last_synced_at?: string | null;
}

export interface AuthMeResponse {
  status: 'OK';
  user: {
    id: string;
    email: string;
  };
  profile: any | null;
  cfAccount: UserCfAccount | null;
}

export const authService = {
  // Google OAuth sign-in with redirect to the current URL origin
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    try {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  },

  // Email and password sign up
  async signUpWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
          },
        },
      });
      return {
        user: data.user,
        session: data.session,
        error: error ? new Error(error.message) : null,
      };
    } catch (err: any) {
      return { user: null, session: null, error: err };
    }
  },

  // Email and password sign in
  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return {
        user: data.user,
        session: data.session,
        error: error ? new Error(error.message) : null,
      };
    } catch (err: any) {
      return { user: null, session: null, error: err };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  },

  // Get current access token
  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  },

  // Helper to build authorization headers
  async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Fetch application profile & linked Codeforces account
  async getMyProfile(): Promise<AuthMeResponse> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/auth/me', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch user profile.');
    }
    return await res.json();
  },

  // Update profile
  async updateProfile(updates: Record<string, any>): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update profile.');
    }
    return await res.json();
  },

  // Migrate guest data to cloud account
  async migrateGuestData(payload: {
    attempts?: any[];
    mistakes?: any[];
    goal?: any;
  }): Promise<{ success: boolean; importedAttempts: number; importedMistakes: number; message: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/auth/guest-migrate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to migrate guest practice data.');
    }
    return await res.json();
  },

  // Codeforces Verification: Initiate
  async initiateCfVerification(handle: string): Promise<{
    challengeId: string;
    challengeCode: string;
    expiresAt: string;
    targetFields: string[];
    handle: string;
    instructions: string;
  }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/codeforces/verify/initiate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ handle }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 'FAILED') {
      if (res.status === 401) {
        throw new Error(data.message || 'You must be signed in to verify Codeforces account ownership. Please sign in or continue in guest mode.');
      }
      throw new Error(data.message || data.error || 'Failed to initiate verification challenge.');
    }
    return data;
  },

  // Codeforces Verification: Confirm
  async confirmCfVerification(challengeId: string): Promise<{
    verified: boolean;
    handle: string;
    rating?: number;
    rank?: string;
    avatar?: string;
    message: string;
  }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/codeforces/verify/confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify({ challengeId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 'FAILED') {
      if (res.status === 401) {
        throw new Error(data.message || 'Authentication session expired. Please sign in again.');
      }
      throw new Error(data.message || data.error || 'Verification check failed.');
    }
    return data;
  },

  // Codeforces Account: Unlink
  async unlinkCfAccount(): Promise<{ success: boolean; message: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/codeforces/unlink', {
      method: 'POST',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 'FAILED') {
      if (res.status === 401) {
        throw new Error(data.message || 'Authentication session expired. Please sign in again.');
      }
      throw new Error(data.message || data.error || 'Failed to unlink Codeforces account.');
    }
    return data;
  },

  // Codeforces Account: Sync Data
  async syncCfData(): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/codeforces/sync', {
      method: 'POST',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 'FAILED') {
      if (res.status === 401) {
        throw new Error(data.message || 'Authentication session expired. Please sign in again.');
      }
      throw new Error(data.message || data.error || 'Failed to synchronize Codeforces data.');
    }
    return data;
  },
};
