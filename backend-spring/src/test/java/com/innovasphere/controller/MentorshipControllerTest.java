package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class MentorshipControllerTest {

    private record AuthUser(String token, String id) {
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
                .content("{\"title\":\"" + title + "\",\"description\":\"A mentorship test project description.\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void mentorsListReturnsFaculty() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        mockMvc.perform(get("/api/mentors")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$..content[?(@.id=='" + faculty.id() + "')]").exists());
    }

    @Test
    void getMentorReturnsProfile() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        mockMvc.perform(get("/api/mentors/" + faculty.id())
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(faculty.id()))
            .andExpect(jsonPath("$.name").isNotEmpty())
            .andExpect(jsonPath("$.activeMentorships").isNumber())
            .andExpect(jsonPath("$.researchDomains").isArray());
    }

    @Test
    void searchMentorsByKeyword() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        mockMvc.perform(get("/api/mentors/search")
                .param("keyword", "Test")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void studentRequestsMentorship() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\",\"message\":\"Please mentor me\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.facultyId").value(faculty.id()))
            .andExpect(jsonPath("$.facultyName").isNotEmpty());
    }

    @Test
    void duplicateMentorshipRequestReturnsConflict() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\"}"))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("MENTORSHIP_REQUEST_PENDING"));
    }

    @Test
    void facultyAcceptsRequestCreatesMentorship() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");

        MvcResult created = mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        String requestId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/mentorships/requests/" + requestId)
                .header("Authorization", "Bearer " + faculty.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACCEPTED\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/mentors/" + faculty.id())
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activeMentorships").value(1));

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("MENTORSHIP_EXISTS"));
    }

    @Test
    void otherUserCannotDecideMentorshipRequest() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        AuthUser faculty2 = register(unique("faculty2"), unique("mef2") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");

        MvcResult created = mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        String requestId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/mentorships/requests/" + requestId)
                .header("Authorization", "Bearer " + faculty2.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACCEPTED\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void receivedRequestsListsFacultyRequests() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\"}"))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/mentorships/requests/received")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void studentCannotRequestSelfMentorship() throws Exception {
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");
        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + student.id() + "\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("NOT_FACULTY"));
    }

    @Test
    void mentorshipRequestWithProject() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("mef") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("mes") + "@test.com", "STUDENT");
        String projectId = createProject(faculty.token(), unique("Mentor Project"));

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\",\"projectId\":\"" + projectId + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.projectId").value(projectId));
    }
}