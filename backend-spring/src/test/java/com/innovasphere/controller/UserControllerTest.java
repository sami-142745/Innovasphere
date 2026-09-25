package com.innovasphere.controller;

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
class UserControllerTest {

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

    private void createAdmin(String username, String email) {
        userRepository.save(User.builder()
            .username(username)
            .email(email)
            .passwordHash(passwordEncoder.encode("StrongPass@123"))
            .fullName("Dir Admin")
            .role(Role.ADMIN)
            .active(true)
            .build());
    }

    @Test
    void searchRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/search"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void searchByKeywordReturnsMatchingUsers() throws Exception {
        String aliceUsername = unique("alice");
        MvcResult aliceResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Alice\",\"lastName\":\"Test\",\"username\":\"" + aliceUsername
                    + "\",\"email\":\"" + unique("uaa") + "@test.com\",\"password\":\"StrongPass@123\",\"role\":\"STUDENT\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        AuthUser alice = new AuthUser(
            objectMapper.readTree(aliceResult.getResponse().getContentAsString()).get("token").asText(),
            objectMapper.readTree(aliceResult.getResponse().getContentAsString()).get("user").get("id").asText());
        register(unique("bob"), unique("ubb") + "@test.com", "FACULTY");
        register(unique("carol"), unique("ucc") + "@test.com", "STUDENT");

        mockMvc.perform(get("/api/users/search?keyword=" + aliceUsername)
                .header("Authorization", "Bearer " + alice.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].id").value(alice.id()))
            .andExpect(jsonPath("$.content[0].username").value(aliceUsername))
            .andExpect(jsonPath("$.content[0].email").isNotEmpty())
            .andExpect(jsonPath("$.content[0].role").isNotEmpty());
    }

    @Test
    void roleFilterReturnsOnlyFaculty() throws Exception {
        AuthUser faculty = register(unique("fac1"), unique("ufa") + "@test.com", "FACULTY");

        mockMvc.perform(get("/api/users/search?role=FACULTY&size=50")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[*].role").value(org.hamcrest.Matchers.everyItem(
                org.hamcrest.Matchers.is("FACULTY"))));
    }

    @Test
    void adminsAreExcludedByDefaultButIncludeWithRoleAdmin() throws Exception {
        AuthUser student = register(unique("stu"), unique("uue") + "@test.com", "STUDENT");
        String adminEmail = unique("adm") + "@test.com";
        createAdmin(unique("sysadm"), adminEmail);
        String adminKeyword = adminEmail.split("@")[0];

        mockMvc.perform(get("/api/users/search?keyword=" + adminKeyword)
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(0));

        mockMvc.perform(get("/api/users/search?keyword=" + adminKeyword + "&role=ADMIN")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].email").value(adminEmail));
    }

    @Test
    void searchIsPaginated() throws Exception {
        AuthUser first = register(unique("pager"), unique("upa") + "@test.com", "STUDENT");
        register(unique("pager1"), unique("upb") + "@test.com", "STUDENT");
        register(unique("pager2"), unique("upc") + "@test.com", "FACULTY");

        mockMvc.perform(get("/api/users/search?page=0&size=2&sort=username,asc")
                .header("Authorization", "Bearer " + first.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(org.hamcrest.Matchers.lessThanOrEqualTo(2)))
            .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)))
            .andExpect(jsonPath("$.totalPages").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }
}