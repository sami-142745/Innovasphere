import type {
  AuthResponse,
  NotificationDto,
  Page,
  ProjectRecommendationDto,
  ProjectSummaryDto,
  UserProfileDto
} from '../types';

export function makeUser(overrides: Partial<UserProfileDto> = {}): UserProfileDto {
  return {
    id: 'u-1',
    username: 'ada.lovelace',
    email: 'ada@university.edu',
    fullName: 'Ada Lovelace',
    role: 'STUDENT',
    active: true,
    createdAt: '2026-01-10T09:00:00Z',
    studentProfile: {
      id: 'sp-1',
      enrollmentNumber: 'ENR-001',
      university: 'INNOVASPHERE University',
      department: 'Computer Science',
      yearOfStudy: 3,
      bio: 'Analytical engine enthusiast.',
      skills: [{ id: 's1', name: 'Mathematics' }],
      researchDomains: [{ id: 'd1', name: 'Artificial Intelligence' }]
    },
    ...overrides
  };
}

export function makeAuth(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    token: 'test-token',
    user: makeUser(),
    expiresIn: 3600,
    ...overrides
  };
}

export function makeProject(overrides: Partial<ProjectSummaryDto> = {}): ProjectSummaryDto {
  return {
    id: 'p-1',
    title: 'Neural Interface Design',
    shortDescription: 'A novel brain-computer interface for accessibility.',
    description: 'Research into neural interface design with open hardware.',
    status: 'IN_PROGRESS',
    owner: {
      id: 'u-1',
      username: 'ada.lovelace',
      email: 'ada@university.edu',
      fullName: 'Ada Lovelace',
      role: 'STUDENT',
      active: true,
      createdAt: '2026-01-10T09:00:00Z'
    },
    domains: [{ id: 'd1', name: 'Artificial Intelligence' }],
    skills: [{ id: 's1', name: 'Mathematics' }, { id: 's2', name: 'Python' }],
    teamSize: 4,
    memberCount: 2,
    createdAt: '2026-02-01T10:30:00Z',
    ...overrides
  };
}

export function makeNotification(overrides: Partial<NotificationDto> = {}): NotificationDto {
  return {
    id: 'n-1',
    type: 'PROJECT_UPDATE',
    title: 'Project updated',
    message: 'Your project moved to In Progress.',
    read: false,
    createdAt: '2026-02-02T12:00:00Z',
    ...overrides
  };
}

export function makePage<T>(content: T[], totalElements = content.length, page = 0, size = 9): Page<T> {
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size,
    numberOfElements: content.length,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0
  };
}

export function makeRecommendedProject(overrides: Partial<ProjectRecommendationDto> = {}): ProjectRecommendationDto {
  return {
    projectId: 'p-1',
    title: 'Neural Interface Design',
    owner: {
      id: 'u-2',
      username: 'grace.hopper',
      email: 'grace@university.edu',
      fullName: 'Grace Hopper',
      role: 'STUDENT',
      active: true,
      createdAt: '2026-01-10T09:00:00Z'
    },
    status: 'LOOKING_FOR_TEAM',
    matchScore: 85,
    matchedSkills: ['Python'],
    matchedDomains: ['Artificial Intelligence'],
    matchedInterests: [],
    missingSkills: ['Machine Learning'],
    reason: 'Strong overlap with your profile.',
    ...overrides
  };
}