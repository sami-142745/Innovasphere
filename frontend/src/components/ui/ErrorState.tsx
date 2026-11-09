import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Failed to load data.', onRetry }: ErrorStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-panel border border-status-rejected-200/80 bg-status-rejected-50/60 px-6 py-12 text-center dark:border-status-rejected-500/20 dark:bg-status-rejected-950/20">
      <div className="blob blob-orchid h-36 w-36 opacity-30" aria-hidden="true" />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-status-rejected-600 to-status-rejected-800 shadow-[0_10px_30px_-8px_rgb(244_63_94/0.5)]">
        <AlertTriangle className="h-6 w-6 text-white" aria-hidden="true" />
      </div>
      <h3 className="relative mt-4 text-base font-semibold text-status-rejected-900 dark:text-status-rejected-200">Something went wrong</h3>
      <p className="relative mt-1 max-w-md text-sm text-status-rejected-700 dark:text-status-rejected-300">{message}</p>
      {onRetry && (
        <Button variant="outline" className="relative mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}