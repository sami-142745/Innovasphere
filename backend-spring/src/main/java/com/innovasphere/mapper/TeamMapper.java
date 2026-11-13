package com.innovasphere.mapper;

import com.innovasphere.dto.TeamDto;
import com.innovasphere.dto.UserSummaryDto;
import com.innovasphere.entity.Team;
import com.innovasphere.entity.User;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class TeamMapper {

    public TeamDto toDto(Team team) {
        if (team == null) {
            return null;
        }
        Set<UserSummaryDto> members = new LinkedHashSet<>();
        for (User member : team.getMembers()) {
            members.add(toSummary(member));
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

    private UserSummaryDto toSummary(User user) {
        return new UserSummaryDto(
            user.getId(),
            user.getFullName(),
            user.getUsername(),
            user.getRole(),
            null,
            null,
            user.getCreatedAt()
        );
    }
}