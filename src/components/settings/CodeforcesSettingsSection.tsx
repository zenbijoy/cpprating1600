import React, { useState } from 'react';
import {
  ShieldIcon as ShieldCheck,
  RefreshIcon as RefreshCw,
  DisconnectedIcon as Unlink,
  CheckCircleIcon as CheckCircle2,
  ExternalLinkIcon as ExternalLink,
  InformationStatusIcon as Info,
} from '../icons';
import { useTranslation } from '../../utils/i18n';

interface CodeforcesSettingsSectionProps {
  cfHandle?: string;
  isCfVerified?: boolean;
  cfAccount?: any;
  onOpenVerificationModal?: () => void;
  onSyncCfData?: () => Promise<void> | void;
  onUnlinkCfAccount?: () => Promise<void> | void;
}

export const CodeforcesSettingsSection: React.FC<CodeforcesSettingsSectionProps> = ({
  cfHandle,
  isCfVerified = false,
  cfAccount,
  onOpenVerificationModal,
  onSyncCfData,
  onUnlinkCfAccount,
}) => {
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState<boolean>(false);

  const handleSync = async () => {
    if (!onSyncCfData) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await onSyncCfData();
      setSyncMessage('Codeforces submissions and contest history synchronized!');
    } catch (err: any) {
      setSyncMessage(`Sync issue: ${err.message || 'Rate limit or network error.'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleUnlink = async () => {
    if (!onUnlinkCfAccount) return;
    try {
      await onUnlinkCfAccount();
      setShowUnlinkModal(false);
    } catch (err: any) {
      alert(`Unlink error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Account Status & Actions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{t('cf.title')}</span>
          </h3>
          {isCfVerified ? (
            <span className="flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Owner</span>
            </span>
          ) : (
            <span className="rounded bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              {cfHandle ? 'Unverified Handle' : 'Not Linked'}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Sync your verified handle from the official Codeforces public API. We verify ownership using cryptographic challenge tokens in your public profile and never ask for passwords.
        </p>

        {cfHandle ? (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white">{cfHandle}</span>
                  <a
                    href={`https://codeforces.com/profile/${cfHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300"
                    title="View official profile on Codeforces"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                {cfAccount?.last_synced_at && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('cf.last_sync')}: {new Date(cfAccount.last_synced_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {onSyncCfData && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : t('cf.sync_now')}</span>
                  </button>
                )}

                {onUnlinkCfAccount && (
                  <button
                    type="button"
                    onClick={() => setShowUnlinkModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-800/40 hover:bg-rose-950/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>{t('cf.unlink')}</span>
                  </button>
                )}
              </div>
            </div>

            {syncMessage && (
              <div className="p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <p className="font-semibold text-white">{t('cf.not_linked')}</p>
              <p className="text-slate-400 mt-0.5">
                Link your handle to unlock rating history graphs, submission autopsies, and weak topic identification.
              </p>
            </div>
            {onOpenVerificationModal && (
              <button
                type="button"
                onClick={onOpenVerificationModal}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('cf.verify_new')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Public Data Transparency */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Imported Public Data & Privacy Transparency</span>
        </h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
          <li><strong>Official Submissions:</strong> Problem IDs, verdicts (OK, WA, TLE), submission timestamps, and execution times.</li>
          <li><strong>Contest Participation:</strong> Contest IDs, past rank, delta changes, and historical rating curve.</li>
          <li><strong>Public Profile:</strong> Max rating, current title (Specialist, Expert), and profile avatar.</li>
          <li><strong>Never Imported:</strong> Passwords, private contest drafts, unsubmitted gym test cases, or personal billing info.</li>
        </ul>
      </div>

      {/* Unlink Confirmation Modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Unlink className="w-4 h-4 text-rose-400" />
              <span>Unlink Codeforces Account?</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlinking will disconnect <strong>{cfHandle}</strong>. Your CLIMB 1600 practice attempts, mistake notebook records, and study habits will be safely preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlink}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Yes, Unlink Handle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
