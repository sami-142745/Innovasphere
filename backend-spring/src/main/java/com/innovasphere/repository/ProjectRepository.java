package com.innovasphere.repository;

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

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    @Override
    Page<Project> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    Page<Project> findByStatusNot(ProjectStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    Page<Project> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    Page<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        String titleKeyword, String descriptionKeyword, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    Page<Project> findDistinctByResearchDomains_NameContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    Page<Project> findDistinctBySkills_Skill_NameContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "researchDomains", "skills.skill"})
    @Query("""
        select distinct p from Project p
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
    Page<Project> search(
        @Param("keyword") String keyword,
        @Param("status") ProjectStatus status,
        @Param("domain") String domain,
        @Param("skill") String skill,
        Pageable pageable);

    List<Project> findByOwnerId(UUID ownerId);

    Page<Project> findByOwnerId(UUID ownerId, Pageable pageable);

    long countByStatus(ProjectStatus status);

    boolean existsByResearchDomains_Id(UUID researchDomainId);
}