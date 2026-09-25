import { useCallback, useState } from 'react';

export interface PaginationControls {
  page: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePagination(initialPage = 0): PaginationControls {
  const [page, setPage] = useState(initialPage);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);

  return { page, setPage, nextPage, prevPage };
}