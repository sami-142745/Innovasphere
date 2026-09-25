import { Link } from 'react-router-dom';
import { AuthShell } from '../../components/forms/AuthShell';
import { RegisterForm } from '../../components/forms/RegisterForm';

export default function Register() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join students and faculty on INNOVASPHERE"
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Sign in
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}