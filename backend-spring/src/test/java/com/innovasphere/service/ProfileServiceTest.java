package com.innovasphere.service;

import com.innovasphere.dto.FacultyProfileUpdateRequest;
import com.innovasphere.dto.StudentProfileUpdateRequest;
import com.innovasphere.dto.UserUpdateRequest;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.StudentProfileRepository;
import com.innovasphere.repository.UserRepository;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock UserRepository userRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock FacultyProfileRepository facultyProfileRepository;
    @Mock SkillRepository skillRepository;
    @Mock ResearchDomainRepository researchDomainRepository;
    @InjectMocks ProfileService profileService;

    private UUID userId() {
        return UUID.fromString("11111111-1111-1111-1111-111111111111");
    }

    private User student(UUID id) {
        User u = User.builder()
            .username("student")
            .email("student@test.com")
            .fullName("Student User")
            .passwordHash("hash")
            .role(Role.STUDENT)
            .active(true)
            .build();
        u.setId(id);
        return u;
    }

    private User faculty(UUID id) {
        User u = User.builder()
            .username("faculty")
            .email("faculty@test.com")
            .fullName("Faculty User")
            .passwordHash("hash")
            .role(Role.FACULTY)
            .active(true)
            .build();
        u.setId(id);
        return u;
    }

    @Test
    void updateOwnUserUpdatesFields() {
        UUID id = userId();
        User u = student(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserUpdateRequest req = new UserUpdateRequest("newuser", "New Name", "new@test.com");
        var result = profileService.updateOwnUser(id, req);

        assertEquals("newuser", result.username());
        assertEquals("New Name", result.fullName());
        assertEquals("new@test.com", result.email());
        verify(userRepository).save(u);
    }

    @Test
    void updateOwnUserEmailConflictIs409() {
        UUID id = userId();
        User u = student(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(userRepository.existsByEmail("taken@test.com")).thenReturn(true);

        UserUpdateRequest req = new UserUpdateRequest("user", "Name", "taken@test.com");
        ApiException ex = assertThrows(ApiException.class, () -> profileService.updateOwnUser(id, req));
        assertEquals("EMAIL_EXISTS", ex.getCode());
    }

    @Test
    void updateOwnStudentProfileNotStudentIs403() {
        UUID id = userId();
        User u = faculty(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));

        StudentProfileUpdateRequest req = new StudentProfileUpdateRequest("ENR", "Uni", "Dept", 3, "Bio", null, null);
        ApiException ex = assertThrows(ApiException.class, () -> profileService.updateOwnStudentProfile(id, req));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void updateOwnFacultyProfileNotFacultyIs403() {
        UUID id = userId();
        User u = student(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));

        FacultyProfileUpdateRequest req = new FacultyProfileUpdateRequest("Dept", "Prof", "Bio", "Expertise", null);
        ApiException ex = assertThrows(ApiException.class, () -> profileService.updateOwnFacultyProfile(id, req));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void getProfileNotFoundIs404() {
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> profileService.getProfile(UUID.randomUUID()));
        assertEquals("USER_NOT_FOUND", ex.getCode());
    }

    @Test
    void adminUpdateUserUsernameConflictIs409() {
        UUID id = userId();
        User u = student(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        UserUpdateRequest req = new UserUpdateRequest("taken", "Name", "new@test.com");
        ApiException ex = assertThrows(ApiException.class, () -> profileService.adminUpdateUser(id, req));
        assertEquals("USERNAME_EXISTS", ex.getCode());
    }
}
