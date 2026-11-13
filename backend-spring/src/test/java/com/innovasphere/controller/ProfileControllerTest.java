package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ProfileControllerTest {

    private record AuthUser(String token, String id) {}

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private AuthUser registerStudent() throws Exception {
        String email = unique("stu") + "@test.com";
        MvcResult result = mockMvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Test\",\"lastName\":\"Student\",\"username\":\"" + unique("stu")
                    + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass@123\",\"role\":\"STUDENT\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthUser(body.get("token").asText(), body.get("user").get("id").asText());
    }

    private AuthUser registerAdmin() throws Exception {
        String email = unique("adm") + "@test.com";
        userRepository.save(User.builder()
            .username(unique("admu"))
            .email(email)
            .passwordHash(passwordEncoder.encode("StrongPass@123"))
            .fullName("Test Admin")
            .role(Role.ADMIN)
            .active(true)
            .build());
        MvcResult result = mockMvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"StrongPass@123\"}"))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthUser(body.get("token").asText(), body.get("user").get("id").asText());
    }

    @Test
    void getOwnProfileReturnsUserProfile() throws Exception {
        AuthUser student = registerStudent();

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(student.id()))
            .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void updateOwnUserUpdatesAccount() throws Exception {
        AuthUser student = registerStudent();
        String newEmail = unique("new") + "@test.com";

        mockMvc.perform(put("/api/users/me")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"newuser\",\"fullName\":\"New Name\",\"email\":\"" + newEmail + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("newuser"))
            .andExpect(jsonPath("$.fullName").value("New Name"))
            .andExpect(jsonPath("$.email").value(newEmail));
    }

    @Test
    void updateOwnUserEmailConflictIs409() throws Exception {
        AuthUser student = registerStudent();
        String existingEmail = unique("dup") + "@test.com";

        // Register another user with this email
        mockMvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Dup\",\"lastName\":\"User\",\"username\":\"" + unique("dup")
                    + "\",\"email\":\"" + existingEmail + "\",\"password\":\"StrongPass@123\",\"role\":\"STUDENT\"}"))
            .andExpect(status().isCreated());

        mockMvc.perform(put("/api/users/me")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"user\",\"fullName\":\"Name\",\"email\":\"" + existingEmail + "\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void getAnyUserProfileReturnsProfile() throws Exception {
        AuthUser student = registerStudent();
        AuthUser admin = registerAdmin();

        mockMvc.perform(get("/api/users/" + student.id())
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(student.id()));
    }

    @Test
    void adminUpdateUserUpdatesAccount() throws Exception {
        AuthUser student = registerStudent();
        AuthUser admin = registerAdmin();
        String newEmail = unique("admin") + "@test.com";

        mockMvc.perform(put("/api/users/" + student.id())
                .header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"adminupdated\",\"fullName\":\"Admin Updated\",\"email\":\"" + newEmail + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("adminupdated"));
    }

    @Test
    void nonAdminCannotUpdateOtherUser() throws Exception {
        AuthUser student1 = registerStudent();
        AuthUser student2 = registerStudent();

        mockMvc.perform(put("/api/users/" + student2.id())
                .header("Authorization", "Bearer " + student1.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"hacker\",\"fullName\":\"Hacker\",\"email\":\"hacker@test.com\"}"))
            .andExpect(status().isForbidden());
    }
}
