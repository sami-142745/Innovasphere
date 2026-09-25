import { useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { extractApiError } from '../../api/client';
import { mentorService } from '../../services/mentors';
import type { MentorshipRequestDto, RequestStatus } from '../../types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Spinner
} from '../../components/ui';
import { formatDate, requestStatusLabel, timeAgo, titleCase } from '../../utils/format';
import { HeroBanner } from '../../components/shared/HeroBanner';

const STATUS_TONES: Record<RequestStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger'
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-900 sm:col-span-2 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [actingId, setActingId] = useState<string | null>(null);
  const { data, loading, error: loadError, reload } = useAsync(() => mentorService.receivedRequests(), [user?.id]);

  if (!user) return null;

  const facultyProfile = user.facultyProfile;

  const decide = async (request: MentorshipRequestDto, action: 'ACCEPTED' | 'REJECTED') => {
    setActingId(request.id);
    try {
      await mentorService.decideRequest(request.id, action);
      success(action === 'ACCEPTED' ? 'Mentorship request accepted' : 'Mentorship request rejected');
      reload();
    } catch (err) {
      error(extractApiError(err, 'Could not update the mentorship request.'));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <HeroBanner accent="faculty" eyebrow="Your profile" title="Profile" description="Your faculty profile and mentorship activity" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar name={user.fullName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</p>
                <div className="mt-1.5">
                  <Badge tone="brand">{titleCase(user.role)}</Badge>
                </div>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
              <Field label="Email" value={user.email} />
              <Field label="Username" value={`@${user.username}`} />
              <Field label="Member since" value={formatDate(user.createdAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic profile</CardTitle>
          </CardHeader>
          <CardContent>
            {facultyProfile ? (
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <Field label="Department" value={facultyProfile.department ?? '—'} />
                <Field label="Designation" value={facultyProfile.designation ?? '—'} />
                <Field label="Expertise" value={facultyProfile.expertise ?? '—'} />
                <Field label="Bio" value={facultyProfile.bio ?? '—'} />
              </dl>
            ) : (
              <EmptyState
                title="Profile details coming soon"
                description="Complete your faculty profile to help students find the right mentor."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research domains</CardTitle>
        </CardHeader>
        <CardContent>
          {facultyProfile && facultyProfile.researchDomains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {facultyProfile.researchDomains.map((d) => (
                <Badge key={d.id} tone="indigo">
                  {d.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No research domains added yet. Add domains to help students find you as a mentor.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mentorship requests received</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={reload} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="No mentorship requests"
              description="When students request your mentorship, they will appear here."
              icon={Users}
            />
          ) : (
            <ul className="space-y-3">
              {data.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.studentName}</p>
                      <Badge tone={STATUS_TONES[r.status]}>{requestStatusLabel(r.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.projectTitle ?? 'General mentorship request'}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Received {timeAgo(r.createdAt)}</p>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" loading={actingId === r.id} onClick={() => decide(r, 'ACCEPTED')}>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" disabled={actingId !== null} onClick={() => decide(r, 'REJECTED')}>
                        <X className="h-4 w-4" aria-hidden="true" />
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}