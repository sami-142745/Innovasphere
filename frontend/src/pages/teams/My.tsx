import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox, Mail } from 'lucide-react';
import { extractApiError } from '../../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { invitationService } from '../../services/invitations';
import { projectService } from '../../services/projects';
import type { JoinRequestDto, RequestStatus, TeamInvitationDto } from '../../types';
import { requestStatusLabel, requestStatusTone, timeAgo } from '../../utils/format';
import { HeroBanner } from '../../components/shared/HeroBanner';

function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={requestStatusTone(status)}>{requestStatusLabel(status)}</Badge>;
}

export default function My() {
  const { success, error } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const joinRequests = useAsync<JoinRequestDto[]>(() => projectService.myJoinRequests(), []);
  const invitations = useAsync<TeamInvitationDto[]>(() => invitationService.my(), []);

  const decideInvitation = async (id: string, action: 'accept' | 'reject') => {
    setBusyId(id);
    try {
      if (action === 'accept') {
        await invitationService.accept(id);
        success('Invitation accepted.');
      } else {
        await invitationService.reject(id);
        success('Invitation declined.');
      }
      invitations.reload();
    } catch (err) {
      error(extractApiError(err, action === 'accept' ? 'Could not accept the invitation.' : 'Could not decline the invitation.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        eyebrow="Collaboration"
        title="My teams"
        description="Track your join requests and team invitations."
      />

      <div className="glass-panel mb-6 flex flex-col gap-3 rounded-panel p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Teams you belong to are managed through their project. Open a project to see member roles and team details.
        </p>
        <Link
          to="/projects"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Browse projects
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Inbox className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            My join requests
          </h2>

          {joinRequests.loading ? (
            <Spinner />
          ) : joinRequests.error ? (
            <ErrorState message={joinRequests.error} onRetry={joinRequests.reload} />
          ) : joinRequests.data && joinRequests.data.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Project</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Message</TableHeadCell>
                    <TableHeadCell>Requested</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {joinRequests.data.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{req.projectTitle}</TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                        {req.status === 'PENDING' && (
                          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Waiting on the project owner.</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.message ? (
                          <p className="max-w-xs truncate text-sm text-slate-600 dark:text-slate-300">{req.message}</p>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-400">{timeAgo(req.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              title="No join requests yet"
              description="When you request to join a project, it will appear here."
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            Team invitations
          </h2>

          {invitations.loading ? (
            <Spinner />
          ) : invitations.error ? (
            <ErrorState message={invitations.error} onRetry={invitations.reload} />
          ) : invitations.data && invitations.data.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Team</TableHeadCell>
                    <TableHeadCell>Project</TableHeadCell>
                    <TableHeadCell>Invited by</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Received</TableHeadCell>
                    <TableHeadCell className="text-right">Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.data.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{inv.teamName}</TableCell>
                      <TableCell>{inv.projectTitle}</TableCell>
                      <TableCell>{inv.invitedByName}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-400">{timeAgo(inv.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {inv.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => decideInvitation(inv.id, 'accept')}
                              loading={busyId === inv.id}
                              disabled={busyId !== null && busyId !== inv.id}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => decideInvitation(inv.id, 'reject')}
                              loading={busyId === inv.id}
                              disabled={busyId !== null && busyId !== inv.id}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState title="No team invitations" description="Invitations to join a team will show up here." />
          )}
        </section>
      </div>
    </div>
  );
}