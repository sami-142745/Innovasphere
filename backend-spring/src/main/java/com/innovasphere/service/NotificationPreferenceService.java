package com.innovasphere.service;

import com.innovasphere.dto.NotificationPreferenceDto;
import com.innovasphere.dto.NotificationPreferenceUpdateRequest;
import com.innovasphere.entity.NotificationPreference;
import com.innovasphere.entity.User;
import com.innovasphere.exception.ApiException;
import com.innovasphere.repository.NotificationPreferenceRepository;
import com.innovasphere.repository.UserRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public NotificationPreferenceService(
        NotificationPreferenceRepository preferenceRepository,
        UserRepository userRepository
    ) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public NotificationPreferenceDto getOrCreate(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        return preferenceRepository.findByUserId(userId)
            .map(this::toDto)
            .orElseGet(() -> {
                NotificationPreference pref = NotificationPreference.builder()
                    .user(user)
                    .emailAlerts(true)
                    .inAppAlerts(true)
                    .build();
                return toDto(preferenceRepository.save(pref));
            });
    }

    @Transactional
    public NotificationPreferenceDto update(UUID userId, NotificationPreferenceUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        NotificationPreference pref = preferenceRepository.findByUserId(userId)
            .orElseGet(() -> NotificationPreference.builder()
                .user(user)
                .emailAlerts(true)
                .inAppAlerts(true)
                .build());

        pref.setEmailAlerts(request.emailAlerts());
        pref.setInAppAlerts(request.inAppAlerts());
        return toDto(preferenceRepository.save(pref));
    }

    private NotificationPreferenceDto toDto(NotificationPreference pref) {
        return new NotificationPreferenceDto(
            pref.getId(),
            pref.getUser().getId(),
            pref.isEmailAlerts(),
            pref.isInAppAlerts()
        );
    }
}
