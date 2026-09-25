import { Link, useLocation } from 'react-router-dom';
import { AuthShell } from '../../components/forms/AuthShell';
import { LoginForm } from '../../components/forms/LoginForm';

interface LocationState {
  from?: string;
}

export default function Login() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your research workspace"
      footer={
        <span>
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Create an account
          </Link>
        </span>
      }
    >
      <LoginForm redirectTo={state?.from} />
    </AuthShell>
  );
}