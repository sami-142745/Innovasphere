package com.innovasphere.dto;

import com.innovasphere.enums.MemberRole;
import java.util.UUID;

public record MyTeamDto(
    UUID teamId,
    String teamName,
    UUID projectId,
    String projectTitle,
    MemberRole role,
    int memberCount
) {
}