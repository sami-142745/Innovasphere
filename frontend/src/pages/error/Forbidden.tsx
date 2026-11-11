import { ShieldX } from 'lucide-react';
import { ButtonLink } from '../../components/ui/Button';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-panel p-8 text-center">
        <div className="rounded-full bg-rose-100 p-5 dark:bg-rose-900/40 inline-flex">
          <ShieldX className="h-10 w-10 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your account type does not have permission to view this page.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <ButtonLink to="/dashboard">Go to dashboard</ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default ForbiddenPage;