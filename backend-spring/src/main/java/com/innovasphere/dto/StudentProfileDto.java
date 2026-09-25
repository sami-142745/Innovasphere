package com.innovasphere.dto;

import java.util.Set;
import java.util.UUID;

public record StudentProfileDto(
    UUID id,
    String enrollmentNumber,
    String university,
    String department,
    Integer yearOfStudy,
    String bio,
    Set<SkillDto> skills,
    Set<ResearchDomainDto> researchDomains
) {
}