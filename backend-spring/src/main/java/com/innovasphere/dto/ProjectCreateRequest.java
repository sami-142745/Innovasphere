package com.innovasphere.dto;

import com.innovasphere.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record ProjectCreateRequest(
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    String title,

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 10000, message = "Description must be between 10 and 10000 characters")
    String description,

    @Size(max = 500, message = "Short description must be at most 500 characters")
    String shortDescription,

    ProjectStatus status,

    @Size(max = 500, message = "Repository URL must be at most 500 characters")
    String repositoryUrl,

    Set<UUID> researchDomainIds,

    Set<UUID> skillIds
) {
}