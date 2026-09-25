package com.innovasphere.mapper;

import com.innovasphere.dto.ResearchDomainDto;
import com.innovasphere.entity.ResearchDomain;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ResearchDomainMapper {

    public ResearchDomainDto toDto(ResearchDomain domain) {
        if (domain == null) {
            return null;
        }
        return new ResearchDomainDto(
            domain.getId(),
            domain.getName(),
            domain.getDescription()
        );
    }

    public Set<ResearchDomainDto> toDtoSet(Collection<ResearchDomain> domains) {
        Set<ResearchDomainDto> result = new LinkedHashSet<>();
        if (domains != null) {
            for (ResearchDomain domain : domains) {
                result.add(toDto(domain));
            }
        }
        return result;
    }
}