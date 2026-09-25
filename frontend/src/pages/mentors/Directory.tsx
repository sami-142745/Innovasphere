import { useEffect, useState } from 'react';
import { FilterChips } from '../../components/shared/FilterChips';
import { MentorCard } from '../../components/shared/MentorCard';
import { SortSelect } from '../../components/shared/SortSelect';
import { EmptyState, ErrorState, GridSkeleton, Pagination, SearchInput } from '../../components/ui';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { mentorService } from '../../services/mentors';
import type { MentorDto, Page } from '../../types';
import { DEFAULT_PAGE_SIZE, PROJECT_SORT_OPTIONS } from '../../utils/constants';

const DOMAIN_FILTERS = [
  { value: '', label: 'All' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'IoT', label: 'IoT' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Mobile', label: 'Mobile' }
];

const SORT_OPTIONS = PROJECT_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

export default function Directory() {
  const [keyword, setKeyword] = useState('');
  const [domain, setDomain] = useState('');
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const debouncedKeyword = useDebounce(keyword, 400);
  const { page, setPage } = usePagination();

  const { data, loading, error, reload } = useAsync<Page<MentorDto>>(
    () => mentorService.search(debouncedKeyword || undefined, domain || undefined, page, DEFAULT_PAGE_SIZE),
    [debouncedKeyword, domain, page, sort]
  );

  useEffect(() => {
    if (data && data.totalPages > 0 && page >= data.totalPages) {
      setPage(0);
    }
  }, [data, page, setPage]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(0);
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(0);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        accent="faculty"
        eyebrow="Faculty network"
        title="Mentor directory"
        description="Browse faculty mentors, their research expertise and open mentorship capacity."
      />

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            className="flex-1"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onClear={() => handleKeywordChange('')}
            placeholder="Search by name, expertise or skill…"
            aria-label="Search mentors"
          />
          <SortSelect value={sort} onChange={handleSortChange} options={SORT_OPTIONS} />
        </div>
        <FilterChips options={DOMAIN_FILTERS} active={domain} onSelect={handleDomainChange} />
      </div>

      {loading && <GridSkeleton />}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && data && data.content.length === 0 && (
        <EmptyState title="No mentors match" description="Try a different keyword or domain filter." />
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={DEFAULT_PAGE_SIZE}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}