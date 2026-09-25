package com.innovasphere.repository;

import com.innovasphere.entity.FacultyProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacultyProfileRepository extends JpaRepository<FacultyProfile, UUID> {

    @EntityGraph(attributePaths = {"user", "researchDomains"})
    @Override
    Page<FacultyProfile> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "researchDomains"})
    Optional<FacultyProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    boolean existsByResearchDomains_Id(UUID researchDomainId);

    @EntityGraph(attributePaths = {"user", "researchDomains"})
    Page<FacultyProfile> findByExpertiseContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "researchDomains"})
    Page<FacultyProfile> findByDepartmentContainingIgnoreCase(String department, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "researchDomains"})
    Page<FacultyProfile> findDistinctByResearchDomains_NameContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "researchDomains"})
    @Query("""
        select distinct f from FacultyProfile f
        where (:keyword is null
               or lower(f.user.fullName) like lower(concat('%', :keyword, '%'))
               or lower(f.designation) like lower(concat('%', :keyword, '%'))
               or lower(f.department) like lower(concat('%', :keyword, '%'))
               or lower(f.expertise) like lower(concat('%', :keyword, '%')))
          and (:domain is null
               or exists (select 1 from f.researchDomains rd where lower(rd.name) like lower(concat('%', :domain, '%'))))
        """)
    Page<FacultyProfile> search(
        @Param("keyword") String keyword,
        @Param("domain") String domain,
        Pageable pageable);
}