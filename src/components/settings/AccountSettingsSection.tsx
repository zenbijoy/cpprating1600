import React, { useState } from 'react';
import {
  ShieldIcon as Shield,
  UserIcon as User,
  FeedbackIcon as Mail,
  CheckCircleIcon as CheckCircle2,
  WarningStatusIcon as AlertTriangle,
  LogOutIcon as LogOut,
  DeleteAccountIcon as Trash2,
  KeyIcon as LogIn,
  KeyIcon as Key,
  SystemThemeIcon as Laptop,
} from '../icons';
import { useTranslation } from '../../utils/i18n';
import { settingsService } from '../../services/settingsService';

interface AccountSettingsSectionProps {
  isAuthenticated: boolean;
  userEmail?: string;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const AccountSettingsSection: React.FC<AccountSettingsSectionProps> = ({
  isAuthenticated,
  userEmail,
  onOpenAuthModal,
  onSignOut,
}) => {
  const { t } = useTranslation();
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Safely detect current environment
  const browserInfo = typeof navigator !== 'undefined' ? navigator.userAgent : 'Standard Web Browser';
  const osInfo = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Linux') ? 'Linux' : 'Android / Mobile') : 'Desktop OS';

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setDeleteError('Please type DELETE_MY_ACCOUNT exactly as shown.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await settingsService.deleteAccount();
      if (res.success) {
        alert('Your CLIMB 1600 account and associated records have been deleted. Reloading...');
        window.location.reload();
      } else {
        setDeleteError(res.message || 'Failed to delete account.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error executing deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Signed-in Account Identity */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>{t('account.identity')}</span>
        </h3>

        {isAuthenticated ? (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center font-bold text-emerald-300">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm font-mono">{userEmail}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('account.status_verified')}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">{t('account.google_auth')}</span>
                  </div>
                </div>
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 hover:border-rose-700/60 hover:bg-rose-950/30 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('account.sign_out')}</span>
                </button>
              )}
            </div>

            {/* Session Info */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Active on <strong>{osInfo}</strong> ({browserInfo.substring(0, 32)}...)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Authenticated via Supabase OAuth 2.0</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-amber-200">Local Guest Mode</p>
              <p className="text-slate-400">
                You are practicing locally. Your attempts and mistakes are stored in this browser. Sign in with Google to enable automatic cloud backup across your laptop and Android companion.
              </p>
            </div>
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Security Guidance */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Security & Authentication Architecture</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          CLIMB 1600 utilizes Supabase Auth with Row Level Security (RLS) policies. Only you can read or update your private mistakes and practice attempts. We never request your Codeforces password.
        </p>
      </div>

      {/* 3. Danger Zone: Account Deletion */}
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-5 space-y-3">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{t('account.danger_zone')}</span>
        </h3>
        <p className="text-xs text-slate-400">{t('account.delete_desc')}</p>

        {!showDeleteModal ? (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 rounded-xl border border-rose-800 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('account.delete_btn')}</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/60 space-y-3">
            <p className="text-xs font-bold text-rose-200">
              To confirm deletion, type <code className="bg-rose-950 px-1 py-0.5 rounded border border-rose-700 text-white font-mono">DELETE_MY_ACCOUNT</code> below:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE_MY_ACCOUNT"
              className="w-full rounded-xl border border-rose-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-400"
            />
            {deleteError && <p className="text-xs text-rose-300">{deleteError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE_MY_ACCOUNT' || isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 text-xs cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Everything'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
