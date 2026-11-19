import { api } from '../api/client';
import { createApiCache } from '../utils/apiCache';
import { getCurrentUserId } from '../utils/currentUser';
import type { MentorRecommendationDto, Page, ProjectRecommendationDto, RecommendationScoreDto } from '../types';

const projectRecommendationsCache = createApiCache<Page<ProjectRecommendationDto>>({ ttlMs: 30_000 });
const mentorRecommendationsCache = createApiCache<Page<MentorRecommendationDto>>({ ttlMs: 30_000 });

export const recommendationService = {
  projects(page = 0, size = 9): Promise<Page<ProjectRecommendationDto>> {
    const userId = getCurrentUserId();
    const cacheKey = `rec:projects:${userId}:${page}:${size}`;

    const cached = projectRecommendationsCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/recommendations/projects', { params: { page, size } }).then((r) => {
      projectRecommendationsCache.set(cacheKey, r.data);
      return r.data;
    });
  },

  mentors(page = 0, size = 9): Promise<Page<MentorRecommendationDto>> {
    const userId = getCurrentUserId();
    const cacheKey = `rec:mentors:${userId}:${page}:${size}`;

    const cached = mentorRecommendationsCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/recommendations/mentors', { params: { page, size } }).then((r) => {
      mentorRecommendationsCache.set(cacheKey, r.data);
      return r.data;
    });
  },

  projectScore(projectId: string): Promise<RecommendationScoreDto> {
    return api.get(`/api/recommendations/projects/${projectId}/score`).then((r) => r.data);
  },

  mentorScore(mentorId: string): Promise<RecommendationScoreDto> {
    return api.get(`/api/recommendations/mentors/${mentorId}/score`).then((r) => r.data);
  }
};
