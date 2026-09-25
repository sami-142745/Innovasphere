import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { teamService } from '../../services/teams';

interface InviteMemberFormProps {
  teamId: string;
  onSuccess: () => void;
}

export function InviteMemberForm({ teamId, onSuccess }: InviteMemberFormProps) {
  const { success, error } = useToast();

  const schema = z.object({
    inviteeId: z.string().uuid('Enter a valid user ID (a UUID)'),
    message: z.string().min(1, 'A short message is required').max(1000, 'At most 1000 characters')
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { inviteeId: '', message: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await teamService.invite(teamId, { inviteeId: values.inviteeId, message: values.message });
      success('Invitation sent.');
      onSuccess();
    } catch (err) {
      error(extractApiError(err, 'Could not send the invitation.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="User ID"
        placeholder="00000000-0000-0000-0000-000000000000"
        hint="Paste the invitee’s account ID. (No user directory endpoint is exposed by the API.)"
        autoComplete="off"
        spellCheck={false}
        {...register('inviteeId')}
        error={errors.inviteeId?.message}
      />
      <Textarea label="Message" placeholder="Why would they be a good fit for the team?" rows={3} {...register('message')} error={errors.message?.message} />
      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          Send invitation
        </Button>
      </div>
    </form>
  );
}