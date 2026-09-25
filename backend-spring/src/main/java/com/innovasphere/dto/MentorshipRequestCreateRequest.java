package com.innovasphere.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record MentorshipRequestCreateRequest(
    @NotNull(message = "facultyId is required")
    UUID facultyId,

    UUID projectId,

    @Size(max = 1000, message = "Message must be at most 1000 characters")
    String message
) {
}