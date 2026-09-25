import { useParams } from 'react-router-dom';
import { ProjectForm } from '../../components/forms/ProjectForm';
import { Card, CardContent, ErrorState, Spinner } from '../../components/ui';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { projectService } from '../../services/projects';
import type { ProjectDto } from '../../types';
import { ForbiddenPage } from '../error/Forbidden';

export default function Edit() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: project, loading, error, reload } = useAsync<ProjectDto>(
    () => (id ? projectService.get(id) : Promise.reject(new Error('Invalid project id'))),
    [id]
  );

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (loading) {
    return <Spinner label="Loading project…" />;
  }

  if (!project) {
    return null;
  }

  if (project.owner.id !== user?.id) {
    return <ForbiddenPage />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <HeroBanner eyebrow="Project settings" title="Edit project" description="Update the project details and team requirements." />
      <Card className="relative mt-6 overflow-hidden rounded-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" aria-hidden="true" />
        <CardContent className="p-6 sm:p-8">
          <ProjectForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}