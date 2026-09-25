package com.innovasphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResearchDomainCreateRequest(
    @NotBlank(message = "Research domain name is required")
    @Size(max = 150, message = "Research domain name must be at most 150 characters")
    String name,

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    String description
) {
}