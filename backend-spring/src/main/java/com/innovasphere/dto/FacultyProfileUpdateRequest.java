package com.innovasphere.dto;

import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record FacultyProfileUpdateRequest(
    @Size(max = 255, message = "Department must be at most 255 characters")
    String department,

    @Size(max = 255, message = "Designation must be at most 255 characters")
    String designation,

    @Size(max = 2000, message = "Bio must be at most 2000 characters")
    String bio,

    @Size(max = 2000, message = "Expertise must be at most 2000 characters")
    String expertise,

    Set<UUID> researchDomainIds
) {
}
