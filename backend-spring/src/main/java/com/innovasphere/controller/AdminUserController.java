package com.innovasphere.controller;

import com.innovasphere.dto.AdminUserDto;
import com.innovasphere.dto.AdminUserStatusRequest;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.AdminUserService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final CurrentUserProvider currentUserProvider;

    public AdminUserController(AdminUserService adminUserService, CurrentUserProvider currentUserProvider) {
        this.adminUserService = adminUserService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public Page<AdminUserDto> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Role role,
        Pageable pageable) {
        return adminUserService.search(keyword, role, pageable);
    }

    @PatchMapping("/{id}/status")
    public AdminUserDto updateStatus(
        @PathVariable UUID id,
        @Valid @RequestBody AdminUserStatusRequest request,
        Authentication authentication) {
        User admin = currentUserProvider.require(authentication);
        return adminUserService.updateStatus(id, request.active(), admin.getId());
    }
}
