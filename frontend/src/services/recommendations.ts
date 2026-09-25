import { api } from '../api/client';
import type { MentorRecommendationDto, Page, ProjectRecommendationDto, RecommendationScoreDto } from '../types';

export const recommendationService = {
  projects(page = 0, size = 9): Promise<Page<ProjectRecommendationDto>> {
    return api.get('/api/recommendations/projects', { params: { page, size } }).then((r) => r.data);
  },

  mentors(page = 0, size = 9): Promise<Page<MentorRecommendationDto>> {
    return api.get('/api/recommendations/mentors', { params: { page, size } }).then((r) => r.data);
  },

  projectScore(projectId: string): Promise<RecommendationScoreDto> {
    return api.get(`/api/recommendations/projects/${projectId}/score`).then((r) => r.data);
  },

  mentorScore(mentorId: string): Promise<RecommendationScoreDto> {
    return api.get(`/api/recommendations/mentors/${mentorId}/score`).then((r) => r.data);
  }
};