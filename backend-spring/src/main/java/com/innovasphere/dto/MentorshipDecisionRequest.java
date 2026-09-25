package com.innovasphere.dto;

import com.innovasphere.enums.MentorshipStatus;
import jakarta.validation.constraints.NotNull;

public record MentorshipDecisionRequest(
    @NotNull(message = "Status is required")
    MentorshipStatus status
) {
}