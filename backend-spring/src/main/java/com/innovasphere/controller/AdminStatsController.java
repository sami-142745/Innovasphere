package com.innovasphere.controller;

import com.innovasphere.dto.AdminStatsDto;
import com.innovasphere.service.AdminUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final AdminUserService adminUserService;

    public AdminStatsController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public AdminStatsDto stats() {
        return adminUserService.stats();
    }
}
