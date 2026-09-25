import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Check,
  Compass,
  FolderKanban,
  GraduationCap,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { extractApiError } from '../api/client';
import { Avatar, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, ErrorState, GridSkeleton } from '../components/ui';
import { DonutChartCard, TrendChartCard } from '../components/shared/Charts';
import { HeroBanner } from '../components/shared/HeroBanner';
import { RecommendationCard } from '../components/shared/RecommendationCard';
import { SectionHeading } from '../components/ui/Card';
import { StatCard } from '../components/shared/StatCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { mentorService } from '../services/mentors';
import { notificationService } from '../services/notifications';
import { projectService } from '../services/projects';
import { recommendationService } from '../services/recommendations';
import type { MentorshipRequestDto, MentorRecommendationDto, NotificationDto, ProjectRecommendationDto, ProjectStatus, ProjectSummaryDto, RequestStatus } from '../types';
import { projectStatusLabel, timeAgo } from '../utils/format';

function buildStatusDistribution(projects: ProjectSummaryDto[]): Array<{ label: string; value: number }> {
  const counts = new Map<ProjectStatus, number>();
  for (const project of projects) {
    counts.set(project.status, (counts.get(project.status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({
    label: projectStatusLabel(status),
    value: count
  }));
}

function buildDailyTrend(notifications: NotificationDto[]): Array<{ label: string; value: number }> {
  const now = new Date();
  const days: Date[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
  }
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const counts = new Map<string, number>();
  for (const day of days) counts.set(key(day), 0);
  for (const notification of notifications) {
    const created = new Date(notification.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const k = key(created);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return days.map((day) => ({
    label: `${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
    value: counts.get(key(day)) ?? 0
  }));
}

function buildMonthlyTrend(requests: MentorshipRequestDto[], months = 6): Array<{ label: string; value: number }> {
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const now = new Date();
  const buckets: Date[] = [];
  for (let i = months - 1; i >= 0; i--) {
    buckets.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const counts = new Map<string, number>();
  for (const bucket of buckets) counts.set(monthKey(bucket), 0);
  for (const request of requests) {
    const created = new Date(request.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const k = monthKey(created);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return buckets.map((bucket) => ({
    label: bucket.toLocaleString('en-US', { month: 'short' }),
    value: counts.get(monthKey(bucket)) ?? 0
  }));
}

function StudentDashboard() {
  const { user } = useAuth();
  const { count: unreadCount } = useUnreadCount();
  const myProjects = useAsync(() => projectService.my({ page: 0, size: 100 }), []);
  const joinRequests = useAsync(() => projectService.myJoinRequests(), []);
  const notifications = useAsync(() => notificationService.list(0, 100), []);
  const recProjects = useAsync(() => recommendationService.projects(0, 9), []);
  const recMentors = useAsync(() => recommendationService.mentors(0, 6), []);

  const loading = myProjects.loading || joinRequests.loading || notifications.loading || recProjects.loading || recMentors.loading;
  const error = myProjects.error || joinRequests.error || notifications.error || recProjects.error || recMentors.error;
  const reloadAll = () => {
    myProjects.reload();
    joinRequests.reload();
    notifications.reload();
    recProjects.reload();
    recMentors.reload();
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <ErrorState message={error} onRetry={reloadAll} />
      </div>
    );
  }

  const pendingJoins = (joinRequests.data ?? []).filter((r) => r.status === 'PENDING').length;
  const statusData = buildStatusDistribution(myProjects.data?.content ?? []);
  const trendData = buildDailyTrend(notifications.data?.content ?? []);
  const recommendedProjects = recProjects.data?.content ?? [];
  const recommendedMentors = recMentors.data?.content ?? [];
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        eyebrow="AI-driven research matching"
        title={
          <>
            Welcome back, <span className="gradient-text">{firstName}</span>
          </>
        }
        description="Your personalized research workspace — top-matched projects, mentors and activity, all in one place."
        actions={
          <>
            <Link to="/projects/create">
              <Button variant="gradient" className="shadow-[0_10px_30px_-8px_rgb(109_94_245/0.6)]">
                <Plus className="h-4 w-4" aria-hidden="true" /> Start a project
              </Button>
            </Link>
            <Link to="/mentors">
              <Button variant="outline">
                <Compass className="h-4 w-4" aria-hidden="true" /> Find mentors
              </Button>
            </Link>
          </>
        }
      />

      <div className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="My projects" value={myProjects.data?.content.length ?? 0} icon={FolderKanban} hint="Projects you own or belong to" />
          <StatCard label="Open join requests" value={pendingJoins} icon={Users} accent="warning" hint="Awaiting response" />
          <StatCard label="Unread notifications" value={unreadCount} icon={Bell} accent="indigo" hint="Waiting for your attention" />
          <StatCard label="Recommended projects" value={recProjects.data?.totalElements ?? 0} icon={Sparkles} accent="success" hint="Curated for your profile" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DonutChartCard title="My project status" description="Distribution of your projects by current status" data={statusData} />
        <TrendChartCard title="Notifications (14 days)" description="Daily notification volume over the last two weeks" data={trendData} fill />
      </div>

      <section className="mt-9">
        <SectionHeading
          title="Recommended projects"
          description="Projects matched to your skills and research interests."
          actions={
            <Button variant="ghost" size="sm" onClick={reloadAll} aria-label="Refresh dashboard">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
            </Button>
          }
        />
        {recommendedProjects.length === 0 ? (
          <EmptyState title="No project recommendations yet" description="We'll recommend projects as you build up your profile and skills." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedProjects.slice(0, 6).map((project, i) => (
              <motion.div key={project.projectId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <RecommendationCard project={project} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-9">
        <SectionHeading
          title="Recommended mentors"
          description="Faculty who align with your research direction."
          actions={
            <Link to="/mentors" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:gap-1.5 dark:text-brand-400">
              Browse all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        {recommendedMentors.length === 0 ? (
          <EmptyState title="No mentor recommendations yet" description="We'll suggest mentors as you define your research interests." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedMentors.map((mentor, i) => (
              <motion.div key={mentor.mentorId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <RecommendationCard mentor={mentor} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FacultyDashboard() {
  const toastHelper = useToast();
  const { user } = useAuth();
  const { count: unreadCount } = useUnreadCount();
  const [busyId, setBusyId] = useState<string | null>(null);
  const received = useAsync(() => mentorService.receivedRequests(), []);
  const allProjects = useAsync(() => projectService.search({ page: 0, size: 100 }), []);

  const requests = received.data ?? [];
  const pending = requests.filter((r) => r.status === 'PENDING');
  const activeMentorships = requests.filter((r) => r.status === 'ACCEPTED').length;

  const loading = received.loading || allProjects.loading;
  const error = received.error || allProjects.error;
  const reloadAll = () => {
    received.reload();
    allProjects.reload();
  };

  async function handleDecide(request: MentorshipRequestDto, status: Exclude<RequestStatus, 'PENDING'>) {
    setBusyId(request.id);
    try {
      await mentorService.decideRequest(request.id, status);
      toastHelper.success(status === 'ACCEPTED' ? 'Mentorship request accepted' : 'Mentorship request rejected');
      received.reload();
    } catch (err) {
      toastHelper.error(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <ErrorState message={error} onRetry={reloadAll} />
      </div>
    );
  }

  const statusData = buildStatusDistribution(allProjects.data?.content ?? []);
  const trendData = buildMonthlyTrend(requests);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Professor';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        accent="faculty"
        eyebrow="Faculty workspace"
        title={
          <>
            Hi, <span className="gradient-text">{firstName}</span> 👋
          </>
        }
        description="Review mentorship requests and keep an eye on project health across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={reloadAll} aria-label="Refresh dashboard">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Received requests" value={requests.length} icon={Users} hint="All-time mentorship requests" />
        <StatCard label="All projects" value={allProjects.data?.totalElements ?? 0} icon={FolderKanban} accent="indigo" hint="Across the platform" />
        <StatCard label="Unread notifications" value={unreadCount} icon={Bell} accent="warning" hint="Waiting for your attention" />
        <StatCard label="Active mentorships" value={activeMentorships} icon={GraduationCap} accent="success" hint="Accepted requests" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DonutChartCard title="Project status (all projects)" description="Current status of every project on the platform" data={statusData} />
        <TrendChartCard title="Mentorship activity (6 months)" description="Mentorship requests received, grouped by month" data={trendData} />
      </div>

      <section className="mt-9">
        <SectionHeading title="Pending mentorship requests" description="Review and respond to students requesting your mentorship." />
        <Card className="overflow-hidden">
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState title="No pending requests" description="You're all caught up — no mentorship requests are awaiting a decision." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {pending.map((request, i) => (
                  <motion.li
                    key={request.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={request.studentName} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{request.studentName}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{request.projectTitle || 'General mentorship'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(request.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        disabled={busyId !== null && busyId !== request.id}
                        loading={busyId === request.id}
                        onClick={() => void handleDecide(request, 'ACCEPTED')}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId !== null && busyId !== request.id}
                        onClick={() => void handleDecide(request, 'REJECTED')}
                      >
                        <X className="h-4 w-4" aria-hidden="true" /> Reject
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] ?? 'Admin';
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        accent="admin"
        eyebrow="Platform administration"
        title={
          <>
            Console, <span className="gradient-text-cyan">{firstName}</span>
          </>
        }
        description="Govern users, projects and faculty with full visibility into the INNOVASPHERE ecosystem."
        actions={
          <Link to="/admin/dashboard">
            <Button variant="gradient">
              Open admin dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        }
      >
        <div className="flex h-full items-center justify-center">
          <div className="glass-chip flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            All systems operational
          </div>
        </div>
      </HeroBanner>

      <Card className="mt-8 overflow-hidden">
        <CardHeader>
          <CardTitle>Admin overview</CardTitle>
          <CardDescription>Manage platform users, projects and faculty from the dedicated admin console.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-chip rounded-card-sm p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Next step</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">Review platform users and faculty access.</p>
            </div>
            <div className="glass-chip rounded-card-sm p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Guidance</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">Open the admin dashboard for analytics and moderation.</p>
            </div>
            <Link to="/admin/users" className="group">
              <div className="glass-chip flex h-full items-center justify-between rounded-card-sm p-4 transition group-hover:border-brand-300 dark:group-hover:border-brand-400/40">
                <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Manage users</p>
                <ArrowRight className="h-4 w-4 text-brand-500 transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'FACULTY') return <FacultyDashboard />;
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  return <StudentDashboard />;
}