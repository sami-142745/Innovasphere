package com.innovasphere.mapper;

import com.innovasphere.dto.StudentProfileDto;
import com.innovasphere.entity.StudentProfile;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class StudentProfileMapper {

    private final SkillMapper skillMapper;
    private final ResearchDomainMapper researchDomainMapper;

    public StudentProfileMapper(SkillMapper skillMapper, ResearchDomainMapper researchDomainMapper) {
        this.skillMapper = skillMapper;
        this.researchDomainMapper = researchDomainMapper;
    }

    public StudentProfileDto toDto(StudentProfile profile) {
        if (profile == null) {
            return null;
        }
        Set<com.innovasphere.dto.SkillDto> skills = new LinkedHashSet<>();
        if (profile.getSkills() != null) {
            profile.getSkills().forEach(studentSkill -> skills.add(skillMapper.toDto(studentSkill.getSkill())));
        }
        return new StudentProfileDto(
            profile.getId(),
            profile.getEnrollmentNumber(),
            profile.getUniversity(),
            profile.getDepartment(),
            profile.getYearOfStudy(),
            profile.getBio(),
            skills,
            researchDomainMapper.toDtoSet(profile.getResearchDomains())
        );
    }
}