package com.innovasphere.repository;

import com.innovasphere.entity.ResearchDomain;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResearchDomainRepository extends JpaRepository<ResearchDomain, UUID> {

    Optional<ResearchDomain> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    Page<ResearchDomain> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    List<ResearchDomain> findByNameContainingIgnoreCase(String keyword, Sort sort);
}