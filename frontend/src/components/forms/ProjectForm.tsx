import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PROJECT_STATUSES } from '../../utils/constants';
import type { ProjectDto, ProjectStatus } from '../../types';
import { projectService } from '../../services/projects';

export interface ProjectFormValues {
  title: string;
  description: string;
  shortDescription: string;
  repositoryUrl: string;
  status: ProjectStatus | '';
}

const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }));

export function ProjectForm({ project, onSuccess }: { project?: ProjectDto; onSuccess?: () => void }) {
  const { user } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();
  const isEdit = Boolean(project);

  const isTeamOwner = project ? project.owner.id === user?.id : true;

  const schema = z
    .object({
      title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'At most 255 characters'),
      description: z.string().min(10, 'Please provide a description of at least 10 characters').max(10000),
      shortDescription: z.string().max(500, 'At most 500 characters').optional().or(z.literal('')),
      repositoryUrl: z
        .string()
        .max(500, 'At most 500 characters')
        .optional()
        .or(z.literal(''))
        .refine((v) => !v || /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(v), 'Enter a valid URL'),
      status: z.enum(['', 'IDEA', 'LOOKING_FOR_TEAM', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED'])
    })
    .superRefine((v, ctx) => {
      if (isEdit && isTeamOwner && !v.status) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['status'], message: 'Status is required when editing' });
      }
    });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: project?.title ?? '',
      description: project?.description ?? '',
      shortDescription: project?.shortDescription ?? '',
      repositoryUrl: project?.repositoryUrl ?? '',
      status: (project?.status ?? '') as FormValues['status']
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        shortDescription: values.shortDescription || null,
        repositoryUrl: values.repositoryUrl || null,
        status: (values.status || 'IDEA') as ProjectStatus,
        researchDomainIds: project?.domains.map((d) => d.id) ?? [],
        skillIds: project?.skills.map((s) => s.id) ?? []
      };
      if (isEdit && project) {
        await projectService.update(project.id, payload);
        success('Project updated.');
        onSuccess?.();
        navigate(`/projects/${project.id}`, { replace: true });
      } else {
        const created = await projectService.create(payload);
        success('Project created successfully.');
        navigate(`/projects/${created.id}`, { replace: true });
      }
    } catch (err) {
      error(extractApiError(err, isEdit ? 'Could not update the project.' : 'Could not create the project.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Input label="Title" placeholder="e.g. AI-assisted crop disease detection" {...register('title')} error={errors.title?.message} />
      <Input
        label="Short description"
        placeholder="One-liner anyone sees in cards and search"
        hint="Optional · shown on cards and search results."
        {...register('shortDescription')}
        error={errors.shortDescription?.message}
      />
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Full description
        </label>
        <textarea
          id="description"
          rows={7}
          placeholder="Objectives, motivation, expected outcomes, tech stack…"
          aria-invalid={errors.description ? true : undefined}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          {...register('description')}
        />
        {errors.description?.message ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {errors.description.message}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Min 10 characters.</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Repository URL"
          placeholder="https://github.com/your-repo"
          hint="Optional · public repo the team works from."
          {...register('repositoryUrl')}
          error={errors.repositoryUrl?.message}
        />
        <Select
          label="Status"
          placeholder={isEdit ? 'Keep current status' : 'Select status…'}
          options={PROJECT_STATUS_OPTIONS}
          {...register('status')}
          error={errors.status?.message}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}