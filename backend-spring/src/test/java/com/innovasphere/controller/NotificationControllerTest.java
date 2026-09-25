package com.innovasphere.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class NotificationControllerTest {

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
                .content("{\"title\":\"" + title + "\",\"description\":\"A notification test project description.\"}"))
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
    void studentJoinCreatesNotificationForOwner() throws Exception {
        AuthUser owner = register(unique("owner"), unique("nto") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Notify Project"));
        AuthUser student = register(unique("student"), unique("nts") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);

        mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.type=='JOIN_REQUEST')]").exists())
            .andExpect(jsonPath("$.content[0].title").value("New join request"));
    }

    @Test
    void acceptedJoinCreatesAcceptedNotificationForStudent() throws Exception {
        AuthUser owner = register(unique("owner"), unique("ntoa") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Accept Notify Project"));
        AuthUser student = register(unique("student"), unique("ntsa") + "@test.com", "STUDENT");
        String requestId = sendJoinRequest(student.token(), projectId);

        mockMvc.perform(patch("/api/projects/" + projectId + "/join-requests/" + requestId)
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACCEPTED\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.type=='JOIN_REQUEST_ACCEPTED')]").exists());
    }

    @Test
    void teamInvitationCreatesNotificationForInvitee() throws Exception {
        AuthUser owner = register(unique("owner"), unique("nti") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Invite Notify Project"));
        AuthUser student = register(unique("student"), unique("ntis") + "@test.com", "STUDENT");

        MvcResult teamResult = mockMvc.perform(post("/api/projects/" + projectId + "/teams")
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Notify Team\",\"description\":\"A notification team\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        String teamId = objectMapper.readTree(teamResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/teams/" + teamId + "/invitations")
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"inviteeId\":\"" + student.id() + "\",\"message\":\"Join us\"}"))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + student.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.type=='TEAM_INVITATION')]").exists());
    }

    @Test
    void mentorshipRequestCreatesNotificationForFaculty() throws Exception {
        AuthUser faculty = register(unique("faculty"), unique("ntm") + "@test.com", "FACULTY");
        AuthUser student = register(unique("student"), unique("ntms") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/mentorships/requests")
                .header("Authorization", "Bearer " + student.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"facultyId\":\"" + faculty.id() + "\",\"message\":\"Please mentor me\"}"))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + faculty.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.type=='MENTORSHIP_REQUEST')]").exists());
    }

    @Test
    void unreadCountAndUnreadListReflectUnreadNotifications() throws Exception {
        AuthUser owner = register(unique("owner"), unique("ntu") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Unread Project"));
        AuthUser student = register(unique("student"), unique("ntus") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);

        mockMvc.perform(get("/api/notifications/count")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(1L));

        mockMvc.perform(get("/api/notifications/unread?size=20")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].read").value(false))
            .andExpect(jsonPath("$.totalElements").value(1L));
    }

    @Test
    void markReadUpdatesNotificationAndUnreadCount() throws Exception {
        AuthUser owner = register(unique("owner"), unique("ntr") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Mark Read Project"));
        AuthUser student = register(unique("student"), unique("ntrs") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);

        MvcResult listResult = mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + owner.token()))
            .andReturn();
        String notificationId = objectMapper.readTree(listResult.getResponse().getContentAsString())
            .get("content").get(0).get("id").asText();

        mockMvc.perform(put("/api/notifications/" + notificationId + "/read")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.read").value(true));

        mockMvc.perform(get("/api/notifications/count")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(0L));
    }

    @Test
    void markAllReadClearsUnreadNotifications() throws Exception {
        AuthUser owner = register(unique("owner"), unique("ntall") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Mark All Project"));
        AuthUser student = register(unique("student"), unique("ntalls") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);

        mockMvc.perform(put("/api/notifications/read-all")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/notifications/count")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(0L));
    }

    @Test
    void deleteNotificationRemovesIt() throws Exception {
        AuthUser owner = register(unique("owner"), unique("ntd") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Delete Notify Project"));
        AuthUser student = register(unique("student"), unique("ntds") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);

        MvcResult listResult = mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + owner.token()))
            .andReturn();
        String notificationId = objectMapper.readTree(listResult.getResponse().getContentAsString())
            .get("content").get(0).get("id").asText();

        mockMvc.perform(delete("/api/notifications/" + notificationId)
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isNoContent());

        mockMvc.perform(put("/api/notifications/" + notificationId + "/read")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOTIFICATION_NOT_FOUND"));
    }

    @Test
    void cannotReadAnotherUsersNotification() throws Exception {
        AuthUser owner = register(unique("owner"), unique("ntx") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Cross User Project"));
        AuthUser student = register(unique("student"), unique("ntxs") + "@test.com", "STUDENT");
        sendJoinRequest(student.token(), projectId);
        AuthUser other = register(unique("other"), unique("ntxo") + "@test.com", "STUDENT");

        MvcResult listResult = mockMvc.perform(get("/api/notifications?size=20")
                .header("Authorization", "Bearer " + owner.token()))
            .andReturn();
        String notificationId = objectMapper.readTree(listResult.getResponse().getContentAsString())
            .get("content").get(0).get("id").asText();

        mockMvc.perform(put("/api/notifications/" + notificationId + "/read")
                .header("Authorization", "Bearer " + other.token()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOTIFICATION_NOT_FOUND"));

        mockMvc.perform(delete("/api/notifications/" + notificationId)
                .header("Authorization", "Bearer " + other.token()))
            .andExpect(status().isNotFound());
    }

    @Test
    void unauthorizedAccessBlocked() throws Exception {
        mockMvc.perform(get("/api/notifications"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/notifications/count"))
            .andExpect(status().isUnauthorized());
    }
}