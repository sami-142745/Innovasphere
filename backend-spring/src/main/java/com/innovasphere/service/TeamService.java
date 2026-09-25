package com.innovasphere.service;

import com.innovasphere.dto.MyTeamDto;
import com.innovasphere.dto.TeamCreateRequest;
import com.innovasphere.dto.TeamDto;
import com.innovasphere.dto.TeamUpdateRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.Team;
import com.innovasphere.entity.User;
import com.innovasphere.enums.MemberRole;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.TeamMapper;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.TeamRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final TeamMapper teamMapper;

    public TeamService(TeamRepository teamRepository, ProjectRepository projectRepository, TeamMapper teamMapper) {
        this.teamRepository = teamRepository;
        this.projectRepository = projectRepository;
        this.teamMapper = teamMapper;
    }

    @Transactional
    public TeamDto create(UUID projectId, TeamCreateRequest request, User user) {
        Project project = requireProject(projectId);
        requireOwnerOrAdmin(user, project);

        Team team = Team.builder()
            .project(project)
            .name(request.name().trim())
            .description(request.description() != null ? request.description().trim() : null)
            .build();
        team.getMembers().add(user);
        return teamMapper.toDto(teamRepository.save(team));
    }

    @Transactional(readOnly = true)
    public List<TeamDto> list(UUID projectId) {
        requireProject(projectId);
        return teamRepository.findByProjectId(projectId).stream()
            .map(teamMapper::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public TeamDto get(UUID teamId) {
        return teamMapper.toDto(requireTeam(teamId));
    }

    @Transactional(readOnly = true)
    public Page<MyTeamDto> my(UUID userId, Pageable pageable) {
        return teamRepository.findByMembers_Id(userId, pageable).map(team -> toMyTeam(team, userId));
    }

    private MyTeamDto toMyTeam(Team team, UUID userId) {
        Project project = team.getProject();
        MemberRole role = project.getOwner().getId().equals(userId) ? MemberRole.PROJECT_OWNER : MemberRole.MEMBER;
        return new MyTeamDto(
            team.getId(),
            team.getName(),
            project.getId(),
            project.getTitle(),
            role,
            team.getMembers().size()
        );
    }

    @Transactional
    public TeamDto update(UUID teamId, TeamUpdateRequest request, User user) {
        Team team = requireTeam(teamId);
        requireOwnerOrAdmin(user, team.getProject());

        team.setName(request.name().trim());
        team.setDescription(request.description() != null ? request.description().trim() : null);
        return teamMapper.toDto(teamRepository.save(team));
    }

    @Transactional
    public void delete(UUID teamId, User user) {
        Team team = requireTeam(teamId);
        requireOwnerOrAdmin(user, team.getProject());
        teamRepository.delete(team);
    }

    private Team requireTeam(UUID teamId) {
        return teamRepository.findById(teamId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND", "Team not found"));
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
}