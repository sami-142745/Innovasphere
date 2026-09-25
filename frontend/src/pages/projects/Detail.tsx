import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, ExternalLink, Users } from 'lucide-react';
import { extractApiError } from '../../api/client';
import { JoinRequestForm } from '../../components/forms/JoinRequestForm';
import { Avatar, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmationDialog, EmptyState, ErrorState, Modal, Skeleton, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { projectService } from '../../services/projects';
import { teamService } from '../../services/teams';
import type { JoinRequestDto, ProjectDto, RequestStatus, TeamDto } from '../../types';
import { cn } from '../../utils/cn';
import { coverGradient, formatDate, projectStatusLabel, projectStatusStroke, projectStatusTone, requestStatusClasses, requestStatusLabel, timeAgo } from '../../utils/format';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const projectState = useAsync<ProjectDto>(
    () => (id ? projectService.get(id) : Promise.reject(new Error('Invalid project id'))),
    [id]
  );
  const project = projectState.data;
  const isOwner = Boolean(project && user && project.owner.id === user.id);
  const isStudent = user?.role === 'STUDENT';

  const teamsState = useAsync<TeamDto[]>(
    () => (project && id ? teamService.listForProject(id) : Promise.resolve([])),
    [id, Boolean(project)]
  );

  const requestsState = useAsync<JoinRequestDto[]>(
    () => (isOwner && id ? projectService.listJoinRequestsForProject(id) : Promise.resolve([])),
    [id, isOwner]
  );

  if (!id) {
    return <ErrorState message="Project not found." />;
  }

  if (projectState.loading) {
    return <Spinner label="Loading project…" />;
  }

  if (projectState.error || !project) {
    return <ErrorState message={projectState.error ?? 'Could not load this project.'} onRetry={projectState.reload} />;
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectService.remove(project.id);
      success('Project deleted.');
      navigate('/projects', { replace: true });
    } catch (err) {
      toastError(extractApiError(err, 'Could not delete the project.'));
      setDeleting(false);
    }
  };

  const handleDecide = async (request: JoinRequestDto, decision: Exclude<RequestStatus, 'PENDING'>) => {
    setDecidingId(request.id);
    try {
      await projectService.decideJoinRequest(project.id, request.id, decision);
      success(decision === 'ACCEPTED' ? 'Join request accepted.' : 'Join request rejected.');
      requestsState.reload();
    } catch (err) {
      toastError(extractApiError(err, 'Could not update the join request.'));
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="glass-panel relative mb-8 overflow-hidden rounded-panel">
        <div className={cn('relative h-32 overflow-hidden bg-gradient-to-br sm:h-40', coverGradient(project.id || project.title))}>
          <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
          <div className="blob blob-purple -right-10 -top-16 h-56 w-56 opacity-70" aria-hidden="true" />
          <div className="blob blob-cyan bottom-[-40px] left-10 h-44 w-44 opacity-50" aria-hidden="true" />
        </div>
        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-8 flex flex-col gap-5 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Badge tone={projectStatusTone(project.status)} dot className="mb-2 shadow-card">
                {projectStatusLabel(project.status)}
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[32px] dark:text-slate-50">{project.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Avatar name={project.owner.fullName} size="sm" />
                  {project.owner.fullName}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  Created {formatDate(project.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {project.memberCount}/{project.teamSize} members
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {isOwner ? (
                <>
                  <Link to={`/projects/edit/${project.id}`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                    Delete
                  </Button>
                </>
              ) : isStudent ? (
                <Button variant="gradient" onClick={() => setJoinModalOpen(true)}>
                  Request to join
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About this project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{project.description}</p>
            </CardContent>
          </Card>

          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass group flex items-center justify-between rounded-card-sm p-4 transition hover:border-brand-400 dark:hover:border-brand-400/40"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Repository</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition group-hover:gap-2.5 dark:text-brand-400">
                Open repository
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          )}

          {(project.domains.length > 0 || project.skills.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Domains &amp; skills</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {project.domains.map((d) => (
                  <Badge key={d.id} tone="brand">
                    {d.name}
                  </Badge>
                ))}
                {project.skills.map((s) => (
                  <Badge key={s.id}>{s.name}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                  <span className={cn('h-2 w-2 rounded-full', projectStatusStroke(project.status))} aria-hidden="true" />
                  {projectStatusLabel(project.status)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Team size</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{project.teamSize}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Members</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{project.memberCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Owner</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{project.owner.fullName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(project.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Updated</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(project.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>{teamsState.data?.length ?? 0} team{teamsState.data?.length === 1 ? '' : 's'} working on this project.</CardDescription>
          </CardHeader>
          <CardContent>
            {teamsState.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : teamsState.error ? (
              <ErrorState message={teamsState.error} onRetry={teamsState.reload} />
            ) : teamsState.data && teamsState.data.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamsState.data.map((team) => (
                  <li key={team.id}>
                    <Link
                      to={`/teams/${team.id}`}
                      className="group flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                          {team.name}
                        </p>
                        {team.description ? (
                          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{team.description}</p>
                        ) : null}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {team.members.length} member{team.members.length === 1 ? '' : 's'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No teams yet" description="Teams are formed once members join this project." />
            )}
          </CardContent>
        </Card>
      </div>

      {isOwner && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Join requests</CardTitle>
              <CardDescription>Review students who want to join this project.</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsState.loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }, (_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : requestsState.error ? (
                <ErrorState message={requestsState.error} onRetry={requestsState.reload} />
              ) : requestsState.data && requestsState.data.length > 0 ? (
                <ul className="space-y-3">
                  {requestsState.data.map((request) => (
                    <li key={request.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{request.studentName}</p>
                          {request.message ? (
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{request.message}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{timeAgo(request.createdAt)}</p>
                        </div>
                        <Badge className={cn('shrink-0', requestStatusClasses(request.status))}>
                          {requestStatusLabel(request.status)}
                        </Badge>
                      </div>
                      {request.status === 'PENDING' && (
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={decidingId !== null}
                            onClick={() => handleDecide(request, 'REJECTED')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            loading={decidingId === request.id}
                            disabled={decidingId !== null && decidingId !== request.id}
                            onClick={() => handleDecide(request, 'ACCEPTED')}
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No join requests yet" />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Request to join"
        description={project.title}
      >
        <JoinRequestForm projectId={project.id} projectTitle={project.title} onSuccess={() => setJoinModalOpen(false)} />
      </Modal>

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project"
        message={`Are you sure you want to delete "${project.title}"? This action cannot be undone.`}
        confirmLabel="Delete project"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}