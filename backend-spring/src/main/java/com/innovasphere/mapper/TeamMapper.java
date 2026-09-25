package com.innovasphere.mapper;

import com.innovasphere.dto.TeamDto;
import com.innovasphere.entity.Team;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class TeamMapper {

    private final UserMapper userMapper;

    public TeamMapper(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public TeamDto toDto(Team team) {
        if (team == null) {
            return null;
        }
        Set<com.innovasphere.dto.UserDto> members = new LinkedHashSet<>();
        for (com.innovasphere.entity.User member : team.getMembers()) {
            members.add(userMapper.toDto(member));
        }
        return new TeamDto(
            team.getId(),
            team.getProject().getId(),
            team.getName(),
            team.getDescription(),
            members,
            team.getCreatedAt()
        );
    }
}