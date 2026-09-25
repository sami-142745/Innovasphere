package com.innovasphere.service;

import com.innovasphere.dto.ProjectCreateRequest;
import com.innovasphere.dto.ProjectDto;
import com.innovasphere.dto.ProjectUpdateRequest;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.User;
import com.innovasphere.enums.ProjectStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.exception.ApiException;
import com.innovasphere.mapper.ProjectMapper;
import com.innovasphere.repository.JoinRequestRepository;
import com.innovasphere.repository.MentorshipRepository;
import com.innovasphere.repository.MentorshipRequestRepository;
import com.innovasphere.repository.ProjectMemberRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.TeamRepository;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock ResearchDomainRepository researchDomainRepository;
    @Mock SkillRepository skillRepository;
    @Mock ProjectMemberRepository projectMemberRepository;
    @Mock JoinRequestRepository joinRequestRepository;
    @Mock TeamRepository teamRepository;
    @Mock MentorshipRepository mentorshipRepository;
    @Mock MentorshipRequestRepository mentorshipRequestRepository;
    @Mock ProjectMapper projectMapper;
    @Mock NotificationService notificationService;
    @InjectMocks ProjectServiceImpl projectService;

    private User user(UUID id, Role role) {
        User u = User.builder().username("u").email("u@test.com").fullName("Test User").role(role).active(true).build();
        u.setId(id);
        return u;
    }

    private Project project(UUID id, User owner) {
        Project p = Project.builder().owner(owner).title("Project X").description("A description").build();
        p.setId(id);
        return p;
    }

    private ProjectCreateRequest createRequest(ProjectStatus status, Set<UUID> domains, Set<UUID> skills) {
        return new ProjectCreateRequest("  My Project  ", "A long enough description for the project", "short",
            status, null, domains, skills);
    }

    private ProjectUpdateRequest updateRequest() {
        return new ProjectUpdateRequest("New Title", null, null, null, null, null, null);
    }

    @Test
    void createDefaultsStatusToIdeaAndTrimsTitle() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        projectService.create(owner, createRequest(null, null, null));
        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        assertEquals("My Project", captor.getValue().getTitle());
        assertEquals(ProjectStatus.IDEA, captor.getValue().getStatus());
        assertEquals(owner, captor.getValue().getOwner());
    }

    @Test
    void createResolvesDomainsAndSkills() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        UUID domainId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();
        ResearchDomain domain = ResearchDomain.builder().name("AI").build();
        Skill skill = Skill.builder().name("Python").build();
        when(researchDomainRepository.findById(domainId)).thenReturn(Optional.of(domain));
        when(skillRepository.findById(skillId)).thenReturn(Optional.of(skill));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        projectService.create(owner, createRequest(ProjectStatus.IN_PROGRESS, Set.of(domainId), Set.of(skillId)));

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        assertEquals(1, captor.getValue().getResearchDomains().size());
        assertEquals(1, captor.getValue().getSkills().size());
        assertEquals(ProjectStatus.IN_PROGRESS, captor.getValue().getStatus());
    }

    @Test
    void createWithUnknownDomainThrows() {
        UUID bad = UUID.randomUUID();
        when(researchDomainRepository.findById(bad)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> projectService.create(user(UUID.randomUUID(), Role.STUDENT), createRequest(null, Set.of(bad), null)));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("RESEARCH_DOMAIN_NOT_FOUND", ex.getCode());
        verify(projectRepository, never()).save(any());
    }

    @Test
    void createWithUnknownSkillThrows() {
        UUID domainId = UUID.randomUUID();
        UUID bad = UUID.randomUUID();
        ResearchDomain domain = ResearchDomain.builder().name("AI").build();
        when(researchDomainRepository.findById(domainId)).thenReturn(Optional.of(domain));
        when(skillRepository.findById(bad)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
            () -> projectService.create(user(UUID.randomUUID(), Role.STUDENT), createRequest(null, Set.of(domainId), Set.of(bad))));
        assertEquals("SKILL_NOT_FOUND", ex.getCode());
    }

    @Test
    void updateByOwnerTrimsAndNotifies() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        projectService.update(owner, project.getId(), updateRequest());

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        assertEquals("New Title", captor.getValue().getTitle());
        verify(notificationService).projectUpdated(project, owner);
    }

    @Test
    void updateByAdminOnForeignProjectAllowed() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User admin = user(UUID.randomUUID(), Role.ADMIN);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        projectService.update(admin, project.getId(), updateRequest());
        verify(notificationService).projectUpdated(project, admin);
    }

    @Test
    void updateByNonOwnerForbidden() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User other = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        ApiException ex = assertThrows(ApiException.class,
            () -> projectService.update(other, project.getId(), updateRequest()));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void updateUnknownProjectNotFound() {
        UUID id = UUID.randomUUID();
        when(projectRepository.findById(id)).thenReturn(Optional.empty());
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        ApiException ex = assertThrows(ApiException.class, () -> projectService.update(owner, id, updateRequest()));
        assertEquals("PROJECT_NOT_FOUND", ex.getCode());
    }

    @Test
    void updateClearsAndReplacesAssociations() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        UUID d1 = UUID.randomUUID();
        UUID s1 = UUID.randomUUID();
        when(researchDomainRepository.findById(d1)).thenReturn(Optional.of(ResearchDomain.builder().name("AI").build()));
        when(skillRepository.findById(s1)).thenReturn(Optional.of(Skill.builder().name("Java").build()));
        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, null, null, Set.of(d1), Set.of(s1));

        projectService.update(owner, project.getId(), request);

        assertEquals(1, project.getResearchDomains().size());
        assertEquals(1, project.getSkills().size());
    }

    @Test
    void deleteRemovesAllDependencies() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        projectService.delete(owner, project.getId());

        verify(projectMemberRepository).deleteByProjectId(project.getId());
        verify(joinRequestRepository).deleteByProjectId(project.getId());
        verify(teamRepository).deleteByProjectId(project.getId());
        verify(mentorshipRepository).deleteByProjectId(project.getId());
        verify(mentorshipRequestRepository).deleteByProjectId(project.getId());
        verify(projectRepository).delete(project);
    }

    @Test
    void deleteByNonOwnerForbidden() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        User other = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        assertThrows(ApiException.class, () -> projectService.delete(other, project.getId()));
        verify(projectRepository, never()).delete(any());
    }

    @Test
    void getReturnsMappedProjectOrNotFound() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        projectService.get(project.getId());
        verify(projectMapper).toDto(project);

        UUID missing = UUID.randomUUID();
        when(projectRepository.findById(missing)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> projectService.get(missing));
        assertEquals("PROJECT_NOT_FOUND", ex.getCode());
    }

    @Test
    void listWithoutStatusUsesFindAll() {
        when(projectRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(java.util.List.of()));
        projectService.list(null, PageRequest.of(0, 20));
        verify(projectRepository).findAll(any(Pageable.class));
    }

    @Test
    void listWithStatusFilters() {
        when(projectRepository.findByStatus(eq(ProjectStatus.LOOKING_FOR_TEAM), any(Pageable.class)))
            .thenReturn(new PageImpl<>(java.util.List.of()));
        projectService.list(ProjectStatus.LOOKING_FOR_TEAM, PageRequest.of(0, 20));
        verify(projectRepository).findByStatus(ProjectStatus.LOOKING_FOR_TEAM, PageRequest.of(0, 20));
    }

    @Test
    void searchNormalizesBlankValuesToNull() {
        when(projectRepository.search(eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
            .thenReturn(new PageImpl<>(java.util.List.of()));
        projectService.search("   ", null, "  ", " ", PageRequest.of(0, 20));
        verify(projectRepository).search(null, null, null, null, PageRequest.of(0, 20));
    }

    @Test
    void searchTrimsProvidedValues() {
        when(projectRepository.search(eq("ai"), eq(ProjectStatus.IDEA), eq("ml"), eq("python"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(java.util.List.of()));
        projectService.search(" ai ", ProjectStatus.IDEA, " ml ", " python ", PageRequest.of(0, 20));
        verify(projectRepository).search("ai", ProjectStatus.IDEA, "ml", "python", PageRequest.of(0, 20));
    }

    @Test
    void myCallsFindByOwnerId() {
        when(projectRepository.findByOwnerId(any(UUID.class), any(Pageable.class)))
            .thenReturn(new PageImpl<>(java.util.List.of()));
        UUID ownerId = UUID.randomUUID();
        projectService.my(ownerId, PageRequest.of(0, 20));
        verify(projectRepository).findByOwnerId(ownerId, PageRequest.of(0, 20));
    }

    @Test
    void updateRequestWithOnlyTitleKeepsOtherFields() {
        User owner = user(UUID.randomUUID(), Role.STUDENT);
        Project project = project(UUID.randomUUID(), owner);
        project.setStatus(ProjectStatus.COMPLETED);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        ProjectUpdateRequest request = new ProjectUpdateRequest("  Updated  ", null, "  ", null, null, null, null);
        projectService.update(owner, project.getId(), request);
        assertEquals(ProjectStatus.COMPLETED, project.getStatus());
        assertEquals("Updated", project.getTitle());
        assertEquals("", project.getShortDescription());
    }
}