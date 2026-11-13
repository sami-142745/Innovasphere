package com.innovasphere.security;

import com.innovasphere.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class JwtServiceVersionTest {

    public static final String TEST_SECRET =
        "aW5ub3Zhc3BoZXJlLXRlc3Qtc2VjcmV0LWtleS0wMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3OA==";

    private JwtService jwtService() {
        return new JwtService(TEST_SECRET, 3600000L);
    }

    private AuthenticatedUser user(int tokenVersion) {
        return new AuthenticatedUser(
            UUID.randomUUID(),
            "user@test.com",
            "password",
            Role.STUDENT,
            true,
            tokenVersion
        );
    }

    @Test
    void matchingTokenVersionIsValid() {
        String token = jwtService().generateToken("user@test.com", 5);
        assertTrue(jwtService().validateToken(token, user(5)));
    }

    @Test
    void staleTokenVersionIsInvalid() {
        String token = jwtService().generateToken("user@test.com", 5);
        assertFalse(jwtService().validateToken(token, user(6)));
    }

    @Test
    void tokenWithoutVersionIsValidAgainstVersionZero() {
        JwtService service = jwtService();
        String token = service.generateToken("user@test.com");
        assertTrue(service.validateToken(token, user(0)));
        assertFalse(service.validateToken(token, user(1)));
    }
}
