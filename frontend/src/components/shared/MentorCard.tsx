import { Link } from 'react-router-dom';
import { GraduationCap, BadgeCheck } from 'lucide-react';
import type { MentorDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { MatchScore } from './MatchScore';
import { cn } from '../../utils/cn';
import { coverGradient } from '../../utils/format';

export function MentorCard({ mentor, matchScore }: { mentor: MentorDto; matchScore?: number }) {
  return (
    <Link
      to={`/mentors/${mentor.id}`}
      className="group relative flex flex-col overflow-hidden rounded-panel border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-card-hover dark:border-white/[0.08] dark:bg-deep-800/80 dark:hover:border-brand-400/30 dark:hover:bg-deep-750"
    >
      <div className={cn('relative h-14 bg-gradient-to-br', coverGradient(mentor.id || mentor.name))}>
        <div className="absolute inset-0 bg-grid opacity-25" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col p-5 pt-0">
        <div className="-mt-7 flex items-end justify-between">
          <Avatar name={mentor.name} size="lg" ring className="shadow-card" />
          {typeof matchScore === 'number' && <MatchScore score={matchScore} />}
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-50 dark:group-hover:text-brand-300">
            {mentor.name}
          </h3>
          <BadgeCheck className="h-4 w-4 text-accent-500" aria-hidden="true" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {[mentor.designation, mentor.department].filter(Boolean).join(' · ') || 'Faculty'}
        </p>

        <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">
          {mentor.bio?.trim() || mentor.expertise?.trim() || 'No bio provided yet.'}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.researchDomains.slice(0, 3).map((d) => (
            <Badge key={d.id} tone="brand">
              {d.name}
            </Badge>
          ))}
          {mentor.skills.slice(0, 3).map((s) => (
            <Badge key={s.id}>{s.name}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            {mentor.activeMentorships} active mentorship{mentor.activeMentorships === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            Faculty mentor
          </span>
        </div>
      </div>
    </Link>
  );
}