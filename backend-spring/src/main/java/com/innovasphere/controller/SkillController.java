package com.innovasphere.controller;

import com.innovasphere.dto.SkillDto;
import com.innovasphere.service.SkillService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    public List<SkillDto> list() {
        return skillService.list();
    }

    @GetMapping("/search")
    public List<SkillDto> search(@RequestParam(required = false) String keyword) {
        return skillService.search(keyword);
    }
}