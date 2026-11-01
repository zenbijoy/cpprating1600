import React, { useState, useEffect } from 'react';
import {
  DataExportIcon as Database,
  DownloadIcon as Download,
  ExportIcon as FileSpreadsheet,
  UploadIcon as Upload,
  MemoryUsageIcon as HardDrive,
  RetryIcon as RotateCcw,
  CheckCircleIcon as CheckCircle2,
  WarningStatusIcon as AlertTriangle,
} from '../icons';
import { useTranslation } from '../../utils/i18n';
import { settingsService } from '../../services/settingsService';
import { storageService } from '../../services/storage';

interface DataSettingsSectionProps {
  onResetAllData: () => void;
}

export const DataSettingsSection: React.FC<DataSettingsSectionProps> = ({
  onResetAllData,
}) => {
  const { t } = useTranslation();
  const [showImportBox, setShowImportBox] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ usedBytes: number; formatted: string; itemCount: number }>({
    usedBytes: 0,
    formatted: '0 B',
    itemCount: 0,
  });

  useEffect(() => {
    setStorageUsage(storageService.getStorageUsage());
  }, []);

  const handleExportJson = async () => {
    await settingsService.exportUserData();
  };

  const handleExportCsv = () => {
    settingsService.exportPracticeCsv();
  };

  const handleImportJson = () => {
    if (!importJsonText.trim()) return;
    const ok = storageService.importData(importJsonText.trim());
    if (ok) {
      alert('Data restored successfully! Reloading...');
      window.location.reload();
    } else {
      alert('Invalid JSON structure. Please check the backup file format.');
    }
  };

  const handleClearCache = () => {
    storageService.clearLocalCache();
    setStorageUsage(storageService.getStorageUsage());
    setCacheClearedMsg('Transient local cache flushed cleanly.');
    setTimeout(() => setCacheClearedMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Data Portability & Backup */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>{t('data.title')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Download your full learning history, personal mistake notebook entries, and training preferences anytime.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('data.export_json')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>{t('data.export_csv')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>{t('data.import_backup')}</span>
          </button>
        </div>

        {showImportBox && (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Paste Backup JSON Content</label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"profile": {...}, "attempts": [...], "mistakes": [...]}'
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleImportJson}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Restore Backup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportBox(false);
                  setImportJsonText('');
                }}
                className="px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Storage Inspector & Cache Control */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Local Storage Health & Diagnostics</span>
        </h3>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">{t('data.storage_used')}</p>
            <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
              {storageUsage.formatted}{' '}
              <span className="text-xs text-slate-500 font-normal">({storageUsage.itemCount} storage keys)</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('data.clear_cache')}</span>
          </button>
        </div>

        {cacheClearedMsg && (
          <div className="p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cacheClearedMsg}</span>
          </div>
        )}
      </div>

      {/* 3. Danger Zone: Wipe All Local Data */}
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-5 space-y-3">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Reset Training History</span>
        </h3>
        <p className="text-xs text-slate-400">
          Reset local problem attempts, mistake records, and daily plans back to day 1 without deleting your cloud login credentials.
        </p>

        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-xl border border-rose-800 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
          >
            Reset All Training Progress
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-rose-300 font-bold">Are you sure?</span>
            <button
              type="button"
              onClick={onResetAllData}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 text-xs cursor-pointer shadow-md"
            >
              Yes, Reset Everything
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
