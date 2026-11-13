-- Notification preferences table: persists per-user email and in-app alert settings.
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `email_alerts` bit(1) NOT NULL DEFAULT b'1',
  `in_app_alerts` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_preferences_user_id` (`user_id`),
  CONSTRAINT `FK_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
