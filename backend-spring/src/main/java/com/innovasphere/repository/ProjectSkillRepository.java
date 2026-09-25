package com.innovasphere.repository;

import com.innovasphere.entity.ProjectSkill;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, UUID> {

    List<ProjectSkill> findByProjectId(UUID projectId);

    boolean existsByProjectIdAndSkillId(UUID projectId, UUID skillId);

    boolean existsBySkillId(UUID skillId);
}