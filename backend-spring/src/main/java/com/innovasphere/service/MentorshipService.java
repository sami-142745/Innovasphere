package com.innovasphere.service;

import com.innovasphere.dto.MentorDto;
import com.innovasphere.dto.MentorshipDecisionRequest;
import com.innovasphere.dto.MentorshipRequestCreateRequest;
import com.innovasphere.dto.MentorshipRequestDto;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorshipService {

    private final FacultyProfileRepository facultyProfileRepository;
    private final MentorshipRequestRepository mentorshipRequestRepository;
    private final MentorshipRepository mentorshipRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final MentorMapper mentorMapper;
    private final MentorshipRequestMapper mentorshipRequestMapper;
    private final NotificationService notificationService;

    public MentorshipService(
        FacultyProfileRepository facultyProfileRepository,
        MentorshipRequestRepository mentorshipRequestRepository,
        MentorshipRepository mentorshipRepository,
        UserRepository userRepository,
        ProjectRepository projectRepository,
        MentorMapper mentorMapper,
        MentorshipRequestMapper mentorshipRequestMapper,
        NotificationService notificationService
    ) {
        this.facultyProfileRepository = facultyProfileRepository;
        this.mentorshipRequestRepository = mentorshipRequestRepository;
        this.mentorshipRepository = mentorshipRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.mentorMapper = mentorMapper;
        this.mentorshipRequestMapper = mentorshipRequestMapper;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Page<MentorDto> list(Pageable pageable) {
        Page<FacultyProfile> page = facultyProfileRepository.findAll(pageable);
        Map<UUID, Long> mentorshipCounts = mentorshipCounts(page.getContent());
        return page.map(faculty -> mentorMapper.toDto(faculty, mentorshipCounts.getOrDefault(faculty.getId(), 0L)));
    }

    @Transactional(readOnly = true)
    public MentorDto get(UUID userId) {
        FacultyProfile faculty = requireFacultyByUserId(userId);
        return mentorMapper.toDto(faculty, mentorshipRepository.countByFacultyId(faculty.getId()));
    }

    @Transactional(readOnly = true)
    public Page<MentorDto> search(String keyword, String domain, Pageable pageable) {
        Page<FacultyProfile> page = facultyProfileRepository.search(normalize(keyword), normalize(domain), pageable);
        Map<UUID, Long> mentorshipCounts = mentorshipCounts(page.getContent());
        return page.map(faculty -> mentorMapper.toDto(faculty, mentorshipCounts.getOrDefault(faculty.getId(), 0L)));
    }

    private Map<UUID, Long> mentorshipCounts(List<FacultyProfile> faculty) {
        if (faculty.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = mentorshipRepository.countByFacultyIds(
            faculty.stream().map(FacultyProfile::getId).toList());
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return counts;
    }

    @Transactional
    public MentorshipRequestDto createRequest(User student, MentorshipRequestCreateRequest request) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only students can request mentorship");
        }

        User facultyUser = userRepository.findById(request.facultyId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FACULTY_NOT_FOUND", "Faculty member not found"));
        if (facultyUser.getRole() != Role.FACULTY) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NOT_FACULTY", "The requested user is not faculty");
        }
        requireFacultyByUserId(facultyUser.getId());

        if (facultyUser.getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_MENTOR_SELF", "You cannot request mentorship from yourself");
        }

        if (mentorshipRepository.existsByFaculty_UserIdAndStudent_Id(facultyUser.getId(), student.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "MENTORSHIP_EXISTS", "A mentorship already exists with this faculty member");
        }
        if (mentorshipRequestRepository.existsByStudentIdAndFacultyIdAndStatus(
            student.getId(), facultyUser.getId(), MentorshipStatus.PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "MENTORSHIP_REQUEST_PENDING",
                "You already have a pending mentorship request with this faculty member");
        }

        Project project = null;
        if (request.projectId() != null) {
            project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));
            UUID facultyProfileId = requireFacultyByUserId(facultyUser.getId()).getId();
            if (mentorshipRepository.existsByFaculty_IdAndProject_Id(facultyProfileId, project.getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "MENTORSHIP_EXISTS",
                    "This faculty member is already mentoring on the specified project");
            }
        }

        MentorshipRequest mentorshipRequest = MentorshipRequest.builder()
            .student(student)
            .faculty(facultyUser)
            .project(project)
            .message(request.message() != null ? request.message().trim() : null)
            .build();
        MentorshipRequest saved = mentorshipRequestRepository.save(mentorshipRequest);
        notificationService.mentorshipRequestSent(saved);
        return mentorshipRequestMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MentorshipRequestDto> myRequests(UUID studentId) {
        return mentorshipRequestRepository.findByStudentId(studentId).stream()
            .map(mentorshipRequestMapper::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MentorshipRequestDto> receivedRequests(UUID facultyUserId) {
        return mentorshipRequestRepository.findByFacultyId(facultyUserId).stream()
            .map(mentorshipRequestMapper::toDto)
            .toList();
    }

    @Transactional
    public MentorshipRequestDto decide(User facultyUser, UUID requestId, MentorshipDecisionRequest decision) {
        MentorshipRequest mentorshipRequest = mentorshipRequestRepository.findById(requestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MENTORSHIP_REQUEST_NOT_FOUND",
                "Mentorship request not found"));

        boolean isAdmin = facultyUser.getRole() == Role.ADMIN;
        if (!isAdmin && !mentorshipRequest.getFaculty().getId().equals(facultyUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Only the requested faculty member can respond to this mentorship request");
        }
        if (mentorshipRequest.getStatus() != MentorshipStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "MENTORSHIP_REQUEST_ALREADY_DECIDED",
                "Mentorship request has already been processed");
        }

        MentorshipStatus target = decision.status();
        if (target == MentorshipStatus.ACCEPTED) {
            FacultyProfile faculty = requireFacultyByUserId(mentorshipRequest.getFaculty().getId());
            mentorshipRepository.save(Mentorship.builder()
                .faculty(faculty)
                .student(mentorshipRequest.getStudent())
                .project(mentorshipRequest.getProject())
                .build());
            mentorshipRequest.setStatus(MentorshipStatus.ACCEPTED);
            notificationService.mentorshipAccepted(mentorshipRequest);
        } else {
            mentorshipRequest.setStatus(MentorshipStatus.REJECTED);
            notificationService.mentorshipRejected(mentorshipRequest);
        }

        return mentorshipRequestMapper.toDto(mentorshipRequestRepository.save(mentorshipRequest));
    }

    private FacultyProfile requireFacultyByUserId(UUID userId) {
        return facultyProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FACULTY_PROFILE_NOT_FOUND",
                "Faculty profile not found"));
    }

    private String normalize(String value) {
        return value != null && !value.isBlank() ? value.trim() : null;
    }
}