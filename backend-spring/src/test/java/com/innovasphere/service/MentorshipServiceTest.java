package com.innovasphere.service;

import com.innovasphere.dto.MentorshipDecisionRequest;
import com.innovasphere.dto.MentorshipRequestCreateRequest;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.Mentorship;
import com.innovasphere.entity.MentorshipRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.User;
import com.innovasphere.enums.MentorshipStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.MentorMapper;
import com.innovasphere.mapper.MentorshipRequestMapper;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.MentorshipRepository;
import com.innovasphere.repository.MentorshipRequestRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.UserRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentorshipServiceTest {

    @Mock FacultyProfileRepository facultyProfileRepository;
    @Mock MentorshipRequestRepository mentorshipRequestRepository;
    @Mock MentorshipRepository mentorshipRepository;
    @Mock UserRepository userRepository;
    @Mock ProjectRepository projectRepository;
    @Mock MentorMapper mentorMapper;
    @Mock MentorshipRequestMapper mentorshipRequestMapper;
    @Mock NotificationService notificationService;
    @InjectMocks MentorshipService mentorshipService;

    private User student(UUID id) {
        User u = User.builder().username("s").email("s@test.com").fullName("Student").role(Role.STUDENT).active(true).build();
        u.setId(id);
        return u;
    }

    private User faculty(UUID id) {
        User u = User.builder().username("f").email("f@test.com").fullName("Faculty").role(Role.FACULTY).active(true).build();
        u.setId(id);
        return u;
    }

    private FacultyProfile facultyProfile(User u) {
        FacultyProfile p = new FacultyProfile();
        p.setUser(u);
        p.setId(UUID.randomUUID());
        p.setDepartment("AI");
        p.setExpertise("machine learning");
        return p;
    }

    @Test
    void listMapsMentorsWithMentorshipCounts() {
        User f = faculty(UUID.randomUUID());
        FacultyProfile profile = facultyProfile(f);
        when(facultyProfileRepository.findAll(any(Pageable.class)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(profile)));
        when(mentorshipRepository.countByFacultyIds(any(Collection.class)))
            .thenReturn(List.<Object[]>of(new Object[] { profile.getId(), 3L }));
        assertEquals(1, mentorshipService.list(PageRequest.of(0, 20)).getContent().size());
        verify(mentorMapper).toDto(profile, 3L);
    }

    @Test
    void getMapsFacultyOrThrowsWhenMissing() {
        User f = faculty(UUID.randomUUID());
        FacultyProfile profile = facultyProfile(f);
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(profile));
        assertEquals(null, mentorshipService.get(f.getId()));

        UUID missing = UUID.randomUUID();
        when(facultyProfileRepository.findByUserId(missing)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> mentorshipService.get(missing));
        assertEquals("FACULTY_PROFILE_NOT_FOUND", ex.getCode());
    }

    @Test
    void searchNormalizesAndMaps() {
        User f = faculty(UUID.randomUUID());
        FacultyProfile profile = facultyProfile(f);
        when(facultyProfileRepository.search(eq("ai"), eq("ml"), any(Pageable.class)))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(profile)));
        when(mentorshipRepository.countByFacultyIds(any(Collection.class)))
            .thenReturn(List.<Object[]>of(new Object[] { profile.getId(), 0L }));
        assertEquals(1, mentorshipService.search(" ai ", " ml ", PageRequest.of(0, 20)).getContent().size());
    }

    @Test
    void createRequestSuccessNotifiesFaculty() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        FacultyProfile profile = facultyProfile(f);
        when(userRepository.findById(f.getId())).thenReturn(Optional.of(f));
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(profile));
        when(mentorshipRepository.existsByFaculty_UserIdAndStudent_Id(f.getId(), s.getId())).thenReturn(false);
        when(mentorshipRequestRepository.existsByStudentIdAndFacultyIdAndStatus(s.getId(), f.getId(), MentorshipStatus.PENDING))
            .thenReturn(false);
        when(mentorshipRequestRepository.save(any(MentorshipRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(f.getId(), null, "  Hello  "));

        verify(mentorshipRequestRepository).save(any(MentorshipRequest.class));
        verify(notificationService).mentorshipRequestSent(any(MentorshipRequest.class));
    }

    @Test
    void createRequestNonStudentForbidden() {
        User f = faculty(UUID.randomUUID());
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(f, new MentorshipRequestCreateRequest(UUID.randomUUID(), null, null)));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void createRequestFacultyNotFound() {
        User s = student(UUID.randomUUID());
        UUID fid = UUID.randomUUID();
        when(userRepository.findById(fid)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(fid, null, null)));
        assertEquals("FACULTY_NOT_FOUND", ex.getCode());
    }

    @Test
    void createRequestUserNotFaculty() {
        User s = student(UUID.randomUUID());
        User notFaculty = student(UUID.randomUUID());
        when(userRepository.findById(notFaculty.getId())).thenReturn(Optional.of(notFaculty));
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(notFaculty.getId(), null, null)));
        assertEquals("NOT_FACULTY", ex.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void createRequestSelfConflict() {
        User s = student(UUID.randomUUID());
        User sameIdAsFaculty = faculty(s.getId());
        when(userRepository.findById(s.getId())).thenReturn(Optional.of(sameIdAsFaculty));
        when(facultyProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(facultyProfile(sameIdAsFaculty)));
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(s.getId(), null, null)));
        assertEquals("CANNOT_MENTOR_SELF", ex.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void createRequestMentorshipAlreadyExists() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        when(userRepository.findById(f.getId())).thenReturn(Optional.of(f));
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(facultyProfile(f)));
        when(mentorshipRepository.existsByFaculty_UserIdAndStudent_Id(f.getId(), s.getId())).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(f.getId(), null, null)));
        assertEquals("MENTORSHIP_EXISTS", ex.getCode());
    }

    @Test
    void createRequestPendingExists() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        when(userRepository.findById(f.getId())).thenReturn(Optional.of(f));
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(facultyProfile(f)));
        when(mentorshipRepository.existsByFaculty_UserIdAndStudent_Id(f.getId(), s.getId())).thenReturn(false);
        when(mentorshipRequestRepository.existsByStudentIdAndFacultyIdAndStatus(s.getId(), f.getId(), MentorshipStatus.PENDING))
            .thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(f.getId(), null, null)));
        assertEquals("MENTORSHIP_REQUEST_PENDING", ex.getCode());
    }

    @Test
    void createRequestWithProjectProjectNotFound() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        UUID pid = UUID.randomUUID();
        when(userRepository.findById(f.getId())).thenReturn(Optional.of(f));
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(facultyProfile(f)));
        when(mentorshipRepository.existsByFaculty_UserIdAndStudent_Id(f.getId(), s.getId())).thenReturn(false);
        when(mentorshipRequestRepository.existsByStudentIdAndFacultyIdAndStatus(s.getId(), f.getId(), MentorshipStatus.PENDING))
            .thenReturn(false);
        when(projectRepository.findById(pid)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(f.getId(), pid, null)));
        assertEquals("PROJECT_NOT_FOUND", ex.getCode());
    }

    @Test
    void createRequestProjectAlreadyMentored() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        FacultyProfile profile = facultyProfile(f);
        UUID pid = UUID.randomUUID();
        Project project = Project.builder().title("P").build();
        project.setId(pid);
        when(userRepository.findById(f.getId())).thenReturn(Optional.of(f));
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(profile));
        when(mentorshipRepository.existsByFaculty_UserIdAndStudent_Id(f.getId(), s.getId())).thenReturn(false);
        when(mentorshipRequestRepository.existsByStudentIdAndFacultyIdAndStatus(s.getId(), f.getId(), MentorshipStatus.PENDING))
            .thenReturn(false);
        when(projectRepository.findById(pid)).thenReturn(Optional.of(project));
        when(mentorshipRepository.existsByFaculty_IdAndProject_Id(profile.getId(), pid)).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.createRequest(s, new MentorshipRequestCreateRequest(f.getId(), pid, null)));
        assertEquals("MENTORSHIP_EXISTS", ex.getCode());
    }

    @Test
    void myAndReceivedRequestsMap() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        when(mentorshipRequestRepository.findByStudentId(s.getId())).thenReturn(List.of(MentorshipRequest.builder().build()));
        when(mentorshipRequestRepository.findByFacultyId(f.getId())).thenReturn(List.of(MentorshipRequest.builder().build()));
        assertEquals(1, mentorshipService.myRequests(s.getId()).size());
        assertEquals(1, mentorshipService.receivedRequests(f.getId()).size());
    }

    @Test
    void decideAcceptedCreatesMentorshipAndNotifies() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        FacultyProfile profile = facultyProfile(f);
        MentorshipRequest request = MentorshipRequest.builder().student(s).faculty(f).build();
        request.setId(UUID.randomUUID());
        request.setStatus(MentorshipStatus.PENDING);
        when(mentorshipRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(facultyProfileRepository.findByUserId(f.getId())).thenReturn(Optional.of(profile));

        mentorshipService.decide(f, request.getId(), new MentorshipDecisionRequest(MentorshipStatus.ACCEPTED));

        verify(mentorshipRepository).save(any(Mentorship.class));
        assertEquals(MentorshipStatus.ACCEPTED, request.getStatus());
        verify(notificationService).mentorshipAccepted(request);
    }

    @Test
    void decideRejectedNotifiesRejected() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        MentorshipRequest request = MentorshipRequest.builder().student(s).faculty(f).build();
        request.setId(UUID.randomUUID());
        request.setStatus(MentorshipStatus.PENDING);
        when(mentorshipRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        mentorshipService.decide(f, request.getId(), new MentorshipDecisionRequest(MentorshipStatus.REJECTED));

        assertEquals(MentorshipStatus.REJECTED, request.getStatus());
        verify(mentorshipRepository, never()).save(any(Mentorship.class));
        verify(notificationService).mentorshipRejected(request);
    }

    @Test
    void decideByOtherFacultyForbidden() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        User other = faculty(UUID.randomUUID());
        MentorshipRequest request = MentorshipRequest.builder().student(s).faculty(f).build();
        request.setId(UUID.randomUUID());
        request.setStatus(MentorshipStatus.PENDING);
        when(mentorshipRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.decide(other, request.getId(), new MentorshipDecisionRequest(MentorshipStatus.ACCEPTED)));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void decideAlreadyProcessedConflict() {
        User s = student(UUID.randomUUID());
        User f = faculty(UUID.randomUUID());
        MentorshipRequest request = MentorshipRequest.builder().student(s).faculty(f).build();
        request.setId(UUID.randomUUID());
        request.setStatus(MentorshipStatus.ACCEPTED);
        when(mentorshipRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.decide(f, request.getId(), new MentorshipDecisionRequest(MentorshipStatus.ACCEPTED)));
        assertEquals("MENTORSHIP_REQUEST_ALREADY_DECIDED", ex.getCode());
    }

    @Test
    void decideRequestNotFound() {
        UUID rid = UUID.randomUUID();
        User f = faculty(UUID.randomUUID());
        when(mentorshipRequestRepository.findById(rid)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> mentorshipService.decide(f, rid, new MentorshipDecisionRequest(MentorshipStatus.ACCEPTED)));
        assertEquals("MENTORSHIP_REQUEST_NOT_FOUND", ex.getCode());
    }
}