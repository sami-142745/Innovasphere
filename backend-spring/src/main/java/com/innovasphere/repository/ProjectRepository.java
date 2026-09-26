package com.innovasphere.repository;

import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.entity.Project;
import com.innovasphere.enums.ProjectStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    // Use projection queries for paginated results to avoid in-memory pagination
    @Override
    Page<Project> findAll(Pageable pageable);

    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);

    Page<Project> findByStatusNot(ProjectStatus status, Pageable pageable);

    Page<Project> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        String titleKeyword, String descriptionKeyword, Pageable pageable);

    Page<Project> findDistinctByResearchDomains_NameContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Project> findDistinctBySkills_Skill_NameContainingIgnoreCase(String keyword, Pageable pageable);

    // Projection-based queries for paginated results (no EntityGraph, no in-memory pagination)
    @Query("""
        select new com.innovasphere.dto.ProjectSummaryDto(
            p.id,
            p.title,
            p.shortDescription,
            p.status,
            case when size(p.researchDomains) > 0 then (select d.name from p.researchDomains d limit 1) else null end,
            concat(p.owner.firstName, ' ', p.owner.lastName),
            size(p.teams),
            p.teamSize,
            p.createdAt
        )
        from Project p
        where (:status is null or p.status = :status)
        order by p.createdAt desc
        """)
    Page<ProjectSummaryDto> findSummaryByStatus(
        @Param("status") ProjectStatus status,
        Pageable pageable);

    @Query("""
        select new com.innovasphere.dto.ProjectSummaryDto(
            p.id,
            p.title,
            p.shortDescription,
            p.status,
            case when size(p.researchDomains) > 0 then (select d.name from p.researchDomains d limit 1) else null end,
            concat(p.owner.firstName, ' ', p.owner.lastName),
            size(p.teams),
            p.teamSize,
            p.createdAt
        )
        from Project p
        order by p.createdAt desc
        """)
    Page<ProjectSummaryDto> findAllSummary(Pageable pageable);

    // Projection-based search with filtering (no EntityGraph, no in-memory pagination)
    @Query("""
        select new com.innovasphere.dto.ProjectSummaryDto(
            p.id,
            p.title,
            p.shortDescription,
            p.status,
            case when size(p.researchDomains) > 0 then (select d.name from p.researchDomains d limit 1) else null end,
            concat(p.owner.firstName, ' ', p.owner.lastName),
            size(p.teams),
            p.teamSize,
            p.createdAt
        )
        from Project p
        where (:keyword is null
               or lower(p.title) like lower(concat('%', :keyword, '%'))
               or lower(p.shortDescription) like lower(concat('%', :keyword, '%'))
               or lower(p.description) like lower(concat('%', :keyword, '%')))
          and (:status is null or p.status = :status)
          and (:domain is null
               or exists (select 1 from p.researchDomains d where lower(d.name) like lower(concat('%', :domain, '%'))))
          and (:skill is null
               or exists (select 1 from p.skills ps where lower(ps.skill.name) like lower(concat('%', :skill, '%'))))
        order by p.createdAt desc
        """)
    Page<ProjectSummaryDto> searchSummary(
        @Param("keyword") String keyword,
        @Param("status") ProjectStatus status,
        @Param("domain") String domain,
        @Param("skill") String skill,
        Pageable pageable);

    List<Project> findByOwnerId(UUID ownerId);

    Page<Project> findByOwnerId(UUID ownerId, Pageable pageable);

    long countByStatus(ProjectStatus status);

    boolean existsByResearchDomains_Id(UUID researchDomainId);