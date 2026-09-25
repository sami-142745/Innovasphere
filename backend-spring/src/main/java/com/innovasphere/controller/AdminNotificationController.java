package com.innovasphere.controller;

import com.innovasphere.dto.SystemNotificationRequest;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    public AdminNotificationController(NotificationService notificationService, CurrentUserProvider currentUserProvider) {
        this.notificationService = notificationService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping
    public ResponseEntity<Void> broadcast(@Valid @RequestBody SystemNotificationRequest request,
                                          Authentication authentication) {
        User admin = currentUserProvider.require(authentication);
        notificationService.broadcast(request.title(), request.message(), request.userId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}