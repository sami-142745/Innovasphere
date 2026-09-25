package com.innovasphere.dto;

import com.innovasphere.enums.Role;
import java.time.Instant;
import java.util.UUID;

public record UserProfileDto(
    UUID id,
    String username,
    String email,
    String fullName,
    Role role,
    boolean active,
    StudentProfileDto studentProfile,
    FacultyProfileDto facultyProfile,
    Instant createdAt
) {
}