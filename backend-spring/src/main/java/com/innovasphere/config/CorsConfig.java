package com.innovasphere.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Single source of truth for CORS. Exactly one {@link CorsConfigurationSource}
 * bean exists in the application context - it is defined here and nowhere else,
 * so Spring Security's {@code http.cors(...)} and Spring MVC both consume it.
 */
@Configuration
public class CorsConfig {

    /**
     * Comma separated list of allowed browser origins. Configured through
     * {@code APP_CORS_ALLOWED_ORIGINS} in every profile.
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,"
            + "https://innovasphere-4mmu.onrender.com,https://innovasphere-frontend.onrender.com}")
    private String corsOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> allowedOrigins = Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        // Patterns (not exact origins) are required because the app sends
        // credentials, and they also cover the rotating *.onrender.com hostnames.
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type", "ETag", "Content-Length"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
