package com.innovasphere.service;

import com.innovasphere.dto.NotificationDto;
import com.innovasphere.entity.MentorshipRequest;
import com.innovasphere.entity.Notification;
import com.innovasphere.entity.Project;
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
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    public NotificationServiceImpl(
        NotificationRepository notificationRepository,
        UserRepository userRepository,
        NotificationMapper notificationMapper
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationMapper = notificationMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> list(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(notificationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> unread(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndReadFalse(userId, pageable)
            .map(notificationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationDto markRead(UUID userId, UUID notificationId) {
        Notification notification = requireOwned(userId, notificationId);
        notification.setRead(true);
        return notificationMapper.toDto(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID notificationId) {
        Notification notification = requireOwned(userId, notificationId);
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void broadcast(String title, String message, UUID targetUserId) {
        if (targetUserId != null) {
            User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
            push(target.getId(), NotificationType.SYSTEM, title, message);
            return;
        }
        Page<User> users;
        int page = 0;
        do {
            users = userRepository.findAll(PageRequest.of(page, 200));
            users.forEach(user -> push(user.getId(), NotificationType.SYSTEM, title, message));
            page++;
        } while (users.hasNext());
    }

    @Override
    @Transactional
    public void projectJoinRequested(Project project, StudentProfile student) {
        User recipient = project.getOwner();
        push(recipient.getId(), NotificationType.JOIN_REQUEST,
            "New join request",
            student.getUser().getFullName() + " requested to join your project \"" + project.getTitle() + "\".");
    }

    @Override
    @Transactional
    public void projectJoinRequestAccepted(Project project, User student) {
        push(student.getId(), NotificationType.JOIN_REQUEST_ACCEPTED,
            "Join request accepted",
            "Your request to join project \"" + project.getTitle() + "\" was accepted.");
    }

    @Override
    @Transactional
    public void projectJoinRequestRejected(Project project, User student) {
        push(student.getId(), NotificationType.JOIN_REQUEST_REJECTED,
            "Join request rejected",
            "Your request to join project \"" + project.getTitle() + "\" was rejected.");
    }

    @Override
    @Transactional
    public void teamInvitationCreated(TeamInvitation invitation) {
        Team team = invitation.getTeam();
        push(invitation.getUser().getId(), NotificationType.TEAM_INVITATION,
            "Team invitation",
            invitation.getInvitedBy().getFullName() + " invited you to team \"" + team.getName()
                + "\" for project \"" + team.getProject().getTitle() + "\".");
    }

    @Override
    @Transactional
    public void teamInvitationAccepted(TeamInvitation invitation) {
        Team team = invitation.getTeam();
        push(invitation.getInvitedBy().getId(), NotificationType.TEAM_INVITATION_ACCEPTED,
            "Invitation accepted",
            invitation.getUser().getFullName() + " accepted your invitation to team \"" + team.getName()
                + "\" for project \"" + team.getProject().getTitle() + "\".");
    }

    @Override
    @Transactional
    public void teamInvitationRejected(TeamInvitation invitation) {
        Team team = invitation.getTeam();
        push(invitation.getInvitedBy().getId(), NotificationType.TEAM_INVITATION_REJECTED,
            "Invitation declined",
            invitation.getUser().getFullName() + " declined your invitation to team \"" + team.getName()
                + "\" for project \"" + team.getProject().getTitle() + "\".");
    }

    @Override
    @Transactional
    public void mentorshipRequestSent(MentorshipRequest request) {
        push(request.getFaculty().getId(), NotificationType.MENTORSHIP_REQUEST,
            "New mentorship request",
            request.getStudent().getFullName() + " requested mentorship from you.");
    }

    @Override
    @Transactional
    public void mentorshipAccepted(MentorshipRequest request) {
        push(request.getStudent().getId(), NotificationType.MENTORSHIP_ACCEPTED,
            "Mentorship accepted",
            "Your mentorship request to " + request.getFaculty().getFullName() + " was accepted.");
    }

    @Override
    @Transactional
    public void mentorshipRejected(MentorshipRequest request) {
        push(request.getStudent().getId(), NotificationType.MENTORSHIP_REJECTED,
            "Mentorship declined",
            "Your mentorship request to " + request.getFaculty().getFullName() + " was declined.");
    }

    @Override
    @Transactional
    public void projectUpdated(Project project, User actor) {
        Set<UUID> recipients = new HashSet<>();
        if (project.getMembers() != null) {
            project.getMembers().forEach(member -> recipients.add(member.getUser().getId()));
        }
        if (project.getTeams() != null) {
            for (Team team : project.getTeams()) {
                team.getMembers().forEach(member -> recipients.add(member.getId()));
            }
        }
        recipients.remove(actor.getId());
        if (recipients.isEmpty()) {
            return;
        }
        String title = "Project updated";
        String message = "Project \"" + project.getTitle() + "\" was updated by " + actor.getFullName() + ".";
        recipients.forEach(id -> push(id, NotificationType.PROJECT_UPDATE, title, message));
    }

    private void push(UUID userId, NotificationType type, String title, String message) {
        notificationRepository.save(Notification.builder()
            .user(userRepository.getReferenceById(userId))
            .type(type)
            .title(title)
            .message(message)
            .read(false)
            .build());
    }

    private Notification requireOwned(UUID userId, UUID notificationId) {
        return notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND",
                "Notification not found"));
    }
}