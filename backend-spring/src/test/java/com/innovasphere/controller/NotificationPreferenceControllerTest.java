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
class NotificationPreferenceControllerTest {

    private record AuthUser(String token, String id) {}

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private AuthUser registerStudent() throws Exception {
        String email = unique("pref") + "@test.com";
        MvcResult result = mockMvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Pref\",\"lastName\":\"User\",\"username\":\"" + unique("pref")
                    + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass@123\",\"role\":\"STUDENT\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthUser(body.get("token").asText(), body.get("user").get("id").asText());
    }

    @Test
    void getPreferencesReturnsDefaults() throws Exception {
        AuthUser student = registerStudent();

        mockMvc.perform(get("/api/notifications/preferences")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(student.id()))
            .andExpect(jsonPath("$.emailAlerts").value(true))
            .andExpect(jsonPath("$.inAppAlerts").value(true));
    }

    @Test
    void updatePreferencesPersists() throws Exception {
        AuthUser student = registerStudent();

        mockMvc.perform(put("/api/notifications/preferences")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"emailAlerts\":false,\"inAppAlerts\":false}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.emailAlerts").value(false))
            .andExpect(jsonPath("$.inAppAlerts").value(false));

        mockMvc.perform(get("/api/notifications/preferences")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.emailAlerts").value(false))
            .andExpect(jsonPath("$.inAppAlerts").value(false));
    }

    @Test
    void unauthenticatedCannotAccessPreferences() throws Exception {
        mockMvc.perform(get("/api/notifications/preferences"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/notifications/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"emailAlerts\":true,\"inAppAlerts\":true}"))
            .andExpect(status().isUnauthorized());
    }
}
