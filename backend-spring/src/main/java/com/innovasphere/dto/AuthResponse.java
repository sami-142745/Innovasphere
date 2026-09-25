package com.innovasphere.dto;

public record AuthResponse(
    String token,
    UserProfileDto user,
    Long expiresIn
) {
}