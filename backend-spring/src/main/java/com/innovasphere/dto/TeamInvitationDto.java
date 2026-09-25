package com.innovasphere.dto;

import com.innovasphere.enums.InvitationStatus;
import java.time.Instant;
import java.util.UUID;

public record TeamInvitationDto(
    UUID id,
    UUID teamId,
    String teamName,
    UUID projectId,
    String projectTitle,
    UUID inviteeId,
    String inviteeName,
    UUID invitedById,
    String invitedByName,
    InvitationStatus status,
    String message,
    Instant createdAt
) {
}