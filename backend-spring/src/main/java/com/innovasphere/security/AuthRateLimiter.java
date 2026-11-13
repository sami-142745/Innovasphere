package com.innovasphere.security;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import com.innovasphere.exception.ApiException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AuthRateLimiter {

    private static final int MAX_KEY_LENGTH = 64;

    private final LoadingCache<String, AtomicInteger> counters;
    private final boolean enabled;
    private final int loginLimitPerMinute;
    private final int registerLimitPerMinute;

    public AuthRateLimiter(
        @Value("${app.security.rate-limit.enabled:true}") boolean enabled,
        @Value("${app.security.rate-limit.login-per-minute:20}") int loginLimitPerMinute,
        @Value("${app.security.rate-limit.register-per-minute:10}") int registerLimitPerMinute
    ) {
        this.enabled = enabled;
        this.loginLimitPerMinute = loginLimitPerMinute;
        this.registerLimitPerMinute = registerLimitPerMinute;
        this.counters = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(100_000)
            .build(key -> new AtomicInteger());
    }

    public void checkLogin(String clientKey) {
        check("login", clientKey, loginLimitPerMinute);
    }

    public void checkRegister(String clientKey) {
        check("register", clientKey, registerLimitPerMinute);
    }

    private void check(String action, String clientKey, int limit) {
        if (!enabled || limit <= 0) {
            return;
        }
        String key = StringUtils.hasText(clientKey)
            ? clientKey.substring(0, Math.min(clientKey.length(), MAX_KEY_LENGTH))
            : "unknown";
        AtomicInteger counter = counters.get(action + ":" + key);
        if (counter.incrementAndGet() > limit) {
            throw new ApiException(
                org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                "RATE_LIMITED",
                "Too many requests. Try again later."
            );
        }
    }
}
