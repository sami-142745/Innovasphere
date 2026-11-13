import { useEffect, useState } from 'react';
import { GraduationCap, ShieldCheck, UserCheck, Users as UsersIcon } from 'lucide-react';
import { adminService } from '../../services/admin';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import type { AdminUserDto, Role } from '../../types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyRow,
  EmptyState,
  ErrorState,
  GridSkeleton,
  Pagination,
  SearchInput,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow
} from '../../components/ui';
import { FilterChips, type ChipOption } from '../../components/shared/FilterChips';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { StatCard } from '../../components/shared/StatCard';
import { formatDate, titleCase } from '../../utils/format';

const ROLE_OPTIONS: ChipOption[] = [
  { value: '', label: 'All' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'ADMIN', label: 'Admins' }
];

export default function Users() {
  const { success, error: toastError } = useToast();
  const [q, setQ] = useUrlState('q');
  const keyword = useDebounce(q, 400);
  const [role, setRole] = useUrlState('role');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [keyword, role]);

  const roleFilter = (role as Role | '') || '';
  const users = useAsync(
    () => adminService.listUsers({ keyword: keyword || undefined, role: roleFilter, page, size: 10 }),
    [keyword, roleFilter, page]
  );
  const stats = useAsync(() => adminService.stats(), []);

  const data = users.data;
  const loading = users.loading && !data;
  const error = users.error || stats.error;
  const retry = () => {
    users.reload();
    stats.reload();
  };

  const toggleStatus = async (user: AdminUserDto) => {
    setBusyId(user.id);
    try {
      await adminService.updateUserStatus(user.id, !user.active);
      success(`${user.fullName} ${user.active ? 'deactivated' : 'reactivated'}.`);
      users.reload();
      stats.reload();
    } catch (err) {
      toastError(extractApiError(err, 'Could not update the user.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <HeroBanner
        accent="admin"
        eyebrow="Administration"
        title="Users"
        description="Manage every account in the INNOVASPHERE community."
      />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : !stats.data ? (
        <GridSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={stats.data.totalUsers} icon={UsersIcon} hint="All registered accounts" />
          <StatCard label="Students" value={stats.data.studentUsers} icon={UserCheck} accent="success" />
          <StatCard label="Faculty" value={stats.data.facultyUsers} icon={GraduationCap} accent="indigo" />
          <StatCard label="Admins" value={stats.data.adminUsers} icon={ShieldCheck} accent="warning" />
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All users</CardTitle>
              <CardDescription className="mt-1">Search, filter by role and manage account status.</CardDescription>
            </div>
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ('')}
              placeholder="Search by name, username or email…"
              className="w-full lg:w-80"
              aria-label="Search users"
            />
          </div>
          <FilterChips options={ROLE_OPTIONS} active={role} onSelect={setRole} className="mt-3" />
        </CardHeader>

        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : loading ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>User</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Department</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Joined</TableHeadCell>
                <TableHeadCell className="text-right">Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : data && data.content.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No users found" description="Try a different search term or role filter." />
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>User</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Department</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Joined</TableHeadCell>
                <TableHeadCell className="text-right">Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.fullName} size="sm" />
                      <div className="leading-tight">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{u.fullName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">{u.email}</TableCell>
                  <TableCell>
                    <Badge tone={u.role === 'ADMIN' ? 'warning' : u.role === 'FACULTY' ? 'indigo' : 'brand'}>
                      {titleCase(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">{u.department ?? '—'}</TableCell>
                  <TableCell>
                    <Badge tone={u.active ? 'success' : 'default'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={u.active ? 'outline' : 'gradient'}
                      loading={busyId === u.id}
                      disabled={busyId !== null && busyId !== u.id}
                      onClick={() => void toggleStatus(u)}
                    >
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={10} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
