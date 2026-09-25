package com.innovasphere.service;

import com.innovasphere.dto.TeamInviteRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.Team;
import com.innovasphere.entity.TeamInvitation;
import com.innovasphere.entity.User;
import com.innovasphere.enums.InvitationStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.TeamInvitationRepository;
import com.innovasphere.repository.TeamRepository;
import com.innovasphere.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock TeamInvitationRepository invitationRepository;
    @Mock TeamRepository teamRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;
    @InjectMocks InvitationService invitationService;

    private User user(UUID id, Role role) {
        User u = User.builder().username("u").email("u@test.com").fullName("User").role(role).active(true).build();
        u.setId(id);
        return u;
    }

    private Team teamWith(UUID id, User owner, User... members) {
        Project p = Project.builder().owner(owner).title("Project").build();
        p.setId(UUID.randomUUID());
        Team t = Team.builder().project(p).name("Team").build();
        t.setId(id);
        for (User m : members) {
            t.getMembers().add(m);
        }
        return t;
    }

    @Test
    void inviteSuccessSavesAndNotifies() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(userRepository.findById(invitee.getId())).thenReturn(Optional.of(invitee));
        when(invitationRepository.existsByTeamIdAndUserIdAndStatus(team.getId(), invitee.getId(), InvitationStatus.PENDING))
            .thenReturn(false);
        when(invitationRepository.save(any(TeamInvitation.class))).thenAnswer(inv -> inv.getArgument(0));

        invitationService.invite(team.getId(), new TeamInviteRequest(invitee.getId(), "  Join us  "), owner);

        verify(invitationRepository).save(any(TeamInvitation.class));
        verify(notificationService).teamInvitationCreated(any(TeamInvitation.class));
    }

    @Test
    void inviteByNonOwnerForbidden() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User other = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        ApiException ex = assertThrows(ApiException.class,
            () -> invitationService.invite(team.getId(), new TeamInviteRequest(UUID.randomUUID(), null), other));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void inviteUserNotFound() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        UUID inviteeId = UUID.randomUUID();
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(userRepository.findById(inviteeId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> invitationService.invite(team.getId(), new TeamInviteRequest(inviteeId, null), owner));
        assertEquals("USER_NOT_FOUND", ex.getCode());
    }

    @Test
    void inviteAlreadyMemberConflict() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner, invitee);
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(userRepository.findById(invitee.getId())).thenReturn(Optional.of(invitee));
        ApiException ex = assertThrows(ApiException.class,
            () -> invitationService.invite(team.getId(), new TeamInviteRequest(invitee.getId(), null), owner));
        assertEquals("ALREADY_MEMBER", ex.getCode());
    }

    @Test
    void invitePendingExistsConflict() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(userRepository.findById(invitee.getId())).thenReturn(Optional.of(invitee));
        when(invitationRepository.existsByTeamIdAndUserIdAndStatus(team.getId(), invitee.getId(), InvitationStatus.PENDING))
            .thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> invitationService.invite(team.getId(), new TeamInviteRequest(invitee.getId(), null), owner));
        assertEquals("INVITATION_PENDING", ex.getCode());
    }

    @Test
    void listForTeamRequiresOwnerOrAdmin() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(invitationRepository.findByTeamIdOrderByCreatedAtDesc(team.getId())).thenReturn(List.of());
        assertEquals(0, invitationService.listForTeam(team.getId(), owner).size());

        User admin = user(UUID.randomUUID(), Role.ADMIN);
        assertEquals(0, invitationService.listForTeam(team.getId(), admin).size());

        User other = user(UUID.randomUUID(), Role.STUDENT);
        assertThrows(ApiException.class, () -> invitationService.listForTeam(team.getId(), other));
    }

    @Test
    void myMapsInvitations() {
        UUID userId = UUID.randomUUID();
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner)
            .message("Join").build();
        invitation.setStatus(InvitationStatus.PENDING);
        when(invitationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(invitation));
        assertEquals(1, invitationService.my(userId).size());
    }

    @Test
    void acceptAddsMemberAndNotifies() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner).build();
        invitation.setId(UUID.randomUUID());
        invitation.setStatus(InvitationStatus.PENDING);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any(TeamInvitation.class))).thenAnswer(inv -> inv.getArgument(0));

        invitationService.accept(invitation.getId(), invitee);

        verify(teamRepository).save(team);
        assertEquals(InvitationStatus.ACCEPTED, invitation.getStatus());
        verify(notificationService).teamInvitationAccepted(invitation);
    }

    @Test
    void acceptWhenAlreadyMemberSkipsTeamSave() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner, invitee);
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner).build();
        invitation.setId(UUID.randomUUID());
        invitation.setStatus(InvitationStatus.PENDING);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any(TeamInvitation.class))).thenAnswer(inv -> inv.getArgument(0));

        invitationService.accept(invitation.getId(), invitee);

        verify(teamRepository, never()).save(any());
        verify(notificationService).teamInvitationAccepted(invitation);
    }

    @Test
    void rejectSetsRejectedAndNotifies() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner).build();
        invitation.setId(UUID.randomUUID());
        invitation.setStatus(InvitationStatus.PENDING);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any(TeamInvitation.class))).thenAnswer(inv -> inv.getArgument(0));

        invitationService.reject(invitation.getId(), invitee);

        assertEquals(InvitationStatus.REJECTED, invitation.getStatus());
        verify(notificationService).teamInvitationRejected(invitation);
    }

    @Test
    void acceptByNonInviteeForbidden() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        User stranger = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner).build();
        invitation.setId(UUID.randomUUID());
        invitation.setStatus(InvitationStatus.PENDING);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        ApiException ex = assertThrows(ApiException.class, () -> invitationService.accept(invitation.getId(), stranger));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void acceptAlreadyDecidedConflict() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        Team team = teamWith(UUID.randomUUID(), owner);
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner).build();
        invitation.setId(UUID.randomUUID());
        invitation.setStatus(InvitationStatus.ACCEPTED);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        ApiException ex = assertThrows(ApiException.class, () -> invitationService.accept(invitation.getId(), invitee));
        assertEquals("INVITATION_ALREADY_DECIDED", ex.getCode());
    }

    @Test
    void invitationNotFound() {
        UUID id = UUID.randomUUID();
        User invitee = user(UUID.randomUUID(), Role.STUDENT);
        when(invitationRepository.findById(id)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> invitationService.accept(id, invitee));
        assertEquals("INVITATION_NOT_FOUND", ex.getCode());
    }
}