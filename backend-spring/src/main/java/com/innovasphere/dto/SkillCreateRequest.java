package com.innovasphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SkillCreateRequest(
    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name must be at most 100 characters")
    String name,

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    String description
) {
}