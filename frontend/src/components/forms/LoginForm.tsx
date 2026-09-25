import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      navigate(redirectTo || '/dashboard', { replace: true });
    } catch (err) {
      error(extractApiError(err, 'Invalid email or password.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input label="Email" type="email" autoComplete="email" placeholder="you@university.edu" {...register('email')} error={errors.email?.message} />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
      />
      <Button type="submit" variant="gradient" fullWidth loading={isSubmitting} className="mt-2">
        Sign in
      </Button>
    </form>
  );
}