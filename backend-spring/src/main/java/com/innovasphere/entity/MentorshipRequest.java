package com.innovasphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.innovasphere.enums.MentorshipStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "mentorship_requests",
    indexes = {
        @Index(name = "idx_mentorship_requests_student_id", columnList = "student_id"),
        @Index(name = "idx_mentorship_requests_faculty_id", columnList = "faculty_id"),
        @Index(name = "idx_mentorship_requests_status", columnList = "status")
    }
)
public class MentorshipRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "faculty_id", nullable = false)
    @JsonIgnore
    private User faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnore
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MentorshipStatus status = MentorshipStatus.PENDING;

    @Size(max = 1000)
    @Column(length = 1000)
    private String message;
}