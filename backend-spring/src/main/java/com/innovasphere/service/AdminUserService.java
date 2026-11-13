package com.innovasphere.service;

import com.innovasphere.dto.AdminStatsDto;
import com.innovasphere.dto.AdminUserDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.UserRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public AdminUserService(UserRepository userRepository, ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatsDto stats() {
        return new AdminStatsDto(
            userRepository.count(),
            userRepository.countByRole(Role.STUDENT),
            userRepository.countByRole(Role.FACULTY),
            userRepository.countByRole(Role.ADMIN),
            userRepository.countByActive(true),
            projectRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> search(String keyword, Role role, Pageable pageable) {
        String normalized = keyword != null && !keyword.isBlank() ? keyword.trim() : null;
        return userRepository.search(normalized, role, true, pageable).map(this::toDto);
    }

    @Transactional
    public AdminUserDto updateStatus(UUID userId, boolean active, UUID actorId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (!active && user.getId().equals(actorId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_DISABLE_SELF",
                "You cannot deactivate your own account");
        }
        if (!active && user.getRole() == Role.ADMIN
            && userRepository.countByRoleAndActive(Role.ADMIN, true) <= 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LAST_ADMIN",
                "At least one active administrator must remain");
        }

        user.setActive(active);
        return toDto(userRepository.save(user));
    }

    private AdminUserDto toDto(User user) {
        return new AdminUserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.isActive(),
            departmentOf(user),
            user.getCreatedAt()
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
