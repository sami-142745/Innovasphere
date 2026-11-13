package com.innovasphere.repository;

import com.innovasphere.entity.TeamInvitation;
import com.innovasphere.enums.InvitationStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, UUID> {

    List<TeamInvitation> findByTeamId(UUID teamId);

    List<TeamInvitation> findByTeamIdOrderByCreatedAtDesc(UUID teamId);

    List<TeamInvitation> findByUserId(UUID userId);

    List<TeamInvitation> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByTeamIdAndUserIdAndStatus(UUID teamId, UUID userId, InvitationStatus status);

    @Transactional
    @Modifying
    @Query("""
        delete from TeamInvitation t
        where t.team.id = :teamId
          and t.user.id = :userId
          and t.status = com.innovasphere.enums.InvitationStatus.PENDING
        """)
    void deletePendingByTeamAndUser(@Param("teamId") UUID teamId, @Param("userId") UUID userId);
}