import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CF_HANDLE_REGEX, validateHandle } from '../utils/codeforcesValidation.ts';
import type { HandleValidationResult } from '../utils/codeforcesValidation.ts';

export { CF_HANDLE_REGEX, validateHandle };
export type { HandleValidationResult };

export function generateChallengeCode(): string {
  // Generate 8-character hex token: e.g. "CLIMB-A8F3C91D"
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CLIMB-${randomHex}`;
}

export interface CFProfileData {
  handle: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  city?: string;
  country?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
}

export function matchesChallengeInProfile(profile: CFProfileData, challengeCode: string): {
  matched: boolean;
  fieldMatched?: string;
  details: Record<string, string>;
} {
  const codeNormalized = challengeCode.trim().toUpperCase();
  const fieldsToCheck: Record<string, string | undefined> = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    organization: profile.organization,
    city: profile.city,
  };

  const details: Record<string, string> = {};
  for (const [key, val] of Object.entries(fieldsToCheck)) {
    details[key] = val || '(empty)';
    if (val && typeof val === 'string') {
      const normalizedVal = val.toUpperCase();
      if (normalizedVal.includes(codeNormalized)) {
        return { matched: true, fieldMatched: key, details };
      }
    }
  }

  return { matched: false, details };
}

export function deduplicateSolvedProblems(submissions: any[]): {
  solvedCount: number;
  solvedProblemIds: string[];
  totalSubmissions: number;
} {
  const solvedSet = new Set<string>();
  if (!Array.isArray(submissions)) {
    return { solvedCount: 0, solvedProblemIds: [], totalSubmissions: 0 };
  }

  for (const sub of submissions) {
    if (sub.verdict === 'OK' && sub.problem) {
      const contestId = sub.problem.contestId ?? sub.contestId ?? '';
      const index = sub.problem.index ?? '';
      if (index) {
        const problemKey = `${contestId}${index}`.toUpperCase();
        solvedSet.add(problemKey);
      }
    }
  }

  return {
    solvedCount: solvedSet.size,
    solvedProblemIds: Array.from(solvedSet),
    totalSubmissions: submissions.length,
  };
}

export class CodeforcesVerificationService {
  private supabase: SupabaseClient | null = null;
  private syncCooldownMap = new Map<string, number>();

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      this.supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  getSupabase(): SupabaseClient {
    if (!this.supabase) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase service role configuration is missing.');
      }
      this.supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return this.supabase;
  }

  // 1. Initiate ownership challenge
  async initiateVerification(userId: string, rawHandle: string): Promise<{
    challengeId: string;
    challengeCode: string;
    expiresAt: string;
    targetFields: string[];
    handle: string;
    instructions: string;
  }> {
    const validation = validateHandle(rawHandle);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const sb = this.getSupabase();

    // Verify handle existence via official Codeforces API
    let cfProfile: CFProfileData;
    try {
      const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(validation.original)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.status !== 'OK' || !data.result?.[0]) {
        throw new Error(data.comment || `Codeforces handle "${validation.original}" does not exist.`);
      }
      cfProfile = data.result[0];
    } catch (err: any) {
      throw new Error(err.message || 'Could not verify handle with Codeforces API.');
    }

    // Check if handle is already linked & verified by ANOTHER user
    const { data: existingVerified, error: searchErr } = await sb
      .from('user_cf_accounts')
      .select('id, user_id, cf_handle, verification_status')
      .eq('normalized_handle', validation.normalized)
      .eq('verification_status', 'verified')
      .maybeSingle();

    if (searchErr) {
      console.error('[CF Verification] DB search error:', searchErr);
    }

    if (existingVerified && existingVerified.user_id !== userId) {
      throw new Error(`The Codeforces handle "${cfProfile.handle}" is already claimed and verified by another CLIMB 1600 user.`);
    }

    // Expire any existing pending challenges for this user and handle
    await sb
      .from('cf_verification_challenges')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('normalized_handle', validation.normalized)
      .eq('status', 'pending');

    const challengeCode = generateChallengeCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    // Insert new cryptographic challenge
    const { data: challenge, error: insertErr } = await sb
      .from('cf_verification_challenges')
      .insert({
        user_id: userId,
        cf_handle: cfProfile.handle,
        normalized_handle: validation.normalized,
        challenge_code: challengeCode,
        target_field: 'firstName_lastName_or_organization',
        status: 'pending',
        attempt_count: 0,
        max_attempts: 5,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertErr || !challenge) {
      console.error('[CF Verification] Insert challenge error:', insertErr);
      throw new Error('Failed to create verification challenge.');
    }

    // Upsert user_cf_accounts row as pending_verification
    await sb
      .from('user_cf_accounts')
      .upsert({
        user_id: userId,
        cf_handle: cfProfile.handle,
        normalized_handle: validation.normalized,
        verification_status: 'pending_verification',
        cf_rating: cfProfile.rating ?? null,
        cf_max_rating: cfProfile.maxRating ?? null,
        cf_rank: cfProfile.rank ?? null,
        cf_avatar: cfProfile.avatar ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return {
      challengeId: challenge.id,
      challengeCode,
      expiresAt,
      targetFields: ['First Name', 'Last Name', 'Organization'],
      handle: cfProfile.handle,
      instructions: `1. Open https://codeforces.com/settings/social in your browser.\n2. Temporarily set your First Name, Last Name, or Organization to "${challengeCode}".\n3. Click "Save changes" on Codeforces.\n4. Return here and click "Verify Ownership Now".\n5. Once verified, you may restore your original profile details.`,
    };
  }

  // 2. Confirm ownership challenge
  async confirmVerification(userId: string, challengeId: string): Promise<{
    verified: boolean;
    handle: string;
    rating?: number;
    rank?: string;
    avatar?: string;
    message: string;
  }> {
    const sb = this.getSupabase();

    // Fetch challenge
    const { data: challenge, error: challengeErr } = await sb
      .from('cf_verification_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (challengeErr || !challenge) {
      throw new Error('Verification challenge not found.');
    }

    if (challenge.status !== 'pending') {
      throw new Error(`This challenge is no longer active (status: ${challenge.status}). Please generate a new code.`);
    }

    if (new Date() > new Date(challenge.expires_at)) {
      await sb.from('cf_verification_challenges').update({ status: 'expired' }).eq('id', challengeId);
      throw new Error('This verification challenge has expired. Please initiate a new verification code.');
    }

    if (challenge.attempt_count >= challenge.max_attempts) {
      await sb.from('cf_verification_challenges').update({ status: 'failed' }).eq('id', challengeId);
      throw new Error('Maximum verification attempts exceeded. Please initiate a new challenge.');
    }

    // Increment attempt count
    await sb
      .from('cf_verification_challenges')
      .update({ attempt_count: challenge.attempt_count + 1 })
      .eq('id', challengeId);

    // Fetch live Codeforces profile directly without cache
    let cfProfile: CFProfileData;
    try {
      const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(challenge.cf_handle)}&_t=${Date.now()}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.status !== 'OK' || !data.result?.[0]) {
        throw new Error(data.comment || 'Codeforces profile lookup failed during verification.');
      }
      cfProfile = data.result[0];
    } catch (err: any) {
      throw new Error(`Could not query Codeforces API: ${err.message}`);
    }

    // Check if challenge code is present in profile
    const matchResult = matchesChallengeInProfile(cfProfile, challenge.challenge_code);

    if (!matchResult.matched) {
      const attemptsLeft = challenge.max_attempts - (challenge.attempt_count + 1);
      throw new Error(
        `Verification code "${challenge.challenge_code}" was not found in profile for "${challenge.cf_handle}". Current values: First Name: "${matchResult.details.firstName}", Last Name: "${matchResult.details.lastName}", Organization: "${matchResult.details.organization}". Please update your Codeforces profile at https://codeforces.com/settings/social, save, and try again. (${attemptsLeft} attempts remaining).`
      );
    }

    // MATCHED! Atomically consume challenge
    const nowIso = new Date().toISOString();
    await sb
      .from('cf_verification_challenges')
      .update({
        status: 'consumed',
        verified_at: nowIso,
      })
      .eq('id', challengeId);

    // Mark user_cf_accounts as verified
    await sb
      .from('user_cf_accounts')
      .update({
        verification_status: 'verified',
        verified_at: nowIso,
        cf_rating: cfProfile.rating ?? null,
        cf_max_rating: cfProfile.maxRating ?? null,
        cf_rank: cfProfile.rank ?? null,
        cf_max_rank: cfProfile.maxRank ?? null,
        cf_avatar: cfProfile.avatar ?? null,
        last_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq('user_id', userId);

    return {
      verified: true,
      handle: challenge.cf_handle,
      rating: cfProfile.rating,
      rank: cfProfile.rank,
      avatar: cfProfile.avatar,
      message: `Ownership successfully verified! Codeforces handle "${challenge.cf_handle}" is now linked to your account.`,
    };
  }

  // 3. Unlink Codeforces handle
  async unlinkHandle(userId: string): Promise<{ success: boolean; message: string }> {
    const sb = this.getSupabase();

    // Expire challenges
    await sb
      .from('cf_verification_challenges')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Remove or reset user_cf_accounts record
    const { error } = await sb
      .from('user_cf_accounts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[CF Unlink] Delete error:', error);
      throw new Error('Failed to unlink Codeforces account.');
    }

    return {
      success: true,
      message: 'Codeforces account successfully unlinked. Your practice history and mistakes remain preserved.',
    };
  }

  // 4. Synchronize Codeforces public data
  async syncCodeforcesData(userId: string, isManual = false): Promise<{
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    solvedCount: number;
    ratingHistory: any[];
    recentSubmissions: any[];
    lastSyncedAt: string;
  }> {
    const sb = this.getSupabase();

    // Fetch user's verified account
    const { data: account, error: accErr } = await sb
      .from('user_cf_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (accErr || !account) {
      throw new Error('No linked Codeforces account found for this user.');
    }

    if (account.verification_status !== 'verified') {
      throw new Error('Cannot synchronize unverified Codeforces account. Please verify ownership first.');
    }

    // Rate-limiting for manual sync: 2-minute cooldown
    if (isManual) {
      const lastManual = this.syncCooldownMap.get(userId) || 0;
      const cooldownMs = 2 * 60 * 1000;
      if (Date.now() - lastManual < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - (Date.now() - lastManual)) / 1000);
        throw new Error(`Sync is in cooldown. Please wait ${remainingSec} seconds before refreshing again.`);
      }
      this.syncCooldownMap.set(userId, Date.now());
    }

    const handle = account.cf_handle;

    // Fetch user.info, user.rating, user.status in parallel with timeouts
    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return await res.json();
      } catch (e) {
        clearTimeout(timeout);
        throw e;
      }
    };

    let userInfoRes: any;
    let userRatingRes: any;
    let userStatusRes: any;

    try {
      [userInfoRes, userRatingRes, userStatusRes] = await Promise.all([
        fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`),
        fetchWithTimeout(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`),
        fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=200`),
      ]);
    } catch (err: any) {
      throw new Error(`Failed to reach Codeforces API during sync: ${err.message}`);
    }

    if (userInfoRes.status !== 'OK' || !userInfoRes.result?.[0]) {
      throw new Error('Could not refresh user info from Codeforces.');
    }

    const cfUser = userInfoRes.result[0];
    const ratingHistory = userRatingRes.status === 'OK' ? userRatingRes.result : [];
    const submissions = userStatusRes.status === 'OK' ? userStatusRes.result : [];

    const { solvedCount, solvedProblemIds } = deduplicateSolvedProblems(submissions);
    const nowIso = new Date().toISOString();

    const syncedData = {
      ratingHistory,
      recentSubmissions: submissions.slice(0, 100),
      solvedProblemIds,
      syncedAt: nowIso,
    };

    // Update database
    await sb
      .from('user_cf_accounts')
      .update({
        cf_rating: cfUser.rating ?? null,
        cf_max_rating: cfUser.maxRating ?? null,
        cf_rank: cfUser.rank ?? null,
        cf_max_rank: cfUser.maxRank ?? null,
        cf_avatar: cfUser.avatar ?? null,
        cf_solved_count: solvedCount,
        synced_data: syncedData,
        last_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq('user_id', userId);

    return {
      handle,
      rating: cfUser.rating,
      maxRating: cfUser.maxRating,
      rank: cfUser.rank,
      solvedCount,
      ratingHistory,
      recentSubmissions: submissions.slice(0, 50),
      lastSyncedAt: nowIso,
    };
  }
}

export const cfVerificationService = new CodeforcesVerificationService();
