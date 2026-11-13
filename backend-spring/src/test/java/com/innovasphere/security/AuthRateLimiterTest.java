package com.innovasphere.security;

import com.innovasphere.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthRateLimiterTest {

    @Test
    void allowedUpToLimit() {
        AuthRateLimiter limiter = new AuthRateLimiter(true, 2, 2);
        limiter.checkLogin("client-1");
        limiter.checkLogin("client-1");
        assertDoesNotThrow(() -> limiter.checkLogin("client-2"));
    }

    @Test
    void beyondLimitIsRateLimited() {
        AuthRateLimiter limiter = new AuthRateLimiter(true, 1, 1);
        limiter.checkLogin("client-1");
        ApiException ex = assertThrows(ApiException.class, () -> limiter.checkLogin("client-1"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertEquals("RATE_LIMITED", ex.getCode());
    }

    @Test
    void differentActionsAreIndependent() {
        AuthRateLimiter limiter = new AuthRateLimiter(true, 1, 1);
        limiter.checkLogin("client-1");
        assertDoesNotThrow(() -> limiter.checkRegister("client-1"));
    }

    @Test
    void disabledDoesNotRateLimit() {
        AuthRateLimiter limiter = new AuthRateLimiter(false, 1, 1);
        for (int i = 0; i < 100; i++) {
            assertDoesNotThrow(() -> limiter.checkLogin("client-1"));
        }
    }

    @Test
    void zeroLimitMeansNoLimit() {
        AuthRateLimiter limiter = new AuthRateLimiter(true, 0, 0);
        for (int i = 0; i < 100; i++) {
            assertDoesNotThrow(() -> limiter.checkLogin("client-1"));
        }
    }
}
