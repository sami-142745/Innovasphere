package com.innovasphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;
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
    name = "student_profiles",
    indexes = {
        @Index(name = "idx_student_profiles_user_id", columnList = "user_id")
    }
)
public class StudentProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Size(max = 100)
    @Column(name = "enrollment_number", length = 100)
    private String enrollmentNumber;

    @Size(max = 255)
    @Column(length = 255)
    private String university;

    @Size(max = 255)
    @Column(length = 255)
    private String department;

    @Min(1)
    @Max(8)
    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    @Size(max = 2000)
    @Column(length = 2000)
    private String bio;

    @OneToMany(mappedBy = "studentProfile", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<StudentSkill> skills = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "student_profile_research_domains",
        joinColumns = @JoinColumn(name = "student_profile_id"),
        inverseJoinColumns = @JoinColumn(name = "research_domain_id")
    )
    @Builder.Default
    private Set<ResearchDomain> researchDomains = new HashSet<>();

    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<JoinRequest> joinRequests = new HashSet<>();
}