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
class TeamControllerTest {

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
                .content("{\"title\":\"" + title + "\",\"description\":\"A team test project description.\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createTeam(String token, String projectId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects/" + projectId + "/teams")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"description\":\"Team description.\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String invite(String token, String teamId, String inviteeId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/teams/" + teamId + "/invitations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"inviteeId\":\"" + inviteeId + "\",\"message\":\"Join us!\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void ownerCreatesTeam() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Team Project"));
        mockMvc.perform(post("/api/projects/" + projectId + "/teams")
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + unique("Alpha Team") + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.projectId").value(projectId))
            .andExpect(jsonPath("$.name").isNotEmpty())
            .andExpect(jsonPath("$.members.length()").value(1));
    }

    @Test
    void nonOwnerCannotCreateTeam() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Secured Team"));
        AuthUser intruder = register(unique("intruder"), unique("tei") + "@test.com", "STUDENT");

        mockMvc.perform(post("/api/projects/" + projectId + "/teams")
                .header("Authorization", "Bearer " + intruder.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Rogue Team\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void listTeamsForProject() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Listed Team Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Bravo Team"));

        mockMvc.perform(get("/api/projects/" + projectId + "/teams"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id=='" + teamId + "')]").exists());
    }

    @Test
    void ownerInvitesUserAndInviteeAccepts() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Invite Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Charlie Team"));
        AuthUser invited = register(unique("invitee"), unique("tev") + "@test.com", "STUDENT");

        String invitationId = invite(owner.token(), teamId, invited.id());

        mockMvc.perform(post("/api/invitations/" + invitationId + "/accept")
                .header("Authorization", "Bearer " + invited.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void duplicatePendingInvitationReturnsConflict() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Dup Team Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Delta Team"));
        AuthUser invited = register(unique("invitee"), unique("tev") + "@test.com", "STUDENT");

        invite(owner.token(), teamId, invited.id());

        mockMvc.perform(post("/api/teams/" + teamId + "/invitations")
                .header("Authorization", "Bearer " + owner.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"inviteeId\":\"" + invited.id() + "\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("INVITATION_PENDING"));
    }

    @Test
    void otherUserCannotAcceptAndInviteeRejects() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Reject Team Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Echo Team"));
        AuthUser invited = register(unique("invitee"), unique("tev") + "@test.com", "STUDENT");
        AuthUser intruder = register(unique("intruder"), unique("tei") + "@test.com", "STUDENT");

        String invitationId = invite(owner.token(), teamId, invited.id());

        mockMvc.perform(post("/api/invitations/" + invitationId + "/accept")
                .header("Authorization", "Bearer " + intruder.token()))
            .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/invitations/" + invitationId + "/reject")
                .header("Authorization", "Bearer " + invited.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void myTeamsListsTeamsWhereOwnerIsMember() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("My Teams Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Home Team"));

        mockMvc.perform(get("/api/teams/my")
                .header("Authorization", "Bearer " + owner.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].teamId").value(teamId))
            .andExpect(jsonPath("$.content[0].teamName").isNotEmpty())
            .andExpect(jsonPath("$.content[0].projectId").value(projectId))
            .andExpect(jsonPath("$.content[0].projectTitle").isNotEmpty())
            .andExpect(jsonPath("$.content[0].role").value("PROJECT_OWNER"))
            .andExpect(jsonPath("$.content[0].memberCount").value(1));
    }

    @Test
    void myTeamsListsAcceptedInviteeAsMember() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("Member Teams Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Joined Team"));
        AuthUser invited = register(unique("invitee"), unique("tev") + "@test.com", "STUDENT");

        String invitationId = invite(owner.token(), teamId, invited.id());
        mockMvc.perform(post("/api/invitations/" + invitationId + "/accept")
                .header("Authorization", "Bearer " + invited.token()))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/teams/my")
                .header("Authorization", "Bearer " + invited.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].teamId").value(teamId))
            .andExpect(jsonPath("$.content[0].projectId").value(projectId))
            .andExpect(jsonPath("$.content[0].role").value("MEMBER"))
            .andExpect(jsonPath("$.content[0].memberCount").value(2));
    }

    @Test
    void myInvitationsListsInvitedUser() throws Exception {
        AuthUser owner = register(unique("owner"), unique("teo") + "@test.com", "FACULTY");
        String projectId = createProject(owner.token(), unique("My Invite Project"));
        String teamId = createTeam(owner.token(), projectId, unique("Foxtrot Team"));
        AuthUser invited = register(unique("invitee"), unique("tev") + "@test.com", "STUDENT");
        String invitationId = invite(owner.token(), teamId, invited.id());

        mockMvc.perform(get("/api/invitations/my")
                .header("Authorization", "Bearer " + invited.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
            .andExpect(jsonPath("$[?(@.id=='" + invitationId + "')]").exists());
    }
}