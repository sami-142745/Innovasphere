package com.innovasphere.config;

import com.innovasphere.security.JwtAuthenticationFilter;
import jakarta.servlet.Filter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;
import org.springframework.data.web.config.PageableHandlerMethodArgumentResolverCustomizer;
import org.springframework.data.web.config.SpringDataWebSettings;

@Configuration
public class WebConfig {

    /**
     * Locks the {@code Pageable} resolver contract the frontend depends on:
     * zero-indexed {@code page} / {@code size} query parameters.
     */
    @Bean
    public PageableHandlerMethodArgumentResolverCustomizer zeroIndexedPageableCustomizer() {
        return (PageableHandlerMethodArgumentResolver resolver) -> resolver.setOneIndexedParameters(false);
    }

    /**
     * Pins the paginated JSON contract.
     *
     * <p>{@link PageSerializationMode#DIRECT} keeps {@code totalElements},
     * {@code totalPages}, {@code number}, {@code size}, {@code first}, {@code last}
     * and {@code empty} as top-level fields, which is exactly the shape the React
     * data layer expects. Switching to {@code VIA_DTO} would nest them under
     * {@code page} and silently break every paginated screen.
     */
    @Bean
    public SpringDataWebSettings springDataWebSettings() {
        return new SpringDataWebSettings(PageSerializationMode.DIRECT);
    }

    /**
     * The filters below are wired explicitly into the Spring Security chain, in the
     * order declared by {@link SecurityConfig}. Without these disabled
     * registrations Spring Boot would additionally auto-register them as plain
     * servlet filters, so each one would sit in two chains at once.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> disableJwtFilterAutoRegistration(
            JwtAuthenticationFilter filter) {
        return disabled(filter);
    }

    @Bean
    public FilterRegistrationBean<CacheControlFilter> disableCacheControlFilterAutoRegistration(
            CacheControlFilter filter) {
        return disabled(filter);
    }

    @Bean
    public FilterRegistrationBean<RequestLoggingFilter> disableRequestLoggingFilterAutoRegistration(
            RequestLoggingFilter filter) {
        return disabled(filter);
    }

    private static <T extends Filter> FilterRegistrationBean<T> disabled(T filter) {
        FilterRegistrationBean<T> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
