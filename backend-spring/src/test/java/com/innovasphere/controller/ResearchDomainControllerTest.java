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
class ResearchDomainControllerTest {

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

    private String createDomain(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/research-domains")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"description\":\"Test domain\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void listIsPublicAndContainsCreatedDomain() throws Exception {
        AuthUser admin = registerAdmin();
        String name = unique("Machine Learning");
        String domainId = createDomain(admin.token(), name);

        mockMvc.perform(get("/api/research-domains"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id=='" + domainId + "')].name").value(name));
    }

    @Test
    void searchFiltersByKeyword() throws Exception {
        AuthUser admin = registerAdmin();
        createDomain(admin.token(), unique("Bio") + "informatics");
        String target = unique("Quantum") + " Computing";

        mockMvc.perform(get("/api/research-domains/search?keyword=" + target))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));

        createDomain(admin.token(), target);
        mockMvc.perform(get("/api/research-domains/search?keyword=" + target))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value(target));
    }

    @Test
    void nonAdminCannotCreateDomain() throws Exception {
        AuthUser student = register(unique("stu"), unique("rduc") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/admin/research-domains")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Rogue Domain\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void duplicateDomainReturnsConflict() throws Exception {
        AuthUser admin = registerAdmin();
        String name = unique("Cybersecurity");

        createDomain(admin.token(), name);

        mockMvc.perform(post("/api/admin/research-domains")
                .header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name.toLowerCase() + "\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("RESEARCH_DOMAIN_ALREADY_EXISTS"));
    }

    @Test
    void createWithBlankNameReturnsBadRequest() throws Exception {
        AuthUser admin = registerAdmin();

        mockMvc.perform(post("/api/admin/research-domains")
                .header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"   \"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void deleteDomainAndMissingReturnsNotFound() throws Exception {
        AuthUser admin = registerAdmin();
        String name = unique("Astrophysics");
        String domainId = createDomain(admin.token(), name);

        mockMvc.perform(delete("/api/admin/research-domains/" + domainId)
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/research-domains"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id=='" + domainId + "')]").doesNotExist());

        mockMvc.perform(delete("/api/admin/research-domains/" + domainId)
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESEARCH_DOMAIN_NOT_FOUND"));
    }

    @Test
    void deleteDomainInUseReturnsConflict() throws Exception {
        AuthUser admin = registerAdmin();
        AuthUser faculty = register(unique("fac"), unique("rdi") + "@test.com", "FACULTY");
        String domainId = createDomain(admin.token(), unique("Robotics"));

        mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + faculty.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + unique("Domain Project") + "\",\"description\":\"References a research domain for the test.\",\"researchDomainIds\":[\"" + domainId + "\"]}"))
            .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/admin/research-domains/" + domainId)
                .header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("RESEARCH_DOMAIN_IN_USE"));
    }
}