package com.innovasphere.dto;

import com.innovasphere.enums.ProjectStatus;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record ProjectSummaryDto(
    UUID id,
    String title,
    String shortDescription,
    String description,
    ProjectStatus status,
    UserDto owner,
    Set<ResearchDomainDto> domains,
    Set<SkillDto> skills,
    int teamSize,
    int memberCount,
    Instant createdAt
) {
}