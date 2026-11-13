package com.innovasphere.service;

import com.innovasphere.dto.NotificationPreferenceDto;
import com.innovasphere.dto.NotificationPreferenceUpdateRequest;
import com.innovasphere.entity.NotificationPreference;
import com.innovasphere.entity.User;
import com.innovasphere.exception.ApiException;
import com.innovasphere.repository.NotificationPreferenceRepository;
import com.innovasphere.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {

    @Mock NotificationPreferenceRepository preferenceRepository;
    @Mock UserRepository userRepository;
    @InjectMocks NotificationPreferenceService preferenceService;

    private UUID userId() {
        return UUID.fromString("22222222-2222-2222-2222-222222222222");
    }

    private User user(UUID id) {
        User u = User.builder()
            .username("user")
            .email("user@test.com")
            .fullName("Test User")
            .passwordHash("hash")
            .active(true)
            .build();
        u.setId(id);
        return u;
    }

    @Test
    void getOrCreateReturnsExistingPreference() {
        UUID id = userId();
        User u = user(id);
        NotificationPreference existing = new NotificationPreference();
        existing.setId(UUID.randomUUID());
        existing.setUser(u);
        existing.setEmailAlerts(false);
        existing.setInAppAlerts(true);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(preferenceRepository.findByUserId(id)).thenReturn(Optional.of(existing));

        NotificationPreferenceDto dto = preferenceService.getOrCreate(id);

        assertEquals(false, dto.emailAlerts());
        assertEquals(true, dto.inAppAlerts());
        verify(preferenceRepository, never()).save(any());
    }

    @Test
    void getOrCreateCreatesDefaultWhenMissing() {
        UUID id = userId();
        User u = user(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(preferenceRepository.findByUserId(id)).thenReturn(Optional.empty());
        when(preferenceRepository.save(any(NotificationPreference.class)))
            .thenAnswer(inv -> {
                NotificationPreference p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                return p;
            });

        NotificationPreferenceDto dto = preferenceService.getOrCreate(id);

        assertEquals(true, dto.emailAlerts());
        assertEquals(true, dto.inAppAlerts());
        verify(preferenceRepository).save(any(NotificationPreference.class));
    }

    @Test
    void updateSetsPreferences() {
        UUID id = userId();
        User u = user(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        when(preferenceRepository.findByUserId(id)).thenReturn(Optional.empty());
        when(preferenceRepository.save(any(NotificationPreference.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        NotificationPreferenceUpdateRequest req = new NotificationPreferenceUpdateRequest(false, false);
        NotificationPreferenceDto dto = preferenceService.update(id, req);

        assertEquals(false, dto.emailAlerts());
        assertEquals(false, dto.inAppAlerts());
    }

    @Test
    void updateNotFoundIs404() {
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());
        NotificationPreferenceUpdateRequest req = new NotificationPreferenceUpdateRequest(true, true);
        ApiException ex = assertThrows(ApiException.class, () -> preferenceService.update(UUID.randomUUID(), req));
        assertEquals("USER_NOT_FOUND", ex.getCode());
    }
}
