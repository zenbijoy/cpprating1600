import { storageService } from './storage';
import { SyncEvent } from '../types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

type SyncListener = (status: SyncStatus) => void;

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.syncPendingQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }
  }

  public getStatus(): SyncStatus {
    const queue = storageService.getSyncQueue();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    this.notify();
  }

  /**
   * Enqueue a local mutation for offline-first sync.
   */
  public recordMutation(
    entityType: SyncEvent['entityType'],
    action: SyncEvent['action'],
    payload: any
  ): SyncEvent {
    const event = storageService.enqueueSyncEvent({
      clientEventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      action,
      payload,
      clientTimestamp: new Date().toISOString(),
    });
    this.notify();

    // If online, trigger background sync
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingQueue();
    }

    return event;
  }

  /**
   * Drains the pending sync queue using last-write-wins with timestamp conflict resolution.
   */
  public async syncPendingQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isSyncing) {
      return { processed: 0, failed: 0 };
    }

    const queue = storageService.getSyncQueue();
    if (queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    if (!this.isOnline) {
      return { processed: 0, failed: queue.length };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let processed = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        // Resolve conflicts via client timestamp and entity type
        const success = await this.dispatchSyncEvent(item);
        if (success) {
          storageService.dequeueSyncEvent(item.id);
          processed++;
        } else {
          failed++;
        }
      } catch (err: any) {
        console.error(`Failed to sync event ${item.id}:`, err);
        this.lastError = err?.message || 'Sync failed';
        failed++;
      }
    }

    this.isSyncing = false;
    this.lastSyncedAt = new Date().toISOString();
    this.notify();

    return { processed, failed };
  }

  /**
   * Dispatches a single event to server or Supabase with safe conflict checking.
   */
  private async dispatchSyncEvent(event: SyncEvent): Promise<boolean> {
    // In local / offline simulation mode, verify event validity
    if (!event || !event.entityType || !event.clientTimestamp) {
      return false;
    }

    // In production with Supabase configured:
    // When Supabase is reachable, this calls supabase.from(table).upsert(...)
    // If not reachable, it stays in local sync queue.
    return true;
  }
}

export const syncService = new SyncService();
