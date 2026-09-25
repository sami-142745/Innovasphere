package com.innovasphere.service;

import com.innovasphere.dto.MentorRecommendationDto;
import com.innovasphere.dto.ProjectRecommendationDto;
import com.innovasphere.dto.UserDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectSkill;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.ProjectStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.UserMapper;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.StudentProfileRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationServiceImpl implements RecommendationService {

    private final StudentProfileRepository studentProfileRepository;
    private final ProjectRepository projectRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final UserMapper userMapper;

    public RecommendationServiceImpl(
        StudentProfileRepository studentProfileRepository,
        ProjectRepository projectRepository,
        FacultyProfileRepository facultyProfileRepository,
        UserMapper userMapper
    ) {
        this.studentProfileRepository = studentProfileRepository;
        this.projectRepository = projectRepository;
        this.facultyProfileRepository = facultyProfileRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectRecommendationDto> recommendProjects(User student, Pageable pageable) {
        requireStudent(student);
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId()).orElse(null);
        Set<String> skills = studentSkills(profile);
        Set<String> domains = studentDomains(profile);
        Set<String> interests = studentInterests(profile);

        Page<Project> page = projectRepository.findByStatusNot(ProjectStatus.COMPLETED, pageable);
        List<ProjectRecommendationDto> content = page.getContent().stream()
            .map(project -> scoreProject(project, skills, domains, interests))
            .sorted(Comparator.comparingInt(ProjectRecommendationDto::matchScore).reversed())
            .toList();
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MentorRecommendationDto> recommendMentors(User student, Pageable pageable) {
        requireStudent(student);
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId()).orElse(null);
        Set<String> skills = studentSkills(profile);
        Set<String> domains = studentDomains(profile);
        Set<String> interests = studentInterests(profile);

        Page<FacultyProfile> page = facultyProfileRepository.findAll(pageable);
        List<MentorRecommendationDto> content = page.getContent().stream()
            .map(faculty -> scoreMentor(faculty, skills, domains, interests))
            .sorted(Comparator.comparingInt(MentorRecommendationDto::matchScore).reversed())
            .toList();
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public int projectScore(User student, UUID projectId) {
        requireStudent(student);
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId()).orElse(null);
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));
        return scoreProject(project, studentSkills(profile), studentDomains(profile), studentInterests(profile))
            .matchScore();
    }

    @Override
    @Transactional(readOnly = true)
    public int mentorScore(User student, UUID mentorId) {
        requireStudent(student);
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId()).orElse(null);
        FacultyProfile faculty = facultyProfileRepository.findByUserId(mentorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MENTOR_NOT_FOUND", "Mentor not found"));
        return scoreMentor(faculty, studentSkills(profile), studentDomains(profile), studentInterests(profile))
            .matchScore();
    }

    private ProjectRecommendationDto scoreProject(Project project, Set<String> skills, Set<String> domains,
                                                  Set<String> interests) {
        LinkedHashSet<String> requiredSkills = new LinkedHashSet<>();
        for (ProjectSkill required : project.getSkills()) {
            requiredSkills.add(required.getSkill().getName());
        }
        LinkedHashSet<String> projectDomains = new LinkedHashSet<>();
        for (ResearchDomain domain : project.getResearchDomains()) {
            projectDomains.add(domain.getName());
        }

        Set<String> studentSkillNames = lower(skills);

        LinkedHashSet<String> matchedSkills = new LinkedHashSet<>();
        for (String required : requiredSkills) {
            if (studentSkillNames.contains(lower(required))) {
                matchedSkills.add(required);
            }
        }
        LinkedHashSet<String> missingSkills = new LinkedHashSet<>(requiredSkills);
        missingSkills.removeAll(matchedSkills);

        Set<String> studentDomainNames = lower(domains);
        LinkedHashSet<String> matchedDomains = new LinkedHashSet<>();
        for (String required : projectDomains) {
            if (studentDomainNames.contains(lower(required))) {
                matchedDomains.add(required);
            }
        }

        String projectText = lower(
            project.getTitle(), project.getShortDescription(), project.getDescription()
        );
        LinkedHashSet<String> matchedInterests = new LinkedHashSet<>();
        for (String interest : interests) {
            if (projectText != null && projectText.contains(lower(interest))) {
                matchedInterests.add(interest);
            }
        }

        double skillComponent = requiredSkills.isEmpty()
            ? 0.0 : 50.0 * matchedSkills.size() / requiredSkills.size();
        double domainComponent = projectDomains.isEmpty()
            ? 0.0 : 20.0 * matchedDomains.size() / projectDomains.size();
        double interestComponent = interests.isEmpty()
            ? 0.0 : 30.0 * matchedInterests.size() / interests.size();

        int score = clamp((int) Math.round(skillComponent + domainComponent + interestComponent));
        String reason = buildReason(matchedSkills.size(), requiredSkills.size(), matchedDomains.size(),
            projectDomains.size(), matchedInterests.size(), interests.size());

        return new ProjectRecommendationDto(
            project.getId(),
            project.getTitle(),
            userMapper.toDto(project.getOwner()),
            project.getStatus(),
            score,
            matchedSkills,
            matchedDomains,
            matchedInterests,
            missingSkills,
            reason
        );
    }

    private MentorRecommendationDto scoreMentor(FacultyProfile faculty, Set<String> skills, Set<String> domains,
                                                Set<String> interests) {
        String expertise = lower(faculty.getExpertise());
        String designation = lower(faculty.getDesignation());
        String department = lower(faculty.getDepartment());

        LinkedHashSet<String> matchedSkills = new LinkedHashSet<>();
        for (String skill : skills) {
            if (expertise != null && expertise.contains(lower(skill))) {
                matchedSkills.add(skill);
            }
        }

        LinkedHashSet<String> facultyDomains = new LinkedHashSet<>();
        for (ResearchDomain domain : faculty.getResearchDomains()) {
            facultyDomains.add(domain.getName());
        }
        Set<String> loweredFacultyDomains = lower(facultyDomains, null);
        LinkedHashSet<String> matchedDomains = new LinkedHashSet<>();
        for (String domain : domains) {
            if (loweredFacultyDomains.contains(lower(domain))) {
                matchedDomains.add(domain);
            }
        }

        LinkedHashSet<String> matchedInterests = new LinkedHashSet<>();
        for (String interest : interests) {
            String token = lower(interest);
            boolean inText = containsAny(token, expertise, designation, department);
            if (inText || loweredFacultyDomains.contains(token)) {
                matchedInterests.add(interest);
            }
        }

        double skillComponent = skills.isEmpty() ? 0.0 : 50.0 * matchedSkills.size() / skills.size();
        double domainComponent = domains.isEmpty() ? 0.0 : 20.0 * matchedDomains.size() / domains.size();
        double interestComponent = interests.isEmpty() ? 0.0 : 30.0 * matchedInterests.size() / interests.size();

        int score = clamp((int) Math.round(skillComponent + domainComponent + interestComponent));
        String reason = buildMentorReason(matchedSkills.size(), skills.size(), matchedDomains.size(),
            domains.size(), matchedInterests.size(), interests.size());

        return new MentorRecommendationDto(
            faculty.getUser().getId(),
            faculty.getUser().getFullName(),
            faculty.getDepartment(),
            faculty.getExpertise(),
            score,
            matchedSkills,
            matchedDomains,
            reason
        );
    }

    private Set<String> studentSkills(StudentProfile profile) {
        Set<String> skills = new LinkedHashSet<>();
        if (profile != null && profile.getSkills() != null) {
            profile.getSkills().forEach(ss -> skills.add(ss.getSkill().getName()));
        }
        return skills;
    }

    private Set<String> studentDomains(StudentProfile profile) {
        Set<String> domains = new LinkedHashSet<>();
        if (profile != null && profile.getResearchDomains() != null) {
            profile.getResearchDomains().forEach(rd -> domains.add(rd.getName()));
        }
        return domains;
    }

    private Set<String> studentInterests(StudentProfile profile) {
        return studentDomains(profile);
    }

    private Set<String> lower(Set<String> collection, Set<String> ignored) {
        Set<String> result = new HashSet<>();
        if (collection == null) {
            return result;
        }
        for (String value : collection) {
            String lowered = lower(value);
            if (lowered != null) {
                result.add(lowered);
            }
        }
        return result;
    }

    private Set<String> lower(Set<String> collection) {
        return lower(collection, null);
    }

    private String lower(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String lower(String a, String b, String c) {
        return (trimToLower(a) + " " + trimToLower(b) + " " + trimToLower(c)).trim();
    }

    private String trimToLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private boolean containsAny(String token, String... fields) {
        for (String field : fields) {
            if (field != null && field.contains(token)) {
                return true;
            }
        }
        return false;
    }

    private String buildReason(int matchedSkills, int requiredSkills, int matchedDomains,
                               int requiredDomains, int matchedInterests, int totalInterests) {
        List<String> parts = new ArrayList<>();
        if (requiredSkills > 0) {
            parts.add("Matched " + matchedSkills + " of " + requiredSkills + " required skills");
        }
        if (requiredDomains > 0) {
            parts.add("matched " + matchedDomains + " of " + requiredDomains + " research domains");
        }
        if (totalInterests > 0) {
            parts.add("matched " + matchedInterests + " of " + totalInterests + " research interests");
        }
        if (parts.isEmpty()) {
            return "No skills, domains or interests available to compare";
        }
        return String.join("; ", parts) + ".";
    }

    private String buildMentorReason(int matchedSkills, int totalSkills, int matchedDomains,
                                     int totalDomains, int matchedInterests, int totalInterests) {
        List<String> parts = new ArrayList<>();
        if (totalSkills > 0) {
            parts.add("Matched " + matchedSkills + " of " + totalSkills + " of your skills");
        }
        if (totalDomains > 0) {
            parts.add("shared " + matchedDomains + " of " + totalDomains + " research domains");
        }
        if (totalInterests > 0) {
            parts.add("matched " + matchedInterests + " of " + totalInterests + " research interests");
        }
        if (parts.isEmpty()) {
            return "No skills, domains or interests available to compare";
        }
        return String.join("; ", parts) + ".";
    }

    private void requireStudent(User user) {
        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Only students can access recommendations");
        }
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }
}