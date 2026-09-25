package com.innovasphere.repository;

import com.innovasphere.entity.Team;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, UUID> {

    List<Team> findByProjectId(UUID projectId);

    Page<Team> findByMembers_Id(UUID userId, Pageable pageable);

    void deleteByProjectId(UUID projectId);
}