package com.innovasphere.service;

import com.innovasphere.dto.ProjectCreateRequest;
import com.innovasphere.dto.ProjectDto;
import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.dto.ProjectUpdateRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectSkill;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.User;
import com.innovasphere.enums.ProjectStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.ProjectMapper;
import com.innovasphere.repository.JoinRequestRepository;
import com.innovasphere.repository.MentorshipRepository;
import com.innovasphere.repository.MentorshipRequestRepository;
import com.innovasphere.repository.ProjectMemberRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.TeamRepository;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ResearchDomainRepository researchDomainRepository;
    private final SkillRepository skillRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final TeamRepository teamRepository;
    private final MentorshipRepository mentorshipRepository;
    private final MentorshipRequestRepository mentorshipRequestRepository;
    private final ProjectMapper projectMapper;
    private final NotificationService notificationService;

    public ProjectServiceImpl(
        ProjectRepository projectRepository,
        ResearchDomainRepository researchDomainRepository,
        SkillRepository skillRepository,
        ProjectMemberRepository projectMemberRepository,
        JoinRequestRepository joinRequestRepository,
        TeamRepository teamRepository,
        MentorshipRepository mentorshipRepository,
        MentorshipRequestRepository mentorshipRequestRepository,
        ProjectMapper projectMapper,
        NotificationService notificationService
    ) {
        this.projectRepository = projectRepository;
        this.researchDomainRepository = researchDomainRepository;
        this.skillRepository = skillRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.joinRequestRepository = joinRequestRepository;
        this.teamRepository = teamRepository;
        this.mentorshipRepository = mentorshipRepository;
        this.mentorshipRequestRepository = mentorshipRequestRepository;
        this.projectMapper = projectMapper;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public ProjectDto create(User user, ProjectCreateRequest request) {
        ProjectStatus status = request.status() != null ? request.status() : ProjectStatus.IDEA;
        Project project = Project.builder()
            .owner(user)
            .title(request.title().trim())
            .shortDescription(request.shortDescription() != null ? request.shortDescription().trim() : null)
            .description(request.description().trim())
            .status(status)
            .repositoryUrl(request.repositoryUrl() != null ? request.repositoryUrl().trim() : null)
            .build();

        if (request.researchDomainIds() != null) {
            Set<ResearchDomain> domains = resolveDomains(request.researchDomainIds());
            project.getResearchDomains().addAll(domains);
        }
        if (request.skillIds() != null) {
            addSkills(project, request.skillIds());
        }

        return projectMapper.toDto(projectRepository.save(project));
    }

    @Override
    @Transactional
    public ProjectDto update(User user, UUID projectId, ProjectUpdateRequest request) {
        Project project = requireProject(projectId);
        requireOwnerOrAdmin(user, project);

        if (request.title() != null) {
            project.setTitle(request.title().trim());
        }
        if (request.shortDescription() != null) {
            project.setShortDescription(request.shortDescription().trim());
        }
        if (request.description() != null) {
            project.setDescription(request.description().trim());
        }
        if (request.status() != null) {
            project.setStatus(request.status());
        }
        if (request.repositoryUrl() != null) {
            project.setRepositoryUrl(request.repositoryUrl().trim());
        }
        if (request.researchDomainIds() != null) {
            project.getResearchDomains().clear();
            project.getResearchDomains().addAll(resolveDomains(request.researchDomainIds()));
        }
        if (request.skillIds() != null) {
            project.getSkills().clear();
            addSkills(project, request.skillIds());
        }

        ProjectDto dto = projectMapper.toDto(projectRepository.save(project));
        notificationService.projectUpdated(project, user);
        return dto;
    }

    @Override
    @Transactional
    public void delete(User user, UUID projectId) {
        Project project = requireProject(projectId);
        requireOwnerOrAdmin(user, project);
        projectMemberRepository.deleteByProjectId(projectId);
        joinRequestRepository.deleteByProjectId(projectId);
        teamRepository.deleteByProjectId(projectId);
        mentorshipRepository.deleteByProjectId(projectId);
        mentorshipRequestRepository.deleteByProjectId(projectId);
        projectRepository.delete(project);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDto get(UUID projectId) {
        return projectMapper.toDto(requireProject(projectId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectSummaryDto> list(ProjectStatus status, Pageable pageable) {
        Page<Project> result = status != null
            ? projectRepository.findByStatus(status, pageable)
            : projectRepository.findAll(pageable);
        return result.map(projectMapper::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectSummaryDto> search(String keyword, ProjectStatus status, String domain, String skill,
                                          Pageable pageable) {
        return projectRepository.search(normalize(keyword), status, normalize(domain), normalize(skill), pageable)
            .map(projectMapper::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectSummaryDto> my(UUID ownerId, Pageable pageable) {
        return projectRepository.findByOwnerId(ownerId, pageable).map(projectMapper::toSummary);
    }

    private Set<ResearchDomain> resolveDomains(Set<UUID> domainIds) {
        java.util.LinkedHashSet<ResearchDomain> result = new java.util.LinkedHashSet<>();
        for (UUID domainId : domainIds) {
            result.add(researchDomainRepository.findById(domainId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "RESEARCH_DOMAIN_NOT_FOUND",
                    "Research domain not found: " + domainId)));
        }
        return result;
    }

    private void addSkills(Project project, Set<UUID> skillIds) {
        for (UUID skillId : skillIds) {
            Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "SKILL_NOT_FOUND",
                    "Skill not found: " + skillId));
            project.getSkills().add(ProjectSkill.builder()
                .project(project)
                .skill(skill)
                .requiredLevel(3)
                .build());
        }
    }

    private Project requireProject(UUID projectId) {
        return projectRepository.findById(projectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));
    }

    private void requireOwnerOrAdmin(User user, Project project) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !project.getOwner().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the project owner can perform this action");
        }
    }

    private String normalize(String value) {
        return value != null && !value.isBlank() ? value.trim() : null;
    }
}