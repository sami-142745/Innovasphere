package com.innovasphere.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record StudentProfileUpdateRequest(
    @Size(max = 100, message = "Enrollment number must be at most 100 characters")
    String enrollmentNumber,

    @Size(max = 255, message = "University must be at most 255 characters")
    String university,

    @Size(max = 255, message = "Department must be at most 255 characters")
    String department,

    @Min(value = 1, message = "Year of study must be between 1 and 8")
    @Max(value = 8, message = "Year of study must be between 1 and 8")
    Integer yearOfStudy,

    @Size(max = 2000, message = "Bio must be at most 2000 characters")
    String bio,

    Set<UUID> skillIds,

    Set<UUID> researchDomainIds
) {
}
