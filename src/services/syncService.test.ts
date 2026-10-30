import test from 'node:test';
import assert from 'node:assert/strict';

// Polyfill localStorage in Node test environment
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (idx: number) => Array.from(store.keys())[idx] || null,
    get length() {
      return store.size;
    },
  };
}

import { syncService } from './syncService';
import { storageService } from './storage';

test('syncService: records mutations to storage queue and notifies listeners', async () => {
  storageService.clearSyncQueue();
  let latestStatus: any = null;
  const unsubscribe = syncService.subscribe((status) => {
    latestStatus = status;
  });

  const event = syncService.recordMutation('mistake', 'upsert', {
    problemId: '158A',
    category: 'boundary_condition',
  });

  assert.ok(event.id);
  assert.equal(event.entityType, 'mistake');

  // Allow async auto-sync to complete
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(latestStatus?.pendingCount, 0);

  unsubscribe();
});

test('syncService: offline queue accumulates and drains when set back online', async () => {
  storageService.clearSyncQueue();
  syncService.setOnlineStatus(false);

  syncService.recordMutation('plan', 'upsert', { day: 1, completed: true });
  syncService.recordMutation('revision', 'upsert', { problemId: '71A', outcome: 'easy' });

  let status = syncService.getStatus();
  assert.equal(status.isOnline, false);
  assert.equal(status.pendingCount, 2);

  // Set back online and trigger sync
  syncService.setOnlineStatus(true);
  const result = await syncService.syncPendingQueue();

  assert.equal(result.processed, 2);
  assert.equal(result.failed, 0);

  status = syncService.getStatus();
  assert.equal(status.pendingCount, 0);
  assert.ok(status.lastSyncedAt);
});
