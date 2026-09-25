package com.innovasphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TeamCreateRequest(
    @NotBlank(message = "Team name is required")
    @Size(min = 3, max = 255, message = "Team name must be between 3 and 255 characters")
    String name,

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    String description
) {
}