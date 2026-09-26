import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Filter, Sparkles, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { FilterChips } from '../../components/shared/FilterChips';
import { ProjectCard } from '../../components/shared/ProjectCard';
import { SortSelect } from '../../components/shared/SortSelect';
import { EmptyState, ErrorState, GridSkeleton, Input, Pagination, SearchInput } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import { projectService } from '../../services/projects';
import { extractApiError } from '../../api/client';
import type { Page, ProjectStatus, ProjectSummaryDto } from '../../types';
import { DEFAULT_PAGE_SIZE, PROJECT_SORT_OPTIONS, PROJECT_STATUSES } from '../../utils/constants';
import { getProjectCache, setProjectCache } from '../../utils/projectCache';

const STATUS_OPTIONS = [{ value: '', label: 'All' }, ...PROJECT_STATUSES];
const SORT_OPTIONS = PROJECT_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

export default function Directory() {
  const [keyword, setKeyword] = useUrlState('q');
  const [status, setStatus] = useUrlState('status');
  const [page, setPage] = useUrlState('page');
  const [domain, setDomain] = useState('');
  const [skill, setSkill] = useState('');
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const debouncedKeyword = useDebounce(keyword, 400);

  const pageNumber = Math.max(0, Number(page) || 0);

  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetPage = () => {
    if (page && page !== '0') setPage('0');
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    resetPage();
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    resetPage();
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    resetPage();
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    resetPage();
  };

  const handleSkillChange = (value: string) => {
    setSkill(value);
    resetPage();
  };

  const reload = () => {
    requestIdRef.current += 1;
  };

  const hasFilters = useMemo(() => 
    debouncedKeyword || domain.trim() || skill.trim() || status, 
    [debouncedKeyword, domain, skill, status]
  );

  const listQuery = useMemo(() => ({
    page: pageNumber,
    size: DEFAULT_PAGE_SIZE,
    sort,
    status: status as ProjectStatus | undefined,
  }), [pageNumber, sort, status]);

  const searchQuery = useMemo(() => ({
    page: pageNumber,
    size: DEFAULT_PAGE_SIZE,
    sort,
    keyword: debouncedKeyword || undefined,
    domain: domain.trim() || undefined,
    skill: skill.trim() || undefined,
    status: status as ProjectStatus | undefined,
  }), [pageNumber, debouncedKeyword, domain, skill, status, sort]);

  const currentQuery = hasFilters ? searchQuery : listQuery;

  useEffect(() => {
    const cached = getProjectCache(currentQuery);

    if (!cached) return;

    setProjects(cached.content ?? []);
    setTotalPages(cached.totalPages ?? 0);
    setTotalElements(cached.totalElements ?? 0);
    setLoading(false);
  }, [currentQuery]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let mounted = true;
    const requestId = ++requestIdRef.current;

    async function fetchProjects() {
      if (projects.length === 0) {
        setLoading(true);
      }

      setError(null);

      try {
        const isSearch = hasFilters;
        const response = isSearch
          ? await projectService.search(currentQuery, abortController.signal)
          : await projectService.list(listQuery, abortController.signal);

        if (!mounted) return;
        if (requestId !== requestIdRef.current) return;

        setProjectCache(currentQuery, response);

        setProjects(response.content ?? []);
        setTotalPages(response.totalPages ?? 0);
        setTotalElements(response.totalElements ?? 0);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!mounted) return;
        if (requestId !== requestIdRef.current) return;

        setError(extractApiError(err));
      } finally {
        if (mounted && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchProjects();

    return () => {
      mounted = false;
      abortControllerRef.current?.abort();
    };
  }, [currentQuery, hasFilters, listQuery]);

  useEffect(() => {
    if (loading) return;
    if (projects.length === 0) return;

    const nextPage = pageNumber + 1;
    const prevPage = pageNumber - 1;

    const baseQuery = { ...currentQuery };

    if (nextPage < totalPages) {
      const nextQuery = { ...baseQuery, page: nextPage };
      if (!getProjectCache(nextQuery)) {
        const isSearch = hasFilters;
        (isSearch ? projectService.search(nextQuery) : projectService.list({ ...listQuery, page: nextPage }))
          .then(data => setProjectCache(nextQuery, data))
          .catch(() => {});
      }
    }

    if (prevPage >= 0) {
      const prevQuery = { ...baseQuery, page: prevPage };
      if (!getProjectCache(prevQuery)) {
        const isSearch = hasFilters;
        (isSearch ? projectService.search(prevQuery) : projectService.list({ ...listQuery, page: prevPage }))
          .then(data => setProjectCache(prevQuery, data))
          .catch(() => {});
      }
    }
  }, [currentQuery, totalPages, loading, projects.length, hasFilters, listQuery]);

  useEffect(() => {
    if (totalPages > 0 && pageNumber >= totalPages) {
      setPage('0');
    }
  }, [totalPages, pageNumber, setPage]);

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72" aria-hidden="true">
        <div className="blob blob-purple h-full w-full opacity-30" />
      </div>

      <div className="relative mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-brand-50/70 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Research marketplace
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-[36px] dark:text-slate-50">
          Browse <span className="gradient-text">research projects</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Explore collaborations by domain, skill or open team spots — then join a team that fits you.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel mb-6 rounded-panel p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <SearchInput
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              onClear={() => handleKeywordChange('')}
              placeholder="Search projects…"
              aria-label="Search projects"
            />
          </div>
          <Input
            aria-label="Filter by domain"
            placeholder="Domain"
            value={domain}
            onChange={(e) => handleDomainChange(e.target.value)}
          />
          <Input
            aria-label="Filter by skill"
            placeholder="Skill"
            value={skill}
            onChange={(e) => handleSkillChange(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
          <FilterChips options={STATUS_OPTIONS} active={status} onSelect={handleStatusChange} />
          <div className="flex items-center gap-2">
            <SortSelect value={sort} onChange={handleSortChange} options={SORT_OPTIONS} />
          </div>
        </div>
      </motion.div>

      {!loading && !error && totalElements > 0 && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          {totalElements} project{totalElements === 1 ? '' : 's'}
          {status ? ` · ${STATUS_OPTIONS.find((o) => o.value === status)?.label}` : ''}
        </p>
      )}

      {loading && projects.length === 0 && <GridSkeleton count={6} />}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={Filter}
          title="No projects match your filters"
          description="Try adjusting your search keywords, domain or skill filters."
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <React.Fragment key={p.id}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ProjectCard project={p} />
                </motion.div>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-8">
            <Pagination
              page={pageNumber}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={DEFAULT_PAGE_SIZE}
              onChange={(p) => setPage(String(p))}
            />
          </div>
        </>
      )}
    </div>
  );
}