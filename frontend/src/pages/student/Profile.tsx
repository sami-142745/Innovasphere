import { Link } from 'react-router-dom';
import { FileText, FolderPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { projectService } from '../../services/projects';
import type { ProjectStatus } from '../../types';
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Spinner
} from '../../components/ui';
import { formatDate, projectStatusLabel, titleCase, yearOfStudyLabel } from '../../utils/format';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { Button } from '../../components/ui/Button';

const STATUS_TONES: Record<ProjectStatus, 'default' | 'brand' | 'success' | 'warning' | 'indigo'> = {
  IDEA: 'default',
  LOOKING_FOR_TEAM: 'brand',
  IN_PROGRESS: 'success',
  UNDER_REVIEW: 'warning',
  COMPLETED: 'indigo'
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
  const { data, loading, error, reload } = useAsync(() => projectService.my({ page: 0, size: 5 }), [user?.id]);

  if (!user) return null;

  const studentProfile = user.studentProfile;
  const hasInterests = Boolean(studentProfile && (studentProfile.skills.length > 0 || studentProfile.researchDomains.length > 0));

  return (
    <div className="space-y-6">
      <HeroBanner eyebrow="Your profile" title="Profile" description="Your research profile and activity on INNOVASPHERE" />

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
            {studentProfile ? (
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <Field label="Enrollment number" value={studentProfile.enrollmentNumber ?? '—'} />
                <Field label="University" value={studentProfile.university ?? '—'} />
                <Field label="Department" value={studentProfile.department ?? '—'} />
                <Field label="Year of study" value={yearOfStudyLabel(studentProfile.yearOfStudy)} />
                <Field label="Bio" value={studentProfile.bio ?? '—'} />
              </dl>
            ) : (
              <EmptyState
                title="Profile details coming soon"
                description="Complete your academic profile to let teams and mentors find you."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research interests</CardTitle>
        </CardHeader>
        <CardContent>
          {hasInterests && studentProfile ? (
            <div className="flex flex-wrap gap-2">
              {studentProfile.skills.map((s) => (
                <Badge key={s.id} tone="default">
                  {s.name}
                </Badge>
              ))}
              {studentProfile.researchDomains.map((d) => (
                <Badge key={d.id} tone="indigo">
                  {d.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No research interests added yet. Add skills and domains to match with the right projects.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data || data.empty ? (
            <EmptyState
              title="No projects yet"
              description="Create your first research project to start building a team."
              icon={FolderPlus}
            >
              <Link to="/projects/create">
                <Button variant="gradient">Create a project</Button>
              </Link>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {data.content.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="group flex items-center justify-between gap-4 rounded-card border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:border-brand-300 hover:shadow-card dark:border-slate-800 dark:bg-deep-900/60 dark:hover:border-brand-700"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{p.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{p.shortDescription || p.description}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {p.memberCount}
                      </span>
                      <Badge tone={STATUS_TONES[p.status]}>{projectStatusLabel(p.status)}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}