package com.innovasphere.service;

import com.innovasphere.dto.ResearchDomainCreateRequest;
import com.innovasphere.dto.ResearchDomainDto;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.ResearchDomainMapper;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.StudentProfileRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResearchDomainService {

    private final ResearchDomainRepository researchDomainRepository;
    private final ProjectRepository projectRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final ResearchDomainMapper researchDomainMapper;

    public ResearchDomainService(ResearchDomainRepository researchDomainRepository,
                                 ProjectRepository projectRepository,
                                 StudentProfileRepository studentProfileRepository,
                                 FacultyProfileRepository facultyProfileRepository,
                                 ResearchDomainMapper researchDomainMapper) {
        this.researchDomainRepository = researchDomainRepository;
        this.projectRepository = projectRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.facultyProfileRepository = facultyProfileRepository;
        this.researchDomainMapper = researchDomainMapper;
    }

    @Transactional(readOnly = true)
    public List<ResearchDomainDto> list() {
        return researchDomainRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
            .map(researchDomainMapper::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ResearchDomainDto> search(String keyword) {
        String normalized = keyword != null ? keyword.trim() : null;
        if (normalized == null || normalized.isEmpty()) {
            return list();
        }
        return researchDomainRepository
            .findByNameContainingIgnoreCase(normalized, Sort.by(Sort.Direction.ASC, "name")).stream()
            .map(researchDomainMapper::toDto)
            .toList();
    }

    @Transactional
    public ResearchDomainDto create(ResearchDomainCreateRequest request) {
        String name = request.name().trim();
        if (researchDomainRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "RESEARCH_DOMAIN_ALREADY_EXISTS",
                "A research domain named '" + name + "' already exists");
        }
        ResearchDomain domain = ResearchDomain.builder()
            .name(name)
            .description(request.description() != null ? request.description().trim() : null)
            .build();
        return researchDomainMapper.toDto(researchDomainRepository.save(domain));
    }

    @Transactional
    public void delete(UUID domainId) {
        ResearchDomain domain = researchDomainRepository.findById(domainId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESEARCH_DOMAIN_NOT_FOUND",
                "Research domain not found"));
        boolean inUse = projectRepository.existsByResearchDomains_Id(domainId)
            || studentProfileRepository.existsByResearchDomains_Id(domainId)
            || facultyProfileRepository.existsByResearchDomains_Id(domainId);
        if (inUse) {
            throw new ApiException(HttpStatus.CONFLICT, "RESEARCH_DOMAIN_IN_USE",
                "Research domain '" + domain.getName() + "' is referenced by projects or profiles and cannot be deleted");
        }
        researchDomainRepository.delete(domain);
    }
}