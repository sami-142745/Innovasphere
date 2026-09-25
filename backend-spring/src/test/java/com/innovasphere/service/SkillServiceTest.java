package com.innovasphere.service;

import com.innovasphere.dto.SkillCreateRequest;
import com.innovasphere.dto.SkillDto;
import com.innovasphere.entity.Skill;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.SkillMapper;
import com.innovasphere.repository.ProjectSkillRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.StudentSkillRepository;
import java.util.List;
import java.util.Optional;
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
class SkillServiceTest {

    @Mock SkillRepository skillRepository;
    @Mock ProjectSkillRepository projectSkillRepository;
    @Mock StudentSkillRepository studentSkillRepository;
    @Mock SkillMapper skillMapper;
    @InjectMocks SkillService skillService;

    private Skill skill(String name) {
        Skill s = Skill.builder().name(name).build();
        s.setId(UUID.randomUUID());
        return s;
    }

    @Test
    void listReturnsAllSortedByName() {
        Skill s = skill("Java");
        when(skillRepository.findAll(any(Sort.class))).thenReturn(List.of(s));
        when(skillMapper.toDto(s)).thenReturn(org.mockito.Mockito.mock(SkillDto.class));
        assertEquals(1, skillService.list().size());
        verify(skillRepository).findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Test
    void searchBlankKeywordDelegatesToList() {
        when(skillRepository.findAll(any(Sort.class))).thenReturn(List.of());
        assertTrue(skillService.search("   ").isEmpty());
        assertTrue(skillService.search(null).isEmpty());
    }

    @Test
    void searchTrimsAndFilters() {
        Skill s = skill("Java");
        when(skillRepository.findByNameContainingIgnoreCase("java", Sort.by(Sort.Direction.ASC, "name")))
            .thenReturn(List.of(s));
        when(skillMapper.toDto(s)).thenReturn(org.mockito.Mockito.mock(SkillDto.class));
        assertEquals(1, skillService.search(" java ").size());
        verify(skillRepository).findByNameContainingIgnoreCase("java", Sort.by(Sort.Direction.ASC, "name"));
    }

    @Test
    void createTrimsNameAndSaves() {
        when(skillMapper.toDto(any(Skill.class))).thenReturn(org.mockito.Mockito.mock(SkillDto.class));
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> inv.getArgument(0));
        skillService.create(new SkillCreateRequest("  Java  ", "  Language  "));
        ArgumentCaptor<Skill> captor = ArgumentCaptor.forClass(Skill.class);
        verify(skillRepository).save(captor.capture());
        assertEquals("Java", captor.getValue().getName());
        assertEquals("Language", captor.getValue().getDescription());
    }

    @Test
    void createDuplicateNameIsConflict() {
        when(skillRepository.existsByNameIgnoreCase("Java")).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class,
            () -> skillService.create(new SkillCreateRequest("Java", null)));
        assertEquals("SKILL_ALREADY_EXISTS", ex.getCode());
    }

    @Test
    void deleteNotFoundIs404() {
        when(skillRepository.findById(any(UUID.class))).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> skillService.delete(UUID.randomUUID()));
        assertEquals("SKILL_NOT_FOUND", ex.getCode());
    }

    @Test
    void deleteSkillInUseIsConflict() {
        Skill s = skill("Java");
        when(skillRepository.findById(s.getId())).thenReturn(Optional.of(s));
        when(projectSkillRepository.existsBySkillId(s.getId())).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class, () -> skillService.delete(s.getId()));
        assertEquals("SKILL_IN_USE", ex.getCode());
    }

    @Test
    void deleteSuccess() {
        Skill s = skill("Java");
        when(skillRepository.findById(s.getId())).thenReturn(Optional.of(s));
        when(projectSkillRepository.existsBySkillId(s.getId())).thenReturn(false);
        when(studentSkillRepository.existsBySkillId(s.getId())).thenReturn(false);
        skillService.delete(s.getId());
        verify(skillRepository).delete(s);
    }
}