import type { ProjectStatus, Role } from '../types';

export const PROJECT_STATUSES: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'LOOKING_FOR_TEAM', label: 'Looking for Team' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' }
];

export const REGISTRATION_ROLES: Array<{ value: Exclude<Role, 'ADMIN'>; label: string; description: string }> = [
  { value: 'STUDENT', label: 'Student', description: 'Find projects, form teams and request mentors.' },
  { value: 'FACULTY', label: 'Faculty', description: 'Mentor research projects and review requests.' }
];

export const DEFAULT_PAGE_SIZE = 9;

/**
 * Browse Projects uses a denser grid (6 per page) so more of the first screen
 * is project content instead of pagination chrome. Mentor and other
 * directories keep {@link DEFAULT_PAGE_SIZE}.
 */
export const PROJECT_DIRECTORY_PAGE_SIZE = 6;

export const AUTH_STORAGE_KEY = 'innovasphere.auth';
export const TOKEN_KEY = 'innovasphere.token';

export const PROJECT_SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'createdAt,asc', label: 'Oldest first' },
  { value: 'title,asc', label: 'Title A–Z' },
  { value: 'title,desc', label: 'Title Z–A' }
] as const;

export const NOTIFICATION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'JOIN_REQUEST', label: 'Join requests' },
  { value: 'TEAM_INVITATION', label: 'Team invitations' },
  { value: 'MENTORSHIP_REQUEST', label: 'Mentorship' },
  { value: 'PROJECT_UPDATE', label: 'Project updates' },
  { value: 'SYSTEM', label: 'System' }
] as const;