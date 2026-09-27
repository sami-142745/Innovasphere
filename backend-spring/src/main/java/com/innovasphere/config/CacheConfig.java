package com.innovasphere.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PROJECTS = "projects";
    public static final String PROJECT_SEARCH = "projectSearch";
    public static final String MENTORS = "mentors";
    public static final String DOMAINS = "domains";
    public static final String SKILLS = "skills";

    private static final int MAX_ENTRIES = 500;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // Default for any cache that is not registered explicitly below.
        cacheManager.setCaffeine(volatileBuilder());

        // Frequently changing, user facing catalogues: 5 minute TTL.
        cacheManager.registerCustomCache(PROJECTS, volatileBuilder().build());
        cacheManager.registerCustomCache(PROJECT_SEARCH, volatileBuilder().build());
        cacheManager.registerCustomCache(MENTORS, volatileBuilder().build());

        // Near static reference data: 1 day TTL.
        cacheManager.registerCustomCache(DOMAINS, metadataBuilder().build());
        cacheManager.registerCustomCache(SKILLS, metadataBuilder().build());

        return cacheManager;
    }

    private static Caffeine<Object, Object> volatileBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(MAX_ENTRIES)
                .recordStats();
    }

    private static Caffeine<Object, Object> metadataBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.DAYS)
                .maximumSize(MAX_ENTRIES)
                .recordStats();
    }
}
