package com.innovasphere.dto;

import jakarta.validation.constraints.Size;

public record JoinRequestCreateRequest(
    @Size(max = 1000, message = "Message must be at most 1000 characters")
    String message
) {
}