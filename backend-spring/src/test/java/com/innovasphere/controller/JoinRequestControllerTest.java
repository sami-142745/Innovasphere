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
class JoinRequestControllerTest {

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
                .content("{\"title\":\"" + title + "\",\"description\":\"A join request test project description.\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String sendJoinRequest(String token, String projectId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects/" + projectId + "/join-requests")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"I would like to join\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void studentCanRequestToJoinProject() throws Exception {
        AuthUser owner = register(unique("owner"), unique("jro") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Joinable Project"));
        AuthUser student = register(unique("student"), unique("jrs") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/projects/" + projectId + "/join-requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"I would like to join\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.projectId").value(projectId))
            .andExpect(jsonPath("$.studentName").isNotEmpty());
    }

    @Test
    void duplicatePendingJoinRequestReturnsConflict() throws Exception {
        AuthUser owner = register(unique("owner"), unique("jro") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Dup Project"));
        AuthUser student = register(unique("student"), unique("jrs") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);

        mockMvc.perform(post("/api/projects/" + projectId + "/join-requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("JOIN_REQUEST_PENDING"));
    }

    @Test
    void ownerCannotJoinOwnProject() throws Exception {
        AuthUser owner = register(unique("student"), unique("jrs") + "@test.com", "STUDENT");
        String projectId = createProject(owner.token(), unique("Own Project"));

        mockMvc.perform(post("/api/projects/" + projectId + "/join-requests")
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CANNOT_JOIN_OWN_PROJECT"));
    }

    @Test
    void facultyCannotRequestToJoin() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("jrf") + "@test.com", "FACULTY");
        String projectId = createProject(faculty.token(), unique("Faculty Try Join"));
        AuthUser otherFaculty = register(unique("faculty2"), unique("jrf2") + "@test.com", "FACULTY");

        mockMvc.perform(post("/api/projects/" + projectId + "/join-requests")
                .header("Authorization", "Bearer " + otherFaculty.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void ownerAcceptingJoinsStudentToProject() throws Exception {
        AuthUser owner = register(unique("owner"), unique("jro") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Acceptor Project"));
        AuthUser student = register(unique("student"), unique("jrs") + "@test.com", "STUDENT");
        String requestId = sendJoinRequest(student.token(), projectId);

        mockMvc.perform(patch("/api/projects/" + projectId + "/join-requests/" + requestId)
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACCEPTED\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(post("/api/projects/" + projectId + "/join-requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("ALREADY_MEMBER"));
    }

    @Test
    void nonOwnerCannotDecideJoinRequest() throws Exception {
        AuthUser owner = register(unique("owner"), unique("jro") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Secure Project"));
        AuthUser student = register(unique("student"), unique("jrs") + "@test.com", "STUDENT");
        String requestId = sendJoinRequest(student.token(), projectId);
        AuthUser intruder = register(unique("intruder"), unique("jri") + "@test.com", "STUDENT");

        mockMvc.perform(patch("/api/projects/" + projectId + "/join-requests/" + requestId)
                .header("Authorization", "Bearer " + intruder.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACCEPTED\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void myJoinRequestsListsOwnRequests() throws Exception {
        AuthUser owner = register(unique("owner"), unique("jro") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("My Requests Project"));
        AuthUser student = register(unique("student"), unique("jrs") + "@test.com", "STUDENT");
        String requestId = sendJoinRequest(student.token(), projectId);

        mockMvc.perform(get("/api/join-requests/my")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
            .andExpect(jsonPath("$[?(@.id=='" + requestId + "')]").exists());
    }
}