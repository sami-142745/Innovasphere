package com.innovasphere.dto;

import java.util.Set;
import java.util.UUID;

public record MentorRecommendationDto(
    UUID mentorId,
    String name,
    String department,
    String expertise,
    int matchScore,
    Set<String> matchedSkills,
    Set<String> matchedDomains,
    String reason
) implements RecommendationDto {
}