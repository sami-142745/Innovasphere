import { useEffect, useMemo, useState } from 'react';
import { mentorService } from '../../services/mentors';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import { titleCase } from '../../utils/format';
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
import { BarChartCard } from '../../components/shared/Charts';
import { HeroBanner } from '../../components/shared/HeroBanner';

function departmentLabel(value: string): string {
  return /^[A-Z][A-Z0-9_]*$/.test(value) ? titleCase(value) : value;
}

export default function Faculty() {
  const [q, setQ] = useUrlState('q');
  const keyword = useDebounce(q, 400);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [keyword]);

  const mentors = useAsync(() => mentorService.search(keyword || undefined, undefined, page, 10), [keyword, page]);

  const data = mentors.data;
  const loading = mentors.loading && !data;

  const deptData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of data?.content ?? []) {
      const dept = (m.department ?? '').trim() || 'Not specified';
      counts.set(dept, (counts.get(dept) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([dept, value]) => ({ label: departmentLabel(dept), value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div>
      <HeroBanner
        accent="admin"
        eyebrow="Administration"
        title="Faculty & mentors"
        description="The researchers who mentor INNOVASPHERE projects."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Active mentors</CardTitle>
              <CardDescription className="mt-1">Search mentors by name, expertise or domain.</CardDescription>
            </div>
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ('')}
              placeholder="Search mentors…"
              className="w-full lg:w-72"
              aria-label="Search mentors"
            />
          </div>
        </CardHeader>

        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {mentors.error ? (
              <ErrorState message={mentors.error} onRetry={mentors.reload} />
            ) : loading ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Mentor</TableHeadCell>
                    <TableHeadCell>Department</TableHeadCell>
                    <TableHeadCell>Designation</TableHeadCell>
                    <TableHeadCell>Active mentorships</TableHeadCell>
                    <TableHeadCell>Domains</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : data && data.content.length === 0 ? (
              <EmptyState title="No mentors found" description="Try a different search term." />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Mentor</TableHeadCell>
                    <TableHeadCell>Department</TableHeadCell>
                    <TableHeadCell>Designation</TableHeadCell>
                    <TableHeadCell>Active mentorships</TableHeadCell>
                    <TableHeadCell>Expertise</TableHeadCell>
                    <TableHeadCell>Domains</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.content.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size="sm" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{m.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{m.department ?? '—'}</TableCell>
                      <TableCell>{m.designation ?? '—'}</TableCell>
                      <TableCell>{m.activeMentorships}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2 text-slate-500 dark:text-slate-400">{m.expertise ?? '—'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {m.researchDomains.slice(0, 3).map((d) => (
                            <Badge key={d.id} tone="brand">
                              {d.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <BarChartCard
            title="Mentors by department (derived)"
            description="From the mentors on this page"
            data={deptData}
            color="#6366f1"
          />
        </div>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={10} onChange={setPage} />
        </div>
      )}
    </div>
  );
}