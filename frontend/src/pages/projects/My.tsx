import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProjectCard } from '../../components/shared/ProjectCard';
import { Button, EmptyState, ErrorState, GridSkeleton, Pagination } from '../../components/ui';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { projectService } from '../../services/projects';
import type { Page, ProjectSummaryDto } from '../../types';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

export default function My() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data, loading, error, reload } = useAsync<Page<ProjectSummaryDto>>(
    () => projectService.my({ page, size: DEFAULT_PAGE_SIZE }),
    [page, user?.id]
  );

  useEffect(() => {
    if (data && data.totalPages > 0 && page >= data.totalPages) {
      setPage(0);
    }
  }, [data, page]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        eyebrow="Your workspace"
        title="My projects"
        description="Research projects you have created and are managing."
        actions={
          <Link to="/projects/create">
            <Button variant="gradient">New project</Button>
          </Link>
        }
      />

      {loading && <GridSkeleton />}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && data && data.content.length === 0 && (
        <EmptyState
          title="You have no projects yet"
          description="Create your first research project and start building a team."
          actionLabel="Create your first project"
          onAction={() => navigate('/projects/create')}
        />
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={DEFAULT_PAGE_SIZE}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}