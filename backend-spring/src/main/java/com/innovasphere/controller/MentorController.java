package com.innovasphere.controller;

import com.innovasphere.dto.MentorDto;
import com.innovasphere.service.MentorshipService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors")
public class MentorController {

    private final MentorshipService mentorshipService;

    public MentorController(MentorshipService mentorshipService) {
        this.mentorshipService = mentorshipService;
    }

    @GetMapping
    public Page<MentorDto> list(
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return mentorshipService.list(pageable);
    }

    @GetMapping("/search")
    public Page<MentorDto> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String domain,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return mentorshipService.search(keyword, domain, pageable);
    }

    @GetMapping("/{id}")
    public MentorDto get(@PathVariable UUID id) {
        return mentorshipService.get(id);
    }
}