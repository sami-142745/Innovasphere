package com.innovasphere.dto;

import com.innovasphere.enums.Role;
import java.util.UUID;

public record UserSummaryDto(
    UUID id,
    String name,
    String username,
    String email,
    Role role,
    String department,
    String avatar
) {
}