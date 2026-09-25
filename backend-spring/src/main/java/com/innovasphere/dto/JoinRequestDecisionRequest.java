package com.innovasphere.dto;

import com.innovasphere.enums.JoinRequestStatus;
import jakarta.validation.constraints.NotNull;

public record JoinRequestDecisionRequest(
    @NotNull(message = "Status is required")
    JoinRequestStatus status
) {
}