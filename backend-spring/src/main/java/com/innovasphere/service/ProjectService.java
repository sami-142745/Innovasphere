package com.innovasphere.service;

import com.innovasphere.dto.ProjectCreateRequest;
import com.innovasphere.dto.ProjectDto;
import com.innovasphere.dto.ProjectSummaryDto;
import com.innovasphere.dto.ProjectUpdateRequest;
import com.innovasphere.entity.User;
import com.innovasphere.enums.ProjectStatus;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectService {

    ProjectDto create(User user, ProjectCreateRequest request);

    ProjectDto update(User user, UUID projectId, ProjectUpdateRequest request);

    void delete(User user, UUID projectId);

    ProjectDto get(UUID projectId);

    Page<ProjectSummaryDto> list(ProjectStatus status, Pageable pageable);

    Page<ProjectSummaryDto> search(String keyword, ProjectStatus status, String domain, String skill, Pageable pageable);

    Page<ProjectSummaryDto> my(UUID ownerId, Pageable pageable);
}