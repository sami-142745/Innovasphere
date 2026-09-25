package com.innovasphere.service;

import com.innovasphere.dto.MentorRecommendationDto;
import com.innovasphere.dto.ProjectRecommendationDto;
import com.innovasphere.entity.User;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RecommendationService {

    Page<ProjectRecommendationDto> recommendProjects(User student, Pageable pageable);

    Page<MentorRecommendationDto> recommendMentors(User student, Pageable pageable);

    int projectScore(User student, UUID projectId);

    int mentorScore(User student, UUID mentorId);
}