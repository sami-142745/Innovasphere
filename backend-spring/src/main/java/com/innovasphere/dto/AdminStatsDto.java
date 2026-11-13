package com.innovasphere.dto;

public record AdminStatsDto(
    long totalUsers,
    long studentUsers,
    long facultyUsers,
    long adminUsers,
    long activeUsers,
    long totalProjects
) {
}
