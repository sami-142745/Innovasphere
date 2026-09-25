package com.innovasphere.repository;

import com.innovasphere.entity.Skill;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    Optional<Skill> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    Page<Skill> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    List<Skill> findByNameContainingIgnoreCase(String keyword, Sort sort);
}