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
    name = "faculty_profiles",
    indexes = {
        @Index(name = "idx_faculty_profiles_user_id", columnList = "user_id")
    }
)
public class FacultyProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Size(max = 255)
    @Column(length = 255)
    private String department;

    @Size(max = 255)
    @Column(length = 255)
    private String designation;

    @Size(max = 2000)
    @Column(length = 2000)
    private String bio;

    @Size(max = 2000)
    @Column(length = 2000)
    private String expertise;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "faculty_profile_research_domains",
        joinColumns = @JoinColumn(name = "faculty_profile_id"),
        inverseJoinColumns = @JoinColumn(name = "research_domain_id")
    )
    @Builder.Default
    private Set<ResearchDomain> researchDomains = new HashSet<>();

    @OneToMany(mappedBy = "faculty", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Mentorship> mentorships = new HashSet<>();
}