package com.innovasphere.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationPreferenceUpdateRequest(
    @NotNull(message = "emailAlerts is required")
    Boolean emailAlerts,

    @NotNull(message = "inAppAlerts is required")
    Boolean inAppAlerts
) {
}
