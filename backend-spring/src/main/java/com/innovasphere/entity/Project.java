package com.innovasphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.innovasphere.enums.ProjectStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "projects",
    indexes = {
        @Index(name = "idx_projects_status", columnList = "status"),
        @Index(name = "idx_projects_owner_id", columnList = "owner_id")
    }
)
public class Project extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnore
    private User owner;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, length = 255)
    private String title;

    @Size(max = 500)
    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Size(max = 10000)
    @Column(length = 10000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.IDEA;

    @Size(max = 500)
    @Column(name = "repository_url", length = 500)
    private String repositoryUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "project_research_domains",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "research_domain_id")
    )
    @BatchSize(size = 30)
    @Builder.Default
    private Set<ResearchDomain> researchDomains = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 30)
    @Builder.Default
    private Set<ProjectSkill> skills = new HashSet<>();

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    @BatchSize(size = 30)
    @Builder.Default
    private Set<ProjectMember> members = new HashSet<>();

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    @BatchSize(size = 30)
    @Builder.Default
    private Set<JoinRequest> joinRequests = new HashSet<>();

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    @BatchSize(size = 30)
    @Builder.Default
    private Set<Team> teams = new HashSet<>();
}