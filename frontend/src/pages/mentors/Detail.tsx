import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Users2 } from 'lucide-react';
import { MentorshipRequestForm } from '../../components/forms/MentorshipRequestForm';
import { MatchScore } from '../../components/shared/MatchScore';
import { Avatar, Badge, Button, Card, CardContent, ErrorState, Modal, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { mentorService } from '../../services/mentors';
import { recommendationService } from '../../services/recommendations';
import type { MentorDto, RecommendationScoreDto } from '../../types';
import { coverGradient, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [requestOpen, setRequestOpen] = useState(false);

  const mentorState = useAsync<MentorDto>(() => (id ? mentorService.get(id) : Promise.reject(new Error('Invalid mentor id'))), [id]);
  const mentor = mentorState.data;

  const scoreState = useAsync<RecommendationScoreDto | null>(
    async () => {
      if (!isStudent || !id) return null;
      return recommendationService.mentorScore(id);
    },
    [id, isStudent]
  );

  if (!id) {
    return <ErrorState message="Mentor not found." />;
  }

  if (mentorState.loading) {
    return <Spinner label="Loading mentor…" />;
  }

  if (mentorState.error || !mentor) {
    return <ErrorState message={mentorState.error ?? 'Could not load this mentor.'} onRetry={mentorState.reload} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          to="/mentors"
          className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all mentors
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div
          className={cn(
            'relative flex h-28 items-end bg-gradient-to-br px-6 sm:h-36 sm:px-8',
            coverGradient(mentor.id)
          )}
        >
          <span className="bg-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
        </div>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="-mt-16 w-fit drop-shadow-xl sm:-mt-20">
              <Avatar name={mentor.name} size="xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{mentor.name}</h1>
                <Badge tone="indigo">
                  <Award className="h-3 w-3" aria-hidden="true" />
                  Faculty
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                {[mentor.designation, mentor.department].filter(Boolean).join(' · ') || 'Faculty'}
              </p>
              {mentor.expertise && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{mentor.expertise}</p>}
              {mentor.bio && <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{mentor.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {mentor.researchDomains.map((d) => (
                  <Badge key={d.id} tone="brand">
                    {d.name}
                  </Badge>
                ))}
                {mentor.skills.map((s) => (
                  <Badge key={s.id}>{s.name}</Badge>
                ))}
              </div>
            </div>
            {isStudent && (
              <Button className="shrink-0" onClick={() => setRequestOpen(true)}>
                Request mentorship
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">About</p>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                {mentor.bio || 'This mentor has not added a bio yet.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <aside>
          <Card>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow-soft">
                  <Users2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active mentorships</p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{mentor.activeMentorships}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mentor since</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatDate(mentor.createdAt)}</p>
              </div>
              {isStudent && (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Match with you</p>
                    {scoreState.loading && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Computing…</p>}
                    {!scoreState.loading && !scoreState.data && !scoreState.error && (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">No match score available.</p>
                    )}
                  </div>
                  {typeof scoreState.data?.score === 'number' && <MatchScore score={scoreState.data.score} />}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request mentorship"
        description={`Send a mentorship request to ${mentor.name}.`}
      >
        <MentorshipRequestForm
          facultyId={mentor.id}
          facultyName={mentor.name}
          onSuccess={() => {
            setRequestOpen(false);
            scoreState.reload();
          }}
        />
      </Modal>
    </div>
  );
}