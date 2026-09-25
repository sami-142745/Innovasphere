package com.innovasphere.service;

import com.innovasphere.dto.AuthResponse;
import com.innovasphere.dto.FacultyProfileDto;
import com.innovasphere.dto.LoginRequest;
import com.innovasphere.dto.RegisterRequest;
import com.innovasphere.dto.StudentProfileDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.FacultyProfileMapper;
import com.innovasphere.mapper.StudentProfileMapper;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.StudentProfileRepository;
import com.innovasphere.repository.UserRepository;
import com.innovasphere.security.JwtService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock FacultyProfileRepository facultyProfileRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtService jwtService;
    @Mock StudentProfileMapper studentProfileMapper;
    @Mock FacultyProfileMapper facultyProfileMapper;

    @InjectMocks AuthService authService;

    private RegisterRequest request(Role role) {
        return new RegisterRequest("First", "Last", "username1", "user@test.com", "StrongPass@123", role);
    }

    private User savedUser(Role role) {
        User user = User.builder()
            .username("username1")
            .email("user@test.com")
            .passwordHash("encoded")
            .fullName("First Last")
            .role(role)
            .active(true)
            .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    @Test
    void registerStudentCreatesStudentProfileAndReturnsToken() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("username1")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass@123")).thenReturn("encoded");
        User expected = savedUser(Role.STUDENT);
        when(userRepository.save(any(User.class))).thenReturn(expected);
        when(jwtService.generateToken("user@test.com")).thenReturn("jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.register(request(Role.STUDENT));

        assertEquals("jwt-token", response.token());
        verify(studentProfileRepository).save(any(StudentProfile.class));
        verify(facultyProfileRepository, never()).save(any(FacultyProfile.class));
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals(Role.STUDENT, captor.getValue().getRole());
        assertEquals("First Last", captor.getValue().getFullName());
        assertEquals("encoded", captor.getValue().getPasswordHash());
    }

    @Test
    void registerFacultyCreatesFacultyProfile() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("username1")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass@123")).thenReturn("encoded");
        User expected = savedUser(Role.FACULTY);
        when(userRepository.save(any(User.class))).thenReturn(expected);
        when(jwtService.generateToken("user@test.com")).thenReturn("t");
        when(jwtService.getExpirationMs()).thenReturn(1L);

        authService.register(request(Role.FACULTY));

        verify(facultyProfileRepository).save(any(FacultyProfile.class));
        verify(studentProfileRepository, never()).save(any(StudentProfile.class));
    }

    @Test
    void registerDefaultsToStudentWhenRoleNull() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("username1")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass@123")).thenReturn("encoded");
        User expected = savedUser(Role.STUDENT);
        when(userRepository.save(any(User.class))).thenReturn(expected);
        when(jwtService.generateToken("user@test.com")).thenReturn("t");
        when(jwtService.getExpirationMs()).thenReturn(1L);

        authService.register(request(null));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals(Role.STUDENT, captor.getValue().getRole());
    }

    @Test
    void registerAdminIsForbidden() {
        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request(Role.ADMIN)));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADMIN_REGISTRATION_NOT_ALLOWED", ex.getCode());
        verifyNoInteractions(userRepository);
    }

    @Test
    void registerDuplicateEmailIsConflict() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request(Role.STUDENT)));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("EMAIL_EXISTS", ex.getCode());
    }

    @Test
    void registerDuplicateUsernameIsConflict() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("username1")).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request(Role.STUDENT)));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("USERNAME_EXISTS", ex.getCode());
    }

    @Test
    void registerWeakPasswordIsBadRequest() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("username1")).thenReturn(false);
        RegisterRequest weak = new RegisterRequest("First", "Last", "username1", "user@test.com", "password", Role.STUDENT);
        ApiException ex = assertThrows(ApiException.class, () -> authService.register(weak));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("WEAK_PASSWORD", ex.getCode());
    }

    @Test
    void loginSuccessAuthenticatesAndReturnsToken() {
        User user = savedUser(Role.STUDENT);
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("user@test.com")).thenReturn("login-token");
        when(jwtService.getExpirationMs()).thenReturn(7200000L);

        AuthResponse response = authService.login(new LoginRequest("user@test.com", "StrongPass@123"));

        assertEquals("login-token", response.token());
        verify(authenticationManager).authenticate(any());
        assertEquals("user@test.com", response.user().email());
    }

    @Test
    void loginUnknownUserIsUnauthorized() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> authService.login(new LoginRequest("unknown@test.com", "pw")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("UNAUTHORIZED", ex.getCode());
    }

    @Test
    void meMapsUserProfileWithMappers() {
        User faculty = savedUser(Role.FACULTY);
        FacultyProfile profile = new FacultyProfile();
        profile.setUser(faculty);
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(faculty));
        when(facultyProfileRepository.findByUserId(faculty.getId())).thenReturn(Optional.of(profile));
        when(facultyProfileMapper.toDto(profile)).thenReturn(org.mockito.Mockito.mock(FacultyProfileDto.class));

        authService.me("user@test.com");

        verify(facultyProfileMapper).toDto(profile);
    }

    @Test
    void meStudentMapsStudentProfile() {
        User student = savedUser(Role.STUDENT);
        StudentProfile profile = new StudentProfile();
        profile.setUser(student);
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(student));
        when(studentProfileRepository.findByUserId(student.getId())).thenReturn(Optional.of(profile));
        when(studentProfileMapper.toDto(profile)).thenReturn(org.mockito.Mockito.mock(StudentProfileDto.class));

        authService.me("user@test.com");

        verify(studentProfileMapper).toDto(profile);
    }

    @Test
    void meUnknownUserThrows() {
        when(userRepository.findByEmail("nope@test.com")).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> authService.me("nope@test.com"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("USER_NOT_FOUND", ex.getCode());
    }

    @Test
    void registerUsesEncodedPassword() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("username1")).thenReturn(false);
        when(passwordEncoder.encode(eq("StrongPass@123"))).thenReturn("bcrypt-hash");
        User expected = savedUser(Role.STUDENT);
        when(userRepository.save(any(User.class))).thenReturn(expected);
        when(jwtService.generateToken("user@test.com")).thenReturn("t");
        when(jwtService.getExpirationMs()).thenReturn(1L);

        authService.register(request(Role.STUDENT));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertTrue(captor.getValue().getPasswordHash().equals("bcrypt-hash"));
    }
}