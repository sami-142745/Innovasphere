package com.innovasphere.controller;

import com.innovasphere.dto.MentorshipDecisionRequest;
import com.innovasphere.dto.MentorshipRequestCreateRequest;
import com.innovasphere.dto.MentorshipRequestDto;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.MentorshipService;
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
@RequestMapping("/api/mentorships")
public class MentorshipRequestController {

    private final MentorshipService mentorshipService;
    private final CurrentUserProvider currentUserProvider;

    public MentorshipRequestController(MentorshipService mentorshipService, CurrentUserProvider currentUserProvider) {
        this.mentorshipService = mentorshipService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/requests")
    public ResponseEntity<MentorshipRequestDto> create(@Valid @RequestBody MentorshipRequestCreateRequest request,
                                                       Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(mentorshipService.createRequest(user, request));
    }

    @GetMapping("/requests/my")
    public List<MentorshipRequestDto> my(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return mentorshipService.myRequests(user.getId());
    }

    @GetMapping("/requests/received")
    public List<MentorshipRequestDto> received(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return mentorshipService.receivedRequests(user.getId());
    }

    @PatchMapping("/requests/{id}")
    public MentorshipRequestDto decide(@PathVariable UUID id,
                                       @Valid @RequestBody MentorshipDecisionRequest request,
                                       Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return mentorshipService.decide(user, id, request);
    }
}