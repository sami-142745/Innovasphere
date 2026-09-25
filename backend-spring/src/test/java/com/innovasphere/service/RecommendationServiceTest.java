package com.innovasphere.service;

import com.innovasphere.dto.ProjectRecommendationDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectSkill;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.StudentSkill;
import com.innovasphere.entity.User;
import com.innovasphere.enums.ProjectStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.UserMapper;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.StudentProfileRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock StudentProfileRepository studentProfileRepository;
    @Mock ProjectRepository projectRepository;
    @Mock FacultyProfileRepository facultyProfileRepository;
    @Mock UserMapper userMapper;
    @InjectMocks RecommendationServiceImpl recommendationService;

    private User student(UUID id) {
        User u = User.builder().username("s").email("s@test.com").fullName("Student").role(Role.STUDENT).active(true).build();
        u.setId(id);
        return u;
    }

    private StudentProfile profileWithSkills(User u, String... skillNames) {
        StudentProfile profile = new StudentProfile();
        profile.setUser(u);
        Set<StudentSkill> skills = new HashSet<>();
        for (String name : skillNames) {
            Skill skill = Skill.builder().name(name).build();
            StudentSkill ss = new StudentSkill();
            ss.setSkill(skill);
            skills.add(ss);
        }
        profile.setSkills(skills);
        return profile;
    }

    private Project projectWithSkills(String title, String... skillNames) {
        Project p = Project.builder().owner(student(UUID.randomUUID())).title(title).description("desc")
            .shortDescription("sd").build();
        p.setId(UUID.randomUUID());
        p.setStatus(ProjectStatus.IN_PROGRESS);
        Set<ProjectSkill> skills = new HashSet<>();
        for (String name : skillNames) {
            ProjectSkill ps = new ProjectSkill();
            ps.setProject(p);
            ps.setSkill(Skill.builder().name(name).build());
            skills.add(ps);
        }
        p.setSkills(skills);
        return p;
    }

    @Test
    void nonStudentCannotAccessRecommendations() {
        User faculty = student(UUID.randomUUID());
        faculty.setRole(Role.FACULTY);
        ApiException ex = assertThrows(ApiException.class,
            () -> recommendationService.recommendProjects(faculty, PageRequest.of(0, 20)));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        ApiException ex2 = assertThrows(ApiException.class,
            () -> recommendationService.recommendMentors(faculty, PageRequest.of(0, 20)));
        assertEquals("FORBIDDEN", ex2.getCode());
    }

    @Test
    void recommendProjectsScoresAndSortsDescending() {
        User s = student(UUID.randomUUID());
        when(studentProfileRepository.findByUserId(s.getId()))
            .thenReturn(Optional.of(profileWithSkills(s, "Python")));
        Project good = projectWithSkills("AI Assistant", "Python", "Java");
        Project bad = projectWithSkills("Gardening", "Rust");
        when(projectRepository.findByStatusNot(ProjectStatus.COMPLETED, PageRequest.of(0, 20)))
            .thenReturn(new PageImpl<>(List.of(good, bad)));

        List<ProjectRecommendationDto> content =
            recommendationService.recommendProjects(s, PageRequest.of(0, 20)).getContent();

        assertEquals("AI Assistant", content.get(0).title());
        assertEquals(25, content.get(0).matchScore());
        assertEquals(0, content.get(1).matchScore());
        assertEquals(1, content.get(0).matchedSkills().size());
        assertEquals(1, content.get(0).missingSkills().size());
    }

    @Test
    void recommendProjectsWithoutProfileStillWorks() {
        User s = student(UUID.randomUUID());
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.empty());
        Project p = projectWithSkills("Solo", "Java", "Kotlin");
        when(projectRepository.findByStatusNot(ProjectStatus.COMPLETED, PageRequest.of(0, 20)))
            .thenReturn(new PageImpl<>(List.of(p)));
        List<ProjectRecommendationDto> content =
            recommendationService.recommendProjects(s, PageRequest.of(0, 20)).getContent();
        assertEquals(0, content.get(0).matchScore());
    }

    @Test
    void recommendMentorsScoresByExpertise() {
        User s = student(UUID.randomUUID());
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(profileWithSkills(s, "python")));

        FacultyProfile good = new FacultyProfile();
        good.setUser(student(UUID.randomUUID()));
        good.setId(UUID.randomUUID());
        good.setExpertise("python, machine learning");
        good.setDesignation("Professor");
        good.setDepartment("AI");

        FacultyProfile bad = new FacultyProfile();
        bad.setUser(student(UUID.randomUUID()));
        bad.setId(UUID.randomUUID());
        bad.setExpertise("botany");
        bad.setDesignation("Lecturer");
        bad.setDepartment("Biology");

        when(facultyProfileRepository.findAll(any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(good, bad)));

        var content = recommendationService.recommendMentors(s, PageRequest.of(0, 20)).getContent();

        assertEquals(50, content.get(0).matchScore());
        assertEquals(0, content.get(1).matchScore());
        assertEquals(1, content.get(0).matchedSkills().size());
    }

    @Test
    void projectScoreReturnsComputedScoreOrThrowsWhenMissing() {
        User s = student(UUID.randomUUID());
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(profileWithSkills(s, "Python")));
        Project good = projectWithSkills("AI Assistant", "Python");
        when(projectRepository.findById(good.getId())).thenReturn(Optional.of(good));
        assertEquals(50, recommendationService.projectScore(s, good.getId()));

        UUID missing = UUID.randomUUID();
        when(projectRepository.findById(missing)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> recommendationService.projectScore(s, missing));
        assertEquals("PROJECT_NOT_FOUND", ex.getCode());
    }

    @Test
    void mentorScoreReturnsComputedScoreOrThrowsWhenMissing() {
        User s = student(UUID.randomUUID());
        when(studentProfileRepository.findByUserId(s.getId())).thenReturn(Optional.of(profileWithSkills(s, "python")));
        FacultyProfile good = new FacultyProfile();
        good.setUser(student(UUID.randomUUID()));
        good.setId(UUID.randomUUID());
        good.setExpertise("python");
        when(facultyProfileRepository.findByUserId(good.getUser().getId())).thenReturn(Optional.of(good));
        assertEquals(50, recommendationService.mentorScore(s, good.getUser().getId()));

        UUID missing = UUID.randomUUID();
        when(facultyProfileRepository.findByUserId(missing)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> recommendationService.mentorScore(s, missing));
        assertEquals("MENTOR_NOT_FOUND", ex.getCode());
    }
}