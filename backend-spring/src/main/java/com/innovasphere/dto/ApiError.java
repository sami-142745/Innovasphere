package com.innovasphere.dto;

import java.time.Instant;
import java.util.Map;

public record ApiError(
    int status,
    String error,
    String message,
    String path,
    Map<String, String> fieldErrors,
    Instant timestamp
) {
    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(status, error, message, path, null, Instant.now());
    }

    public static ApiError of(int status, String error, String message, String path, Map<String, String> fieldErrors) {
        return new ApiError(status, error, message, path, fieldErrors, Instant.now());
    }
}