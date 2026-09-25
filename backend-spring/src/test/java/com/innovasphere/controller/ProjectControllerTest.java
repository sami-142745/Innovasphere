package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private String register(String username, String email, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Test\",\"lastName\":\"User\",\"username\":\"" + username
                    + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass@123\",\"role\":\"" + role + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private String createProject(String token, String title, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + title + "\",\"description\":\"" + description + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void createProjectReturnsCreatedWithOwner() throws Exception {
        String token = register(unique("owner"), unique("o") + "@test.com", "FACULTY");
        mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + unique("New Project") + "\",\"description\":\"A research project description.\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").isNotEmpty())
            .andExpect(jsonPath("$.owner.email").isNotEmpty())
            .andExpect(jsonPath("$.status").value("IDEA"))
            .andExpect(jsonPath("$.domains").isArray())
            .andExpect(jsonPath("$.skills").isArray());
    }

    @Test
    void createProjectWithoutAuthReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"X\",\"description\":\"A very detailed description here.\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void getProjectReturnsDetails() throws Exception {
        String token = register(unique("owner"), unique("gd") + "@test.com", "FACULTY");
        String projectId = createProject(token, unique("Detail Project"), "A detailed description here.");
        mockMvc.perform(get("/api/projects/" + projectId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(projectId))
            .andExpect(jsonPath("$.owner.email").isNotEmpty());
    }

    @Test
    void getMissingProjectReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/projects/" + UUID.randomUUID()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("PROJECT_NOT_FOUND"));
    }

    @Test
    void listProjectsReturnsPage() throws Exception {
        String token = register(unique("owner"), unique("lp") + "@test.com", "FACULTY");
        createProject(token, unique("Listed Project"), "A listed project description body.");
        mockMvc.perform(get("/api/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    void searchProjectsFindsByKeyword() throws Exception {
        String token = register(unique("owner"), unique("se") + "@test.com", "FACULTY");
        String keyword = unique("Needle");
        createProject(token, keyword + " Alpha", "Some description text.");
        createProject(token, "Other Project", "Unrelated description here.");
        mockMvc.perform(get("/api/projects/search").param("keyword", keyword))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].title").value(org.hamcrest.Matchers.containsString(keyword)));
    }

    @Test
    void updateProjectByOwnerSucceeds() throws Exception {
        String token = register(unique("owner"), unique("up") + "@test.com", "FACULTY");
        String projectId = createProject(token, unique("Original"), "The original description.");
        mockMvc.perform(put("/api/projects/" + projectId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + unique("Updated") + "\",\"description\":\"The updated description.\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(org.hamcrest.Matchers.containsString("Updated")));
    }

    @Test
    void updateProjectByNonOwnerReturnsForbidden() throws Exception {
        String ownerToken = register(unique("owner"), unique("uo") + "@test.com", "FACULTY");
        String projectId = createProject(ownerToken, unique("Owned Project"), "Owned description.");
        String intruderToken = register(unique("intruder"), unique("in") + "@test.com", "STUDENT");

        mockMvc.perform(put("/api/projects/" + projectId)
                .header("Authorization", "Bearer " + intruderToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Hijacked\",\"description\":\"Should not work.\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void deleteProjectByOwnerSucceeds() throws Exception {
        String token = register(unique("owner"), unique("del") + "@test.com", "FACULTY");
        String projectId = createProject(token, unique("To Delete"), "Delete me soon.");
        mockMvc.perform(delete("/api/projects/" + projectId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/projects/" + projectId))
            .andExpect(status().isNotFound());
    }

    @Test
    void deleteProjectByNonOwnerReturnsForbidden() throws Exception {
        String ownerToken = register(unique("owner"), unique("dno") + "@test.com", "FACULTY");
        String projectId = createProject(ownerToken, unique("Protected"), "Secure description.");
        String intruderToken = register(unique("intruder"), unique("din") + "@test.com", "STUDENT");

        mockMvc.perform(delete("/api/projects/" + projectId)
                .header("Authorization", "Bearer " + intruderToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void myProjectsReturnsOwnedProjects() throws Exception {
        String token = register(unique("owner"), unique("my") + "@test.com", "FACULTY");
        String projectId = createProject(token, unique("Mine"), "My own project.");
        mockMvc.perform(get("/api/projects/my")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.id=='" + projectId + "')]").exists());
    }
}