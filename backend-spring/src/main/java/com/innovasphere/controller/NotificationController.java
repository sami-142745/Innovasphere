package com.innovasphere.controller;

import com.innovasphere.dto.NotificationDto;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.NotificationService;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    public NotificationController(NotificationService notificationService, CurrentUserProvider currentUserProvider) {
        this.notificationService = notificationService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public Page<NotificationDto> list(
        Authentication authentication,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = currentUserProvider.require(authentication);
        return notificationService.list(user.getId(), pageable);
    }

    @GetMapping("/unread")
    public Page<NotificationDto> unread(
        Authentication authentication,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = currentUserProvider.require(authentication);
        return notificationService.unread(user.getId(), pageable);
    }

    @GetMapping("/count")
    public Map<String, Long> count(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return Map.of("count", notificationService.unreadCount(user.getId()));
    }

    @PutMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable UUID id, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return notificationService.markRead(user.getId(), id);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        notificationService.markAllRead(user.getId());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        notificationService.delete(user.getId(), id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}