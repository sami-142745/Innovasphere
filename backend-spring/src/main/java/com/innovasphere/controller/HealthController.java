package com.innovasphere.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/healthz")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> healthz() {
        return Map.of(
                "status", "UP",
                "service", "innovasphere-api"
        );
    }

    @GetMapping("/api/health")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "innovasphere-backend",
                "version", "1.0.0",
                "runtime", "Spring Boot"
        );
    }
}