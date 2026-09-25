package com.innovasphere.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record MentorDto(
    UUID id,
    String name,
    String designation,
    String department,
    String expertise,
    String bio,
    Set<ResearchDomainDto> researchDomains,
    Set<SkillDto> skills,
    long activeMentorships,
    Instant createdAt
) {
}