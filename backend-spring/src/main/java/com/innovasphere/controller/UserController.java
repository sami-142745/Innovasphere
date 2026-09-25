package com.innovasphere.controller;

import com.innovasphere.dto.UserSummaryDto;
import com.innovasphere.enums.Role;
import com.innovasphere.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/search")
    public Page<UserSummaryDto> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Role role,
        Pageable pageable) {
        return userService.search(keyword, role, pageable);
    }
}