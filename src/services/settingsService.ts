import { authService, supabase } from './supabase';
import { storageService } from './storage';
import { GlobalUserSettings } from '../types/settings';
import { mergeWithDefaultSettings, DEFAULT_GLOBAL_SETTINGS } from '../utils/settingsDefaults';
import { applyThemeToDom } from '../utils/themeEngine';

export const settingsService = {
  // Fetch settings from server if authenticated, or localStorage if guest
  async getSettings(): Promise<GlobalUserSettings> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        // Guest mode
        const local = storageService.getSettings();
        applyThemeToDom(local.theme);
        return local;
      }

      const headers = await authService.getAuthHeaders();
      const res = await fetch('/api/settings', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const merged = mergeWithDefaultSettings(data.settings);
          storageService.saveSettings(merged);
          applyThemeToDom(merged.theme);
          return merged;
        }
      }
      const local = storageService.getSettings();
      applyThemeToDom(local.theme);
      return local;
    } catch (err) {
      console.warn('[settingsService] Fallback to local settings:', err);
      const local = storageService.getSettings();
      applyThemeToDom(local.theme);
      return local;
    }
  },

  // Save settings (server-first if authenticated, always saves locally for resilience)
  async saveSettings(settings: GlobalUserSettings): Promise<{ success: boolean; message?: string }> {
    try {
      // Always persist to local storage first for immediate offline resilience
      storageService.saveSettings(settings);
      applyThemeToDom(settings.theme);

      const token = await authService.getAccessToken();
      if (!token) {
        return { success: true, message: 'Saved to local browser storage.' };
      }

      const headers = await authService.getAuthHeaders();
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update remote settings.');
      }

      return { success: true, message: 'Settings synchronized with cloud account.' };
    } catch (err: any) {
      console.error('[settingsService] Save error:', err);
      return { success: false, message: err.message };
    }
  },

  // Reset section or all settings
  async resetSettings(section?: keyof GlobalUserSettings): Promise<GlobalUserSettings> {
    const updated = storageService.resetSettings(section);
    applyThemeToDom(updated.theme);

    try {
      const token = await authService.getAccessToken();
      if (token) {
        const headers = await authService.getAuthHeaders();
        await fetch('/api/settings/reset', {
          method: 'POST',
          headers,
          body: JSON.stringify({ section }),
        });
      }
    } catch (err) {
      console.warn('[settingsService] Reset remote error:', err);
    }

    return updated;
  },

  // Export authorized user data
  async exportUserData(): Promise<void> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        // Export local guest data
        const localData = storageService.exportAllData();
        const blob = new Blob([localData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `climb1600_guest_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const headers = await authService.getAuthHeaders();
      const res = await fetch('/api/settings/export', { method: 'POST', headers });
      if (!res.ok) {
        throw new Error('Export failed on server.');
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `climb1600_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[settingsService] Export error:', err);
      alert(`Export error: ${err.message}`);
    }
  },

  // Export practice history as CSV
  exportPracticeCsv(): void {
    const attempts = storageService.getAttempts();
    if (attempts.length === 0) {
      alert('No problem attempts to export.');
      return;
    }
    const headers = ['Problem ID', 'Name', 'Rating', 'Tags', 'Verdict', 'Duration (s)', 'Hints Used', 'Date'];
    const rows = attempts.map((a) => [
      `"${a.problemId || ''}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      a.rating || '',
      `"${(a.tags || []).join(';')}"`,
      a.outcome || a.officialVerdict || '',
      a.timeSpentSeconds || 0,
      a.hintsUsedCount || 0,
      a.startedAt || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climb1600_practice_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Permanent account deletion
  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        // Guest mode: clear local storage
        storageService.resetAll();
        return { success: true, message: 'All local guest practice data has been cleared.' };
      }

      const headers = await authService.getAuthHeaders();
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Server rejected account deletion.');
      }

      // Clear local browser data
      storageService.resetAll();
      await supabase.auth.signOut();

      return { success: true, message: data.message };
    } catch (err: any) {
      console.error('[settingsService] Account deletion error:', err);
      return { success: false, message: err.message };
    }
  },
};
