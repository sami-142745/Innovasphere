import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Reads a value from the URL query string and returns a setter that
 * keeps the query string in sync without triggering a navigation reload.
 */
export function useUrlState(key: string): [string, (value: string) => void] {
  const location = useLocation();
  const navigate = useNavigate();

  const value = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get(key) ?? '';
  }, [location.search, key]);

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(location.search);
      if (next && next.length > 0) {
        params.set(key, next);
      } else {
        params.delete(key);
      }
      const search = params.toString();
      navigate(search ? `?${search}` : location.pathname, { replace: true });
    },
    [location.search, location.pathname, key, navigate]
  );

  return [value, setValue];
}