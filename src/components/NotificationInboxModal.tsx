import React, { useState, useEffect } from 'react';
import {
  NotificationBellIcon,
  CloseIcon,
  DeleteIcon,
  CheckIcon,
  AcceptedIcon,
  ContestsIcon,
  StreakIcon,
  FocusModeIcon,
  LearningRoadmapIcon,
  AISparkleIcon,
  ClockStatusIcon,
  FilterIcon as Filter,
  RefreshIcon as RefreshCw,
  NotificationBellIcon as Bell,
  ExternalLinkIcon as ExternalLink,
  CloseIcon as X,
} from './icons';
import { AppNotification, NotificationCategory } from '../services/notifications/types';
import { notificationClient } from '../services/notificationClient';

interface NotificationInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (actionUrl: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const CATEGORIES: { label: string; value: NotificationCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Practice', value: 'practice' },
  { label: 'Submissions', value: 'submission' },
  { label: 'Contests', value: 'contest' },
  { label: 'Streaks', value: 'streak' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'System', value: 'system' },
];

export const NotificationInboxModal: React.FC<NotificationInboxModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchInbox = async (cat = selectedCategory, unread = unreadOnly, pageNum = page) => {
    setLoading(true);
    try {
      const res = await notificationClient.getNotifications({
        category: cat,
        unreadOnly: unread,
        page: pageNum,
        limit: 15,
      });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setTotalPages(res.totalPages);
      if (onUnreadCountChange) onUnreadCountChange(res.unreadCount);
    } catch (err) {
      console.error('[NotificationInbox] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInbox(selectedCategory, unreadOnly, 1);
    }
  }, [isOpen, selectedCategory, unreadOnly]);

  const handleMarkAsRead = async (notif: AppNotification) => {
    if (notif.read) return;
    await notificationClient.markAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
    );
    const newCount = Math.max(0, unreadCount - 1);
    setUnreadCount(newCount);
    if (onUnreadCountChange) onUnreadCountChange(newCount);
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await notificationClient.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationClient.dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDismissAll = async () => {
    setActionLoading(true);
    try {
      await notificationClient.dismissAll();
      setNotifications([]);
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClickNotification = (notif: AppNotification) => {
    handleMarkAsRead(notif);
    if (notif.action_url) {
      onClose();
      onNavigate(notif.action_url);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'submission':
        return <AcceptedIcon size={16} semantic="success" />;
      case 'contest':
        return <ContestsIcon size={16} semantic="warning" />;
      case 'streak':
        return <StreakIcon size={16} semantic="warning" />;
      case 'guardian':
        return <FocusModeIcon size={16} semantic="primary" />;
      case 'curriculum':
        return <LearningRoadmapIcon size={16} semantic="indigo" />;
      case 'system':
        return <AISparkleIcon size={16} semantic="info" />;
      default:
        return <ClockStatusIcon size={16} />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn safe-area-overlay"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
              <NotificationBellIcon size={20} semantic="primary" />
            </div>
            <div>
              <h2 id="notification-center-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notification Center
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Practice reminders, contest schedules, and Codeforces sync alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-sm"
                title="Mark all as read"
              >
                <CheckIcon size={14} semantic="success" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDismissAll}
                disabled={actionLoading}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Clear all"
              >
                <DeleteIcon size={16} semantic="error" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notification center"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setUnreadOnly(!unreadOnly);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 border transition-colors cursor-pointer ${
              unreadOnly
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold'
                : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Unread Only</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400 gap-3">
              <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                <Bell className="w-8 h-8 stroke-1" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Your inbox is clear</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Upcoming Codeforces rounds, solved submission alerts, and daily training reminders will appear here.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleClickNotification(notif)}
                className={`group relative flex items-start gap-3.5 p-3 rounded-xl transition-all cursor-pointer border ${
                  notif.read
                    ? 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/70'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50'
                }`}
              >
                <div className="mt-0.5 shrink-0 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold truncate ${notif.read ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white font-bold'}`}>
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Unread" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>

                  {notif.action_url && (
                    <div className="pt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => handleDismiss(e, notif.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 shadow-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
