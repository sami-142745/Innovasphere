import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-rose-100 p-5 dark:bg-rose-900/40">
        <ShieldX className="h-10 w-10 text-rose-600 dark:text-rose-400" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Your account type does not have permission to view this page.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export default ForbiddenPage;