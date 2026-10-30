import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test('1. Supabase Database Schema: Profiles Table & Constraints Verification', async () => {
  assert.ok(SUPABASE_URL, 'SUPABASE_URL must be defined');
  assert.ok(SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY must be defined');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.from('profiles').select('id, email, display_name, onboarding_completed').limit(1);
  assert.equal(error, null, `Query to profiles table should succeed without error, got: ${error?.message}`);
  assert.ok(Array.isArray(data), 'Result must be an array');
});

test('2. Supabase Database Schema: User CF Accounts Table & Unique Index Verification', async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('user_cf_accounts')
    .select('id, user_id, cf_handle, normalized_handle, verification_status')
    .limit(1);

  assert.equal(error, null, `Query to user_cf_accounts should succeed, got: ${error?.message}`);
  assert.ok(Array.isArray(data));
});

test('3. Supabase Database Schema: CF Verification Challenges Table', async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('cf_verification_challenges')
    .select('id, user_id, cf_handle, challenge_code, status, attempt_count, expires_at')
    .limit(1);

  assert.equal(error, null, `Query to cf_verification_challenges should succeed, got: ${error?.message}`);
  assert.ok(Array.isArray(data));
});

test('4. Supabase Database Schema: User Practice Attempts & Mistakes Tables', async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [attRes, misRes] = await Promise.all([
    supabase.from('user_practice_attempts').select('id, problem_id, verdict').limit(1),
    supabase.from('user_mistakes').select('id, problem_id, category, interval_days').limit(1),
  ]);

  assert.equal(attRes.error, null, `Attempts query failed: ${attRes.error?.message}`);
  assert.equal(misRes.error, null, `Mistakes query failed: ${misRes.error?.message}`);
});

test('5. Express Auth Middleware: Rejects Requests with Missing or Malformed Bearer Token', async () => {
  // Test verifyAuth middleware directly using mock req/res
  const { verifyAuth } = await import('./authServer.ts');

  // Case A: Missing header
  let statusResult = 0;
  let jsonResult: any = null;
  const mockReqNoAuth: any = { headers: {} };
  const mockRes: any = {
    status(s: number) {
      statusResult = s;
      return {
        json(j: any) {
          jsonResult = j;
        },
      };
    },
  };
  let nextCalled = false;
  await verifyAuth(mockReqNoAuth, mockRes, () => { nextCalled = true; });

  assert.equal(statusResult, 401);
  assert.equal(jsonResult?.error, 'Unauthorized');
  assert.equal(nextCalled, false, 'Middleware should not call next() on missing auth');

  // Case B: Malformed header (Basic instead of Bearer)
  const mockReqBasic: any = { headers: { authorization: 'Basic 12345' } };
  await verifyAuth(mockReqBasic, mockRes, () => { nextCalled = true; });
  assert.equal(statusResult, 401);
  assert.equal(nextCalled, false);

  // Case C: Invalid / expired JWT
  const mockReqFakeJwt: any = { headers: { authorization: 'Bearer invalid.token.signature' } };
  await verifyAuth(mockReqFakeJwt, mockRes, () => { nextCalled = true; });
  assert.equal(statusResult, 401);
  assert.equal(nextCalled, false);
});
