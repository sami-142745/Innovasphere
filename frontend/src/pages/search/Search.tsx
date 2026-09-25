import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { Badge, EmptyState, ErrorState, GridSkeleton, SearchInput } from '../../components/ui';
import { FilterChips, type ChipOption } from '../../components/shared/FilterChips';
import { MentorCard } from '../../components/shared/MentorCard';
import { ProjectCard } from '../../components/shared/ProjectCard';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import { mentorService } from '../../services/mentors';
import { projectService } from '../../services/projects';

const SCOPE_OPTIONS: ChipOption[] = [
  { value: 'projects', label: 'Projects' },
  { value: 'mentors', label: 'Mentors' },
  { value: 'all', label: 'Projects + Mentors' }
];

function ProjectsResults({ keyword }: { keyword: string }) {
  const { data, loading, error, reload } = useAsync(
    () => projectService.search({ keyword, page: 0, size: 9 }),
    [keyword]
  );
  const content = data?.content ?? [];

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Projects</h2>
        {data && (
          <Badge tone="brand">
            {data.totalElements}
          </Badge>
        )}
      </div>
      {loading ? (
        <GridSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : content.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={keyword ? `No results for "${keyword}"` : 'No projects found'}
          description="Try different keywords, or broaden your search scope."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ProjectCard key={project.id} project={project} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function MentorsResults({ keyword }: { keyword: string }) {
  const { data, loading, error, reload } = useAsync(
    () => mentorService.search(keyword, undefined, 0, 9),
    [keyword]
  );
  const content = data?.content ?? [];

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Mentors</h2>
        {data && (
          <Badge tone="brand">
            {data.totalElements}
          </Badge>
        )}
      </div>
      {loading ? (
        <GridSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : content.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={keyword ? `No results for "${keyword}"` : 'No mentors found'}
          description="Try different keywords, or broaden your search scope."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((mentor, i) => (
            <motion.div key={mentor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <MentorCard key={mentor.id} mentor={mentor} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function SearchPage() {
  const [keyword, setKeyword] = useUrlState('q');
  const [scope, setScope] = useState('projects');
  const debouncedKeyword = useDebounce(keyword, 400);

  return (
    <div className="relative mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-50">Search</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Find research projects and mentors across INNOVASPHERE.
        </p>
      </div>

      <SearchInput
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onClear={() => setKeyword('')}
        placeholder="Search by title, keyword, domain or skill…"
        className="w-full max-w-2xl"
        inputClassName="h-12 text-base rounded-xl"
        aria-label="Search INNOVASPHERE"
      />
      <FilterChips className="mt-4" options={SCOPE_OPTIONS} active={scope} onSelect={setScope} deselectValue="all" />
      <div className="mt-8">
        {(scope === 'projects' || scope === 'all') && <ProjectsResults keyword={debouncedKeyword} />}
        {(scope === 'mentors' || scope === 'all') && <MentorsResults keyword={debouncedKeyword} />}
      </div>
    </div>
  );
}