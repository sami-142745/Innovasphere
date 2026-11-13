package com.innovasphere.repository;

import com.innovasphere.entity.NotificationPreference;
import com.innovasphere.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
