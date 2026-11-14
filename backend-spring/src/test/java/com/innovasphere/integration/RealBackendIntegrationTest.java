package com.innovasphere.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real backend integration tests against a disposable MySQL 8 database via
 * Testcontainers. These tests exercise the full Spring Boot application over
 * real HTTP, verifying status codes, response bodies, DB persistence,
 * authorization and JWT token revocation.
 */
@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealBackendIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("innovasphere_e2e")
        .withUsername("e2e")
        .withPassword("e2e-pass")
        ;


    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("app.jwt.secret", () -> "aW5ub3Zhc3BoZXJlLWUyZS1zZWNyZXQta2V5LTAwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OQ==");
        registry.add("app.jwt.expiration-ms", () -> "3600000");
        registry.add("app.seed.enabled", () -> "false");
        registry.add("app.security.rate-limit.enabled", () -> "false");
    }

    // ------------------------------------------------------------------ helpers

    private JsonNode register(String email, String password, String role) throws Exception {
        String body = "{\"firstName\":\"Test\",\"lastName\":\"User\",\"username\":\""
            + email.replace("@", "_") + "\",\"email\":\"" + email
            + "\",\"password\":\"" + password + "\",\"role\":\"" + role + "\"}";
        ResponseEntity<String> res = rest.postForEntity("/api/auth/register", body, String.class);
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        return objectMapper.readTree(res.getBody());
    }

    private String login(String email, String password) throws Exception {
        String body = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
        ResponseEntity<String> res = rest.postForEntity("/api/auth/login", body, String.class);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        return objectMapper.readTree(res.getBody()).get("token").asText();
    }

    private HttpHeaders auth(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private ResponseEntity<String> request(HttpMethod method, String url, Object body, String token) {
        HttpEntity<Object> entity = new HttpEntity<>(body, auth(token));
        return rest.exchange(url, method, entity, String.class);
    }

    private String unique(String prefix) {
        return prefix + System.currentTimeMillis() + (int) (Math.random() * 10000);
    }

    // ------------------------------------------------------------------ registration & login

    @Test
    void studentRegistrationSucceeds() throws Exception {
        String email = unique("reg") + "@test.com";
        JsonNode node = register(email, "StrongPass@123", "STUDENT");
        assertNotNull(node.get("token"));
        assertEquals("STUDENT", node.get("user").get("role").asText());
        assertNotNull(node.get("user").get("id").asText());
    }

    @Test
    void adminRegistrationRejected() throws Exception {
        String email = unique("admreg") + "@test.com";
        String body = "{\"firstName\":\"Bad\",\"lastName\":\"Admin\",\"username\":\"badadm\",\"email\":\""
            + email + "\",\"password\":\"StrongPass@123\",\"role\":\"ADMIN\"}";
        ResponseEntity<String> res = rest.postForEntity("/api/auth/register", body, String.class);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
    }

    @Test
    void studentLoginSucceeds() throws Exception {
        String email = unique("log") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String token = login(email, "StrongPass@123");
        assertNotNull(token);
    }

    @Test
    void loginWrongPasswordRejected() throws Exception {
        String email = unique("wlog") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String body = "{\"email\":\"" + email + "\",\"password\":\"WrongPass@999\"}";
        ResponseEntity<String> res = rest.postForEntity("/api/auth/login", body, String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    }

    // ------------------------------------------------------------------ profile

    @Test
    void profileRetrieveAndUpdate() throws Exception {
        String email = unique("prof") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String token = login(email, "StrongPass@123");

        ResponseEntity<String> me = rest.exchange(
            "/api/users/me", HttpMethod.GET, new HttpEntity<>(auth(token)), String.class);
        assertEquals(HttpStatus.OK, me.getStatusCode());
        JsonNode userNode = objectMapper.readTree(me.getBody());
        assertNotNull(userNode.get("id").asText());

        String newEmail = unique("profupd") + "@test.com";
        String updBody = "{\"username\":\"updateduser\",\"fullName\":\"Updated Name\",\"email\":\""
            + newEmail + "\"}";
        ResponseEntity<String> upd = request(HttpMethod.PUT, "/api/users/me", updBody, token);
        assertEquals(HttpStatus.OK, upd.getStatusCode());
        JsonNode updated = objectMapper.readTree(upd.getBody());
        assertEquals("updateduser", updated.get("username").asText());
        assertEquals("Updated Name", updated.get("fullName").asText());
        assertEquals(newEmail, updated.get("email").asText());
    }

    @Test
    void studentProfileEdit() throws Exception {
        String email = unique("stuprof") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String token = login(email, "StrongPass@123");

        String updBody = "{\"enrollmentNumber\":\"ENR-999\",\"university\":\"Test University\","
            + "\"department\":\"CS\",\"yearOfStudy\":3,\"bio\":\"Updated bio\"}";
        ResponseEntity<String> upd = request(HttpMethod.PUT, "/api/users/me/student-profile", updBody, token);
        assertEquals(HttpStatus.OK, upd.getStatusCode());
        JsonNode profile = objectMapper.readTree(upd.getBody());
        assertEquals("ENR-999", profile.get("enrollmentNumber").asText());
        assertEquals("Test University", profile.get("university").asText());
    }

    // ------------------------------------------------------------------ notification preferences

    @Test
    void notificationPreferencesGetAndUpdate() throws Exception {
        String email = unique("pref") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String token = login(email, "StrongPass@123");

        ResponseEntity<String> get = request(HttpMethod.GET, "/api/notifications/preferences", null, token);
        assertEquals(HttpStatus.OK, get.getStatusCode());
        JsonNode prefs = objectMapper.readTree(get.getBody());
        assertTrue(prefs.get("emailAlerts").asBoolean());

        String updBody = "{\"emailAlerts\":false,\"inAppAlerts\":true}";
        ResponseEntity<String> put = request(HttpMethod.PUT, "/api/notifications/preferences", updBody, token);
        assertEquals(HttpStatus.OK, put.getStatusCode());
        JsonNode updated = objectMapper.readTree(put.getBody());
        assertEquals(false, updated.get("emailAlerts").asBoolean());
        assertEquals(true, updated.get("inAppAlerts").asBoolean());

        // Verify persistence across calls
        ResponseEntity<String> get2 = request(HttpMethod.GET, "/api/notifications/preferences", null, token);
        JsonNode prefs2 = objectMapper.readTree(get2.getBody());
        assertEquals(false, prefs2.get("emailAlerts").asBoolean());
    }

    // ------------------------------------------------------------------ authorization

    @Test
    void adminEndpointsRejectNonAdmin() throws Exception {
        String email = unique("nonadmin") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String token = login(email, "StrongPass@123");

        ResponseEntity<String> stats = request(HttpMethod.GET, "/api/admin/stats", null, token);
        assertEquals(HttpStatus.FORBIDDEN, stats.getStatusCode());

        ResponseEntity<String> users = request(HttpMethod.GET, "/api/admin/users", null, token);
        assertEquals(HttpStatus.FORBIDDEN, users.getStatusCode());
    }

    @Test
    void unauthenticatedEndpointsRejected() throws Exception {
        ResponseEntity<String> me = rest.exchange("/api/users/me", HttpMethod.GET, null, String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, me.getStatusCode());

        ResponseEntity<String> prefs = rest.exchange("/api/notifications/preferences", HttpMethod.GET, null, String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, prefs.getStatusCode());
    }

    // ------------------------------------------------------------------ logout & token revocation

    @Test
    void logoutRevokesToken() throws Exception {
        String email = unique("logout") + "@test.com";
        register(email, "StrongPass@123", "STUDENT");
        String token = login(email, "StrongPass@123");

        ResponseEntity<String> logout = request(HttpMethod.POST, "/api/auth/logout", null, token);
        assertEquals(HttpStatus.NO_CONTENT, logout.getStatusCode());

        // The same token should now fail
        ResponseEntity<String> meAfter = request(HttpMethod.GET, "/api/users/me", null, token);
        assertEquals(HttpStatus.UNAUTHORIZED, meAfter.getStatusCode());
    }
}


