package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private String registerBody(String username, String email, String password, String role) {
        return "{\"firstName\":\"Test\",\"lastName\":\"User\",\"username\":\"" + username
            + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"role\":\"" + role + "\"}";
    }

    @Test
    void registerIsCreatedAndReturnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("student"), unique("student") + "@test.com", "StrongPass@123", "STUDENT")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.expiresIn").isNumber())
            .andExpect(jsonPath("$.user.email").isNotEmpty())
            .andExpect(jsonPath("$.user.role").value("STUDENT"))
            .andExpect(jsonPath("$.user.password").doesNotExist())
            .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void duplicateEmailReturnsConflict() throws Exception {
        String email = unique("dup") + "@test.com";
        String first = registerBody(unique("u1"), email, "StrongPass@123", "STUDENT");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(first))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("u2"), email, "StrongPass@123", "STUDENT")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("EMAIL_EXISTS"));
    }

    @Test
    void duplicateUsernameReturnsConflict() throws Exception {
        String username = unique("sameuser");
        String email1 = unique("a") + "@test.com";
        String email2 = unique("b") + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(username, email1, "StrongPass@123", "STUDENT")))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(username, email2, "StrongPass@123", "STUDENT")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("USERNAME_EXISTS"));
    }

    @Test
    void adminRegistrationIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("admin"), unique("admin") + "@test.com", "StrongPass@123", "ADMIN")))
            .andExpect(status().isForbidden());
    }

    @Test
    void loginSucceedsWithValidCredentials() throws Exception {
        String email = unique("login") + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("lu"), email, "StrongPass@123", "STUDENT")))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"StrongPass@123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void loginWithWrongPasswordReturnsUnauthorized() throws Exception {
        String email = unique("wl") + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("wu"), email, "StrongPass@123", "STUDENT")))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"WrongPass@999\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void meReturnsAuthenticatedUserWithValidJwt() throws Exception {
        String email = unique("me") + "@test.com";
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("mu"), email, "StrongPass@123", "STUDENT")))
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode body = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String token = body.get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.role").value("STUDENT"))
            .andExpect(jsonPath("$.studentProfile").exists())
            .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void meWithoutJwtReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void studentTokenCannotAccessAdminEndpoint() throws Exception {
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("su"), unique("sv") + "@test.com", "StrongPass@123", "STUDENT")))
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode body = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String token = body.get("token").asText();

        mockMvc.perform(get("/api/admin/anything")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void invalidPasswordFormatIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(unique("weak"), unique("weak") + "@test.com", "weak", "STUDENT")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }
}