package com.innovasphere.repository;

import com.innovasphere.entity.StudentSkill;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentSkillRepository extends JpaRepository<StudentSkill, UUID> {

    List<StudentSkill> findByStudentProfileId(UUID studentProfileId);

    boolean existsByStudentProfileIdAndSkillId(UUID studentProfileId, UUID skillId);

    boolean existsBySkillId(UUID skillId);
}