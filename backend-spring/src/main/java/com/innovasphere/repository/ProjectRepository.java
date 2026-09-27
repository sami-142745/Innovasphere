package com.innovasphere.repository;

import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.entity.Project;
import com.innovasphere.enums.ProjectStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Project persistence.
 *
 * <p><b>Pagination rules.</b> No pageable query here may join-fetch a collection
 * (directly or through {@code @EntityGraph}): Hibernate would have to hydrate the
 * whole result set before slicing it and would log
 * {@code HHH90003004: firstResult/maxResults specified with collection fetch
 * mode; applying in memory}. Every paginated read therefore uses a constructor
 * projection, which Spring Data turns into a single {@code LIMIT}/{@code OFFSET}
 * statement with the sort supplied by the {@link Pageable}.
 */
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    // ---------------------------------------------------------------------
    // Browse / search projections (SQL pagination, no entity graph)
    // ---------------------------------------------------------------------

    @Query("""
        select new com.innovasphere.dto.ProjectSummaryDto(
            p.id,
            p.title,
            p.shortDescription,
            p.status,
            (select min(d.name) from p.researchDomains d),
            p.owner.fullName,
            size(p.teams),
            size(p.teams),
            p.createdAt
        )
        from Project p
        """)
    Page<ProjectSummaryDto> findAllSummary(Pageable pageable);

    @Query("""
        select new com.innovasphere.dto.ProjectSummaryDto(
            p.id,
            p.title,
            p.shortDescription,
            p.status,
            (select min(d.name) from p.researchDomains d),
            p.owner.fullName,
            size(p.teams),
            size(p.teams),
            p.createdAt
        )
        from Project p
        where (:status is null or p.status = :status)
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
            (select min(d.name) from p.researchDomains d),
            p.owner.fullName,
            size(p.teams),
            size(p.teams),
            p.createdAt
        )
        from Project p
        where p.owner.id = :ownerId
        """)
    Page<ProjectSummaryDto> findAllSummaryByOwnerId(
        @Param("ownerId") UUID ownerId,
        Pageable pageable);

    @Query("""
        select new com.innovasphere.dto.ProjectSummaryDto(
            p.id,
            p.title,
            p.shortDescription,
            p.status,
            (select min(d.name) from p.researchDomains d),
            p.owner.fullName,
            size(p.teams),
            size(p.teams),
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
        """)
    Page<ProjectSummaryDto> searchSummary(
        @Param("keyword") String keyword,
        @Param("status") ProjectStatus status,
        @Param("domain") String domain,
        @Param("skill") String skill,
        Pageable pageable);

    // ---------------------------------------------------------------------
    // Non paginated reads and derived lookups
    // ---------------------------------------------------------------------

    List<Project> findByOwnerId(UUID ownerId);

    Page<Project> findByOwnerId(UUID ownerId, Pageable pageable);

    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);

    Page<Project> findByStatusNot(ProjectStatus status, Pageable pageable);

    Page<Project> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        String titleKeyword, String descriptionKeyword, Pageable pageable);

    Page<Project> findDistinctByResearchDomains_NameContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Project> findDistinctBySkills_Skill_NameContainingIgnoreCase(String keyword, Pageable pageable);

    long countByStatus(ProjectStatus status);

    boolean existsByResearchDomains_Id(UUID researchDomainId);
}
