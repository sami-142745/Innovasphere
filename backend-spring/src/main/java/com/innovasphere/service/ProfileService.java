package com.innovasphere.service;

import com.innovasphere.dto.FacultyProfileDto;
import com.innovasphere.dto.FacultyProfileUpdateRequest;
import com.innovasphere.dto.StudentProfileDto;
import com.innovasphere.dto.StudentProfileUpdateRequest;
import com.innovasphere.dto.UserProfileDto;
import com.innovasphere.dto.UserUpdateRequest;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.StudentSkill;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.FacultyProfileMapper;
import com.innovasphere.mapper.StudentProfileMapper;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.StudentProfileRepository;
import com.innovasphere.repository.UserRepository;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final SkillRepository skillRepository;
    private final ResearchDomainRepository researchDomainRepository;
    private final StudentProfileMapper studentProfileMapper;
    private final FacultyProfileMapper facultyProfileMapper;

    public ProfileService(
        UserRepository userRepository,
        StudentProfileRepository studentProfileRepository,
        FacultyProfileRepository facultyProfileRepository,
        SkillRepository skillRepository,
        ResearchDomainRepository researchDomainRepository,
        StudentProfileMapper studentProfileMapper,
        FacultyProfileMapper facultyProfileMapper
    ) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.facultyProfileRepository = facultyProfileRepository;
        this.skillRepository = skillRepository;
        this.researchDomainRepository = researchDomainRepository;
        this.studentProfileMapper = studentProfileMapper;
        this.facultyProfileMapper = facultyProfileMapper;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        return buildUserProfile(user);
    }

    @Transactional
    public UserProfileDto updateOwnUser(UUID userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        String email = request.email().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email is already registered");
        }

        String username = request.username().trim();
        if (!user.getUsername().equals(username) && userRepository.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "USERNAME_EXISTS", "Username is already taken");
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        userRepository.save(user);

        return buildUserProfile(user);
    }

    @Transactional
    public StudentProfileDto updateOwnStudentProfile(UUID userId, StudentProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only students can update a student profile");
        }

        StudentProfile profile = studentProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Student profile not found"));

        profile.setEnrollmentNumber(request.enrollmentNumber() != null ? request.enrollmentNumber().trim() : null);
        profile.setUniversity(request.university() != null ? request.university().trim() : null);
        profile.setDepartment(request.department() != null ? request.department().trim() : null);
        profile.setYearOfStudy(request.yearOfStudy());
        profile.setBio(request.bio() != null ? request.bio().trim() : null);

        updateStudentSkills(profile, request.skillIds());
        updateStudentResearchDomains(profile, request.researchDomainIds());

        studentProfileRepository.save(profile);
        return studentProfileMapper.toDto(profile);
    }

    @Transactional
    public FacultyProfileDto updateOwnFacultyProfile(UUID userId, FacultyProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        if (user.getRole() != Role.FACULTY) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only faculty can update a faculty profile");
        }

        FacultyProfile profile = facultyProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Faculty profile not found"));

        profile.setDepartment(request.department() != null ? request.department().trim() : null);
        profile.setDesignation(request.designation() != null ? request.designation().trim() : null);
        profile.setBio(request.bio() != null ? request.bio().trim() : null);
        profile.setExpertise(request.expertise() != null ? request.expertise().trim() : null);
        updateFacultyResearchDomains(profile, request.researchDomainIds());

        facultyProfileRepository.save(profile);
        return facultyProfileMapper.toDto(profile);
    }

    @Transactional
    public UserProfileDto adminUpdateUser(UUID userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        String email = request.email().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email is already registered");
        }

        String username = request.username().trim();
        if (!user.getUsername().equals(username) && userRepository.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "USERNAME_EXISTS", "Username is already taken");
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        userRepository.save(user);

        return buildUserProfile(user);
    }

    private UserProfileDto buildUserProfile(User user) {
        if (user.getRole() == Role.FACULTY) {
            FacultyProfile facultyProfile = facultyProfileRepository.findByUserId(user.getId()).orElse(null);
            return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                null,
                facultyProfile != null ? facultyProfileMapper.toDto(facultyProfile) : null,
                user.getCreatedAt()
            );
        }
        StudentProfile studentProfile = studentProfileRepository.findByUserId(user.getId()).orElse(null);
        return new UserProfileDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.isActive(),
            studentProfile != null ? studentProfileMapper.toDto(studentProfile) : null,
            null,
            user.getCreatedAt()
        );
    }

    private void updateStudentSkills(StudentProfile profile, Set<UUID> skillIds) {
        Set<Skill> skills = new HashSet<>();
        if (skillIds != null) {
            for (UUID skillId : skillIds) {
                Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SKILL_NOT_FOUND", "Skill not found: " + skillId));
                skills.add(skill);
            }
        }
        // Clear existing student-skill links and replace
        profile.getSkills().clear();
        profile.getSkills().addAll(skills.stream()
            .map(s -> StudentSkill.builder()
                .studentProfile(profile)
                .skill(s)
                .build())
            .toList());
    }

    private void updateStudentResearchDomains(StudentProfile profile, Set<UUID> domainIds) {
        Set<ResearchDomain> domains = new HashSet<>();
        if (domainIds != null) {
            for (UUID domainId : domainIds) {
                ResearchDomain domain = researchDomainRepository.findById(domainId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESEARCH_DOMAIN_NOT_FOUND", "Research domain not found: " + domainId));
                domains.add(domain);
            }
        }
        profile.getResearchDomains().clear();
        profile.getResearchDomains().addAll(domains);
    }

    private void updateFacultyResearchDomains(FacultyProfile profile, Set<UUID> domainIds) {
        Set<ResearchDomain> domains = new HashSet<>();
        if (domainIds != null) {
            for (UUID domainId : domainIds) {
                ResearchDomain domain = researchDomainRepository.findById(domainId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESEARCH_DOMAIN_NOT_FOUND", "Research domain not found: " + domainId));
                domains.add(domain);
            }
        }
        profile.getResearchDomains().clear();
        profile.getResearchDomains().addAll(domains);
    }
}
