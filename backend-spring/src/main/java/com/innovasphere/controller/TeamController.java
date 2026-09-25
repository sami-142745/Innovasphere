package com.innovasphere.controller;

import com.innovasphere.dto.MyTeamDto;
import com.innovasphere.dto.TeamCreateRequest;
import com.innovasphere.dto.TeamDto;
import com.innovasphere.dto.TeamInvitationDto;
import com.innovasphere.dto.TeamInviteRequest;
import com.innovasphere.dto.TeamUpdateRequest;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.InvitationService;
import com.innovasphere.service.TeamService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TeamController {

    private final TeamService teamService;
    private final InvitationService invitationService;
    private final CurrentUserProvider currentUserProvider;

    public TeamController(TeamService teamService, InvitationService invitationService,
                          CurrentUserProvider currentUserProvider) {
        this.teamService = teamService;
        this.invitationService = invitationService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/projects/{projectId}/teams")
    public ResponseEntity<TeamDto> create(@PathVariable UUID projectId,
                                          @Valid @RequestBody TeamCreateRequest request,
                                          Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.create(projectId, request, user));
    }

    @GetMapping("/projects/{projectId}/teams")
    public List<TeamDto> list(@PathVariable UUID projectId) {
        return teamService.list(projectId);
    }

    @GetMapping("/teams/{teamId}")
    public TeamDto get(@PathVariable UUID teamId) {
        return teamService.get(teamId);
    }

    @GetMapping("/teams/my")
    public Page<MyTeamDto> my(Authentication authentication, Pageable pageable) {
        User user = currentUserProvider.require(authentication);
        return teamService.my(user.getId(), pageable);
    }

    @PatchMapping("/teams/{teamId}")
    public TeamDto update(@PathVariable UUID teamId,
                          @Valid @RequestBody TeamUpdateRequest request,
                          Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return teamService.update(teamId, request, user);
    }

    @DeleteMapping("/teams/{teamId}")
    public ResponseEntity<Void> delete(@PathVariable UUID teamId, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        teamService.delete(teamId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/teams/{teamId}/invitations")
    public ResponseEntity<TeamInvitationDto> invite(@PathVariable UUID teamId,
                                                    @Valid @RequestBody TeamInviteRequest request,
                                                    Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(invitationService.invite(teamId, request, user));
    }

    @GetMapping("/teams/{teamId}/invitations")
    public List<TeamInvitationDto> listForTeam(@PathVariable UUID teamId, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return invitationService.listForTeam(teamId, user);
    }
}