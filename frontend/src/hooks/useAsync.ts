import { useCallback, useEffect, useRef, useState } from 'react';
import { extractApiError } from '../api/client';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOptions {
  keepDataOnError?: boolean;
  timeoutMs?: number;
}

/**
 * Runs `fetcher` and returns data / loading / error plus a `reload` to retry.
 * Safe against updating state after unmount.
 *
 * Features:
 * - Abort controller: when `run()` is called again (e.g. deps changed), the
 *   previous in-flight fetch is aborted so it can't overwrite newer state.
 * - Timeout: if `fetcher` takes longer than `timeoutMs` (default 10s), the
 *   request is aborted and an error is set, preventing stuck loading states.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options: UseAsyncOptions = {}
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const mounted = useRef(true);
  const runId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutId = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearTimeoutId();
  };

  const run = useCallback(() => {
    // Abort any in-flight request from a previous run
    abort();

    const id = ++runId.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set up timeout if configured
    const timeoutMs = options.timeoutMs ?? 10000;
    timeoutRef.current = setTimeout(() => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      if (mounted.current && runId.current === id) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Request timed out. Please try again.',
        }));
      }
    }, timeoutMs);

    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (mounted.current && runId.current === id) {
          clearTimeoutId();
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        // Aborted requests should not set error state
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (mounted.current && runId.current === id) {
          setState((prev) => ({ ...prev, loading: false, error: extractApiError(err) }));
        }
      });
  }, [options.keepDataOnError, options.timeoutMs]);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
      abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}
