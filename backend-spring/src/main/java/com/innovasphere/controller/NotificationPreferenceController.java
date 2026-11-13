package com.innovasphere.controller;

import com.innovasphere.dto.NotificationPreferenceDto;
import com.innovasphere.dto.NotificationPreferenceUpdateRequest;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications/preferences")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;
    private final CurrentUserProvider currentUserProvider;

    public NotificationPreferenceController(
        NotificationPreferenceService preferenceService,
        CurrentUserProvider currentUserProvider
    ) {
        this.preferenceService = preferenceService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public NotificationPreferenceDto getPreferences(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return preferenceService.getOrCreate(user.getId());
    }

    @PutMapping
    public NotificationPreferenceDto updatePreferences(
        Authentication authentication,
        @Valid @RequestBody NotificationPreferenceUpdateRequest request) {
        User user = currentUserProvider.require(authentication);
        return preferenceService.update(user.getId(), request);
    }
}
