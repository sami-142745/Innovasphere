import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { projectService } from '../../services/projects';

interface JoinRequestFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess: () => void;
}

export function JoinRequestForm({ projectId, projectTitle, onSuccess }: JoinRequestFormProps) {
  const { success, error } = useToast();

  const schema = z.object({
    message: z.string().min(10, 'Tell the owner why you want to join (at least 10 characters)').max(1000, 'At most 1000 characters')
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { message: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await projectService.createJoinRequest(projectId, values.message);
      success(`Join request sent for “${projectTitle}”.`);
      onSuccess();
    } catch (err) {
      error(extractApiError(err, 'Could not send the join request.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Textarea
        label="Why do you want to join?"
        placeholder="Highlight skills, availability and enthusiasm…"
        rows={4}
        {...register('message')}
        error={errors.message?.message}
      />
      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          Send join request
        </Button>
      </div>
    </form>
  );
}