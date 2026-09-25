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
import { REGISTRATION_ROLES } from '../../utils/constants';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50, 'At most 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'At most 50 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'At most 50 characters')
      .regex(/^[A-Za-z0-9._-]+$/, 'Letters, digits, dots, underscores and hyphens only'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address').max(255),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .max(100, 'At most 100 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, 'Uppercase, lowercase, digit and special character required'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'FACULTY'], { message: 'Choose a role' })
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type RegisterValues = z.infer<typeof schema>;

export function RegisterForm() {
  const { register: signUp } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT' }
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await signUp({
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      error(extractApiError(err, 'Could not create account. Please try again.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" autoComplete="given-name" placeholder="Ada" {...register('firstName')} error={errors.firstName?.message} />
        <Input label="Last name" autoComplete="family-name" placeholder="Lovelace" {...register('lastName')} error={errors.lastName?.message} />
      </div>
      <Input
        label="Username"
        autoComplete="username"
        placeholder="ada.lovelace"
        hint="3–50 characters: letters, digits, dots, underscores, hyphens."
        {...register('username')}
        error={errors.username?.message}
      />
      <Input label="Email" type="email" autoComplete="email" placeholder="you@university.edu" {...register('email')} error={errors.email?.message} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="8+ characters"
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
      </div>
      <Select
        label="I am a…"
        options={REGISTRATION_ROLES.map((r) => ({ value: r.value, label: r.label }))}
        {...register('role')}
        error={errors.role?.message}
      />
      <Button type="submit" variant="gradient" fullWidth loading={isSubmitting} className="mt-2">
        Create account
      </Button>
    </form>
  );
}