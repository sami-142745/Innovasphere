import { useCallback, useEffect, useRef, useState } from 'react';
import { extractApiError } from '../api/client';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOptions {
  keepDataOnError?: boolean;
}

/**
 * Runs `fetcher` and returns data / loading / error plus a `reload` to retry.
 * Safe against updating state after unmount.
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

  const run = useCallback(() => {
    const id = ++runId.current;
    setState((prev) => ({ data: options.keepDataOnError ? prev.data : null, loading: true, error: null }));
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (mounted.current && runId.current === id) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (mounted.current && runId.current === id) {
          setState((prev) => ({ ...prev, loading: false, error: extractApiError(err) }));
        }
      });
  }, [options.keepDataOnError]);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}