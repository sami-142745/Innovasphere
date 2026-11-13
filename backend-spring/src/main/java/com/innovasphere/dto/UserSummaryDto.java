package com.innovasphere.dto;

import com.innovasphere.enums.Role;
import java.time.Instant;
import java.util.UUID;

public record UserSummaryDto(
    UUID id,
    String fullName,
    String username,
    Role role,
    String department,
    String avatar,
    Instant createdAt
) {
}