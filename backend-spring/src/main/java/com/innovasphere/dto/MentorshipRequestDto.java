package com.innovasphere.dto;

import com.innovasphere.enums.MentorshipStatus;
import java.time.Instant;
import java.util.UUID;

public record MentorshipRequestDto(
    UUID id,
    UUID studentId,
    String studentName,
    UUID facultyId,
    String facultyName,
    UUID projectId,
    String projectTitle,
    MentorshipStatus status,
    String message,
    Instant createdAt
) {
}