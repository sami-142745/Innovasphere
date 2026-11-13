package com.innovasphere.dto;

import jakarta.validation.constraints.NotNull;

public record AdminUserStatusRequest(
    @NotNull(message = "Active status is required")
    Boolean active
) {
}
