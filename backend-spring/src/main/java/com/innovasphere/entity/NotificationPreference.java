package com.innovasphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "notification_preferences",
    indexes = {
        @Index(name = "idx_notification_preferences_user_id", columnList = "user_id", unique = true)
    }
)
public class NotificationPreference extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_alerts", nullable = false)
    @Builder.Default
    private boolean emailAlerts = true;

    @Column(name = "in_app_alerts", nullable = false)
    @Builder.Default
    private boolean inAppAlerts = true;
}
