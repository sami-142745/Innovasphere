package com.innovasphere.service;

import com.innovasphere.dto.UserSummaryDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserService userService;

    private User user(Role role, String fullName) {
        User u = User.builder().username("user").email("u@test.com").fullName(fullName).role(role).active(true).build();
        u.setId(UUID.randomUUID());
        return u;
    }

    @Test
    void searchTrimsKeywordAndMapsResults() {
        User student = user(Role.STUDENT, "Alice Test");
        StudentProfile profile = new StudentProfile();
        profile.setDepartment("CSE");
        student.setStudentProfile(profile);
        when(userRepository.search(eq("python"), any(), eq(false), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(student)));

        var page = userService.search("  python  ", null, PageRequest.of(0, 20));

        assertEquals(1, page.getTotalElements());
        UserSummaryDto dto = page.getContent().get(0);
        assertEquals("Alice Test", dto.name());
        assertEquals("CSE", dto.department());
        assertNull(dto.avatar());
        ArgumentCaptor<String> keywordCapture = ArgumentCaptor.forClass(String.class);
        verify(userRepository).search(keywordCapture.capture(), any(), eq(false), any(PageRequest.class));
        assertEquals("python", keywordCapture.getValue());
    }

    @Test
    void searchBlankKeywordPassesNull() {
        User u = user(Role.STUDENT, "Blank User");
        when(userRepository.search(eq(null), any(), eq(false), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(u)));
        userService.search("   ", null, PageRequest.of(0, 20));
        verify(userRepository).search(eq(null), any(), eq(false), any(PageRequest.class));
    }

    @Test
    void searchWithAdminRoleIncludesAdmins() {
        User admin = user(Role.ADMIN, "Root Admin");
        when(userRepository.search(eq(null), eq(Role.ADMIN), eq(true), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(admin)));
        userService.search(null, Role.ADMIN, PageRequest.of(0, 20));
        verify(userRepository).search(eq(null), eq(Role.ADMIN), eq(true), any(PageRequest.class));
    }

    @Test
    void searchWithStudentRoleExcludesAdmins() {
        User faculty = user(Role.FACULTY, "Prof Doe");
        FacultyProfile profile = new FacultyProfile();
        profile.setDepartment("ECE");
        faculty.setFacultyProfile(profile);
        when(userRepository.search(eq(null), eq(Role.FACULTY), eq(false), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(faculty)));
        var page = userService.search(null, Role.FACULTY, PageRequest.of(0, 20));
        assertEquals("ECE", page.getContent().get(0).department());
    }
}