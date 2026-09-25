package com.innovasphere.dto;

import com.innovasphere.enums.ProjectStatus;
import java.util.Set;
import java.util.UUID;

public record ProjectRecommendationDto(
    UUID projectId,
    String title,
    UserDto owner,
    ProjectStatus status,
    int matchScore,
    Set<String> matchedSkills,
    Set<String> matchedDomains,
    Set<String> matchedInterests,
    Set<String> missingSkills,
    String reason
) implements RecommendationDto {
}