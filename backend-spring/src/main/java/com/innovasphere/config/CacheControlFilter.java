package com.innovasphere.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Emits HTTP caching headers for the public, cacheable read endpoints.
 *
 * <p>ETags are produced by {@code ShallowEtagHeaderFilter} (registered once as a
 * servlet filter bean); this filter only owns {@code Cache-Control}.
 *
 * <p>Per-user endpoints such as {@code /api/projects/my} are deliberately
 * excluded - marking them {@code public} would let a shared proxy serve one
 * user's projects to another.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class CacheControlFilter extends OncePerRequestFilter {

    private static final String CACHEABLE_METHOD = "GET";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (CACHEABLE_METHOD.equalsIgnoreCase(request.getMethod())) {
            String path = request.getRequestURI();

            if (isProjects(path)) {
                response.setHeader("Cache-Control", "public, max-age=60");
            } else if (isDomains(path) || isSkills(path)) {
                response.setHeader("Cache-Control", "public, max-age=86400");
            } else if (isMentors(path)) {
                response.setHeader("Cache-Control", "public, max-age=300");
            } else {
                response.setHeader("Cache-Control", "no-store");
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isProjects(String path) {
        // /api/projects/my is user scoped and must never be stored publicly.
        return path.startsWith("/api/projects") && !path.startsWith("/api/projects/my");
    }

    private boolean isDomains(String path) {
        return path.startsWith("/api/research-domains") || path.startsWith("/api/domains");
    }

    private boolean isSkills(String path) {
        return path.startsWith("/api/skills");
    }

    private boolean isMentors(String path) {
        return path.startsWith("/api/mentors");
    }
}
