package com.innovasphere.controller;

import com.innovasphere.dto.AuthResponse;
import com.innovasphere.dto.LoginRequest;
import com.innovasphere.dto.RegisterRequest;
import com.innovasphere.dto.UserProfileDto;
import com.innovasphere.security.AuthRateLimiter;
import com.innovasphere.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthRateLimiter rateLimiter;

    public AuthController(AuthService authService, AuthRateLimiter rateLimiter) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest requestHttp
    ) {
        rateLimiter.checkRegister(clientKey(requestHttp));
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest requestHttp
    ) {
        rateLimiter.checkLogin(clientKey(requestHttp));
        return ResponseEntity.ok(authService.login(request));
    }

    private String clientKey(HttpServletRequest request) {
        String cf = request.getHeader("CF-Connecting-IP");
        if (org.springframework.util.StringUtils.hasText(cf)) {
            return cf.trim();
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (org.springframework.util.StringUtils.hasText(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> me(Authentication authentication) {
        return ResponseEntity.ok(authService.me(authentication.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        authService.logout(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}