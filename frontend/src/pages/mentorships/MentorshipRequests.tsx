import { useState } from 'react';
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
import { mentorService } from '../../services/mentors';
import type { MentorshipRequestDto, RequestStatus } from '../../types';
import { requestStatusLabel, requestStatusTone, timeAgo } from '../../utils/format';
import { HeroBanner } from '../../components/shared/HeroBanner';

type Decision = Exclude<RequestStatus, 'PENDING'>;

function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={requestStatusTone(status)}>{requestStatusLabel(status)}</Badge>;
}

export default function MentorshipRequests() {
  const { success, error } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const receivedState = useAsync<MentorshipRequestDto[]>(() => mentorService.receivedRequests(), []);
  const sentState = useAsync<MentorshipRequestDto[]>(() => mentorService.myRequests(), []);

  const decide = async (id: string, status: Decision) => {
    setBusyId(id);
    try {
      await mentorService.decideRequest(id, status);
      success(status === 'ACCEPTED' ? 'Mentorship request accepted.' : 'Mentorship request rejected.');
      receivedState.reload();
    } catch (err) {
      error(extractApiError(err, status === 'ACCEPTED' ? 'Could not accept the request.' : 'Could not reject the request.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        accent="faculty"
        eyebrow="Mentorship"
        title="Mentorship requests"
        description="Review incoming mentorship requests and track the ones you have sent."
      />

      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Received requests</h2>

          {receivedState.loading ? (
            <Spinner />
          ) : receivedState.error ? (
            <ErrorState message={receivedState.error} onRetry={receivedState.reload} />
          ) : receivedState.data && receivedState.data.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Student</TableHeadCell>
                    <TableHeadCell>Project</TableHeadCell>
                    <TableHeadCell>Message</TableHeadCell>
                    <TableHeadCell>Received</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-right">Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receivedState.data.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{req.studentName}</TableCell>
                      <TableCell>{req.projectTitle ?? <span className="text-slate-400 dark:text-slate-500">—</span>}</TableCell>
                      <TableCell>
                        {req.message ? (
                          <p className="max-w-xs truncate text-sm text-slate-600 dark:text-slate-300">{req.message}</p>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-400">{timeAgo(req.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => decide(req.id, 'ACCEPTED')}
                              loading={busyId === req.id}
                              disabled={busyId !== null && busyId !== req.id}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => decide(req.id, 'REJECTED')}
                              loading={busyId === req.id}
                              disabled={busyId !== null && busyId !== req.id}
                            >
                              Reject
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
            <EmptyState
              title="No received requests"
              description="When students ask for your mentorship, the requests appear here."
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Requests I&apos;ve sent</h2>

          {sentState.loading ? (
            <Spinner />
          ) : sentState.error ? (
            <ErrorState message={sentState.error} onRetry={sentState.reload} />
          ) : sentState.data && sentState.data.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Student</TableHeadCell>
                    <TableHeadCell>Faculty</TableHeadCell>
                    <TableHeadCell>Sent</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sentState.data.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{req.studentName}</TableCell>
                      <TableCell>{req.facultyName}</TableCell>
                      <TableCell className="whitespace-nowrap text-slate-400">{timeAgo(req.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState title="No sent requests" description="Mentorship requests you have sent are shown here." />
          )}
        </section>
      </div>
    </div>
  );
}