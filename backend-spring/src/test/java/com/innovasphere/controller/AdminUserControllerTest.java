package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.repository.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private User createAdmin(String username, String email) {
        return userRepository.save(User.builder()
            .username(username)
            .email(email)
            .passwordHash(passwordEncoder.encode("StrongPass@123"))
            .fullName("Directory Admin")
            .role(Role.ADMIN)
            .active(true)
            .build());
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"StrongPass@123\"}"))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private JsonNode register(String username, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Test\",\"lastName\":\"Student\",\"username\":\"" + username
                    + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass@123\",\"role\":\"STUDENT\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void listRequiresAdminRole() throws Exception {
        JsonNode student = register(unique("student"), unique("student") + "@test.com");
        String token = student.get("token").asText();

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCanSearchUsersWithEmail() throws Exception {
        String adminUsername = unique("admin");
        String adminEmail = unique("admin") + "@test.com";
        createAdmin(adminUsername, adminEmail);
        String token = login(adminEmail);

        mockMvc.perform(get("/api/admin/users?keyword=" + adminUsername)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].username").value(adminUsername))
            .andExpect(jsonPath("$.content[0].email").value(adminEmail))
            .andExpect(jsonPath("$.content[0].active").value(true));
    }

    @Test
    void adminCannotDeactivateOwnAccount() throws Exception {
        String adminEmail = unique("self") + "@test.com";
        User admin = createAdmin(unique("self"), adminEmail);
        String token = login(adminEmail);

        mockMvc.perform(patch("/api/admin/users/" + admin.getId() + "/status")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\":false}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("CANNOT_DISABLE_SELF"));
    }

    @Test
    void adminCanDeactivateAnotherUser() throws Exception {
        String adminEmail = unique("ops") + "@test.com";
        createAdmin(unique("ops"), adminEmail);
        String token = login(adminEmail);
        JsonNode student = register(unique("target"), unique("target") + "@test.com");
        String studentId = student.get("user").get("id").asText();

        mockMvc.perform(patch("/api/admin/users/" + studentId + "/status")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\":false}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void statsRequireAdminAndReturnCounts() throws Exception {
        JsonNode student = register(unique("stats"), unique("stats") + "@test.com");
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + student.get("token").asText()))
            .andExpect(status().isForbidden());

        String adminEmail = unique("statsadmin") + "@test.com";
        createAdmin(unique("statsadmin"), adminEmail);
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + login(adminEmail)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalUsers").isNumber())
            .andExpect(jsonPath("$.studentUsers").isNumber())
            .andExpect(jsonPath("$.facultyUsers").isNumber())
            .andExpect(jsonPath("$.adminUsers").isNumber())
            .andExpect(jsonPath("$.activeUsers").isNumber())
            .andExpect(jsonPath("$.totalProjects").isNumber());
    }
}
