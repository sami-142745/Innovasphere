package com.innovasphere.service;

import com.innovasphere.dto.UserSummaryDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryDto> search(String keyword, Role role, Pageable pageable) {
        String normalized = keyword != null && !keyword.isBlank() ? keyword.trim() : null;
        boolean includeAdmin = role == Role.ADMIN;
        return userRepository.search(normalized, role, includeAdmin, pageable)
            .map(this::toSummary);
    }

    private UserSummaryDto toSummary(User user) {
        return new UserSummaryDto(
            user.getId(),
            user.getFullName(),
            user.getUsername(),
            user.getEmail(),
            user.getRole(),
            departmentOf(user),
            null
        );
    }

    private String departmentOf(User user) {
        if (user.getRole() == Role.FACULTY) {
            FacultyProfile profile = user.getFacultyProfile();
            return profile != null ? profile.getDepartment() : null;
        }
        StudentProfile profile = user.getStudentProfile();
        return profile != null ? profile.getDepartment() : null;
    }
}