package com.innovasphere.mapper;

import com.innovasphere.dto.UserDto;
import com.innovasphere.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }
        return new UserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt()
        );
    }
}