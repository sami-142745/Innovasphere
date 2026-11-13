import { Link } from 'react-router-dom';
import { FileText, FolderPlus, Users, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useState } from 'react';
import { projectService } from '../../services/projects';
import { profileService } from '../../services/profile';
import { skillService } from '../../services/skills';
import { researchDomainService } from '../../services/research-domains';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ProjectStatus, Role, SkillDto, ResearchDomainDto } from '../../types';
import {
  Avatar,
  Badge,
  ButtonLink,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Select,
  Textarea,
  Spinner
} from '../../components/ui';
import { formatDate, projectStatusLabel, titleCase, yearOfStudyLabel } from '../../utils/format';
import { HeroBanner } from '../../components/shared/HeroBanner';

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

const userSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'At most 50 characters'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'At most 255 characters'),
  email: z.string().email('Invalid email address').max(255, 'At most 255 characters')
});

const studentSchema = z.object({
  enrollmentNumber: z.string().max(100, 'At most 100 characters').optional().or(z.literal('')),
  university: z.string().max(255, 'At most 255 characters').optional().or(z.literal('')),
  department: z.string().max(255, 'At most 255 characters').optional().or(z.literal('')),
  yearOfStudy: z.coerce.number().min(1, 'Must be between 1 and 8').max(8, 'Must be between 1 and 8').optional(),
  bio: z.string().max(2000, 'At most 2000 characters').optional().or(z.literal(''))
});

export default function Profile() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => projectService.my({ page: 0, size: 5 }), [user?.id]);
  const { success, error: toastError } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<'user' | 'student' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const skills = useAsync(() => skillService.list(), []);
  const domains = useAsync(() => researchDomainService.list(), []);

  if (!user) return null;

  const studentProfile = user.studentProfile;
  const profileSkills = studentProfile?.skills;
  const researchDomains = studentProfile?.researchDomains;
  const hasSkills = profileSkills !== undefined && profileSkills !== null && profileSkills.length > 0;
  const hasDomains = researchDomains !== undefined && researchDomains !== null && researchDomains.length > 0;
  const hasInterests = studentProfile !== undefined && studentProfile !== null && (hasSkills || hasDomains);

  const handleUserSave = async (values: z.infer<typeof userSchema>) => {
    setSubmitting(true);
    try {
      await profileService.updateUser(values);
      success('Account updated.');
      setEditOpen(false);
      setEditingProfile(null);
    } catch (err) {
      toastError(extractApiError(err, 'Could not update account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentSave = async (values: z.infer<typeof studentSchema>) => {
    setSubmitting(true);
    try {
      const selectedSkillIds = skills.data?.map((s) => s.id) ?? [];
      const selectedDomainIds = domains.data?.map((d) => d.id) ?? [];
      await profileService.updateStudentProfile({
        enrollmentNumber: values.enrollmentNumber || undefined,
        university: values.university || undefined,
        department: values.department || undefined,
        yearOfStudy: values.yearOfStudy,
        bio: values.bio || undefined,
        skillIds: selectedSkillIds,
        researchDomainIds: selectedDomainIds
      });
      success('Profile updated.');
      setEditOpen(false);
      setEditingProfile(null);
    } catch (err) {
      toastError(extractApiError(err, 'Could not update profile.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <HeroBanner eyebrow="Your profile" title="Profile" description="Your research profile and activity on INNOVASPHERE" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Account</CardTitle>
            <Button size="sm" onClick={() => { setEditingProfile('user'); setEditOpen(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
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
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Academic profile</CardTitle>
            <Button size="sm" onClick={() => { setEditingProfile('student'); setEditOpen(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
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
              {profileSkills ? profileSkills.map((s) => (
                <Badge key={s.id} tone="default">
                  {s.name}
                </Badge>
              )) : null}
              {researchDomains ? researchDomains.map((d) => (
                <Badge key={d.id} tone="indigo">
                  {d.name}
                </Badge>
              )) : null}
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
              <ButtonLink variant="gradient" to="/projects/create">Create a project</ButtonLink>
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
                        <span className="truncate">{p.shortDescription ?? ''}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {p.memberCount ?? 0}
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

      {editOpen && (
        <Modal
          open={true}
          onClose={() => { setEditOpen(false); setEditingProfile(null); }}
          title={editingProfile === 'user' ? 'Edit account' : 'Edit academic profile'}
          description={editingProfile === 'user'
            ? 'Update your username, full name and email address.'
            : 'Update your enrollment, department, bio, skills and research domains.'}
        >
          {editingProfile === 'user' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                handleUserSave({
                  username: (formData.get('username') as string) || user.username,
                  fullName: (formData.get('fullName') as string) || user.fullName,
                  email: (formData.get('email') as string) || user.email
                });
              }}
              className="space-y-4"
              noValidate
            >
              <Input label="Username" name="username" defaultValue={user.username} />
              <Input label="Full name" name="fullName" defaultValue={user.fullName} />
              <Input label="Email" name="email" type="email" defaultValue={user.email} />
              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => { setEditOpen(false); setEditingProfile(null); }}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save changes
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                handleStudentSave({
                  enrollmentNumber: (formData.get('enrollmentNumber') as string) || undefined,
                  university: (formData.get('university') as string) || undefined,
                  department: (formData.get('department') as string) || undefined,
                  yearOfStudy: (formData.get('yearOfStudy') as string) ? Number(formData.get('yearOfStudy')) : undefined,
                  bio: (formData.get('bio') as string) || undefined
                });
              }}
              className="space-y-4"
              noValidate
            >
              <Input label="Enrollment number" name="enrollmentNumber" defaultValue={studentProfile?.enrollmentNumber ?? ''} />
              <Input label="University" name="university" defaultValue={studentProfile?.university ?? ''} />
              <Input label="Department" name="department" defaultValue={studentProfile?.department ?? ''} />
              <Input label="Year of study" name="yearOfStudy" type="number" min="1" max="8" defaultValue={studentProfile?.yearOfStudy ?? ''} />
              <Textarea label="Bio" name="bio" rows={3} defaultValue={studentProfile?.bio ?? ''} />
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Skills</p>
                <div className="flex flex-wrap gap-2 border border-slate-200 dark:border-slate-700 rounded-md p-3" style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {(skills.data ?? []).map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        name="skillIds"
                        value={s.id}
                        defaultChecked={profileSkills?.some((ps) => ps.id === s.id) ?? false}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Research domains</p>
                <div className="flex flex-wrap gap-2 border border-slate-200 dark:border-slate-700 rounded-md p-3" style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {(domains.data ?? []).map((d) => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        name="researchDomainIds"
                        value={d.id}
                        defaultChecked={researchDomains?.some((rd) => rd.id === d.id) ?? false}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => { setEditOpen(false); setEditingProfile(null); }}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
