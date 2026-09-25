package com.innovasphere.service;

import com.innovasphere.dto.NotificationDto;
import com.innovasphere.entity.MentorshipRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.TeamInvitation;
import com.innovasphere.entity.User;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    Page<NotificationDto> list(UUID userId, Pageable pageable);

    Page<NotificationDto> unread(UUID userId, Pageable pageable);

    long unreadCount(UUID userId);

    NotificationDto markRead(UUID userId, UUID notificationId);

    void markAllRead(UUID userId);

    void delete(UUID userId, UUID notificationId);

    void broadcast(String title, String message, UUID targetUserId);

    void projectJoinRequested(Project project, StudentProfile student);

    void projectJoinRequestAccepted(Project project, User student);

    void projectJoinRequestRejected(Project project, User student);

    void teamInvitationCreated(TeamInvitation invitation);

    void teamInvitationAccepted(TeamInvitation invitation);

    void teamInvitationRejected(TeamInvitation invitation);

    void mentorshipRequestSent(MentorshipRequest request);

    void mentorshipAccepted(MentorshipRequest request);

    void mentorshipRejected(MentorshipRequest request);

    void projectUpdated(Project project, User actor);
}