package com.innovasphere.controller;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.innovasphere.util.AppVersion;

@RestController
public class HealthController {

    @GetMapping("/healthz")
    @ResponseStatus(HttpStatus.OK)
    public HealthZResponse healthz() {
        return new HealthZResponse("UP", "innovasphere-api");
    }

    @GetMapping("/api/health")
    @ResponseStatus(HttpStatus.OK)
    public HealthResponse health() {
        return new HealthResponse(
            "UP",
            "innovasphere-backend",
            AppVersion.VERSION,
            "Spring Boot",
            Instant.now()
        );
    }

    public record HealthZResponse(String status, String service) {}

    public record HealthResponse(
        String status,
        String service,
        String version,
        String runtime,
        Instant timestamp
    ) {}
}