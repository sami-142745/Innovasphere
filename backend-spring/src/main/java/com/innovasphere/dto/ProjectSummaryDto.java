package com.innovasphere.dto;

import com.innovasphere.enums.ProjectStatus;
import java.time.Instant;
import java.util.UUID;

public record ProjectSummaryDto(
    UUID id,
    String title,
    String shortDescription,
    ProjectStatus status,
    String domain,
    String mentorName,
    int teamSize,
    int maxTeamSize,
    Instant createdAt
) {
}