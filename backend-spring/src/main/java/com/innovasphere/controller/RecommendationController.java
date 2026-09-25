package com.innovasphere.controller;

import com.innovasphere.dto.MentorRecommendationDto;
import com.innovasphere.dto.ProjectRecommendationDto;
import com.innovasphere.dto.RecommendationScoreDto;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.RecommendationService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final CurrentUserProvider currentUserProvider;

    public RecommendationController(RecommendationService recommendationService,
                                    CurrentUserProvider currentUserProvider) {
        this.recommendationService = recommendationService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/projects")
    public Page<ProjectRecommendationDto> recommendProjects(
        Authentication authentication,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = currentUserProvider.require(authentication);
        return recommendationService.recommendProjects(user, pageable);
    }

    @GetMapping("/mentors")
    public Page<MentorRecommendationDto> recommendMentors(
        Authentication authentication,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = currentUserProvider.require(authentication);
        return recommendationService.recommendMentors(user, pageable);
    }

    @GetMapping("/projects/{projectId}/score")
    public RecommendationScoreDto projectScore(@PathVariable UUID projectId, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return new RecommendationScoreDto(projectId, recommendationService.projectScore(user, projectId));
    }

    @GetMapping("/mentors/{mentorId}/score")
    public RecommendationScoreDto mentorScore(@PathVariable UUID mentorId, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return new RecommendationScoreDto(mentorId, recommendationService.mentorScore(user, mentorId));
    }
}