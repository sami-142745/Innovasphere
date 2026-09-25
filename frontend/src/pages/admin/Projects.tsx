import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../../services/projects';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import type { ProjectStatus } from '../../types';
import { PROJECT_STATUSES } from '../../utils/constants';
import { formatDate, projectStatusLabel, projectStatusTone } from '../../utils/format';
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

const STATUS_OPTIONS: ChipOption[] = [{ value: '', label: 'All' }, ...PROJECT_STATUSES];

export default function Projects() {
  const [q, setQ] = useUrlState('q');
  const keyword = useDebounce(q, 400);
  const [status, setStatus] = useUrlState('status');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [keyword, status]);

  const statusFilter: ProjectStatus | '' = (status as ProjectStatus) || '';

  const projects = useAsync(
    () =>
      projectService.search({
        keyword: keyword || undefined,
        status: statusFilter,
        page,
        size: 10,
        sort: 'createdAt,desc'
      }),
    [keyword, statusFilter, page]
  );

  const data = projects.data;
  const loading = projects.loading && !data;

  return (
    <div>
      <HeroBanner
        accent="admin"
        eyebrow="Administration"
        title="Projects"
        description="Review every research project on INNOVASPHERE."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All projects</CardTitle>
              <CardDescription className="mt-1">Search, filter by status and browse the full project list.</CardDescription>
            </div>
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ('')}
              placeholder="Search projects by title…"
              className="w-full lg:w-72"
              aria-label="Search projects"
            />
          </div>
          <FilterChips options={STATUS_OPTIONS} active={status} onSelect={setStatus} className="mt-3" />
        </CardHeader>

        {projects.error ? (
          <ErrorState message={projects.error} onRetry={projects.reload} />
        ) : loading ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Owner</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Team</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : data && data.content.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No projects found"
              description="Try a different search term or clear the status filter."
            />
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Owner</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Team</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-md">
                    <Link to={`/projects/${p.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.owner.fullName} size="sm" />
                      <span className="text-slate-700 dark:text-slate-300">{p.owner.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={projectStatusTone(p.status)}>{projectStatusLabel(p.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.memberCount}/{p.teamSize}
                  </TableCell>
                  <TableCell>{formatDate(p.createdAt)}</TableCell>
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