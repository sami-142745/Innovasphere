package com.innovasphere.service;

import com.innovasphere.enums.ProjectStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Warms the browse/search caches for the pages adjacent to the one a user is
 * looking at, so paging forward feels instant.
 *
 * <p>Both service methods are {@code @Cacheable}, therefore the prefetch only has
 * to invoke them - the cache write happens inside the proxied call. Nothing here
 * builds cache keys by hand, which previously drifted away from the keys declared
 * on {@link ProjectServiceImpl} and silently never hit the cache.
 */
@Service
public class PrefetchService {

    private static final Logger log = LoggerFactory.getLogger(PrefetchService.class);

    private final ProjectService projectService;

    public PrefetchService(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Schedules the previous and next page for warming. Returns immediately.
     */
    @Async
    public void prefetchAdjacentPages(int currentPage, int totalPages, Pageable pageable, boolean isSearch,
                                      ProjectStatus status, String keyword, String domain, String skill) {
        if (totalPages <= 0) {
            return;
        }

        int pageSize = pageable.getPageSize();

        if (currentPage + 1 < totalPages) {
            warm(pageRequest(currentPage + 1, pageSize, pageable), isSearch, status, keyword, domain, skill);
        }
        if (currentPage - 1 >= 0) {
            warm(pageRequest(currentPage - 1, pageSize, pageable), isSearch, status, keyword, domain, skill);
        }
    }

    private void warm(Pageable target, boolean isSearch, ProjectStatus status,
                      String keyword, String domain, String skill) {
        try {
            if (isSearch) {
                projectService.search(keyword, status, domain, skill, target);
            } else {
                projectService.listSummary(status, target);
            }
        } catch (RuntimeException ex) {
            // Prefetching is an optimisation: a failure must never surface to a user.
            log.debug("Prefetch failed for page {}: {}", target.getPageNumber(), ex.toString());
        }
    }

    private static PageRequest pageRequest(int page, int pageSize, Pageable source) {
        // Never reuse Pageable#withSort here: it silently returns a PlainPageable
        // that ignores both unpaged and paged sort specifications.
        return PageRequest.of(page, pageSize, source.getSort());
    }
}
