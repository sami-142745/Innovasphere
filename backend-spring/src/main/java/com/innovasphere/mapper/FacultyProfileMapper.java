package com.innovasphere.mapper;

import com.innovasphere.dto.FacultyProfileDto;
import com.innovasphere.entity.FacultyProfile;
import org.springframework.stereotype.Component;

@Component
public class FacultyProfileMapper {

    private final ResearchDomainMapper researchDomainMapper;

    public FacultyProfileMapper(ResearchDomainMapper researchDomainMapper) {
        this.researchDomainMapper = researchDomainMapper;
    }

    public FacultyProfileDto toDto(FacultyProfile profile) {
        if (profile == null) {
            return null;
        }
        return new FacultyProfileDto(
            profile.getId(),
            profile.getDepartment(),
            profile.getDesignation(),
            profile.getBio(),
            profile.getExpertise(),
            researchDomainMapper.toDtoSet(profile.getResearchDomains())
        );
    }
}