package com.innovasphere.dto;

import com.innovasphere.enums.Role;
import java.time.Instant;
import java.util.UUID;

public record AdminUserDto(
    UUID id,
    String username,
    String email,
    String fullName,
    Role role,
    boolean active,
    String department,
    Instant createdAt
) {
}
