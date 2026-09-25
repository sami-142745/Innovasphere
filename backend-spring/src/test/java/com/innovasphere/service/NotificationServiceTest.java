package com.innovasphere.service;

import com.innovasphere.entity.MentorshipRequest;
import com.innovasphere.entity.Notification;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectMember;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.Team;
import com.innovasphere.entity.TeamInvitation;
import com.innovasphere.entity.User;
import com.innovasphere.enums.NotificationType;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.NotificationMapper;
import com.innovasphere.repository.NotificationRepository;
import com.innovasphere.repository.UserRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationMapper notificationMapper;
    @InjectMocks NotificationServiceImpl notificationService;

    private User user(UUID id) {
        User u = User.builder().username("u").email("u@test.com").fullName("User").active(true).build();
        u.setId(id);
        return u;
    }

    private Notification notification(UUID id) {
        return Notification.builder().user(user(UUID.randomUUID())).build();
    }

    @Test
    void listAndUnreadAndUnreadCountDelegate() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(any(UUID.class), any(Pageable.class)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(notification(UUID.randomUUID()))));
        UUID uid = UUID.randomUUID();
        assertEquals(1, notificationService.list(uid, PageRequest.of(0, 20)).getContent().size());

        when(notificationRepository.findByUserIdAndReadFalse(any(UUID.class), any(Pageable.class)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(notification(UUID.randomUUID()))));
        assertEquals(1, notificationService.unread(uid, PageRequest.of(0, 20)).getContent().size());

        when(notificationRepository.countByUserIdAndReadFalse(uid)).thenReturn(5L);
        assertEquals(5L, notificationService.unreadCount(uid));
    }

    @Test
    void markReadSetsReadAndSaves() {
        UUID uid = UUID.randomUUID();
        Notification notification = notification(UUID.randomUUID());
        when(notificationRepository.findByIdAndUserId(notification.getId(), uid)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        notificationService.markRead(uid, notification.getId());
        assertTrue(notification.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markReadNotFoundIs404() {
        UUID uid = UUID.randomUUID();
        UUID nid = UUID.randomUUID();
        when(notificationRepository.findByIdAndUserId(nid, uid)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> notificationService.markRead(uid, nid));
        assertEquals("NOTIFICATION_NOT_FOUND", ex.getCode());
    }

    @Test
    void markAllReadAndDeleteDelegate() {
        UUID uid = UUID.randomUUID();
        notificationService.markAllRead(uid);
        verify(notificationRepository).markAllReadForUser(uid);

        UUID nid = UUID.randomUUID();
        Notification notification = notification(UUID.randomUUID());
        when(notificationRepository.findByIdAndUserId(nid, uid)).thenReturn(Optional.of(notification));
        notificationService.delete(uid, nid);
        verify(notificationRepository).delete(notification);
    }

    @Test
    void broadcastToTargetUser() {
        UUID targetId = UUID.randomUUID();
        User target = user(targetId);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification(UUID.randomUUID()));
        notificationService.broadcast("Hello", "Everyone", targetId);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals(NotificationType.SYSTEM, captor.getValue().getType());
        verify(userRepository).getReferenceById(targetId);
        verify(userRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void broadcastToUnknownTargetThrows() {
        UUID targetId = UUID.randomUUID();
        when(userRepository.findById(targetId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> notificationService.broadcast("T", "M", targetId));
        assertEquals("USER_NOT_FOUND", ex.getCode());
    }

    @Test
    void broadcastToAllPaginatesThroughUsers() {
        User u1 = user(UUID.randomUUID());
        User u2 = user(UUID.randomUUID());
        when(userRepository.findAll(any(Pageable.class))).thenAnswer(invocation -> {
            Pageable pageable = invocation.getArgument(0);
            if (pageable.getPageNumber() == 0) {
                return new org.springframework.data.domain.PageImpl<>(List.of(u1), pageable, 201);
            }
            return new org.springframework.data.domain.PageImpl<>(List.of(u2), pageable, 201);
        });
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification(UUID.randomUUID()));

        notificationService.broadcast("Title", "Message", null);

        verify(notificationRepository, org.mockito.Mockito.times(2)).save(any(Notification.class));
        verify(userRepository, org.mockito.Mockito.times(2)).findAll(any(Pageable.class));
    }

    @Test
    void projectJoinEventNotifications() {
        User owner = user(UUID.randomUUID());
        User studentUser = user(UUID.randomUUID());
        Project project = Project.builder().owner(owner).title("Project X").build();
        StudentProfile profile = new StudentProfile();
        profile.setUser(studentUser);
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification(UUID.randomUUID()));

        notificationService.projectJoinRequested(project, profile);
        notificationService.projectJoinRequestAccepted(project, studentUser);
        notificationService.projectJoinRequestRejected(project, studentUser);

        verify(notificationRepository, org.mockito.Mockito.times(3)).save(any(Notification.class));
    }

    @Test
    void teamInvitationNotifications() {
        User owner = user(UUID.randomUUID());
        User invitee = user(UUID.randomUUID());
        Project project = Project.builder().owner(owner).title("Project X").build();
        Team team = Team.builder().project(project).name("Team A").build();
        team.setId(UUID.randomUUID());
        TeamInvitation invitation = TeamInvitation.builder().team(team).user(invitee).invitedBy(owner).build();
        invitation.setId(UUID.randomUUID());
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification(UUID.randomUUID()));

        notificationService.teamInvitationCreated(invitation);
        notificationService.teamInvitationAccepted(invitation);
        notificationService.teamInvitationRejected(invitation);

        verify(notificationRepository, org.mockito.Mockito.times(3)).save(any(Notification.class));
    }

    @Test
    void mentorshipNotifications() {
        User student = user(UUID.randomUUID());
        User faculty = user(UUID.randomUUID());
        MentorshipRequest request = MentorshipRequest.builder().student(student).faculty(faculty).build();
        request.setId(UUID.randomUUID());
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification(UUID.randomUUID()));

        notificationService.mentorshipRequestSent(request);
        notificationService.mentorshipAccepted(request);
        notificationService.mentorshipRejected(request);

        verify(notificationRepository, org.mockito.Mockito.times(3)).save(any(Notification.class));
    }

    @Test
    void projectUpdatedNotifiesMembersAndTeamExcludingActor() {
        User owner = user(UUID.randomUUID());
        User actor = user(UUID.randomUUID());
        User teamMember = user(UUID.randomUUID());
        User projectMember = user(UUID.randomUUID());
        Project project = Project.builder().owner(owner).title("Project X").build();

        ProjectMember pm = new ProjectMember();
        pm.setUser(projectMember);
        Set<ProjectMember> members = new HashSet<>();
        members.add(pm);

        Set<User> teamUsers = new HashSet<>();
        teamUsers.add(teamMember);
        teamUsers.add(actor);
        Team team = Team.builder().project(project).name("Team A").build();
        team.getMembers().addAll(teamUsers);
        Set<Team> teams = new HashSet<>();
        teams.add(team);

        project.setMembers(members);
        project.setTeams(teams);
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification(UUID.randomUUID()));

        notificationService.projectUpdated(project, actor);

        verify(notificationRepository, org.mockito.Mockito.times(2)).save(any(Notification.class));
    }

    @Test
    void projectUpdatedWithNoOtherRecipientsDoesNotSave() {
        User owner = user(UUID.randomUUID());
        User actor = user(UUID.randomUUID());
        Project project = Project.builder().owner(owner).title("Project X").build();
        project.setMembers(new HashSet<>());
        project.setTeams(new HashSet<>());
        notificationService.projectUpdated(project, actor);
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}