package com.innovasphere.controller;

import com.innovasphere.dto.TeamInvitationDto;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.InvitationService;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationService invitationService;
    private final CurrentUserProvider currentUserProvider;

    public InvitationController(InvitationService invitationService, CurrentUserProvider currentUserProvider) {
        this.invitationService = invitationService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/my")
    public List<TeamInvitationDto> my(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return invitationService.my(user.getId());
    }

    @PostMapping("/{id}/accept")
    public TeamInvitationDto accept(@PathVariable UUID id, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return invitationService.accept(id, user);
    }

    @PostMapping("/{id}/reject")
    public TeamInvitationDto reject(@PathVariable UUID id, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return invitationService.reject(id, user);
    }
}