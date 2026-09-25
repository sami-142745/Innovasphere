package com.innovasphere.repository;

import com.innovasphere.entity.MentorshipRequest;
import com.innovasphere.enums.MentorshipStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorshipRequestRepository extends JpaRepository<MentorshipRequest, UUID> {

    List<MentorshipRequest> findByStudentId(UUID studentId);

    List<MentorshipRequest> findByFacultyId(UUID facultyId);

    List<MentorshipRequest> findByFacultyIdAndStatus(UUID facultyId, MentorshipStatus status);

    boolean existsByStudentIdAndFacultyIdAndStatus(UUID studentId, UUID facultyId, MentorshipStatus status);

    boolean existsByStudentIdAndFacultyIdAndProjectIdAndStatus(
        UUID studentId, UUID facultyId, UUID projectId, MentorshipStatus status);

    void deleteByProjectId(UUID projectId);
}