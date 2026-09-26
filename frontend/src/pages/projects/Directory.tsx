import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { getProjectCache, setProjectCache, getCacheKey } from '../../utils/projectCache';

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

  const reload = () => {
    requestIdRef.current += 1;
  };

  // Build the current query object
  const query = {
    page: pageNumber,
    size: DEFAULT_PAGE_SIZE,
    sort,
    keyword: debouncedKeyword || undefined,
    domain: domain.trim() || undefined,
    skill: skill.trim() || undefined,
    status: (status || undefined) as ProjectStatus | undefined,
  };

  // Load cached data immediately on mount or when query changes
  useEffect(() => {
    const cached = getProjectCache(query);
    
    if (cached) {
      setProjects(cached.content ?? []);
      setTotalElements(cached.totalElements ?? 0);
      setTotalPages(cached.totalPages ?? 0);
      setLoading(false);
    }
  }, [pageNumber, debouncedKeyword, domain, skill, status, sort]);

  // Prefetch neighbor pages for instant pagination
  useEffect(() => {
    if (loading) return;
    
    const nextPage = pageNumber + 1;
    const prevPage = pageNumber - 1;

    const baseQuery = {
      page: pageNumber,
      size: DEFAULT_PAGE_SIZE,
      sort,
      keyword: debouncedKeyword || undefined,
      domain: domain.trim() || undefined,
      skill: skill.trim() || undefined,
      status: (status || undefined) as ProjectStatus | undefined,
    };

    if (nextPage < totalPages) {
      const nextQuery = { ...baseQuery, page: nextPage };
      if (!getProjectCache(nextQuery)) {
        projectService.search(nextQuery)
          .then(data => setProjectCache(nextQuery, data))
          .catch(() => {});
      }
    }

    if (prevPage >= 0) {
      const prevQuery = { ...baseQuery, page: prevPage };
      if (!getProjectCache(prevQuery)) {
        projectService.search(prevQuery)
          .then(data => setProjectCache(prevQuery, data))
          .catch(() => {});
      }
    }
  }, [loading, pageNumber, totalPages, debouncedKeyword, domain, skill, status, sort]);

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;

    let mounted = true;

    async function loadProjects() {
      const currentQuery = {
        page: pageNumber,
        size: DEFAULT_PAGE_SIZE,
        sort,
        keyword: debouncedKeyword || undefined,
        domain: domain.trim() || undefined,
        skill: skill.trim() || undefined,
        status: (status || undefined) as ProjectStatus | undefined,
      };

      const hasData = projects.length > 0;
      if (!hasData) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await projectService.search(currentQuery);

        if (!mounted) return;
        if (currentRequestId !== requestIdRef.current) return;

        setProjects(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);

        // Update cache
        setProjectCache(currentQuery, data);
      } catch (err) {
        if (!mounted) return;
        if (currentRequestId !== requestIdRef.current) return;
        setError(extractApiError(err));
      } finally {
        if (mounted && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [pageNumber, debouncedKeyword, domain, skill, status, sort]);

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

      {/* Hero */}
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

      {/* Filter panel */}
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
            onChange={(e) => {
              setDomain(e.target.value);
              resetPage();
            }}
          />
          <Input
            aria-label="Filter by skill"
            placeholder="Skill"
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              resetPage();
            }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
          <FilterChips options={STATUS_OPTIONS} active={status} onSelect={handleStatusChange} />
          <div className="flex items-center gap-2">
            <SortSelect value={sort} onChange={handleSortChange} options={SORT_OPTIONS} />
          </div>
        </div>
      </motion.div>

      {/* Results meta */}
      {!loading && !error && totalElements > 0 && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          {totalElements} project{totalElements === 1 ? '' : 's'}
          {status ? ` · ${STATUS_OPTIONS.find((o) => o.value === status)?.label}` : ''}
        </p>
      )}

      {loading && <GridSkeleton count={6} />}

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