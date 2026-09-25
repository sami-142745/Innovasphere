package com.innovasphere.mapper;

import com.innovasphere.dto.SkillDto;
import com.innovasphere.entity.Skill;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper {

    public SkillDto toDto(Skill skill) {
        if (skill == null) {
            return null;
        }
        return new SkillDto(
            skill.getId(),
            skill.getName(),
            skill.getDescription()
        );
    }

    public Set<SkillDto> toDtoSet(Collection<Skill> skills) {
        Set<SkillDto> result = new LinkedHashSet<>();
        if (skills != null) {
            for (Skill skill : skills) {
                result.add(toDto(skill));
            }
        }
        return result;
    }
}