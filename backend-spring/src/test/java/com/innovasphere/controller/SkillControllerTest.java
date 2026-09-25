package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class SkillControllerTest {

    private record AuthUser(String token, String id) {
    }

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

    private AuthUser registerAdmin() throws Exception {
        String email = unique("adm") + "@test.com";
        String password = "StrongPass@123";
        userRepository.save(User.builder()
            .username(unique("admu"))
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .fullName("Test Admin")
            .role(Role.ADMIN)
            .active(true)
            .build());
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthUser(body.get("token").asText(), body.get("user").get("id").asText());
    }

    private String createSkill(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/skills")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"description\":\"Test skill\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void listIsPublicAndContainsCreatedSkill() throws Exception {
        AuthUser admin = registerAdmin();
        String name = unique("React");
        String skillId = createSkill(admin.token(), name);

        mockMvc.perform(get("/api/skills"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id=='" + skillId + "')].name").value(name));
    }

    @Test
    void searchFiltersByKeyword() throws Exception {
        AuthUser admin = registerAdmin();
        createSkill(admin.token(), unique("Kotlin") + " Backend");
        String target = unique("GraphQL") + " API";

        mockMvc.perform(get("/api/skills/search?keyword=" + target))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));

        createSkill(admin.token(), target);
        mockMvc.perform(get("/api/skills/search?keyword=" + target))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value(target));
    }

    @Test
    void nonAdminCannotCreateSkill() throws Exception {
        AuthUser student = register(unique("stu"), unique("sku") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/admin/skills")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Rogue Skill\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedCannotCreateSkill() throws Exception {
        mockMvc.perform(post("/api/admin/skills")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Anon Skill\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateSkillReturnsConflict() throws Exception {
        AuthUser admin = registerAdmin();
        String name = unique("Docker");

        createSkill(admin.token(), name);

        mockMvc.perform(post("/api/admin/skills")
                .header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name.toLowerCase() + "\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("SKILL_ALREADY_EXISTS"));
    }

    @Test
    void createWithBlankNameReturnsBadRequest() throws Exception {
        AuthUser admin = registerAdmin();

        mockMvc.perform(post("/api/admin/skills")
                .header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"   \"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void deleteSkillRemovesItAndMissingReturnsNotFound() throws Exception {
        AuthUser admin = registerAdmin();
        String name = unique("Redis");
        String skillId = createSkill(admin.token(), name);

        mockMvc.perform(delete("/api/admin/skills/" + skillId)
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/skills"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id=='" + skillId + "')]").doesNotExist());

        mockMvc.perform(delete("/api/admin/skills/" + skillId)
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("SKILL_NOT_FOUND"));
    }

    @Test
    void deleteSkillInUseReturnsConflict() throws Exception {
        AuthUser admin = registerAdmin();
        AuthUser faculty = register(unique("fac"), unique("ski") + "@test.com", "FACULTY");
        String skillId = createSkill(admin.token(), unique("CUDA"));

        mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + faculty.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + unique("Skill Project") + "\",\"description\":\"Uses a referenced skill for the test.\",\"skillIds\":[\"" + skillId + "\"]}"))
            .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/admin/skills/" + skillId)
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("SKILL_IN_USE"));
    }
}