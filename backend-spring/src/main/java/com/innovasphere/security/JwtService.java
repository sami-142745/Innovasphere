package com.innovasphere.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String INSECURE_DEFAULT_SECRET = "change_this_to_a_long_random_secret";

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        String candidate = secret == null ? null : secret.trim();
        if (candidate == null || candidate.isEmpty()) {
            throw new IllegalStateException(
                "app.jwt.secret is not configured. Set a strong JWT_SECRET (base64, >= 32 bytes) in production.");
        }
        if (INSECURE_DEFAULT_SECRET.equals(candidate)) {
            throw new IllegalStateException(
                "app.jwt.secret is still set to the insecure default '" + INSECURE_DEFAULT_SECRET
                    + "'. Provide a real JWT_SECRET before running.");
        }
        byte[] secretBytes;
        try {
            secretBytes = Decoders.BASE64.decode(candidate);
        } catch (RuntimeException ex) {
            secretBytes = candidate.getBytes(StandardCharsets.UTF_8);
        }
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                "app.jwt.secret must decode to at least 32 bytes to support HS256 signing.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(String username) {
        return Jwts.builder()
            .subject(username)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(signingKey)
            .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}