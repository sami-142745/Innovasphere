package com.innovasphere.controller;

import com.innovasphere.dto.ResearchDomainCreateRequest;
import com.innovasphere.dto.ResearchDomainDto;
import com.innovasphere.service.ResearchDomainService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/research-domains")
public class AdminResearchDomainController {

    private final ResearchDomainService researchDomainService;

    public AdminResearchDomainController(ResearchDomainService researchDomainService) {
        this.researchDomainService = researchDomainService;
    }

    @PostMapping
    public ResponseEntity<ResearchDomainDto> create(@Valid @RequestBody ResearchDomainCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(researchDomainService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        researchDomainService.delete(id);
        return ResponseEntity.noContent().build();
    }
}