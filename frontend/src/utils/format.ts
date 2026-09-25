import type { ProjectStatus, RequestStatus } from '../types';
import type { BadgeTone } from '../components/ui/Badge';

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function timeAgo(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: Array<[number, string]> = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute']
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count === 1 ? '' : 's'} ago`;
  }
  return `${Math.max(seconds, 1)} sec${seconds === 1 ? '' : 's'} ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function capitalize(value?: string | null): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((p) => capitalize(p))
    .join(' ');
}

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  IDEA: 'Idea',
  LOOKING_FOR_TEAM: 'Looking for Team',
  IN_PROGRESS: 'In Progress',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed'
};

const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  IDEA: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  LOOKING_FOR_TEAM: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  COMPLETED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
};

const PROJECT_STATUS_STROKES: Record<ProjectStatus, string> = {
  IDEA: 'bg-slate-400',
  LOOKING_FOR_TEAM: 'bg-brand-500',
  IN_PROGRESS: 'bg-emerald-500',
  UNDER_REVIEW: 'bg-amber-500',
  COMPLETED: 'bg-indigo-500'
};

export function projectStatusLabel(status: ProjectStatus): string {
  return PROJECT_STATUS_LABELS[status] ?? status;
}

export function projectStatusClasses(status: ProjectStatus): string {
  return PROJECT_STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export function projectStatusStroke(status: ProjectStatus): string {
  return PROJECT_STATUS_STROKES[status] ?? 'bg-slate-400';
}

export function projectStatusTone(status: ProjectStatus): BadgeTone {
  switch (status) {
    case 'IN_PROGRESS':
      return 'success';
    case 'UNDER_REVIEW':
      return 'warning';
    case 'LOOKING_FOR_TEAM':
      return 'brand';
    case 'COMPLETED':
      return 'indigo';
    default:
      return 'default';
  }
}

export function requestStatusTone(status: RequestStatus): BadgeTone {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    default:
      return 'warning';
  }
}

const COVER_GRADIENTS = [
  'from-brand-600 via-indigo-500 to-accent-500',
  'from-purple-600 via-orchid-500 to-accent-500',
  'from-indigo-600 via-brand-600 to-purple-600',
  'from-accent-600 via-sky-500 to-brand-500',
  'from-fuchsia-600 via-purple-500 to-indigo-500',
  'from-sky-600 via-indigo-500 to-purple-600'
];

/** Deterministic decorative cover-art gradient derived from a stable string (title/id/domain). */
export function coverGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

const REQUEST_STATUS_CLASSES: Record<RequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  REJECTED: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
};

export function requestStatusLabel(status: RequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function requestStatusClasses(status: RequestStatus): string {
  return REQUEST_STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export function yearOfStudyLabel(year?: number | null): string {
  if (!year) return '—';
  const suffix = year % 10 === 1 && year % 100 !== 11 ? 'st' : year % 10 === 2 && year % 100 !== 12 ? 'nd' : year % 10 === 3 && year % 100 !== 13 ? 'rd' : 'th';
  return `${year}${suffix} Year`;
}