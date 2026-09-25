package com.innovasphere.service;

import com.innovasphere.dto.JoinRequestCreateRequest;
import com.innovasphere.dto.JoinRequestDecisionRequest;
import com.innovasphere.dto.JoinRequestDto;
import com.innovasphere.entity.JoinRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectMember;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.JoinRequestStatus;
import com.innovasphere.enums.MemberRole;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.JoinRequestMapper;
import com.innovasphere.repository.JoinRequestRepository;
import com.innovasphere.repository.ProjectMemberRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.StudentProfileRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final ProjectRepository projectRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final JoinRequestMapper joinRequestMapper;
    private final NotificationService notificationService;

    public JoinRequestService(
        JoinRequestRepository joinRequestRepository,
        ProjectRepository projectRepository,
        StudentProfileRepository studentProfileRepository,
        ProjectMemberRepository projectMemberRepository,
        JoinRequestMapper joinRequestMapper,
        NotificationService notificationService
    ) {
        this.joinRequestRepository = joinRequestRepository;
        this.projectRepository = projectRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.joinRequestMapper = joinRequestMapper;
        this.notificationService = notificationService;
    }

    @Transactional
    public JoinRequestDto create(User student, UUID projectId, JoinRequestCreateRequest request) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only students can request to join a project");
        }
        Project project = requireProject(projectId);
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PROFILE_NOT_FOUND",
                "Student profile not found"));

        if (project.getOwner().getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "CANNOT_JOIN_OWN_PROJECT",
                "You cannot request to join your own project");
        }
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, student.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_MEMBER",
                "You are already a member of this project");
        }
        if (joinRequestRepository.existsByProjectIdAndStudentIdAndStatus(
            projectId, profile.getId(), JoinRequestStatus.PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "JOIN_REQUEST_PENDING",
                "You already have a pending join request for this project");
        }

        JoinRequest joinRequest = JoinRequest.builder()
            .project(project)
            .student(profile)
            .message(request.message() != null ? request.message().trim() : null)
            .build();
        JoinRequest saved = joinRequestRepository.save(joinRequest);
        notificationService.projectJoinRequested(project, profile);
        return joinRequestMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<JoinRequestDto> listForProject(User user, UUID projectId) {
        Project project = requireProject(projectId);
        requireOwnerOrAdmin(user, project);
        return joinRequestRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
            .stream()
            .map(joinRequestMapper::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<JoinRequestDto> my(User student) {
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PROFILE_NOT_FOUND",
                "Student profile not found"));
        return joinRequestRepository.findByStudentIdOrderByCreatedAtDesc(profile.getId())
            .stream()
            .map(joinRequestMapper::toDto)
            .toList();
    }

    @Transactional
    public JoinRequestDto decide(User user, UUID projectId, UUID requestId, JoinRequestDecisionRequest decision) {
        Project project = requireProject(projectId);
        requireOwnerOrAdmin(user, project);

        JoinRequest joinRequest = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOIN_REQUEST_NOT_FOUND", "Join request not found"));
        if (!joinRequest.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST",
                "Join request does not belong to the specified project");
        }
        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "REQUEST_ALREADY_DECIDED",
                "Join request has already been processed");
        }

        JoinRequestStatus target = decision.status();
        User studentUser = joinRequest.getStudent().getUser();
        if (target == JoinRequestStatus.ACCEPTED) {
            if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, studentUser.getId())) {
                projectMemberRepository.save(ProjectMember.builder()
                    .project(project)
                    .user(studentUser)
                    .roleInProject(MemberRole.MEMBER)
                    .build());
            }
            joinRequest.setStatus(JoinRequestStatus.ACCEPTED);
            notificationService.projectJoinRequestAccepted(project, studentUser);
        } else {
            joinRequest.setStatus(JoinRequestStatus.REJECTED);
            notificationService.projectJoinRequestRejected(project, studentUser);
        }

        return joinRequestMapper.toDto(joinRequestRepository.save(joinRequest));
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