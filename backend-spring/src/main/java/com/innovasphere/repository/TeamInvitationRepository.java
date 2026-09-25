package com.innovasphere.repository;

import com.innovasphere.entity.TeamInvitation;
import com.innovasphere.enums.InvitationStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, UUID> {

    List<TeamInvitation> findByTeamId(UUID teamId);

    List<TeamInvitation> findByTeamIdOrderByCreatedAtDesc(UUID teamId);

    List<TeamInvitation> findByUserId(UUID userId);

    List<TeamInvitation> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByTeamIdAndUserIdAndStatus(UUID teamId, UUID userId, InvitationStatus status);
}