import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  FolderKanban,
  Handshake,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { extractApiError } from '../../api/client';
import { Button, CardSkeleton, EmptyState, ErrorState } from '../../components/ui';
import { FilterChips, type ChipOption } from '../../components/shared/FilterChips';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { notificationService } from '../../services/notifications';
import type { NotificationDto, NotificationType } from '../../types';
import { NOTIFICATION_FILTERS } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { timeAgo, titleCase } from '../../utils/format';

const FILTER_OPTIONS: ChipOption[] = [...NOTIFICATION_FILTERS];

const TYPE_STYLES: Record<NotificationType, { icon: typeof Bell; gradient: string }> = {
  JOIN_REQUEST: { icon: UserPlus, gradient: 'from-brand-500 to-indigo-600 shadow-glow' },
  JOIN_REQUEST_ACCEPTED: { icon: Check, gradient: 'from-emerald-500 to-teal-600 shadow-[0_10px_30px_-10px_rgb(16_185_129/0.5)]' },
  JOIN_REQUEST_REJECTED: { icon: Bell, gradient: 'from-rose-500 to-red-600 shadow-[0_10px_30px_-10px_rgb(239_68_68/0.5)]' },
  TEAM_INVITATION: { icon: Users, gradient: 'from-accent-500 to-brand-600 shadow-glow-cyan' },
  TEAM_INVITATION_ACCEPTED: { icon: Check, gradient: 'from-emerald-500 to-teal-600 shadow-[0_10px_30px_-10px_rgb(16_185_129/0.5)]' },
  TEAM_INVITATION_REJECTED: { icon: Bell, gradient: 'from-rose-500 to-red-600 shadow-[0_10px_30px_-10px_rgb(239_68_68/0.5)]' },
  MENTORSHIP_REQUEST: { icon: Handshake, gradient: 'from-orchid-500 to-brand-600 shadow-[0_10px_30px_-10px_rgb(168_85_247/0.5)]' },
  MENTORSHIP_ACCEPTED: { icon: Check, gradient: 'from-emerald-500 to-teal-600 shadow-[0_10px_30px_-10px_rgb(16_185_129/0.5)]' },
  MENTORSHIP_REJECTED: { icon: Bell, gradient: 'from-rose-500 to-red-600 shadow-[0_10px_30px_-10px_rgb(239_68_68/0.5)]' },
  PROJECT_UPDATE: { icon: FolderKanban, gradient: 'from-sky-500 to-indigo-600 shadow-[0_10px_30px_-10px_rgb(59_130_246/0.5)]' },
  SYSTEM: { icon: BellRing, gradient: 'from-slate-500 to-slate-700 shadow-card' }
};

export default function NotificationsPage() {
  const toastHelper = useToast();
  const { data, loading, error, reload } = useAsync(() => notificationService.list(0, 30), []);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (data) setItems(data.content);
  }, [data]);

  const visible = useMemo(() => {
    let list = items;
    if (filter === 'unread') list = list.filter((n) => !n.read);
    else if (filter !== 'all') list = list.filter((n) => n.type === filter);
    return list;
  }, [items, filter]);

  const unreadCount = items.filter((n) => !n.read).length;

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllRead();
      toastHelper.success('All notifications marked as read');
      reload();
    } catch (err) {
      toastHelper.error(extractApiError(err));
    }
  }

  async function handleMarkRead(notification: NotificationDto) {
    if (notification.read || busyId) return;
    setBusyId(notification.id);
    try {
      await notificationService.markRead(notification.id);
      setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      toastHelper.success('Notification marked as read');
    } catch (err) {
      toastHelper.error(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(notification: NotificationDto) {
    try {
      await notificationService.remove(notification.id);
      toastHelper.success('Notification deleted');
      reload();
    } catch (err) {
      toastHelper.error(extractApiError(err));
    }
  }

  if (loading) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-50">Notifications</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Your platform activity and updates.</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-50">Notifications</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Your platform activity and updates.</p>
        </div>
        <ErrorState message={error} onRetry={reload} />
      </>
    );
  }

  return (
    <div className="relative mx-auto w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-50">Notifications</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={reload} aria-label="Refresh notifications">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <FilterChips className="mb-6" options={FILTER_OPTIONS} active={filter} onSelect={setFilter} deselectValue="all" />

      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'all' ? 'No notifications yet' : 'No matching notifications'}
          description={
            filter === 'all'
              ? 'When there is activity on your projects or mentorship requests, it will show up here.'
              : 'Try a different filter to see more notifications.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((notification, idx) => {
            const unread = !notification.read;
            const style = TYPE_STYLES[notification.type] ?? TYPE_STYLES.SYSTEM;
            const Icon = style.icon;
            return (
              <motion.li
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div
                  className={cn(
                    'glass-panel flex items-start gap-4 rounded-panel p-4 transition-all duration-200',
                    unread && 'border-brand-300/60 dark:border-brand-400/25'
                  )}
                  onClick={unread ? () => void handleMarkRead(notification) : undefined}
                >
                  <span className={cn('relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white', style.gradient)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {unread && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-alive dark:border-deep-800" aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-brand-200/70 bg-brand-50/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
                        {titleCase(notification.type)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(notification.createdAt)}</span>
                    </div>
                    <p className={cn('mt-1 text-sm', unread ? 'font-semibold text-slate-900 dark:text-slate-50' : 'font-medium text-slate-700 dark:text-slate-300')}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{notification.message}</p>
                    )}
                  </div>

                  {unread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkRead(notification);
                      }}
                      aria-label={`Mark read: ${notification.title}`}
                      className="hidden shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 sm:inline-flex dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                    >
                      <CheckCheck className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(notification);
                    }}
                    aria-label={`Delete notification: ${notification.title}`}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}