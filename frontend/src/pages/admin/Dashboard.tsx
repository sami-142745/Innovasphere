import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BellRing, FolderKanban, GraduationCap, Megaphone } from 'lucide-react';
import { projectService } from '../../services/projects';
import { mentorService } from '../../services/mentors';
import { notificationService } from '../../services/notifications';
import { adminService } from '../../services/admin';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import type { NotificationDto } from '../../types';
import { PROJECT_STATUSES } from '../../utils/constants';
import { Button, CardSkeleton, ErrorState, GridSkeleton, Input, Modal, Textarea } from '../../components/ui';
import { StatCard } from '../../components/shared/StatCard';
import { BarChartCard, DonutChartCard, TrendChartCard, type SeriesDatum } from '../../components/shared/Charts';
import { HeroBanner } from '../../components/shared/HeroBanner';

const broadcastSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters'),
  message: z.string().trim().max(2000, 'Message must be at most 2000 characters').optional(),
  userId: z.string().trim().optional()
});

type BroadcastFormValues = z.infer<typeof broadcastSchema>;

interface BroadcastFormProps {
  onSuccess: () => void;
}

function BroadcastForm({ onSuccess }: BroadcastFormProps) {
  const { success, error } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { title: '', message: '', userId: '' }
  });

  const onSubmit = async (values: BroadcastFormValues) => {
    try {
      await adminService.broadcast({
        title: values.title,
        message: values.message || undefined,
        userId: values.userId || undefined
      });
      success('Broadcast sent to all users.');
      reset();
      onSuccess();
    } catch (err) {
      error(extractApiError(err, 'Could not send the broadcast.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input label="Title" placeholder="e.g. Server maintenance this weekend" {...register('title')} error={errors.title?.message} />
      <Textarea label="Message (optional)" rows={4} placeholder="What should users know?" {...register('message')} error={errors.message?.message} />
      <Input
        label="Target user (optional)"
        placeholder="User UUID"
        hint="Target user UUID — leave blank to broadcast to all users."
        {...register('userId')}
        error={errors.userId?.message}
      />
      <div className="flex justify-end gap-3 pt-1">
        <Button type="submit" loading={isSubmitting}>
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          Send broadcast
        </Button>
      </div>
    </form>
  );
}

function buildActivitySeries(items: NotificationDto[], days: number): SeriesDatum[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series: SeriesDatum[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    series.push({
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: counts.get(key) ?? 0
    });
  }
  return series;
}

export default function Dashboard() {
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const projects = useAsync(() => projectService.search({ page: 0, size: 100 }), []);
  const mentors = useAsync(() => mentorService.list(0, 100), []);
  const notifications = useAsync(() => notificationService.list(0, 100), []);
  const unread = useAsync(() => notificationService.unreadCount(), []);

  const ready = Boolean(projects.data && mentors.data && notifications.data && unread.data);
  const error = projects.error || mentors.error || notifications.error || unread.error;
  const retry = () => {
    projects.reload();
    mentors.reload();
    notifications.reload();
    unread.reload();
  };

  const statusCounts: Record<string, number> = {};
  for (const p of projects.data?.content ?? []) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  }
  const statusData = PROJECT_STATUSES.filter((s) => (statusCounts[s.value] ?? 0) > 0).map((s) => ({
    label: s.label,
    value: statusCounts[s.value] ?? 0
  }));

  const studentOwners = new Set<string>();
  const facultyOwners = new Set<string>();
  for (const p of projects.data?.content ?? []) {
    if (p.owner.role === 'STUDENT') studentOwners.add(p.owner.id);
    else if (p.owner.role === 'FACULTY') facultyOwners.add(p.owner.id);
  }
  const roleData: SeriesDatum[] = [];
  if (studentOwners.size > 0) roleData.push({ label: 'Student', value: studentOwners.size });
  const facultyCount = facultyOwners.size + (mentors.data?.totalElements ?? 0);
  if (facultyCount > 0) roleData.push({ label: 'Faculty', value: facultyCount });

  const trendData = buildActivitySeries(notifications.data?.content ?? [], 14);

  return (
    <div>
      <HeroBanner
        accent="admin"
        eyebrow="Analytics console"
        title={
          <>
            Platform <span className="gradient-text-cyan">overview</span>
          </>
        }
        description="High-level health of the INNOVASPHERE community — projects, mentors and notification activity."
        actions={
          <Button variant="gradient" onClick={() => setBroadcastOpen(true)}>
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            Broadcast to users
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : !ready ? (
        <>
          <GridSkeleton count={4} />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total projects" value={projects.data!.totalElements} icon={FolderKanban} hint="From project search" />
            <StatCard label="Faculty mentors" value={mentors.data!.totalElements} icon={GraduationCap} accent="indigo" hint="Active mentor profiles" />
            <StatCard label="Notifications sent" value={notifications.data!.totalElements} icon={Megaphone} accent="success" hint="All-time on this account" />
            <StatCard label="Unread (admin account)" value={unread.data!.count} icon={BellRing} accent="warning" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <DonutChartCard title="Projects by status" description="From the latest 100 projects" data={statusData} />
            <BarChartCard title="Users by role (derived)" description="Distinct project owners plus faculty mentors" data={roleData} color="#6366f1" />
            <TrendChartCard title="Notification activity (14 days)" description="From the latest 100 notifications" data={trendData} />
          </div>
        </>
      )}

      <Modal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Broadcast to users"
        description="Send a system notification to INNOVASPHERE users."
      >
        <BroadcastForm onSuccess={() => setBroadcastOpen(false)} />
      </Modal>
    </div>
  );
}