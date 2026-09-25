package com.innovasphere.mapper;

import com.innovasphere.dto.ProjectDto;
import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectSkill;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    private final SkillMapper skillMapper;
    private final ResearchDomainMapper researchDomainMapper;
    private final UserMapper userMapper;

    public ProjectMapper(SkillMapper skillMapper, ResearchDomainMapper researchDomainMapper, UserMapper userMapper) {
        this.skillMapper = skillMapper;
        this.researchDomainMapper = researchDomainMapper;
        this.userMapper = userMapper;
    }

    public ProjectSummaryDto toSummary(Project project) {
        if (project == null) {
            return null;
        }
        return new ProjectSummaryDto(
            project.getId(),
            project.getTitle(),
            project.getShortDescription(),
            project.getDescription(),
            project.getStatus(),
            userMapper.toDto(project.getOwner()),
            researchDomainMapper.toDtoSet(project.getResearchDomains()),
            toSkillDtos(project.getSkills()),
            project.getTeams().size(),
            project.getMembers().size(),
            project.getCreatedAt()
        );
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
            userMapper.toDto(project.getOwner()),
            researchDomainMapper.toDtoSet(project.getResearchDomains()),
            toSkillDtos(project.getSkills()),
            project.getTeams().size(),
            project.getMembers().size(),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }

    private Set<com.innovasphere.dto.SkillDto> toSkillDtos(Set<ProjectSkill> projectSkills) {
        Set<com.innovasphere.dto.SkillDto> result = new LinkedHashSet<>();
        if (projectSkills != null) {
            for (ProjectSkill projectSkill : projectSkills) {
                result.add(skillMapper.toDto(projectSkill.getSkill()));
            }
        }
        return result;
    }
}