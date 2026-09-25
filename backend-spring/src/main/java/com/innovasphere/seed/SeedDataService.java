package com.innovasphere.seed;

import com.innovasphere.dto.RegisterRequest;
import com.innovasphere.entity.FacultyProfile;
import com.innovasphere.entity.JoinRequest;
import com.innovasphere.entity.Mentorship;
import com.innovasphere.entity.MentorshipRequest;
import com.innovasphere.entity.Notification;
import com.innovasphere.entity.Project;
import com.innovasphere.entity.ProjectMember;
import com.innovasphere.entity.ProjectSkill;
import com.innovasphere.entity.ResearchDomain;
import com.innovasphere.entity.Skill;
import com.innovasphere.entity.StudentProfile;
import com.innovasphere.entity.StudentSkill;
import com.innovasphere.entity.Team;
import com.innovasphere.entity.TeamInvitation;
import com.innovasphere.entity.User;
import com.innovasphere.enums.InvitationStatus;
import com.innovasphere.enums.JoinRequestStatus;
import com.innovasphere.enums.MemberRole;
import com.innovasphere.enums.MentorshipStatus;
import com.innovasphere.enums.NotificationType;
import com.innovasphere.enums.ProjectStatus;
import com.innovasphere.enums.Role;
import com.innovasphere.repository.FacultyProfileRepository;
import com.innovasphere.repository.JoinRequestRepository;
import com.innovasphere.repository.MentorshipRepository;
import com.innovasphere.repository.MentorshipRequestRepository;
import com.innovasphere.repository.NotificationRepository;
import com.innovasphere.repository.ProjectMemberRepository;
import com.innovasphere.repository.ProjectRepository;
import com.innovasphere.repository.ProjectSkillRepository;
import com.innovasphere.repository.ResearchDomainRepository;
import com.innovasphere.repository.SkillRepository;
import com.innovasphere.repository.StudentProfileRepository;
import com.innovasphere.repository.StudentSkillRepository;
import com.innovasphere.repository.TeamInvitationRepository;
import com.innovasphere.repository.TeamRepository;
import com.innovasphere.repository.UserRepository;
import com.innovasphere.service.AuthService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Populates Innovasphere with realistic demo data when app.seed.enabled=true.
 *
 * <p>Idempotency: the whole seed is skipped when the admin account already exists, so running it twice
 * never creates duplicates. The seed never runs during tests because app.seed.enabled defaults to false.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeedDataService {

  public static final String ADMIN_EMAIL = "admin@innovasphere.edu";
  private static final String DEFAULT_PASSWORD = "Innovas@2026";
  private static final String UNIVERSITY = "Innovasphere University";

  private final UserRepository userRepository;
  private final SkillRepository skillRepository;
  private final ResearchDomainRepository researchDomainRepository;
  private final StudentProfileRepository studentProfileRepository;
  private final FacultyProfileRepository facultyProfileRepository;
  private final ProjectRepository projectRepository;
  private final ProjectSkillRepository projectSkillRepository;
  private final StudentSkillRepository studentSkillRepository;
  private final ProjectMemberRepository projectMemberRepository;
  private final TeamRepository teamRepository;
  private final TeamInvitationRepository teamInvitationRepository;
  private final JoinRequestRepository joinRequestRepository;
  private final MentorshipRequestRepository mentorshipRequestRepository;
  private final MentorshipRepository mentorshipRepository;
  private final NotificationRepository notificationRepository;
  private final AuthService authService;
  private final PasswordEncoder passwordEncoder;

  private static final String[] SKILL_NAMES = {
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "React",
    "Machine Learning",
    "Deep Learning",
    "Data Analysis",
    "SQL",
    "Docker",
    "Kubernetes",
    "Cloud Computing",
    "IoT",
    "Embedded Systems",
    "Cybersecurity",
    "Network Protocols",
    "Circuit Design",
    "MATLAB",
    "Statistics",
    "Computer Vision"
  };

  private static final String[] DOMAIN_NAMES = {
    "Artificial Intelligence",
    "Machine Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Internet of Things",
    "Cybersecurity",
    "Cloud Computing",
    "Robotics",
    "Renewable Energy",
    "Human-Computer Interaction"
  };

  @Transactional
  public void seedIfNeeded(boolean enabled) {
    if (!enabled) {
      log.info("Seeding skipped: app.seed.enabled is false");
      return;
    }
    if (userRepository.existsByEmail(ADMIN_EMAIL)) {
      log.info("Seeding skipped: admin account already exists (seed is idempotent)");
      return;
    }
    log.info("Seeding Innovasphere demo data...");

    seedAdmin();
    List<Skill> skills = seedSkills();
    List<ResearchDomain> domains = seedDomains();
    List<User> faculty = seedFaculty(domains);
    List<User> students = seedStudents(skills, domains);
    List<Project> projects = seedProjects(faculty, students, domains, skills);

    seedMembers(projects, students);
    seedTeams(projects, faculty, students);
    seedJoinRequests(projects, students);
    seedMentorship(faculty, students, projects);
    seedNotifications(faculty, students, projects);

    log.info(
        "Seeding complete: {} users, {} skills, {} domains, {} projects",
        userRepository.count(),
        skillRepository.count(),
        researchDomainRepository.count(),
        projectRepository.count());
  }

  // ------------------------------------------------------------------ users

  private void seedAdmin() {
    User admin =
        userRepository.save(
            User.builder()
                .username("admin")
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode("Admin@2026"))
                .fullName("System Administrator")
                .role(Role.ADMIN)
                .active(true)
                .build());
    log.info("Created admin user: {}", admin.getEmail());
  }

  private List<Skill> seedSkills() {
    List<Skill> skills = new ArrayList<>();
    for (String name : SKILL_NAMES) {
      skills.add(
          skillRepository
              .findByNameIgnoreCase(name)
              .orElseGet(
                  () ->
                      skillRepository.save(
                          Skill.builder()
                              .name(name)
                              .description(
                                  "Proficiency in " + name + " for research and product development.")
                              .build())));
    }
    return skills;
  }

  private List<ResearchDomain> seedDomains() {
    List<ResearchDomain> domains = new ArrayList<>();
    for (String name : DOMAIN_NAMES) {
      domains.add(
          researchDomainRepository
              .findByNameIgnoreCase(name)
              .orElseGet(
                  () ->
                      researchDomainRepository.save(
                          ResearchDomain.builder()
                              .name(name)
                              .description("Active research in " + name + ".")
                              .build())));
    }
    return domains;
  }

  private List<User> seedFaculty(List<ResearchDomain> domains) {
    record FacultySeed(
        String firstName,
        String lastName,
        String username,
        String email,
        String department,
        String designation,
        int domainIndex,
        String expertise) {}

    List<FacultySeed> seeds =
        List.of(
            new FacultySeed(
                "Sarah", "Chen", "sarah.chen", "dr.sarah.chen@innovasphere.edu",
                "Artificial Intelligence", "Professor", 0,
                "Deep Learning, Generative Models, Responsible AI"),
            new FacultySeed(
                "Michael", "Rodriguez", "michael.rodriguez", "dr.michael.rodriguez@innovasphere.edu",
                "Machine Learning", "Associate Professor", 1,
                "Statistical Learning, Bayesian Methods, Graph Neural Networks"),
            new FacultySeed(
                "Anita", "Sharma", "anita.sharma", "prof.anita.sharma@innovasphere.edu",
                "Internet of Things", "Professor", 4,
                "IoT Architectures, Edge Computing, Smart Infrastructure"),
            new FacultySeed(
                "James", "Okafor", "james.okafor", "dr.james.okafor@innovasphere.edu",
                "Cybersecurity", "Associate Professor", 5,
                "Applied Cryptography, Network Security, Threat Intelligence"),
            new FacultySeed(
                "Elena", "Petrova", "elena.petrova", "prof.elena.petrova@innovasphere.edu",
                "Electronics and Communication Engineering", "Professor", 8,
                "Embedded Systems, Communication Protocols, Renewable Energy Systems"));

    List<User> faculty = new ArrayList<>();
    for (FacultySeed seed : seeds) {
      User user;
      if (userRepository.existsByEmail(seed.email())) {
        user = userRepository.findByEmail(seed.email()).orElseThrow();
      } else {
        authService.register(
            new RegisterRequest(
                seed.firstName(),
                seed.lastName(),
                seed.username(),
                seed.email(),
                DEFAULT_PASSWORD,
                Role.FACULTY));
        user = userRepository.findByEmail(seed.email()).orElseThrow();
      }
      FacultyProfile profile = facultyProfileRepository.findByUserId(user.getId()).orElseThrow();
      profile.setDepartment(seed.department());
      profile.setDesignation(seed.designation());
      profile.setBio(seed.designation() + " at " + UNIVERSITY + ". Research focus: " + seed.expertise() + ".");
      profile.setExpertise(seed.expertise());
      profile.getResearchDomains().add(domains.get(seed.domainIndex()));
      profile.getResearchDomains().add(domains.get((seed.domainIndex() + 1) % domains.size()));
      facultyProfileRepository.save(profile);
      faculty.add(user);
    }
    return faculty;
  }

  private List<User> seedStudents(List<Skill> skills, List<ResearchDomain> domains) {
    record StudentSeed(
        String firstName,
        String lastName,
        String username,
        String email,
        String department,
        int year,
        String bio,
        int[] skillIndexes,
        int[] domainIndexes) {}

    List<StudentSeed> seeds =
        List.of(
            new StudentSeed(
                "Arjun", "Mehta", "arjun.mehta", "arjun.mehta@innovasphere.edu",
                "Robotics Engineering", 3,
                "Robotics enthusiast building assistive systems. Interests: embedded control, vision.",
                new int[] {4, 16, 19}, new int[] {7}),
            new StudentSeed(
                "Layla", "Hassan", "layla.hassan", "layla.hassan@innovasphere.edu",
                "Data Science", 2,
                "Aspiring ML engineer building production ML pipelines and visualisation dashboards.",
                new int[] {0, 6, 7, 8}, new int[] {0, 1}),
            new StudentSeed(
                "Diego", "Fernandez", "diego.fernandez", "diego.fernandez@innovasphere.edu",
                "Electrical Engineering", 4,
                "Hardware-first engineer working on wearable sensors and signal processing.",
                new int[] {13, 16, 17}, new int[] {4, 8}),
            new StudentSeed(
                "Priya", "Raman", "priya.raman", "priya.raman@innovasphere.edu",
                "Applied Mathematics", 3,
                "Quantum information theory and optimisation. Daily driver: linear algebra and clean proofs.",
                new int[] {2, 3, 18}, new int[] {1}),
            new StudentSeed(
                "Fatima", "Al-Sayed", "fatima.al-sayed", "fatima.al-sayed@innovasphere.edu",
                "Mechanical Engineering", 2,
                "Designer of prosthetics and assistive devices. CAD, kinematics and 3D printing.",
                new int[] {5, 17}, new int[] {7, 8}),
            new StudentSeed(
                "Noah", "Kim", "noah.kim", "noah.kim@innovasphere.edu",
                "Information Systems", 3,
                "Full-stack developer curious about EdTech and product analytics.",
                new int[] {2, 3, 4, 8, 9}, new int[] {6, 9}),
            new StudentSeed(
                "Sofia", "Martins", "sofia.martins", "sofia.martins@innovasphere.edu",
                "Biomedical Engineering", 3,
                "Interested in health monitoring wearables and medical imaging with deep learning.",
                new int[] {1, 6, 13}, new int[] {2, 4}),
            new StudentSeed(
                "Rafael", "Silva", "rafael.silva", "rafael.silva@innovasphere.edu",
                "Computer Science", 4,
                "Security researcher focused on privacy-preserving systems and cryptography.",
                new int[] {1, 9, 15}, new int[] {5, 6}),
            new StudentSeed(
                "Aisha", "Khan", "aisha.khan", "aisha.khan@innovasphere.edu",
                "Aerospace Engineering", 2,
                "Flight systems, control theory and autonomous navigation.",
                new int[] {10, 12}, new int[] {7}),
            new StudentSeed(
                "Chen", "Wei", "chen.wei", "chen.wei@innovasphere.edu",
                "Cognitive Science", 1,
                "Curious about human-computer interaction and natural language interfaces.",
                new int[] {4, 6}, new int[] {3, 9}));

    List<User> students = new ArrayList<>();
    int enrollment = 1;
    for (StudentSeed seed : seeds) {
      User user;
      if (userRepository.existsByEmail(seed.email())) {
        user = userRepository.findByEmail(seed.email()).orElseThrow();
      } else {
        authService.register(
            new RegisterRequest(
                seed.firstName(),
                seed.lastName(),
                seed.username(),
                seed.email(),
                DEFAULT_PASSWORD,
                Role.STUDENT));
        user = userRepository.findByEmail(seed.email()).orElseThrow();
      }
      StudentProfile profile = studentProfileRepository.findByUserId(user.getId()).orElseThrow();
      profile.setEnrollmentNumber(
          "INN" + (2026 - seed.year()) + "-" + String.format("%03d", enrollment));
      profile.setUniversity(UNIVERSITY);
      profile.setDepartment(seed.department());
      profile.setYearOfStudy(seed.year());
      profile.setBio(seed.bio());
      for (int si : seed.skillIndexes()) {
        Skill skill = skills.get(si);
        profile
            .getSkills()
            .add(
                StudentSkill.builder()
                    .studentProfile(profile)
                    .skill(skill)
                    .level(2 + (si % 4))
                    .experience("Self-taught and coursework in " + skill.getName())
                    .build());
      }
      for (int di : seed.domainIndexes()) {
        profile.getResearchDomains().add(domains.get(di));
      }
      studentProfileRepository.save(profile);
      students.add(user);
    }
    return students;
  }

  // ------------------------------------------------------------------ projects

  private List<Project> seedProjects(
      List<User> faculty, List<User> students, List<ResearchDomain> domains, List<Skill> skills) {
    record ProjectSeed(
        int ownerIndex,
        boolean ownerIsFaculty,
        String title,
        String shortDescription,
        String description,
        ProjectStatus status,
        int[] domainIndexes,
        int[] skillIndexes) {}

    List<ProjectSeed> seeds =
        List.of(
            new ProjectSeed(
                0, false, "Augmented Reality for Lab Safety",
                "AR overlays that highlight hazards and guide lab procedures.",
                "An augmented reality assistant for university labs that overlays safety hazards, chemical "
                    + "warnings and step-by-step procedure hints directly on lab equipment using a smartphone camera.",
                ProjectStatus.IDEA, new int[] {7, 9}, new int[] {2, 4}),
            new ProjectSeed(
                1, false, "AI-Powered Textbook Summarizer",
                "Generates concise chapter summaries and study cards from textbooks.",
                "A web app that turns uploaded textbook chapters into summarised study notes, quiz cards and "
                    + "concept maps using a fine-tuned language model.",
                ProjectStatus.IDEA, new int[] {0, 3}, new int[] {0, 6, 4}),
            new ProjectSeed(
                0, true, "Smart Crop Disease Detection",
                "Mobile app that detects crop diseases from leaf photos using computer vision.",
                "A computer-vision pipeline and mobile companion that classifies common crop diseases from "
                    + "leaf photos and recommends treatment, including an offline model for farms with low connectivity.",
                ProjectStatus.LOOKING_FOR_TEAM, new int[] {0, 2}, new int[] {6, 19, 0}),
            new ProjectSeed(
                2, false, "Wearable ECG Monitoring Patch",
                "A low-power ECG patch that streams beat classification to a phone.",
                "Design and firmware for a wearable ECG patch with real-time arrhythmia alerts, low-power "
                    + "BLE streaming and a React Native companion app.",
                ProjectStatus.LOOKING_FOR_TEAM, new int[] {4, 8}, new int[] {13, 16, 17}),
            new ProjectSeed(
                3, false, "Quantum Error Correction Library",
                "A simulation library for surface-code error correction experiments.",
                "An open-source Python library that simulates surface-code quantum error correction circuits, "
                    + "with a focus on teaching fundamentals through visualisation.",
                ProjectStatus.LOOKING_FOR_TEAM, new int[] {1}, new int[] {0, 18, 8}),
            new ProjectSeed(
                2, true, "Campus IoT Energy Dashboard",
                "Aggregates IoT metering data into a live campus energy dashboard.",
                "A dashboard that aggregates data from IoT power meters across campus buildings, applies "
                    + "anomaly detection and recommends conservation actions in real time.",
                ProjectStatus.IN_PROGRESS, new int[] {4, 6}, new int[] {12, 7, 11}),
            new ProjectSeed(
                3, true, "Privacy-Preserving Contact Tracing",
                "Federated contact tracing with local differential privacy.",
                "A Bluetooth contact-tracing prototype that keeps location data on-device and shares only "
                    + "differentially private infection-risk aggregates to a central dashboard.",
                ProjectStatus.IN_PROGRESS, new int[] {5, 6}, new int[] {14, 15, 11}),
            new ProjectSeed(
                4, false, "Robotic Arm for Assistive Feeding",
                "A low-cost robotic arm that assists people with limited mobility at meal times.",
                "Design, control and testing of a low-cost assistive feeding arm with computer-vision bite "
                    + "detection and a safety-first control loop.",
                ProjectStatus.IN_PROGRESS, new int[] {7, 8}, new int[] {16, 5, 13}),
            new ProjectSeed(
                5, false, "EdTech Adaptive Quiz Platform",
                "Adaptive question banking that personalises revision by learning gaps.",
                "An adaptive quiz platform that models student mastery, serves personalised question sequences "
                    + "and gives instructors per-topic analytics.",
                ProjectStatus.UNDER_REVIEW, new int[] {1, 9}, new int[] {2, 3, 8}),
            new ProjectSeed(
                4, true, "University Event Portal",
                "Self-service event discovery, bookings and attendance analytics.",
                "A university-wide event portal with discoverable calendars, themed location tagging, "
                    + "self-service booking and attendance analytics for organisers.",
                ProjectStatus.COMPLETED, new int[] {9, 6}, new int[] {2, 3, 9}));

    List<Project> projects = new ArrayList<>();
    for (ProjectSeed seed : seeds) {
      User owner = seed.ownerIsFaculty() ? faculty.get(seed.ownerIndex()) : students.get(seed.ownerIndex());
      Project project;
      List<Project> existing =
            projectRepository
                .findByTitleContainingIgnoreCase(
                    seed.title(), org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent();
      if (!existing.isEmpty()) {
        project = existing.get(0);
      } else {
        Project created =
            Project.builder()
                .owner(owner)
                .title(seed.title())
                .shortDescription(seed.shortDescription())
                .description(seed.description())
                .status(seed.status())
                .repositoryUrl("https://github.com/innovasphere/" + slug(seed.title()))
                .build();
        created = projectRepository.save(created);
        for (int di : seed.domainIndexes()) {
          created.getResearchDomains().add(domains.get(di));
        }
        for (int si : seed.skillIndexes()) {
          Skill skill = skills.get(si);
          created
              .getSkills()
              .add(ProjectSkill.builder().project(created).skill(skill).requiredLevel(3).build());
        }
        project = projectRepository.save(created);
      }
      projects.add(project);
    }
    return projects;
  }

  private void seedMembers(List<Project> projects, List<User> students) {
    // P5 Campus IoT Energy Dashboard
    addMember(projects.get(5), students.get(2), MemberRole.LEAD);
    addMember(projects.get(5), students.get(5), MemberRole.MEMBER);
    addMember(projects.get(5), students.get(3), MemberRole.MEMBER);
    addMember(projects.get(5), students.get(1), MemberRole.MEMBER);
    // P6 Privacy-Preserving Contact Tracing
    addMember(projects.get(6), students.get(7), MemberRole.LEAD);
    addMember(projects.get(6), students.get(6), MemberRole.MEMBER);
    // P7 Robotic Arm for Assistive Feeding
    addMember(projects.get(7), students.get(2), MemberRole.MEMBER);
    addMember(projects.get(7), students.get(3), MemberRole.MEMBER);
    addMember(projects.get(7), students.get(0), MemberRole.MEMBER);
    // P8 EdTech Adaptive Quiz Platform
    addMember(projects.get(8), students.get(1), MemberRole.REVIEWER);
    addMember(projects.get(8), students.get(4), MemberRole.MEMBER);
    addMember(projects.get(8), students.get(9), MemberRole.MEMBER);
    // P9 University Event Portal
    addMember(projects.get(9), students.get(1), MemberRole.MEMBER);
    addMember(projects.get(9), students.get(2), MemberRole.MEMBER);
    addMember(projects.get(9), students.get(5), MemberRole.MEMBER);
  }

  private void addMember(Project project, User user, MemberRole role) {
    if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
      projectMemberRepository.save(
          ProjectMember.builder().project(project).user(user).roleInProject(role).build());
    }
  }

  // ------------------------------------------------------------------ teams

  private void seedTeams(List<Project> projects, List<User> faculty, List<User> students) {
    Project iot = projects.get(5);
    Team energyCore =
        teamRepository.save(
            Team.builder()
                .project(iot)
                .name("Energy Core")
                .description("Core team behind the Campus IoT Energy Dashboard.")
                .build());
    energyCore
        .getMembers()
        .addAll(List.of(faculty.get(2), students.get(2), students.get(1), students.get(5)));
    teamRepository.save(energyCore);

    Project arm = projects.get(7);
    Team bionicArm =
        teamRepository.save(
            Team.builder()
                .project(arm)
                .name("Bionic Arm Team")
                .description("Hardware, control and vision sub-team for the assistive feeding arm.")
                .build());
    bionicArm.getMembers().addAll(List.of(students.get(4), students.get(0), students.get(3)));
    teamRepository.save(bionicArm);

    // invitations: PENDING / ACCEPTED (adds member) / REJECTED
    addInvitation(energyCore, students.get(3), faculty.get(2), InvitationStatus.PENDING,
        "We need your linear algebra chops for the anomaly detection module.");
    addInvitation(energyCore, students.get(4), faculty.get(2), InvitationStatus.ACCEPTED,
        "Join the Energy Core — we are building the dashboard's hardware wrappers.");
    energyCore.getMembers().add(students.get(4));
    teamRepository.save(energyCore);
    addInvitation(energyCore, students.get(0), faculty.get(2), InvitationStatus.REJECTED,
        "Would you like to contribute to the deployment pipeline?");
    addInvitation(bionicArm, students.get(2), students.get(4), InvitationStatus.ACCEPTED,
        "We need your embedded skills for the control loop.");
    bionicArm.getMembers().add(students.get(2));
    teamRepository.save(bionicArm);
    addInvitation(bionicArm, students.get(1), students.get(4), InvitationStatus.PENDING,
        "Interested in helping with the vision-based bite detection?");
  }

  private void addInvitation(
      Team team, User user, User invitedBy, InvitationStatus status, String message) {
    teamInvitationRepository.save(
        TeamInvitation.builder()
            .team(team)
            .user(user)
            .invitedBy(invitedBy)
            .status(status)
            .message(message)
            .build());
  }

  // ------------------------------------------------------------------ join requests

  private void seedJoinRequests(List<Project> projects, List<User> students) {
    addJoinRequest(projects.get(2), students.get(1), JoinRequestStatus.PENDING,
        "I have ML experience and would love to contribute to the detection models.");
    addJoinRequest(projects.get(2), students.get(0), JoinRequestStatus.ACCEPTED,
        "Can help with edge deployment of the vision model.");
    addJoinRequest(projects.get(2), students.get(3), JoinRequestStatus.REJECTED,
        "Interested in the evaluation pipeline.");
    addJoinRequest(projects.get(3), students.get(4), JoinRequestStatus.PENDING,
        "I can help with the mechanical housing and electrode placement.");
    addJoinRequest(projects.get(3), students.get(6), JoinRequestStatus.ACCEPTED,
        "Biomedical engineer here — keen on signal classification.");
    addJoinRequest(projects.get(3), students.get(7), JoinRequestStatus.REJECTED,
        "Would like to contribute to secure data handling.");
    addJoinRequest(projects.get(4), students.get(8), JoinRequestStatus.PENDING,
        "I enjoy math-heavy projects; keen to learn quantum simulation.");
    addJoinRequest(projects.get(4), students.get(2), JoinRequestStatus.ACCEPTED,
        "Happy to handle performance optimisations of the simulation core.");
  }

  private void addJoinRequest(
      Project project, User student, JoinRequestStatus status, String message) {
    StudentProfile profile = studentProfileRepository.findByUserId(student.getId()).orElseThrow();
    joinRequestRepository.save(
        JoinRequest.builder()
            .project(project)
            .student(profile)
            .status(status)
            .message(message)
            .build());
  }

  // ------------------------------------------------------------------ mentorship

  private void seedMentorship(List<User> faculty, List<User> students, List<Project> projects) {
    FacultyProfile sarah = facultyProfileByEmail("dr.sarah.chen@innovasphere.edu");
    FacultyProfile michael = facultyProfileByEmail("dr.michael.rodriguez@innovasphere.edu");
    FacultyProfile anita = facultyProfileByEmail("prof.anita.sharma@innovasphere.edu");
    FacultyProfile james = facultyProfileByEmail("dr.james.okafor@innovasphere.edu");
    FacultyProfile elena = facultyProfileByEmail("prof.elena.petrova@innovasphere.edu");

    addMentorshipRequest(students.get(1), faculty.get(0), MentorshipStatus.ACCEPTED,
        "I am building an AI summariser and would value your guidance.", projects.get(1));
    addMentorshipRequest(students.get(0), faculty.get(2), MentorshipStatus.ACCEPTED,
        "Need mentorship on the camera-based control loop.", projects.get(7));
    addMentorshipRequest(students.get(3), faculty.get(1), MentorshipStatus.PENDING,
        "Would like to explore optimisation methods with you.", null);
    addMentorshipRequest(students.get(2), faculty.get(4), MentorshipStatus.ACCEPTED,
        "Guidance on the ECG firmware signal chain would be invaluable.", projects.get(3));
    addMentorshipRequest(students.get(4), faculty.get(3), MentorshipStatus.REJECTED,
        "Interested in securing the data layer of the arm.", projects.get(7));
    addMentorshipRequest(students.get(5), faculty.get(0), MentorshipStatus.PENDING,
        "Curious about evaluating NLP summarisation quality.", null);
    addMentorshipRequest(students.get(8), faculty.get(1), MentorshipStatus.ACCEPTED,
        "Keen to learn about sensor fusion with statistical models.", null);
    addMentorshipRequest(students.get(6), faculty.get(2), MentorshipStatus.PENDING,
        "Would like to connect on wearable IoT architectures.", projects.get(3));

    // accepted requests also create durable mentorship records
    addMentorship(sarah, students.get(1), projects.get(1));
    addMentorship(anita, students.get(0), projects.get(7));
    addMentorship(elena, students.get(2), projects.get(3));
    addMentorship(michael, students.get(8), null);
  }

  private FacultyProfile facultyProfileByEmail(String email) {
    User user = userRepository.findByEmail(email).orElseThrow();
    return facultyProfileRepository.findByUserId(user.getId()).orElseThrow();
  }

  private void addMentorshipRequest(
      User student,
      User faculty,
      MentorshipStatus status,
      String message,
      Project project) {
    mentorshipRequestRepository.save(
        MentorshipRequest.builder()
            .student(student)
            .faculty(faculty)
            .project(project)
            .status(status)
            .message(message)
            .build());
  }

  private void addMentorship(FacultyProfile faculty, User student, Project project) {
    mentorshipRepository.save(
        Mentorship.builder().faculty(faculty).student(student).project(project).build());
  }

  // ------------------------------------------------------------------ notifications

  private void seedNotifications(
      List<User> faculty, List<User> students, List<Project> projects) {
    User arjun = students.get(0);
    User layla = students.get(1);
    User diego = students.get(2);
    User priya = students.get(3);
    User fatima = students.get(4);
    User noah = students.get(5);
    User sofia = students.get(6);
    User rafael = students.get(7);
    User aisha = students.get(8);
    User chen = students.get(9);

    notifyUser(layla, NotificationType.JOIN_REQUEST,
        "Join request sent",
        "Your request to join 'Smart Crop Disease Detection' has been received by the owner.", false);
    notifyUser(layla, NotificationType.MENTORSHIP_ACCEPTED,
        "Mentorship accepted",
        "Dr. Sarah Chen accepted your mentorship request.", false);
    notifyUser(layla, NotificationType.TEAM_INVITATION,
        "You have a team invitation",
        "Fatima Al-Sayed invited you to join the 'Bionic Arm Team'.", false);
    notifyUser(layla, NotificationType.PROJECT_UPDATE,
        "Project updated",
        "'AI-Powered Textbook Summarizer' has a new update from its owner.", true);

    notifyUser(arjun, NotificationType.JOIN_REQUEST_ACCEPTED,
        "Join request accepted",
        "Your request to join 'Smart Crop Disease Detection' was accepted.", false);
    notifyUser(arjun, NotificationType.MENTORSHIP_ACCEPTED,
        "Mentorship accepted",
        "Prof. Anita Sharma accepted your mentorship request.", false);
    notifyUser(arjun, NotificationType.SYSTEM,
        "Welcome to Innovasphere",
        "Explore projects, join a team or find a mentor to get started.", true);

    notifyUser(diego, NotificationType.JOIN_REQUEST_ACCEPTED,
        "Join request accepted",
        "Your request to join 'Quantum Error Correction Library' was accepted.", false);
    notifyUser(diego, NotificationType.MENTORSHIP_ACCEPTED,
        "Mentorship accepted",
        "Prof. Elena Petrova accepted your mentorship request.", false);
    notifyUser(diego, NotificationType.TEAM_INVITATION_ACCEPTED,
        "Invitation accepted",
        "Your invitation to join the 'Bionic Arm Team' was accepted.", true);

    notifyUser(priya, NotificationType.TEAM_INVITATION,
        "You have a team invitation",
        "Prof. Anita Sharma invited you to join the 'Energy Core' team.", false);
    notifyUser(priya, NotificationType.MENTORSHIP_REQUEST,
        "Mentorship request sent",
        "Your mentorship request to Dr. Michael Rodriguez is pending.", false);

    notifyUser(fatima, NotificationType.TEAM_INVITATION_ACCEPTED,
        "Invitation accepted",
        "Your invitation to join the 'Energy Core' team was accepted.", true);
    notifyUser(fatima, NotificationType.MENTORSHIP_REJECTED,
        "Mentorship request declined",
        "Dr. James Okafor declined your mentorship request.", false);

    notifyUser(sofia, NotificationType.JOIN_REQUEST_ACCEPTED,
        "Join request accepted",
        "Your request to join 'Wearable ECG Monitoring Patch' was accepted.", false);
    notifyUser(sofia, NotificationType.MENTORSHIP_REQUEST,
        "Mentorship request sent",
        "Your mentorship request to Prof. Anita Sharma is pending.", false);

    notifyUser(rafael, NotificationType.JOIN_REQUEST_REJECTED,
        "Join request declined",
        "The owner declined your request to join 'Wearable ECG Monitoring Patch'.", true);
    notifyUser(rafael, NotificationType.TEAM_INVITATION,
        "You have a team invitation",
        "Prof. Anita Sharma invited you to join the 'Energy Core' team.", true);

    notifyUser(aisha, NotificationType.JOIN_REQUEST,
        "Join request sent",
        "Your request to join 'Quantum Error Correction Library' has been received.", false);
    notifyUser(aisha, NotificationType.MENTORSHIP_ACCEPTED,
        "Mentorship accepted",
        "Dr. Michael Rodriguez accepted your mentorship request.", false);

    notifyUser(noah, NotificationType.MENTORSHIP_REQUEST,
        "Mentorship request sent",
        "Your mentorship request to Dr. Sarah Chen is pending.", false);
    notifyUser(chen, NotificationType.PROJECT_UPDATE,
        "Project updated",
        "'EdTech Adaptive Quiz Platform' has a new update from its owner.", false);
    notifyUser(students.get(1), NotificationType.PROJECT_UPDATE,
        "Project updated",
        "'University Event Portal' shipped a new release.", true);
    notifyUser(faculty.get(0), NotificationType.MENTORSHIP_REQUEST,
        "Mentorship request",
        "Noah Kim requested mentorship. Respond from your mentor dashboard.", false);
    notifyUser(faculty.get(2), NotificationType.MENTORSHIP_REQUEST,
        "Mentorship request",
        "Sofia Martins requested mentorship. Respond from your mentor dashboard.", false);
  }

  private void notifyUser(User user, NotificationType type, String title, String message, boolean read) {
    notificationRepository.save(
        Notification.builder().user(user).type(type).title(title).message(message).read(read).build());
  }

  private static String slug(String title) {
    return title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
  }
}