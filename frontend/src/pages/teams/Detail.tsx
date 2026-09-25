import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, UserPlus } from 'lucide-react';
import { extractApiError } from '../../api/client';
import { InviteMemberForm } from '../../components/forms/InviteMemberForm';
import {
  Avatar,
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Textarea
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { teamService } from '../../services/teams';
import type { RequestStatus, Role, TeamDto, TeamInvitationDto } from '../../types';
import { requestStatusLabel, requestStatusTone, timeAgo, titleCase } from '../../utils/format';

function roleTone(role: Role): BadgeTone {
  switch (role) {
    case 'FACULTY':
      return 'brand';
    case 'ADMIN':
      return 'danger';
    default:
      return 'default';
  }
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={requestStatusTone(status)}>{requestStatusLabel(status)}</Badge>;
}

function EditTeamForm({ team, onClose, onSuccess }: { team: TeamDto; onClose: () => void; onSuccess: () => void }) {
  const { success, error } = useToast();

  const schema = z.object({
    name: z.string().min(3, 'Team name must be at least 3 characters').max(255, 'At most 255 characters'),
    description: z.string().max(2000, 'At most 2000 characters').optional().or(z.literal(''))
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: team.name, description: team.description ?? '' }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await teamService.update(team.id, { name: values.name, description: values.description || undefined });
      success('Team updated.');
      onSuccess();
      onClose();
    } catch (err) {
      error(extractApiError(err, 'Could not update the team.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input label="Team name" placeholder="e.g. Core research team" {...register('name')} error={errors.name?.message} />
      <Textarea
        label="Description"
        rows={4}
        placeholder="What does this team focus on?"
        hint="Optional · max 2000 characters."
        {...register('description')}
        error={errors.description?.message}
      />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const teamState = useAsync<TeamDto>(() => (id ? teamService.get(id) : Promise.reject(new Error('Invalid team id'))), [id]);
  const team = teamState.data;
  const isMember = Boolean(team && user && team.members.some((m) => m.id === user.id));

  const invitationsState = useAsync<TeamInvitationDto[]>(
    async () => {
      if (!isMember || !id) return [];
      return teamService.listInvitationsForTeam(id);
    },
    [id, isMember]
  );

  if (!id) {
    return <ErrorState message="Team not found." />;
  }

  if (teamState.loading) {
    return <Spinner label="Loading team…" />;
  }

  if (teamState.error || !team) {
    return <ErrorState message={teamState.error ?? 'Could not load this team.'} onRetry={teamState.reload} />;
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await teamService.remove(team.id);
      success('Team deleted.');
      navigate(`/projects/${team.projectId}`, { replace: true });
    } catch (err) {
      error(extractApiError(err, 'Could not delete the team.'));
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title={team.name}
        description={team.description || 'Team details, members and invitations.'}
        actions={
          isMember ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button className="inline-flex items-center gap-1.5" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Invite member
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit team
              </Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete team
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              Members
            </CardTitle>
            <CardDescription>
              {team.members.length} member{team.members.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {team.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={member.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.fullName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                  <Badge tone={roleTone(member.role)}>{titleCase(member.role)}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Related project</p>
              <Link
                to={`/projects/${team.projectId}`}
                className="mt-1 inline-block text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Open project →
              </Link>
            </div>
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{timeAgo(team.createdAt)}</p>
            </div>
            <p className="border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400 dark:border-slate-800 dark:text-slate-500">
              Team membership and join/invite flows are managed from the project page.
            </p>
          </CardContent>
        </Card>
      </div>

      {isMember && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>Sent invitations and their current state.</CardDescription>
          </CardHeader>
          <CardContent>
            {invitationsState.loading ? (
              <Spinner />
            ) : invitationsState.error ? (
              <ErrorState message={invitationsState.error} onRetry={invitationsState.reload} />
            ) : invitationsState.data && invitationsState.data.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Invitee</TableHeadCell>
                    <TableHeadCell>Invited by</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Sent</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitationsState.data.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{inv.inviteeName}</TableCell>
                      <TableCell>{inv.invitedByName}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-400">{timeAgo(inv.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="No invitations yet" description="Invite a member and track the request here." />
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite member"
        description={`Send an invitation to join ${team.name}.`}
      >
        <InviteMemberForm
          teamId={team.id}
          onSuccess={() => {
            setInviteOpen(false);
            invitationsState.reload();
          }}
        />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit team" description="Update the team name or description.">
        <EditTeamForm team={team} onClose={() => setEditOpen(false)} onSuccess={() => teamState.reload()} />
      </Modal>

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete team?"
        message={`"${team.name}" and all of its invitations will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete team"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}