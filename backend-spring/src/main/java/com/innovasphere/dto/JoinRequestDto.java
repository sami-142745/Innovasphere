package com.innovasphere.dto;

import com.innovasphere.enums.JoinRequestStatus;
import java.time.Instant;
import java.util.UUID;

public record JoinRequestDto(
    UUID id,
    UUID projectId,
    String projectTitle,
    UUID studentId,
    String studentName,
    JoinRequestStatus status,
    String message,
    Instant createdAt
) {
}