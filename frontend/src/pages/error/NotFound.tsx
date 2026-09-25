import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 dark:opacity-20" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-gradient-brand opacity-20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-accent-500 opacity-10 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-30 blur-2xl" aria-hidden="true" />
          <div className="relative grid h-20 w-20 place-items-center rounded-full border border-white/60 bg-white/70 shadow-card backdrop-blur-xl dark:border-slate-700/60 dark:bg-deep-900/70">
            <Compass className="h-9 w-9 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          </div>
        </div>
        <p className="gradient-text mt-8 text-[96px] font-black leading-none tracking-tighter">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for doesn’t exist or may have been moved.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button onClick={() => window.history.back()} variant="outline">
            Go back
          </Button>
          <Link to="/">
            <Button variant="gradient">
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}