import { Link } from 'react-router-dom';
import { Users, Rocket, ArrowRight } from 'lucide-react';
import type { ProjectSummaryDto } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { coverGradient, formatDate, projectStatusLabel, projectStatusTone } from '../../utils/format';

export function ProjectCard({ project, matchScore }: { project: ProjectSummaryDto; matchScore?: number }) {
  const tone = projectStatusTone(project.status);
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-panel border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-card-hover dark:border-white/[0.08] dark:bg-deep-800/80 dark:hover:border-brand-400/30 dark:hover:bg-deep-750"
    >
      {/* Cover art */}
      <div className={cn('relative h-24 overflow-hidden bg-gradient-to-br', coverGradient(project.id || project.title))}>
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
        <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl transition-transform duration-500 group-hover:scale-150" aria-hidden="true" />
        <Rocket className="absolute -bottom-2 -right-1 h-20 w-20 -rotate-12 text-white/20 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-0" aria-hidden="true" />
        <div className="absolute left-4 top-4 flex gap-1.5">
          <Badge tone={tone} dot className="border-white/20 bg-white/15 text-white backdrop-blur-md dark:text-white">
            {projectStatusLabel(project.status)}
          </Badge>
        </div>
        {typeof matchScore === 'number' && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {matchScore}% match
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-50 dark:group-hover:text-brand-300">
          {project.title}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {project.shortDescription?.trim() || project.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.domains.slice(0, 3).map((d) => (
            <Badge key={d.id} tone="brand">
              {d.name}
            </Badge>
          ))}
          {project.skills.slice(0, 4).map((s) => (
            <Badge key={s.id}>{s.name}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={project.owner.fullName} size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{project.owner.fullName}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatDate(project.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {project.memberCount}/{project.teamSize}
            </span>
            <ArrowRight className="h-4 w-4 -translate-x-1 text-brand-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Link>
  );
}