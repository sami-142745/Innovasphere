package com.innovasphere.dto;

import java.util.UUID;

public record ResearchDomainDto(
    UUID id,
    String name,
    String description
) {
}