package com.innovasphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record SystemNotificationRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    String title,

    @Size(max = 2000, message = "Message must be at most 2000 characters")
    String message,

    UUID userId
) {
}