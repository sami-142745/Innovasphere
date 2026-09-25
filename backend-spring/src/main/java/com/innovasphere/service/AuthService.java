package com.innovasphere.service;

import com.innovasphere.dto.AuthResponse;
import com.innovasphere.dto.FacultyProfileDto;
import com.innovasphere.dto.LoginRequest;
import com.innovasphere.dto.RegisterRequest;
import com.innovasphere.dto.StudentProfileDto;
import com.innovasphere.dto.UserProfileDto;
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
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$";

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final StudentProfileMapper studentProfileMapper;
    private final FacultyProfileMapper facultyProfileMapper;

    public AuthService(
        UserRepository userRepository,
        StudentProfileRepository studentProfileRepository,
        FacultyProfileRepository facultyProfileRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService,
        StudentProfileMapper studentProfileMapper,
        FacultyProfileMapper facultyProfileMapper
    ) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.facultyProfileRepository = facultyProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.studentProfileMapper = studentProfileMapper;
        this.facultyProfileMapper = facultyProfileMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN_REGISTRATION_NOT_ALLOWED",
                "Admin accounts cannot be created through public registration");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email is already registered");
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "USERNAME_EXISTS", "Username is already taken");
        }

        if (!request.password().matches(PASSWORD_PATTERN)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD",
                "Password must contain at least one uppercase letter, one lowercase letter, one digit and one special character");
        }

        Role role = request.role() != null ? request.role() : Role.STUDENT;

        User user = User.builder()
            .username(request.username())
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            .fullName(request.firstName() + " " + request.lastName())
            .role(role)
            .active(true)
            .build();
        user = userRepository.save(user);

        if (role == Role.FACULTY) {
            facultyProfileRepository.save(FacultyProfile.builder().user(user).build());
        } else {
            studentProfileRepository.save(StudentProfile.builder().user(user).build());
        }

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid email or password"));

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserProfileDto me(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        return toUserProfile(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, toUserProfile(user), jwtService.getExpirationMs());
    }

    private UserProfileDto toUserProfile(User user) {
        StudentProfileDto studentProfile = null;
        FacultyProfileDto facultyProfile = null;

        if (user.getRole() == Role.FACULTY) {
            facultyProfile = facultyProfileRepository.findByUserId(user.getId())
                .map(facultyProfileMapper::toDto)
                .orElse(null);
        } else {
            studentProfile = studentProfileRepository.findByUserId(user.getId())
                .map(studentProfileMapper::toDto)
                .orElse(null);
        }

        return new UserProfileDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.isActive(),
            studentProfile,
            facultyProfile,
            user.getCreatedAt()
        );
    }
}