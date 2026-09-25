package com.innovasphere.dto;

import java.util.UUID;

public record RecommendationScoreDto(
    UUID id,
    int score
) {
}