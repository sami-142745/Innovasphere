package com.innovasphere.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record TeamDto(
    UUID id,
    UUID projectId,
    String name,
    String description,
    Set<UserDto> members,
    Instant createdAt
) {
}