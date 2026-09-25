package com.innovasphere.dto;

import java.util.Set;
import java.util.UUID;

public record FacultyProfileDto(
    UUID id,
    String department,
    String designation,
    String bio,
    String expertise,
    Set<ResearchDomainDto> researchDomains
) {
}