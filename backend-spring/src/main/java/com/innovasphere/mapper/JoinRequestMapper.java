package com.innovasphere.mapper;

import com.innovasphere.dto.JoinRequestDto;
import com.innovasphere.entity.JoinRequest;
import org.springframework.stereotype.Component;

@Component
public class JoinRequestMapper {

    public JoinRequestDto toDto(JoinRequest request) {
        if (request == null) {
            return null;
        }
        return new JoinRequestDto(
            request.getId(),
            request.getProject().getId(),
            request.getProject().getTitle(),
            request.getStudent().getId(),
            request.getStudent().getUser().getFullName(),
            request.getStatus(),
            request.getMessage(),
            request.getCreatedAt()
        );
    }
}