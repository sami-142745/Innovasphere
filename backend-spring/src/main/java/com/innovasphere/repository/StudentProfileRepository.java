package com.innovasphere.repository;

import com.innovasphere.entity.StudentProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {

    Optional<StudentProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    boolean existsByResearchDomains_Id(UUID researchDomainId);
}