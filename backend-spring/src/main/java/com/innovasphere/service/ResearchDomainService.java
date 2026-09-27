package com.innovasphere.service;

import com.innovasphere.config.CacheConfig;
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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    @Cacheable(value = CacheConfig.DOMAINS, key = "'list'")
    public List<ResearchDomainDto> list() {
        return load(null);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.DOMAINS, key = "'search:' + (#keyword == null ? '' : #keyword.trim().toLowerCase())")
    public List<ResearchDomainDto> search(String keyword) {
        return load(keyword);
    }

    /**
     * Both cached entry points delegate here so the query itself lives in a single
     * place, and so a self-invocation can never bypass the proxy-managed cache.
     */
    private List<ResearchDomainDto> load(String keyword) {
        String normalized = keyword != null ? keyword.trim() : null;
        return (normalized == null || normalized.isEmpty()
                ? researchDomainRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                : researchDomainRepository.findByNameContainingIgnoreCase(normalized, Sort.by(Sort.Direction.ASC, "name")))
            .stream()
            .map(researchDomainMapper::toDto)
            .toList();
    }

    @Transactional
    @CacheEvict(value = CacheConfig.DOMAINS, allEntries = true)
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
    @CacheEvict(value = CacheConfig.DOMAINS, allEntries = true)
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