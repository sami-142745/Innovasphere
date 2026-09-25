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
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock ProjectRepository projectRepository;
    @Mock TeamMapper teamMapper;
    @InjectMocks TeamService teamService;

    private User user(UUID id, Role role) {
        User u = User.builder().username("u").email("u@test.com").fullName("Test User").role(role).active(true).build();
        u.setId(id);
        return u;
    }

    private Project project(UUID id, User owner) {
        Project p = Project.builder().owner(owner).title("Project").build();
        p.setId(id);
        return p;
    }

    @Test
    void createAddsCreatorToMembers() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        Team team = Team.builder().project(project).name("Team A").build();
        team.setId(UUID.randomUUID());
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        teamService.create(project.getId(), new TeamCreateRequest("  Team A  ", "  desc  "), owner);

        ArgumentCaptor<Team> captor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(captor.capture());
        assertEquals("Team A", captor.getValue().getName());
        assertEquals("desc", captor.getValue().getDescription());
        assertEquals(1, captor.getValue().getMembers().size());
    }

    @Test
    void createByAdminOnForeignProjectAllowed() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User admin = user(UUID.randomUUID(), Role.ADMIN);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));
        teamService.create(project.getId(), new TeamCreateRequest("Team A", null), admin);
        verify(teamRepository).save(any(Team.class));
    }

    @Test
    void createByNonOwnerForbidden() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User other = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        ApiException ex = assertThrows(ApiException.class,
            () -> teamService.create(project.getId(), new TeamCreateRequest("Team A", null), other));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void createUnknownProjectNotFound() {
        UUID id = UUID.randomUUID();
        when(projectRepository.findById(id)).thenReturn(Optional.empty());
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        ApiException ex = assertThrows(ApiException.class,
            () -> teamService.create(id, new TeamCreateRequest("Team A", null), owner));
        assertEquals("PROJECT_NOT_FOUND", ex.getCode());
    }

    @Test
    void listMapsTeamsForProject() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        Team team = Team.builder().project(project).name("A").build();
        when(teamRepository.findByProjectId(project.getId())).thenReturn(List.of(team));
        assertEquals(1, teamService.list(project.getId()).size());
    }

    @Test
    void getReturnsMappedTeamOrNotFound() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        Team team = Team.builder().project(project).name("A").build();
        team.setId(UUID.randomUUID());
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        assertEquals(null, teamService.get(team.getId()));

        UUID missing = UUID.randomUUID();
        when(teamRepository.findById(missing)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> teamService.get(missing));
        assertEquals("TEAM_NOT_FOUND", ex.getCode());
    }

    @Test
    void myMarksProjectOwnerWhenUserOwnsProject() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User member = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        Team owned = Team.builder().project(project).name("Owned").build();
        owned.getMembers().add(owner);
        Project otherProject = project(UUID.randomUUID(), member);
        Team joined = Team.builder().project(otherProject).name("Joined").build();
        joined.getMembers().add(member);

        org.springframework.data.domain.Page<Team> page =
            new org.springframework.data.domain.PageImpl<>(List.of(owned, joined));
        when(teamRepository.findByMembers_Id(member.getId(), PageRequest.of(0, 20))).thenReturn(page);

        MyTeamDto first = teamService.my(member.getId(), PageRequest.of(0, 20)).getContent().get(0);
        MyTeamDto second = teamService.my(member.getId(), PageRequest.of(0, 20)).getContent().get(1);

        assertEquals(MemberRole.MEMBER, first.role());
        assertEquals(MemberRole.PROJECT_OWNER, second.role());
        assertEquals(1, first.memberCount());
        assertEquals(1, second.memberCount());
    }

    @Test
    void updateTrimsAndSaves() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        Team team = Team.builder().project(project).name("Old").build();
        team.setId(UUID.randomUUID());
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        teamService.update(team.getId(), new TeamUpdateRequest("  New  ", "  d  "), owner);

        assertEquals("New", team.getName());
        assertEquals("d", team.getDescription());
    }

    @Test
    void updateByNonOwnerForbidden() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User other = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        Team team = Team.builder().project(project).name("A").build();
        team.setId(UUID.randomUUID());
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        assertThrows(ApiException.class,
            () -> teamService.update(team.getId(), new TeamUpdateRequest("New", null), other));
        verify(teamRepository, never()).save(any());
    }

    @Test
    void deleteDeletesTeam() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        Team team = Team.builder().project(project).name("A").build();
        team.setId(UUID.randomUUID());
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));

        teamService.delete(team.getId(), owner);

        verify(teamRepository).delete(team);
    }

    @Test
    void deleteUnknownTeamNotFound() {
        UUID missing = UUID.randomUUID();
        when(teamRepository.findById(missing)).thenReturn(Optional.empty());
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        ApiException ex = assertThrows(ApiException.class, () -> teamService.delete(missing, owner));
        assertEquals("TEAM_NOT_FOUND", ex.getCode());
    }
}