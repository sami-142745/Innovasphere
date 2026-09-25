package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.StudentSkill;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.StudentProfileRepository;
import com.innovasphere.repository.StudentSkillRepository;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RecommendationControllerTest {

    private record AuthUser(String token, String id) {
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private ResearchDomainRepository researchDomainRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private StudentSkillRepository studentSkillRepository;

    @Autowired
    private FacultyProfileRepository facultyProfileRepository;

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private AuthUser register(String username, String email, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Test\",\"lastName\":\"User\",\"username\":\"" + username
                    + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass@123\",\"role\":\"" + role + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthUser(body.get("token").asText(), body.get("user").get("id").asText());
    }

    private String createProject(String token, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + title + "\",\"description\":\"A recommendation test project description.\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private void updateProject(String token, String projectId, String skillIds, String domainIds) throws Exception {
        String body = "{\"skillIds\":[" + skillIds + "],\"researchDomainIds\":[" + domainIds + "]}";
        mockMvc.perform(put("/api/projects/" + projectId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk());
    }

    private Skill skill(String name) {
        return skillRepository.findByNameIgnoreCase(name)
            .orElseGet(() -> skillRepository.save(Skill.builder().name(name).description("Test skill").build()));
    }

    private ResearchDomain domain(String name) {
        return researchDomainRepository.findByNameIgnoreCase(name)
            .orElseGet(() -> researchDomainRepository.save(
                ResearchDomain.builder().name(name).description("Test domain").build()));
    }

    private void seedStudent(String studentId, Skill studentSkill, ResearchDomain studentDomain) {
        StudentProfile profile = studentProfileRepository.findByUserId(UUID.fromString(studentId)).orElseThrow();
        StudentSkill skill = StudentSkill.builder()
            .studentProfile(profile)
            .skill(studentSkill)
            .level(4)
            .build();
        profile.getSkills().add(skill);
        studentSkillRepository.save(skill);
        profile.getResearchDomains().add(studentDomain);
        studentProfileRepository.save(profile);
    }

    private void seedFaculty(String facultyId, String expertise, ResearchDomain domain) {
        FacultyProfile profile = facultyProfileRepository.findByUserId(UUID.fromString(facultyId)).orElseThrow();
        profile.setExpertise(expertise);
        profile.setDepartment("Computer Science");
        Set<ResearchDomain> domains = new HashSet<>(profile.getResearchDomains());
        domains.add(domain);
        profile.setResearchDomains(domains);
        facultyProfileRepository.save(profile);
    }

    @Test
    void projectRecommendationScoringMatchesSkillsDomainsAndInterests() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcf") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcs") + "@test.com", "STUDENT");

        Skill java = skill("Java");
        Skill python = skill("Python");
        ResearchDomain dl = domain("Deep Learning");
        seedStudent(student.id(), java, dl);

        String projectId = createProject(faculty.token(), unique("Deep Learning Pipeline"));
        String javaSkillId = java.getId().toString();
        String pythonSkillId = python.getId().toString();
        String dlDomainId = dl.getId().toString();
        updateProject(faculty.token(), projectId,
            "\"" + javaSkillId + "\",\"" + pythonSkillId + "\"", "\"" + dlDomainId + "\"");

        mockMvc.perform(get("/api/recommendations/projects?size=50")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.projectId=='" + projectId + "')].matchScore").value(75))
            .andExpect(jsonPath("$.content[?(@.projectId=='" + projectId + "')].matchedSkills[?(@=='Java')]").exists())
            .andExpect(jsonPath("$.content[?(@.projectId=='" + projectId + "')].missingSkills[?(@=='Python')]").exists())
            .andExpect(jsonPath("$.content[?(@.projectId=='" + projectId + "')].matchedDomains[?(@=='Deep Learning')]").exists())
            .andExpect(jsonPath("$.content[?(@.projectId=='" + projectId + "')].matchedInterests[?(@=='Deep Learning')]").exists());
    }

    @Test
    void projectScoreEndpointReturnsScoredValue() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcfs") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcss") + "@test.com", "STUDENT");

        Skill java = skill("Java");
        ResearchDomain dl = domain("Deep Learning");
        seedStudent(student.id(), java, dl);

        String projectId = createProject(faculty.token(), unique("Deep Learning Scoring"));
        updateProject(faculty.token(), projectId,
            "\"" + java.getId().toString() + "\"", "\"" + dl.getId().toString() + "\"");

        mockMvc.perform(get("/api/recommendations/projects/" + projectId + "/score")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(projectId))
            .andExpect(jsonPath("$.score").value(100));
    }

    @Test
    void projectRecommendationsAreSortedDescendingAndDistinct() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcfd") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcsd") + "@test.com", "STUDENT");

        Skill java = skill("Java");
        ResearchDomain dl = domain("Deep Learning");
        seedStudent(student.id(), java, dl);

        String matchId = createProject(faculty.token(), unique("Deep Learning Alpha"));
        updateProject(faculty.token(), matchId,
            "\"" + java.getId().toString() + "\"", "\"" + dl.getId().toString() + "\"");
        String weakId = createProject(faculty.token(), unique("Unrelated Topic"));
        updateProject(faculty.token(), weakId, "\"" + skill("Ruby").getId().toString() + "\"", "");

        MvcResult result = mockMvc.perform(get("/api/recommendations/projects?size=50")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode content = objectMapper.readTree(result.getResponse().getContentAsString()).get("content");
        Set<String> ids = new HashSet<>();
        Integer previous = null;
        for (JsonNode node : content) {
            int score = node.get("matchScore").asInt();
            if (previous != null) {
                org.junit.jupiter.api.Assertions.assertTrue(score <= previous, "scores must be sorted descending");
            }
            previous = score;
            ids.add(node.get("projectId").asText());
        }
        org.junit.jupiter.api.Assertions.assertEquals(content.size(), ids.size(), "no duplicate recommendations");
    }

    @Test
    void completedProjectsAreExcluded() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcfc") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcsc") + "@test.com", "STUDENT");

        Skill java = skill("Java");
        seedStudent(student.id(), java, domain("Deep Learning"));

        String activeId = createProject(faculty.token(), unique("Active Rec Project"));
        updateProject(faculty.token(), activeId, "\"" + java.getId().toString() + "\"", "");

        String completedId = createProject(faculty.token(), unique("Completed Rec Project"));
        updateProject(faculty.token(), completedId, "\"" + java.getId().toString() + "\"", "");
        mockMvc.perform(put("/api/projects/" + completedId)
                .header("Authorization", "Bearer " + faculty.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"COMPLETED\"}"))
            .andExpect(status().isOk());

        JsonNode body = objectMapper.readTree(mockMvc.perform(get("/api/recommendations/projects?size=100")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString());
        JsonNode content = body.get("content");
        for (JsonNode node : content) {
            org.junit.jupiter.api.Assertions.assertNotEquals(completedId, node.get("projectId").asText(),
                "completed project must be excluded");
        }
        mockMvc.perform(get("/api/projects/" + completedId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void recommendationsSupportPagination() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcfp") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcsp") + "@test.com", "STUDENT");
        seedStudent(student.id(), skill("Java"), domain("Deep Learning"));
        createProject(faculty.token(), unique("Page Rec Project"));

        mockMvc.perform(get("/api/recommendations/projects?page=0&size=1")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.numberOfElements").value(1))
            .andExpect(jsonPath("$.totalElements").value(Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void mentorRecommendationReturnsScoredFaculty() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcfm") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcsm") + "@test.com", "STUDENT");

        Skill java = skill("Java");
        ResearchDomain dl = domain("Deep Learning");
        seedStudent(student.id(), java, dl);
        seedFaculty(faculty.id(), "Java and Deep Learning specialist", dl);

        mockMvc.perform(get("/api/recommendations/mentors?size=50")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.mentorId=='" + faculty.id() + "')].matchScore").value(100))
            .andExpect(jsonPath("$.content[?(@.mentorId=='" + faculty.id() + "')].matchedSkills[?(@=='Java')]").exists())
            .andExpect(jsonPath("$.content[?(@.mentorId=='" + faculty.id() + "')].matchedDomains[?(@=='Deep Learning')]").exists());
    }

    @Test
    void mentorScoreEndpointReturnsValue() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcfme") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("rcsme") + "@test.com", "STUDENT");

        Skill java = skill("Java");
        ResearchDomain dl = domain("Deep Learning");
        seedStudent(student.id(), java, dl);
        seedFaculty(faculty.id(), "Java researcher", dl);

        mockMvc.perform(get("/api/recommendations/mentors/" + faculty.id() + "/score")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(faculty.id()))
            .andExpect(jsonPath("$.score").value(100));
    }

    @Test
    void facultyCannotAccessRecommendations() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("rcff") + "@test.com", "FACULTY");

        mockMvc.perform(get("/api/recommendations/projects")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        mockMvc.perform(get("/api/recommendations/mentors")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRecommendationsBlocked() throws Exception {
        mockMvc.perform(get("/api/recommendations/projects"))
            .andExpect(status().isUnauthorized());
    }
}