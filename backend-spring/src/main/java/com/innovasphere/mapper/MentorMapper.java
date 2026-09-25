package com.innovasphere.mapper;

import com.innovasphere.dto.MentorDto;
import com.innovasphere.dto.SkillDto;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.User;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class MentorMapper {

    private final ResearchDomainMapper researchDomainMapper;

    public MentorMapper(ResearchDomainMapper researchDomainMapper) {
        this.researchDomainMapper = researchDomainMapper;
    }

    public MentorDto toDto(FacultyProfile faculty, long activeMentorships) {
        if (faculty == null) {
            return null;
        }
        User user = faculty.getUser();
        Set<SkillDto> skills = java.util.Set.of();
        return new MentorDto(
            user.getId(),
            user.getFullName(),
            faculty.getDesignation(),
            faculty.getDepartment(),
            faculty.getExpertise(),
            faculty.getBio(),
            researchDomainMapper.toDtoSet(faculty.getResearchDomains()),
            skills,
            activeMentorships,
            user.getCreatedAt()
        );
    }
}