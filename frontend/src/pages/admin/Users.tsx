import { useMemo } from 'react';
import { FolderKanban, GraduationCap, Info, Users as UsersIcon } from 'lucide-react';
import { projectService } from '../../services/projects';
import { mentorService } from '../../services/mentors';
import { useAsync } from '../../hooks/useAsync';
import type { UserDto } from '../../types';
import {
  Avatar,
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyRow,
  EmptyState,
  ErrorState,
  GridSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow
} from '../../components/ui';
import { BarChartCard, type SeriesDatum } from '../../components/shared/Charts';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { StatCard } from '../../components/shared/StatCard';
import { formatDate, titleCase } from '../../utils/format';

interface Contributor {
  user: UserDto;
  projectCount: number;
}

export default function Users() {
  const projects = useAsync(() => projectService.search({ page: 0, size: 100 }), []);
  const mentors = useAsync(() => mentorService.list(0, 100), []);

  const ready = Boolean(projects.data && mentors.data);
  const error = projects.error || mentors.error;
  const retry = () => {
    projects.reload();
    mentors.reload();
  };

  const contributors = useMemo<Contributor[]>(() => {
    const byId = new Map<string, Contributor>();
    for (const p of projects.data?.content ?? []) {
      const existing = byId.get(p.owner.id);
      if (existing) existing.projectCount += 1;
      else byId.set(p.owner.id, { user: p.owner, projectCount: 1 });
    }
    return [...byId.values()].sort((a, b) => b.projectCount - a.projectCount);
  }, [projects.data]);

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

  return (
    <div>
      <HeroBanner
        accent="admin"
        eyebrow="Community analytics"
        title="Users & community"
        description="People building the INNOVASPHERE research ecosystem."
      />

      <div className="glass-chip mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300">
        <Info className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        INNOVASPHERE exposes no user directory API. Metrics below are derived from projects and mentors.
      </div>

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : !ready ? (
        <GridSkeleton count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Project owners (unique)" value={contributors.length} icon={UsersIcon} hint="Distinct owners in the latest 100 projects" />
            <StatCard label="Faculty mentors" value={mentors.data!.totalElements} icon={GraduationCap} accent="indigo" />
            <StatCard label="Projects" value={projects.data!.totalElements} icon={FolderKanban} accent="success" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project contributors</CardTitle>
                  <CardDescription>Unique owners derived from the latest 100 projects.</CardDescription>
                </CardHeader>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Contributor</TableHeadCell>
                      <TableHeadCell>Email</TableHeadCell>
                      <TableHeadCell>Role</TableHeadCell>
                      <TableHeadCell>Projects</TableHeadCell>
                      <TableHeadCell>Joined</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contributors.length === 0 ? (
                      <EmptyRow colSpan={5}>
                        <EmptyState title="No project contributors yet" description="Projects with owners will appear here." />
                      </EmptyRow>
                    ) : (
                      contributors.map((c) => (
                        <TableRow key={c.user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={c.user.fullName} size="sm" />
                              <div className="leading-tight">
                                <p className="font-medium text-slate-900 dark:text-slate-100">{c.user.fullName}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">@{c.user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{c.user.email}</TableCell>
                          <TableCell>
                            <Badge tone={c.user.role === 'FACULTY' ? 'indigo' : 'brand'}>{titleCase(c.user.role)}</Badge>
                          </TableCell>
                          <TableCell>{c.projectCount}</TableCell>
                          <TableCell>{formatDate(c.user.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
            <BarChartCard title="Users by role (derived)" description="Distinct project owners plus faculty mentors" data={roleData} color="#6366f1" />
          </div>
        </>
      )}
    </div>
  );
}