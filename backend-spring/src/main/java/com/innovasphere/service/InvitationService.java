package com.innovasphere.service;

import com.innovasphere.dto.TeamInvitationDto;
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
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationService {

    private final TeamInvitationRepository invitationRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public InvitationService(
        TeamInvitationRepository invitationRepository,
        TeamRepository teamRepository,
        ProjectRepository projectRepository,
        UserRepository userRepository,
        NotificationService notificationService
    ) {
        this.invitationRepository = invitationRepository;
        this.teamRepository = teamRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public TeamInvitationDto invite(UUID teamId, TeamInviteRequest request, User inviter) {
        Team team = requireTeam(teamId);
        requireOwnerOrAdmin(inviter, team.getProject());

        User invitee = userRepository.findById(request.inviteeId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (team.getMembers().contains(invitee)) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_MEMBER", "User is already a member of this team");
        }
        if (invitationRepository.existsByTeamIdAndUserIdAndStatus(teamId, invitee.getId(), InvitationStatus.PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "INVITATION_PENDING",
                "A pending invitation already exists for this user");
        }

        TeamInvitation invitation = TeamInvitation.builder()
            .team(team)
            .user(invitee)
            .invitedBy(inviter)
            .message(request.message() != null ? request.message().trim() : null)
            .build();
        TeamInvitation saved = invitationRepository.save(invitation);
        notificationService.teamInvitationCreated(saved);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TeamInvitationDto> listForTeam(UUID teamId, User user) {
        Team team = requireTeam(teamId);
        requireOwnerOrAdmin(user, team.getProject());
        return invitationRepository.findByTeamIdOrderByCreatedAtDesc(teamId).stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamInvitationDto> my(UUID userId) {
        return invitationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public TeamInvitationDto accept(UUID invitationId, User currentUser) {
        TeamInvitation invitation = requireInvitation(invitationId);
        requireOwnInvitation(invitation, currentUser);
        requirePending(invitation);

        Team team = invitation.getTeam();
        if (!team.getMembers().contains(currentUser)) {
            team.getMembers().add(currentUser);
            teamRepository.save(team);
        }
        invitation.setStatus(InvitationStatus.ACCEPTED);
        TeamInvitation accepted = invitationRepository.save(invitation);
        notificationService.teamInvitationAccepted(accepted);
        return toDto(accepted);
    }

    @Transactional
    public TeamInvitationDto reject(UUID invitationId, User currentUser) {
        TeamInvitation invitation = requireInvitation(invitationId);
        requireOwnInvitation(invitation, currentUser);
        requirePending(invitation);

        invitation.setStatus(InvitationStatus.REJECTED);
        TeamInvitation rejected = invitationRepository.save(invitation);
        notificationService.teamInvitationRejected(rejected);
        return toDto(rejected);
    }

    private TeamInvitation requireInvitation(UUID invitationId) {
        return invitationRepository.findById(invitationId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND", "Invitation not found"));
    }

    private void requireOwnInvitation(TeamInvitation invitation, User currentUser) {
        if (!invitation.getUser().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Only the invited user can respond to this invitation");
        }
    }

    private void requirePending(TeamInvitation invitation) {
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "INVITATION_ALREADY_DECIDED",
                "Invitation has already been processed");
        }
    }

    private Team requireTeam(UUID teamId) {
        return teamRepository.findById(teamId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND", "Team not found"));
    }

    private void requireOwnerOrAdmin(User user, Project project) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !project.getOwner().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the project owner can perform this action");
        }
    }

    private TeamInvitationDto toDto(TeamInvitation invitation) {
        Team team = invitation.getTeam();
        return new TeamInvitationDto(
            invitation.getId(),
            team.getId(),
            team.getName(),
            team.getProject().getId(),
            team.getProject().getTitle(),
            invitation.getUser().getId(),
            invitation.getUser().getFullName(),
            invitation.getInvitedBy().getId(),
            invitation.getInvitedBy().getFullName(),
            invitation.getStatus(),
            invitation.getMessage(),
            invitation.getCreatedAt()
        );
    }
}