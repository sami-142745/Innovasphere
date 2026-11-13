package com.innovasphere.dto;

import com.innovasphere.enums.ProjectStatus;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record ProjectDto(
    UUID id,
    String title,
    String shortDescription,
    String description,
    ProjectStatus status,
    String repositoryUrl,
    UserSummaryDto owner,
    Set<ResearchDomainDto> domains,
    Set<SkillDto> skills,
    int memberCount,
    int maxTeamSize,
    int teamCount,
    Instant createdAt,
    Instant updatedAt
) {
}