package com.innovasphere.service;

import com.innovasphere.config.CacheConfig;
import com.innovasphere.dto.SkillCreateRequest;
import com.innovasphere.dto.SkillDto;
import com.innovasphere.entity.Skill;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.SkillMapper;
import com.innovasphere.repository.ProjectSkillRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.StudentSkillRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkillService {

    private final SkillRepository skillRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillMapper skillMapper;

    public SkillService(SkillRepository skillRepository,
                        ProjectSkillRepository projectSkillRepository,
                        StudentSkillRepository studentSkillRepository,
                        SkillMapper skillMapper) {
        this.skillRepository = skillRepository;
        this.projectSkillRepository = projectSkillRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.skillMapper = skillMapper;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.SKILLS, key = "'list'")
    public List<SkillDto> list() {
        return load(null);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.SKILLS, key = "'search:' + (#keyword == null ? '' : #keyword.trim().toLowerCase())")
    public List<SkillDto> search(String keyword) {
        return load(keyword);
    }

    /**
     * Both cached entry points delegate here so the query itself lives in a single
     * place, and so a self-invocation can never bypass the proxy-managed cache.
     */
    private List<SkillDto> load(String keyword) {
        String normalized = keyword != null ? keyword.trim() : null;
        return (normalized == null || normalized.isEmpty()
                ? skillRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                : skillRepository.findByNameContainingIgnoreCase(normalized, Sort.by(Sort.Direction.ASC, "name")))
            .stream()
            .map(skillMapper::toDto)
            .toList();
    }

    @Transactional
    @CacheEvict(value = CacheConfig.SKILLS, allEntries = true)
    public SkillDto create(SkillCreateRequest request) {
        String name = request.name().trim();
        if (skillRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "SKILL_ALREADY_EXISTS",
                "A skill named '" + name + "' already exists");
        }
        Skill skill = Skill.builder()
            .name(name)
            .description(request.description() != null ? request.description().trim() : null)
            .build();
        return skillMapper.toDto(skillRepository.save(skill));
    }

    @Transactional
    @CacheEvict(value = CacheConfig.SKILLS, allEntries = true)
    public void delete(UUID skillId) {
        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SKILL_NOT_FOUND", "Skill not found"));
        if (projectSkillRepository.existsBySkillId(skillId) || studentSkillRepository.existsBySkillId(skillId)) {
            throw new ApiException(HttpStatus.CONFLICT, "SKILL_IN_USE",
                "Skill '" + skill.getName() + "' is referenced by projects or profiles and cannot be deleted");
        }
        skillRepository.delete(skill);
    }
}