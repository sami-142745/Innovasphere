import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { projectService } from '../../services/projects';
import { mentorService } from '../../services/mentors';
import { useAsync } from '../../hooks/useAsync';

interface MentorshipRequestFormProps {
  facultyId: string;
  facultyName: string;
  onSuccess: () => void;
}

export function MentorshipRequestForm({ facultyId, facultyName, onSuccess }: MentorshipRequestFormProps) {
  const { user } = useAuth();
  const { success, error } = useToast();

  const projects = useAsync(
    async () => {
      if (user?.role !== 'STUDENT') return [];
      const page = await projectService.my({ page: 0, size: 100 });
      return page.content;
    },
    [user?.id, user?.role]
  );

  const schema = z.object({
    projectId: z.string().uuid().optional().or(z.literal('')),
    message: z.string().min(10, 'Describe why you would like this mentor (at least 10 characters)').max(1000, 'At most 1000 characters')
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { projectId: '', message: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await mentorService.requestMentorship({
        facultyId,
        projectId: values.projectId || undefined,
        message: values.message
      });
      success(`Mentorship request sent to ${facultyName}.`);
      onSuccess();
    } catch (err) {
      error(extractApiError(err, 'Could not send the mentorship request.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/5 dark:text-brand-200">
        Requesting mentorship from <strong>{facultyName}</strong>.
      </div>
      {projects.data && projects.data.length > 0 && (
        <Select
          label="Related project (optional)"
          placeholder="Select one of your projects…"
          options={projects.data.map((p) => ({ value: p.id, label: p.title }))}
          {...register('projectId')}
          error={errors.projectId?.message}
        />
      )}
      <Textarea
        label="Message to your mentor"
        placeholder="What are you working on and how could their guidance help?"
        rows={4}
        {...register('message')}
        error={errors.message?.message}
      />
      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          Send request
        </Button>
      </div>
    </form>
  );
}