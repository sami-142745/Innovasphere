package com.innovasphere.dto;

import java.util.UUID;

public record NotificationPreferenceDto(
    UUID id,
    UUID userId,
    boolean emailAlerts,
    boolean inAppAlerts
) {
}
