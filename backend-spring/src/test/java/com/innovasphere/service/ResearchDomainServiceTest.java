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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResearchDomainServiceTest {

    @Mock ResearchDomainRepository researchDomainRepository;
    @Mock ProjectRepository projectRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock FacultyProfileRepository facultyProfileRepository;
    @Mock ResearchDomainMapper researchDomainMapper;
    @InjectMocks ResearchDomainService researchDomainService;

    private ResearchDomain domain(String name) {
        ResearchDomain d = ResearchDomain.builder().name(name).build();
        d.setId(UUID.randomUUID());
        return d;
    }

    @Test
    void listReturnsAllSorted() {
        when(researchDomainRepository.findAll(any(Sort.class))).thenReturn(List.of(domain("AI")));
        when(researchDomainMapper.toDto(any(ResearchDomain.class)))
            .thenReturn(org.mockito.Mockito.mock(ResearchDomainDto.class));
        assertEquals(1, researchDomainService.list().size());
    }

    @Test
    void searchBlankDelegatesToList() {
        when(researchDomainRepository.findAll(any(Sort.class))).thenReturn(List.of());
        assertTrue(researchDomainService.search(" ").isEmpty());
        assertTrue(researchDomainService.search(null).isEmpty());
    }

    @Test
    void searchTrimsKeyword() {
        ResearchDomain ai = domain("Artificial Intelligence");
        when(researchDomainRepository.findByNameContainingIgnoreCase("ai", Sort.by(Sort.Direction.ASC, "name")))
            .thenReturn(List.of(ai));
        when(researchDomainMapper.toDto(ai)).thenReturn(org.mockito.Mockito.mock(ResearchDomainDto.class));
        assertEquals(1, researchDomainService.search(" ai ").size());
    }

    @Test
    void createTrimsAndChecksDuplicates() {
        when(researchDomainRepository.existsByNameIgnoreCase("AI")).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> researchDomainService.create(new ResearchDomainCreateRequest(" AI ", null)));
        assertEquals("RESEARCH_DOMAIN_ALREADY_EXISTS", ex.getCode());
    }

    @Test
    void createSuccessSaves() {
        when(researchDomainRepository.existsByNameIgnoreCase("AI")).thenReturn(false);
        when(researchDomainMapper.toDto(any(ResearchDomain.class))).thenReturn(org.mockito.Mockito.mock(ResearchDomainDto.class));
        when(researchDomainRepository.save(any(ResearchDomain.class))).thenReturn(domain("AI"));
        researchDomainService.create(new ResearchDomainCreateRequest("AI", "Desc"));
        ArgumentCaptor<ResearchDomain> captor = ArgumentCaptor.forClass(ResearchDomain.class);
        verify(researchDomainRepository).save(captor.capture());
        assertEquals("AI", captor.getValue().getName());
    }

    @Test
    void deleteNotFoundIs404() {
        when(researchDomainRepository.findById(any(UUID.class))).thenReturn(java.util.Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> researchDomainService.delete(UUID.randomUUID()));
        assertEquals("RESEARCH_DOMAIN_NOT_FOUND", ex.getCode());
    }

    @Test
    void deleteInUseIsConflict() {
        ResearchDomain domain = domain("AI");
        when(researchDomainRepository.findById(domain.getId())).thenReturn(java.util.Optional.of(domain));
        when(projectRepository.existsByResearchDomains_Id(domain.getId())).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class, () -> researchDomainService.delete(domain.getId()));
        assertEquals("RESEARCH_DOMAIN_IN_USE", ex.getCode());
    }

    @Test
    void deleteSuccessWhenUnreferenced() {
        ResearchDomain domain = domain("AI");
        when(researchDomainRepository.findById(domain.getId())).thenReturn(java.util.Optional.of(domain));
        when(projectRepository.existsByResearchDomains_Id(domain.getId())).thenReturn(false);
        when(studentProfileRepository.existsByResearchDomains_Id(domain.getId())).thenReturn(false);
        when(facultyProfileRepository.existsByResearchDomains_Id(domain.getId())).thenReturn(false);
        researchDomainService.delete(domain.getId());
        verify(researchDomainRepository).delete(domain);
    }
}