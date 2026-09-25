package com.innovasphere.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record TeamInviteRequest(
    @NotNull(message = "inviteeId is required")
    UUID inviteeId,

    @Size(max = 1000, message = "Message must be at most 1000 characters")
    String message
) {
}