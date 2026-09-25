package com.innovasphere.controller;

import com.innovasphere.dto.ProjectCreateRequest;
import com.innovasphere.dto.ProjectDto;
import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.dto.ProjectUpdateRequest;
import com.innovasphere.entity.User;
import com.innovasphere.enums.ProjectStatus;
import com.innovasphere.security.CurrentUserProvider;
import com.innovasphere.service.ProjectService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final CurrentUserProvider currentUserProvider;

    public ProjectController(ProjectService projectService, CurrentUserProvider currentUserProvider) {
        this.projectService = projectService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping
    public ResponseEntity<ProjectDto> create(@Valid @RequestBody ProjectCreateRequest request,
                                             Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(user, request));
    }

    @GetMapping
    public Page<ProjectSummaryDto> list(
        @RequestParam(required = false) ProjectStatus status,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return projectService.list(status, pageable);
    }

    @GetMapping("/my")
    public Page<ProjectSummaryDto> my(Authentication authentication,
                                      @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = currentUserProvider.require(authentication);
        return projectService.my(user.getId(), pageable);
    }

    @GetMapping("/search")
    public Page<ProjectSummaryDto> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) ProjectStatus status,
        @RequestParam(required = false) String domain,
        @RequestParam(required = false) String skill,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return projectService.search(keyword, status, domain, skill, pageable);
    }

    @GetMapping("/{id}")
    public ProjectDto get(@PathVariable UUID id) {
        return projectService.get(id);
    }

    @PutMapping("/{id}")
    public ProjectDto update(@PathVariable UUID id, @Valid @RequestBody ProjectUpdateRequest request,
                             Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        return projectService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        User user = currentUserProvider.require(authentication);
        projectService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}