package com.innovasphere.controller;

import com.innovasphere.dto.ResearchDomainDto;
import com.innovasphere.service.ResearchDomainService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/research-domains")
public class ResearchDomainController {

    private final ResearchDomainService researchDomainService;

    public ResearchDomainController(ResearchDomainService researchDomainService) {
        this.researchDomainService = researchDomainService;
    }

    @GetMapping
    public List<ResearchDomainDto> list() {
        return researchDomainService.list();
    }

    @GetMapping("/search")
    public List<ResearchDomainDto> search(@RequestParam(required = false) String keyword) {
        return researchDomainService.search(keyword);
    }
}