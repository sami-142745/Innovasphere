package com.innovasphere.repository;

import com.innovasphere.entity.JoinRequest;
import com.innovasphere.enums.JoinRequestStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, UUID> {

    List<JoinRequest> findByProjectId(UUID projectId);

    List<JoinRequest> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Page<JoinRequest> findByProjectId(UUID projectId, Pageable pageable);

    Page<JoinRequest> findByStudentId(UUID studentId, Pageable pageable);

    List<JoinRequest> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    boolean existsByProjectIdAndStudentIdAndStatus(UUID projectId, UUID studentId, JoinRequestStatus status);

    void deleteByProjectId(UUID projectId);
}