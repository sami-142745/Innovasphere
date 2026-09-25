package com.innovasphere.service;

import com.innovasphere.dto.JoinRequestCreateRequest;
import com.innovasphere.dto.JoinRequestDecisionRequest;
import com.innovasphere.entity.JoinRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectMember;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.JoinRequestStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.JoinRequestMapper;
import com.innovasphere.repository.JoinRequestRepository;
import com.innovasphere.repository.ProjectMemberRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.StudentProfileRepository;
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
class JoinRequestServiceTest {

    @Mock JoinRequestRepository joinRequestRepository;
    @Mock ProjectRepository projectRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock ProjectMemberRepository projectMemberRepository;
    @Mock JoinRequestMapper joinRequestMapper;
    @Mock NotificationService notificationService;
    @InjectMocks JoinRequestService joinRequestService;

    private User student(UUID id) {
        User u = User.builder().username("s").email("s@test.com").fullName("Student One").role(Role.STUDENT).active(true).build();
        u.setId(id);
        return u;
    }

    private StudentProfile profile(User u) {
        StudentProfile p = new StudentProfile();
        p.setUser(u);
        p.setId(UUID.randomUUID());
        return p;
    }

    private Project project(UUID id, User owner) {
        Project p = Project.builder().owner(owner).title("Project").build();
        p.setId(id);
        return p;
    }

