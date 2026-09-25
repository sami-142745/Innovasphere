import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { MentorRecommendationDto, ProjectRecommendationDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { MatchScore } from './MatchScore';
import { cn } from '../../utils/cn';
import { coverGradient, projectStatusLabel, projectStatusTone } from '../../utils/format';

export function RecommendationCard({
  project,
  mentor,
  className
}: {
  project?: ProjectRecommendationDto;
  mentor?: MentorRecommendationDto;
  className?: string;
}) {
  if (!project && !mentor) return null;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-panel border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-card-hover dark:border-white/[0.08] dark:bg-deep-800/80 dark:hover:border-brand-400/30 dark:hover:bg-deep-750',
        className
      )}
    >
      {project && (
        <>
          <div className={cn('relative h-20 overflow-hidden bg-gradient-to-br', coverGradient(project.title))}>
            <div className="absolute inset-0 bg-grid opacity-25" aria-hidden="true" />
            <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform duration-500 group-hover:scale-150" aria-hidden="true" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI match
            </span>
          </div>
          <div className="flex flex-1 flex-col p-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-50">{project.title}</h3>
              <MatchScore score={project.matchScore} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Avatar name={project.owner.fullName} size="sm" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{project.owner.fullName}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.matchedDomains.map((domain) => (
                <Badge key={domain} tone="brand">
                  {domain}
                </Badge>
              ))}
              {project.missingSkills.slice(0, 2).map((skill) => (
                <Badge key={skill} tone="danger">
                  {skill}
                </Badge>
              ))}
            </div>
            {project.reason && <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{project.reason}</p>}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
              <Badge tone={projectStatusTone(project.status)}>{projectStatusLabel(project.status)}</Badge>
              <Link
                to={`/projects/${project.projectId}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition group-hover:gap-1.5 dark:text-brand-400"
              >
                View <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </>
      )}

      {mentor && (
        <>
          <div className={cn('relative h-12 overflow-hidden bg-gradient-to-br', coverGradient(mentor.name))}>
            <div className="absolute inset-0 bg-grid opacity-25" aria-hidden="true" />
          </div>
          <div className="flex flex-1 flex-col p-5 pt-0">
            <div className="-mt-7 flex items-end justify-between">
              <Avatar name={mentor.name} size="lg" ring className="shadow-card" />
              <MatchScore score={mentor.matchScore} />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">{mentor.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {[mentor.department, mentor.expertise].filter(Boolean).join(' · ') || 'Faculty'}
            </p>
            {mentor.reason && <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{mentor.reason}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.matchedDomains.slice(0, 2).map((domain) => (
                <Badge key={domain} tone="brand">
                  {domain}
                </Badge>
              ))}
              {mentor.matchedSkills.slice(0, 3).map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
              <Link
                to={`/mentors/${mentor.mentorId}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition group-hover:gap-1.5 dark:text-brand-400"
              >
                View profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}