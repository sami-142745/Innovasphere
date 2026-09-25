package com.innovasphere.controller;

import com.innovasphere.dto.JoinRequestCreateRequest;
import com.innovasphere.dto.JoinRequestDecisionRequest;
import com.innovasphere.dto.JoinRequestDto;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.JoinRequestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class JoinRequestController {

    private final JoinRequestService joinRequestService;
    private final CurrentUserProvider currentUserProvider;

    public JoinRequestController(JoinRequestService joinRequestService, CurrentUserProvider currentUserProvider) {
        this.joinRequestService = joinRequestService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/projects/{projectId}/join-requests")
    public ResponseEntity<JoinRequestDto> create(@PathVariable UUID projectId,
                                                 @Valid @RequestBody JoinRequestCreateRequest request,
                                                 Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(joinRequestService.create(user, projectId, request));
    }

    @GetMapping("/projects/{projectId}/join-requests")
    public List<JoinRequestDto> listForProject(@PathVariable UUID projectId, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return joinRequestService.listForProject(user, projectId);
    }

    @PatchMapping("/projects/{projectId}/join-requests/{requestId}")
    public JoinRequestDto decide(@PathVariable UUID projectId,
                                 @PathVariable UUID requestId,
                                 @Valid @RequestBody JoinRequestDecisionRequest request,
                                 Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return joinRequestService.decide(user, projectId, requestId, request);
    }

    @GetMapping("/join-requests/my")
    public List<JoinRequestDto> my(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return joinRequestService.my(user);
    }
}