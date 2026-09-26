package com.innovasphere.service;

import com.innovasphere.enums.ProjectStatus;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class PrefetchService {

    private final ProjectService projectService;
    private final CacheManager cacheManager;

    public PrefetchService(ProjectService projectService, CacheManager cacheManager) {
        this.projectService = projectService;
        this.cacheManager = cacheManager;
    }

    @Async
    public void prefetchAdjacentPages(int currentPage, int totalPages, Pageable pageable, ProjectStatus status,
                                      String keyword, String domain, String skill, String sort) {
        if (currentPage + 1 < totalPages) {
            Pageable nextPageable = PageRequest.of(
                currentPage + 1,
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
            );
            prefetchPage(nextPageable, status, keyword, domain, skill, sort, currentPage + 1);
        }

        if (currentPage - 1 >= 0) {
            Pageable prevPageable = PageRequest.of(
                Math.max(0, currentPage - 1),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
            );
            prefetchPage(prevPageable, status, keyword, domain, skill, sort, currentPage - 1);
        }
    }

    @Async
    public void prefetchPage(Pageable pageable, ProjectStatus status, String keyword, String domain, String skill, String sort, int pageNumber) {
        try {
            String cacheName = (keyword != null || domain != null || skill != null) ? "projectSearch" : "projects";
            String key = buildKey(keyword, domain, null, null, pageable, sort);

            if (cacheManager.getCache(cacheName) != null && cacheManager.getCache(cacheName).get(key) != null) {
                return; // Already cached
            }

            if (keyword != null || domain != null) {
                projectService.search(keyword, null, domain, null, pageable);
            } else {
                projectService.listSummary(null, pageable);
            }
        } catch (Exception e) {
            // Ignore prefetch errors
        }
    }

    private String buildKey(String keyword, String domain, String skill, ProjectStatus status, Pageable pageable, String sort) {
        StringBuilder key = new StringBuilder();
        key.append(keyword != null ? keyword : "").append("-");
        key.append(domain != null ? domain : "").append("-");
        key.append(skill != null ? skill : "").append("-");
        key.append(status != null ? status.name() : "ALL").append("-");
        key.append(pageable.getPageNumber()).append("-");
        key.append(pageable.getPageSize()).append("-");
        key.append(sort != null ? sort : "createdAt,desc");
        return key.toString();
    }
}