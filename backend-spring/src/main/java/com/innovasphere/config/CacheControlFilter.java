package com.innovasphere.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class CacheControlFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("GET".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/projects")) {
                // Projects listing - cache for 60 seconds
                response.setHeader("Cache-Control", "public, max-age=60");
            } else if (path.startsWith("/api/domains") || path.startsWith("/api/skills")) {
                // Static metadata - cache for 24 hours
                response.setHeader("Cache-Control", "public, max-age=86400");
            } else if (path.startsWith("/api/mentors")) {
                // Mentors listing - cache for 5 minutes
                response.setHeader("Cache-Control", "public, max-age=300");
            }
        }

        filterChain.doFilter(request, response);
    }
}