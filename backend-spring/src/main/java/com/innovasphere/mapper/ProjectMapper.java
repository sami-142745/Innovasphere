package com.innovasphere.mapper;

import com.innovasphere.dto.ProjectDto;
import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.dto.SkillDto;
import com.innovasphere.dto.UserSummaryDto;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectSkill;
import com.innovasphere.entity.User;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    private static final int DEFAULT_MAX_TEAM_SIZE = 10;

    private final SkillMapper skillMapper;
    private final ResearchDomainMapper researchDomainMapper;

    public ProjectMapper(
            SkillMapper skillMapper,
            ResearchDomainMapper researchDomainMapper) {
        this.skillMapper = skillMapper;
        this.researchDomainMapper = researchDomainMapper;
    }

    /**
     * Maps an entity to the lightweight browse/search DTO.
     *
     * <p>The paginated read path does not use this method - it uses the constructor
     * projection in {@code ProjectRepository} so pagination stays in SQL. This
     * mapper remains for the single-entity paths.
     */
    public ProjectSummaryDto toSummary(Project project) {
        if (project == null) {
            return null;
        }

        String domain = project.getResearchDomains() != null
                && !project.getResearchDomains().isEmpty()
                ? project.getResearchDomains().iterator().next().getName()
                : null;

        String mentorName = project.getOwner() != null
                ? project.getOwner().getFullName()
                : null;

        int teamCount = project.getTeams() == null ? 0 : project.getTeams().size();
        int memberCount = project.getMembers() == null ? 0 : project.getMembers().size();

        return new ProjectSummaryDto(
                project.getId(),
                project.getTitle(),
                project.getShortDescription(),
                project.getStatus(),
                domain,
                toOwner(project.getOwner()),
                mentorName,
                memberCount,
                capacityOf(project),
                teamCount,
                project.getCreatedAt());
    }

    public ProjectDto toDto(Project project) {
        if (project == null) {
            return null;
        }

        return new ProjectDto(
                project.getId(),
                project.getTitle(),
                project.getShortDescription(),
                project.getDescription(),
                project.getStatus(),
                project.getRepositoryUrl(),
                toOwner(project.getOwner()),
                researchDomainMapper.toDtoSet(project.getResearchDomains()),
                toSkillDtos(project.getSkills()),
                project.getMembers() == null ? 0 : project.getMembers().size(),
                capacityOf(project),
                project.getTeams() == null ? 0 : project.getTeams().size(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }

    public UserSummaryDto toOwner(User owner) {
        if (owner == null) {
            return null;
        }
        return new UserSummaryDto(
                owner.getId(),
                owner.getFullName(),
                owner.getUsername(),
                owner.getRole(),
                null,
                null,
                owner.getCreatedAt());
    }

    private int capacityOf(Project project) {
        return project.getMaxTeamSize() != null ? project.getMaxTeamSize() : DEFAULT_MAX_TEAM_SIZE;
    }

    private Set<SkillDto> toSkillDtos(Set<ProjectSkill> projectSkills) {
        Set<SkillDto> result = new LinkedHashSet<>();

        if (projectSkills != null) {
            for (ProjectSkill projectSkill : projectSkills) {
                result.add(skillMapper.toDto(projectSkill.getSkill()));
            }
        }

        return result;
    }
}