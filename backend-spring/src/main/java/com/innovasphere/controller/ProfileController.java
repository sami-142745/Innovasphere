package com.innovasphere.controller;

import com.innovasphere.dto.FacultyProfileDto;
import com.innovasphere.dto.FacultyProfileUpdateRequest;
import com.innovasphere.dto.StudentProfileDto;
import com.innovasphere.dto.StudentProfileUpdateRequest;
import com.innovasphere.dto.UserProfileDto;
import com.innovasphere.dto.UserUpdateRequest;
import com.innovasphere.entity.User;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.ProfileService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUserProvider currentUserProvider;

    public ProfileController(ProfileService profileService, CurrentUserProvider currentUserProvider) {
        this.profileService = profileService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/me")
    public UserProfileDto getOwnProfile(Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return profileService.getProfile(user.getId());
    }

    @PutMapping("/me")
    public UserProfileDto updateOwnUser(
        Authentication authentication,
        @Valid @RequestBody UserUpdateRequest request) {
        User user = currentUserProvider.require(authentication);
        return profileService.updateOwnUser(user.getId(), request);
    }

    @PutMapping("/me/student-profile")
    public StudentProfileDto updateOwnStudentProfile(
        Authentication authentication,
        @Valid @RequestBody StudentProfileUpdateRequest request) {
        User user = currentUserProvider.require(authentication);
        return profileService.updateOwnStudentProfile(user.getId(), request);
    }

    @PutMapping("/me/faculty-profile")
    public FacultyProfileDto updateOwnFacultyProfile(
        Authentication authentication,
        @Valid @RequestBody FacultyProfileUpdateRequest request) {
        User user = currentUserProvider.require(authentication);
        return profileService.updateOwnFacultyProfile(user.getId(), request);
    }

    @GetMapping("/{id}")
    public UserProfileDto getProfile(@PathVariable UUID id) {
        return profileService.getProfile(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileDto> adminUpdateUser(
        @PathVariable UUID id,
        @Valid @RequestBody UserUpdateRequest request,
        Authentication authentication) {
        User actor = currentUserProvider.require(authentication);
        if (actor.getRole() != com.innovasphere.enums.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(profileService.adminUpdateUser(id, request));
    }
}
