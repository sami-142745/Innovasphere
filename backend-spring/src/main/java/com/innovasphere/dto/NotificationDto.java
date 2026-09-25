package com.innovasphere.dto;

import com.innovasphere.enums.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    NotificationType type,
    String title,
    String message,
    boolean read,
    Instant createdAt
) {
}