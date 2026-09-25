package com.innovasphere.mapper;

import com.innovasphere.dto.MentorshipRequestDto;
import com.innovasphere.entity.MentorshipRequest;
import org.springframework.stereotype.Component;

@Component
public class MentorshipRequestMapper {

    public MentorshipRequestDto toDto(MentorshipRequest request) {
        if (request == null) {
            return null;
        }
        return new MentorshipRequestDto(
            request.getId(),
            request.getStudent().getId(),
            request.getStudent().getFullName(),
            request.getFaculty().getId(),
            request.getFaculty().getFullName(),
            request.getProject() != null ? request.getProject().getId() : null,
            request.getProject() != null ? request.getProject().getTitle() : null,
            request.getStatus(),
            request.getMessage(),
            request.getCreatedAt()
        );
    }
}