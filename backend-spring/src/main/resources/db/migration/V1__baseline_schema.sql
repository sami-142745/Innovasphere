-- Baseline schema captured from the production database before Flyway was
-- introduced. Existing databases are baselined at version 1 and skip this
-- migration; empty databases execute it once.
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `users` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','FACULTY','STUDENT') NOT NULL,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `skills` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_skills_name` (`name`),
  KEY `idx_skills_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `research_domains` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_research_domains_name` (`name`),
  KEY `idx_research_domains_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `projects` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `description` varchar(10000) DEFAULT NULL,
  `repository_url` varchar(500) DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `status` enum('COMPLETED','IDEA','IN_PROGRESS','LOOKING_FOR_TEAM','UNDER_REVIEW') NOT NULL,
  `title` varchar(255) NOT NULL,
  `owner_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_owner_id` (`owner_id`),
  KEY `idx_projects_created_at` (`created_at`),
  KEY `idx_projects_status_created_at` (`status`,`created_at`),
  KEY `idx_projects_title` (`title`),
  CONSTRAINT `FKmueqy6cpcwpfl8gnnag4idjt9` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `student_profiles` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `bio` varchar(2000) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `enrollment_number` varchar(100) DEFAULT NULL,
  `university` varchar(255) DEFAULT NULL,
  `year_of_study` int DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhlcwb2egnj8mj3e0mouse1lgy` (`user_id`),
  KEY `idx_student_profiles_user_id` (`user_id`),
  CONSTRAINT `FK32koy3tgqtaujxhfsn0b9pel2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `student_profiles_chk_1` CHECK (((`year_of_study` >= 1) and (`year_of_study` <= 8)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `faculty_profiles` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `bio` varchar(2000) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `expertise` varchar(2000) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK5afdsnnjrd6jv32kgt2juabpo` (`user_id`),
  KEY `idx_faculty_profiles_user_id` (`user_id`),
  CONSTRAINT `FKaj66kj78fcavpppj54g0e6aij` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `project_members` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `joined_at` datetime(6) NOT NULL,
  `role_in_project` enum('LEAD','MEMBER','PROJECT_OWNER','REVIEWER') NOT NULL,
  `project_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_members` (`project_id`,`user_id`),
  KEY `idx_project_members_project_id` (`project_id`),
  KEY `idx_project_members_user_id` (`user_id`),
  CONSTRAINT `FKdki1sp2homqsdcvqm9yrix31g` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `FKgul2el0qjk5lsvig3wgajwm77` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `project_skills` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `required_level` int NOT NULL,
  `project_id` binary(16) NOT NULL,
  `skill_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_skills` (`project_id`,`skill_id`),
  KEY `idx_project_skills_project_id` (`project_id`),
  KEY `idx_project_skills_skill_id` (`skill_id`),
  CONSTRAINT `FK57v4gsyik9h1a1xu92sp1f3wj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `FKoik2usavkhwhi78q9wj6e3lg2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`),
  CONSTRAINT `project_skills_chk_1` CHECK (((`required_level` <= 5) and (`required_level` >= 1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `project_research_domains` (
  `project_id` binary(16) NOT NULL,
  `research_domain_id` binary(16) NOT NULL,
  PRIMARY KEY (`project_id`,`research_domain_id`),
  KEY `FKdqhwkirs2pw4efpb9m8u7kffa` (`research_domain_id`),
  CONSTRAINT `FKdqhwkirs2pw4efpb9m8u7kffa` FOREIGN KEY (`research_domain_id`) REFERENCES `research_domains` (`id`),
  CONSTRAINT `FKgp9g6rk2eepp7qsis136gyo3u` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `join_requests` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `status` enum('ACCEPTED','PENDING','REJECTED') NOT NULL,
  `project_id` binary(16) NOT NULL,
  `student_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_join_requests_project_id` (`project_id`),
  KEY `idx_join_requests_student_id` (`student_id`),
  KEY `idx_join_requests_status` (`status`),
  CONSTRAINT `FK5k311oodnobrrjf6vjgwqqq7b` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`),
  CONSTRAINT `FKquopbdqeh7fojskbpkepn09qj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mentorship_requests` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `status` enum('ACCEPTED','PENDING','REJECTED') NOT NULL,
  `faculty_id` binary(16) NOT NULL,
  `project_id` binary(16) DEFAULT NULL,
  `student_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mentorship_requests_student_id` (`student_id`),
  KEY `idx_mentorship_requests_faculty_id` (`faculty_id`),
  KEY `idx_mentorship_requests_status` (`status`),
  KEY `FK1xcxf19t38kiq3ikq339m0edy` (`project_id`),
  CONSTRAINT `FK1xcxf19t38kiq3ikq339m0edy` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `FKivjqt4o81wlxcnxb2kgl24diq` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKnuwlfl52wjwiimqk6ukdkmo69` FOREIGN KEY (`faculty_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mentorships` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `started_at` datetime(6) NOT NULL,
  `faculty_id` binary(16) NOT NULL,
  `project_id` binary(16) DEFAULT NULL,
  `student_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mentorships_faculty_id` (`faculty_id`),
  KEY `idx_mentorships_student_id` (`student_id`),
  KEY `FKednc01wu90wpofx6n8je3oouu` (`project_id`),
  CONSTRAINT `FK5mswtdbmgxjkljt95rjilcxt2` FOREIGN KEY (`faculty_id`) REFERENCES `faculty_profiles` (`id`),
  CONSTRAINT `FKednc01wu90wpofx6n8je3oouu` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `FKs1lvm1sdgi98r2sud8uhtm8xq` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notifications` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `message` varchar(2000) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('JOIN_REQUEST','JOIN_REQUEST_ACCEPTED','JOIN_REQUEST_REJECTED','MENTORSHIP_ACCEPTED','MENTORSHIP_REJECTED','MENTORSHIP_REQUEST','PROJECT_UPDATE','SYSTEM','TEAM_INVITATION','TEAM_INVITATION_ACCEPTED','TEAM_INVITATION_REJECTED') NOT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `teams` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `project_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK7so1u4r6rpxrqeyxekfwklt5l` (`project_id`),
  CONSTRAINT `FK7so1u4r6rpxrqeyxekfwklt5l` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `team_members` (
  `team_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`team_id`,`user_id`),
  KEY `FKee8x7x5026imwmma9kndkxs36` (`user_id`),
  CONSTRAINT `FKee8x7x5026imwmma9kndkxs36` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtgca08el3ofisywcf11f0f76t` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `team_invitations` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `status` enum('ACCEPTED','PENDING','REJECTED') NOT NULL,
  `invited_by_id` binary(16) NOT NULL,
  `team_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_team_invitations_team_id` (`team_id`),
  KEY `idx_team_invitations_user_id` (`user_id`),
  KEY `idx_team_invitations_status` (`status`),
  KEY `FKnqxer3j4dc7fj8dei8o35xi0` (`invited_by_id`),
  CONSTRAINT `FKmbk1c0kc2kh1p1lppxec0eikr` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKn2spna496q3cr3fmqc8gda2my` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKnqxer3j4dc7fj8dei8o35xi0` FOREIGN KEY (`invited_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `student_skills` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `experience` varchar(1000) DEFAULT NULL,
  `level` int NOT NULL,
  `skill_id` binary(16) NOT NULL,
  `student_profile_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_skills` (`student_profile_id`,`skill_id`),
  KEY `idx_student_skills_student_profile_id` (`student_profile_id`),
  KEY `idx_student_skills_skill_id` (`skill_id`),
  CONSTRAINT `FK3llu0hfl6warqtjivwd8bfkt5` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`),
  CONSTRAINT `FKdyl6ffxg89qebmlpcg2x3fnbw` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`),
  CONSTRAINT `student_skills_chk_1` CHECK (((`level` <= 5) and (`level` >= 1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `student_profile_research_domains` (
  `student_profile_id` binary(16) NOT NULL,
  `research_domain_id` binary(16) NOT NULL,
  PRIMARY KEY (`student_profile_id`,`research_domain_id`),
  KEY `FK56pmi7gcx6a7fgq19vacgwovi` (`research_domain_id`),
  CONSTRAINT `FK2g68fws694f7mnq5fgik31wsq` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`),
  CONSTRAINT `FK56pmi7gcx6a7fgq19vacgwovi` FOREIGN KEY (`research_domain_id`) REFERENCES `research_domains` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `faculty_profile_research_domains` (
  `faculty_profile_id` binary(16) NOT NULL,
  `research_domain_id` binary(16) NOT NULL,
  PRIMARY KEY (`faculty_profile_id`,`research_domain_id`),
  KEY `FKg631phsv4p8nb1xphcvxkmj4d` (`research_domain_id`),
  CONSTRAINT `FKg631phsv4p8nb1xphcvxkmj4d` FOREIGN KEY (`research_domain_id`) REFERENCES `research_domains` (`id`),
  CONSTRAINT `FKm2772tk7w2ql27wq2mk2ns37b` FOREIGN KEY (`faculty_profile_id`) REFERENCES `faculty_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
