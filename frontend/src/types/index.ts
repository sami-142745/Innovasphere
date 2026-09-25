export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type ProjectStatus = 'IDEA' | 'LOOKING_FOR_TEAM' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type NotificationType =
  | 'JOIN_REQUEST'
  | 'JOIN_REQUEST_ACCEPTED'
  | 'JOIN_REQUEST_REJECTED'
  | 'TEAM_INVITATION'
  | 'TEAM_INVITATION_ACCEPTED'
  | 'TEAM_INVITATION_REJECTED'
  | 'MENTORSHIP_REQUEST'
  | 'MENTORSHIP_ACCEPTED'
  | 'MENTORSHIP_REJECTED'
  | 'PROJECT_UPDATE'
  | 'SYSTEM';

export interface SkillDto {
  id: string;
  name: string;
  description?: string | null;
}

export interface ResearchDomainDto {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface StudentProfileDto {
  id: string;
  enrollmentNumber?: string | null;
  university?: string | null;
  department?: string | null;
  yearOfStudy?: number | null;
  bio?: string | null;
  skills: SkillDto[];
  researchDomains: ResearchDomainDto[];
}

export interface FacultyProfileDto {
  id: string;
  department?: string | null;
  designation?: string | null;
  bio?: string | null;
  expertise?: string | null;
  researchDomains: ResearchDomainDto[];
}

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  studentProfile?: StudentProfileDto | null;
  facultyProfile?: FacultyProfileDto | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfileDto;
  expiresIn: number;
}

export interface ProjectSummaryDto {
  id: string;
  title: string;
  shortDescription?: string | null;
  description: string;
  status: ProjectStatus;
  owner: UserDto;
  domains: ResearchDomainDto[];
  skills: SkillDto[];
  teamSize: number;
  memberCount: number;
  createdAt: string;
}

export interface ProjectDto extends ProjectSummaryDto {
  repositoryUrl?: string | null;
  updatedAt: string;
}

export interface ProjectCreateRequest {
  title: string;
  description: string;
  shortDescription?: string | null;
  status?: ProjectStatus | null;
  repositoryUrl?: string | null;
  researchDomainIds: string[];
  skillIds: string[];
}

export interface ProjectUpdateRequest extends ProjectCreateRequest {}

export interface JoinRequestDto {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  status: RequestStatus;
  message?: string | null;
  createdAt: string;
}

export interface MentorshipRequestDto {
  id: string;
  studentId: string;
  studentName: string;
  facultyId: string;
  facultyName: string;
  projectId?: string | null;
  projectTitle?: string | null;
  status: RequestStatus;
  message?: string | null;
  createdAt: string;
}

export interface TeamDto {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  members: UserDto[];
  createdAt: string;
}

export interface TeamInvitationDto {
  id: string;
  teamId: string;
  teamName: string;
  projectId: string;
  projectTitle: string;
  inviteeId: string;
  inviteeName: string;
  invitedById: string;
  invitedByName: string;
  status: RequestStatus;
  message?: string | null;
  createdAt: string;
}

export interface MentorDto {
  id: string;
  name: string;
  designation?: string | null;
  department?: string | null;
  expertise?: string | null;
  bio?: string | null;
  researchDomains: ResearchDomainDto[];
  skills: SkillDto[];
  activeMentorships: number;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ProjectRecommendationDto {
  projectId: string;
  title: string;
  owner: UserDto;
  status: ProjectStatus;
  matchScore: number;
  matchedSkills: string[];
  matchedDomains: string[];
  matchedInterests: string[];
  missingSkills: string[];
  reason: string;
}

export interface MentorRecommendationDto {
  mentorId: string;
  name: string;
  department?: string | null;
  expertise?: string | null;
  matchScore: number;
  matchedSkills: string[];
  matchedDomains: string[];
  reason: string;
}

export interface RecommendationScoreDto {
  id: string;
  score: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CountResponse {
  count: number;
}

export interface ApiErrorResponse {
  status?: number;
  message?: string;
  error?: string;
}