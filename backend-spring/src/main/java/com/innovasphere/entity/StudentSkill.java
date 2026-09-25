package com.innovasphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
    name = "student_skills",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_skills", columnNames = {"student_profile_id", "skill_id"})
    },
    indexes = {
        @Index(name = "idx_student_skills_student_profile_id", columnList = "student_profile_id"),
        @Index(name = "idx_student_skills_skill_id", columnList = "skill_id")
    }
)
public class StudentSkill extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_profile_id", nullable = false)
    @JsonIgnore
    private StudentProfile studentProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id", nullable = false)
    @JsonIgnore
    private Skill skill;

    @NotNull
    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer level;

    @Size(max = 1000)
    @Column(length = 1000)
    private String experience;
}