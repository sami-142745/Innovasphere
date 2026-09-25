package com.innovasphere.dto;

import java.util.UUID;

public record SkillDto(
    UUID id,
    String name,
    String description
) {
}