    @Test
    void createByNonStudentForbidden() {
        User faculty = student(UUID.randomUUID());
        faculty.setRole(Role.FACULTY);
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.create(faculty, UUID.randomUUID(), new JoinRequestCreateRequest("Hi")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void createWithMissingStudentProfileThrows() {
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project(pid, student(UUID.randomUUID()))));
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.create(s, pid, new JoinRequestCreateRequest("Hi")));
        assertEquals("PROFILE_NOT_FOUND", ex.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void createOwnProjectConflict() {
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project(pid, s)));
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(profile(s)));
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.create(s, pid, new JoinRequestCreateRequest(null)));
        assertEquals("CANNOT_JOIN_OWN_PROJECT", ex.getCode());
    }

    @Test
    void createAlreadyMemberConflict() {
        User owner = student(UUID.randomUUID());
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project(pid, owner)));
        StudentProfile sp = profile(s);
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(sp));
        when(projectMemberRepository.existsByProjectIdAndUserId(pid, s.getId())).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.create(s, pid, new JoinRequestCreateRequest(null)));
        assertEquals("ALREADY_MEMBER", ex.getCode());
    }

    @Test
    void createPendingExistsConflict() {
        User owner = student(UUID.randomUUID());
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project(pid, owner)));
        StudentProfile sp = profile(s);
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(sp));
        when(projectMemberRepository.existsByProjectIdAndUserId(pid, s.getId())).thenReturn(false);
        when(joinRequestRepository.existsByProjectIdAndStudentIdAndStatus(pid, sp.getId(), JoinRequestStatus.PENDING))
            .thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.create(s, pid, new JoinRequestCreateRequest(null)));
        assertEquals("JOIN_REQUEST_PENDING", ex.getCode());
    }

    @Test
    void createSuccessSavesAndNotifies() {
        User owner = student(UUID.randomUUID());
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        StudentProfile sp = profile(s);
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(sp));
        when(projectMemberRepository.existsByProjectIdAndUserId(pid, s.getId())).thenReturn(false);
        when(joinRequestRepository.existsByProjectIdAndStudentIdAndStatus(pid, sp.getId(), JoinRequestStatus.PENDING))
            .thenReturn(false);
        when(joinRequestRepository.save(any(JoinRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        joinRequestService.create(s, pid, new JoinRequestCreateRequest("  Hello  "));

        verify(joinRequestRepository).save(any(JoinRequest.class));
        verify(notificationService).projectJoinRequested(project, sp);
    }

    @Test
    void listForProjectByOwnerOrAdminAllowed() {
        User owner = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project(pid, owner)));
        when(joinRequestRepository.findByProjectIdOrderByCreatedAtDesc(pid)).thenReturn(List.of());
        assertEquals(0, joinRequestService.listForProject(owner, pid).size());

        User admin = student(UUID.randomUUID());
        admin.setRole(Role.ADMIN);
        assertEquals(0, joinRequestService.listForProject(admin, pid).size());
    }

    @Test
    void listForProjectByNonOwnerForbidden() {
        User owner = student(UUID.randomUUID());
        User other = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project(pid, owner)));
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.listForProject(other, pid));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void myWithoutProfileThrows() {
        User s = student(UUID.randomUUID());
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> joinRequestService.my(s));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("PROFILE_NOT_FOUND", ex.getCode());
    }

    @Test
    void myMapsRequestsForProfile() {
        User s = student(UUID.randomUUID());
        StudentProfile sp = profile(s);
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(sp));
        JoinRequest jr = JoinRequest.builder().build();
        when(joinRequestRepository.findByStudentIdOrderByCreatedAtDesc(sp.getId())).thenReturn(List.of(jr));
        assertEquals(1, joinRequestService.my(s).size());
    }

    @Test
    void decideAcceptedAddsMemberAndNotifies() {
        User owner = student(UUID.randomUUID());
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        StudentProfile sp = profile(s);
        JoinRequest jr = JoinRequest.builder().project(project).student(sp).build();
        jr.setId(UUID.randomUUID());
        jr.setStatus(JoinRequestStatus.PENDING);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        when(joinRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
        when(projectMemberRepository.existsByProjectIdAndUserId(pid, s.getId())).thenReturn(false);

        joinRequestService.decide(owner, pid, jr.getId(), new JoinRequestDecisionRequest(JoinRequestStatus.ACCEPTED));

        verify(projectMemberRepository).save(any(ProjectMember.class));
        assertEquals(JoinRequestStatus.ACCEPTED, jr.getStatus());
        verify(notificationService).projectJoinRequestAccepted(project, s);
    }

    @Test
    void decideAcceptedSkipsMemberCreationWhenAlreadyMember() {
        User owner = student(UUID.randomUUID());
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        StudentProfile sp = profile(s);
        JoinRequest jr = JoinRequest.builder().project(project).student(sp).build();
        jr.setId(UUID.randomUUID());
        jr.setStatus(JoinRequestStatus.PENDING);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        when(joinRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
        when(projectMemberRepository.existsByProjectIdAndUserId(pid, s.getId())).thenReturn(true);

        joinRequestService.decide(owner, pid, jr.getId(), new JoinRequestDecisionRequest(JoinRequestStatus.ACCEPTED));

        verify(projectMemberRepository, never()).save(any(ProjectMember.class));
        verify(notificationService).projectJoinRequestAccepted(project, s);
    }

    @Test
    void decideRejectedNotifiesRejected() {
        User owner = student(UUID.randomUUID());
        User s = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        StudentProfile sp = profile(s);
        JoinRequest jr = JoinRequest.builder().project(project).student(sp).build();
        jr.setId(UUID.randomUUID());
        jr.setStatus(JoinRequestStatus.PENDING);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        when(joinRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));

        joinRequestService.decide(owner, pid, jr.getId(), new JoinRequestDecisionRequest(JoinRequestStatus.REJECTED));

        assertEquals(JoinRequestStatus.REJECTED, jr.getStatus());
        verify(notificationService).projectJoinRequestRejected(project, s);
        verify(projectMemberRepository, never()).save(any(ProjectMember.class));
    }

    @Test
    void decideRequestNotFound() {
        User owner = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        UUID rid = UUID.randomUUID();
        when(joinRequestRepository.findById(rid)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.decide(owner, pid, rid, new JoinRequestDecisionRequest(JoinRequestStatus.ACCEPTED)));
        assertEquals("JOIN_REQUEST_NOT_FOUND", ex.getCode());
    }

    @Test
    void decideRequestForDifferentProjectThrows() {
        User owner = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        Project other = project(UUID.randomUUID(), student(UUID.randomUUID()));
        StudentProfile sp = profile(student(UUID.randomUUID()));
        JoinRequest jr = JoinRequest.builder().project(other).student(sp).build();
        jr.setId(UUID.randomUUID());
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        when(joinRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.decide(owner, pid, jr.getId(), new JoinRequestDecisionRequest(JoinRequestStatus.ACCEPTED)));
        assertEquals("INVALID_REQUEST", ex.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void decideAlreadyProcessedConflict() {
        User owner = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        StudentProfile sp = profile(student(UUID.randomUUID()));
        JoinRequest jr = JoinRequest.builder().project(project).student(sp).build();
        jr.setId(UUID.randomUUID());
        jr.setStatus(JoinRequestStatus.ACCEPTED);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        when(joinRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.decide(owner, pid, jr.getId(), new JoinRequestDecisionRequest(JoinRequestStatus.ACCEPTED)));
        assertEquals("REQUEST_ALREADY_DECIDED", ex.getCode());
    }

    @Test
    void decideByNonOwnerForbidden() {
        User owner = student(UUID.randomUUID());
        User other = student(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        Project project = project(pid, owner);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        ApiException ex = assertThrows(ApiException.class,
            () -> joinRequestService.decide(other, pid, UUID.randomUUID(), new JoinRequestDecisionRequest(JoinRequestStatus.ACCEPTED)));
        assertEquals("FORBIDDEN", ex.getCode());
    }
}