# Innovasphere — System Architecture

Innovasphere is a **platform for university research collaboration**: students and
faculty browse projects, form teams, request and accept mentorship, and receive
personalised recommendations and notifications.

## High-level architecture

```mermaid
flowchart LR
    subgraph Client["Browser (Vite SPA)"]
        UI[React + Tailwind + Framer Motion]
        ROUTER[React Router]
        AXIOS[Axios client / JWT interceptor]
    end

    subgraph API["Spring Boot 3 (Java 21)"]
        SEC[Spring Security + JWT filter]
        CTRL[Controllers]
        SVC[Service layer]
        REPO[JPA Repositories]
    end

    DB[(MySQL 8)]
    DOC[Swagger / OpenAPI]

    UI <--> ROUTER
    ROUTER <--> AXIOS
    AXIOS <-->|JSON over HTTPS| SEC
    SEC --> CTRL
    CTRL --> SVC
    SVC --> REPO
    REPO <-->|Hibernate ORM| DB
    SEC -.->|dev profile| DOC
```

```
Browser ── Vite dev server / Nginx (prod) ── Axios ── Spring Security ── Controller
        ── Service ── Repository (Spring Data JPA) ── MySQL
```

## Layers

```mermaid
flowchart TB
    FE["React Frontend (Vite / TypeScript)
        - pages/       routes
        - components/  shared UI
        - services/    typed API clients
        - context/     auth, theme, toasts
        - hooks/       useAsync, useDebounce, useUrlState"]
    FE -->|"/api/*"| CTRL

    subgraph Spring["Spring Boot backend"]
        CTRL["Controllers
            (thin: param → service → DTO)"]
        SVC["Service layer
            AuthService, ProjectService, TeamService,
            MentorshipService, NotificationService,
            RecommendationService, AdminService"]
        REPO["Repository layer
            Spring Data JPA interfaces + @Query
            (entity graphs, batch fetch for N+1 control)"]
        MAP["Mappers
            DTO ⇄ Entity (no entity leaks to API)"]
        VAL["Validation
            Jakarta Bean Validation + ApiException"]
    end

    CTRL --> SVC
    SVC --> REPO
    SVC --> MAP
    SVC --> VAL
    REPO --> DB[(MySQL)]
```

Key rules:

- **Controllers stay thin** — they translate HTTP → service calls and never contain
  business logic.
- **DTOs everywhere** — entities never cross the HTTP boundary (JSON serialisation is
  explicit via mappers).
- **Uniform errors** — every failure becomes `ApiError{status,error,message,path,fieldErrors,timestamp}`.
- **Transaction boundaries** live on the service layer (`@Transactional`).

## JWT authentication flow

```mermaid
sequenceDiagram
    participant F as React SPA
    participant B as Spring Boot
    participant DB as MySQL

    F->>B: POST /api/auth/login {email, password}
    B->>B: DaoAuthenticationProvider (bcrypt 12)
    B-->>DB: load user by email
    alt valid credentials & account active
        B->>B: JwtService.generateToken(email)
        B-->>F: 200 { token, user, expiresIn }
        F->>F: persist token (localStorage), set Axios header
        F->>B: GET /api/projects/my (Authorization: Bearer …)
        B->>B: JwtAuthenticationFilter: parse + verify signature
        B->>B: loadUserDetails + validateToken + isEnabled
        B->>B: set SecurityContext
        B-->>F: 200 JSON
    else invalid credentials
        B-->>F: 401 { error: UNAUTHORIZED }
    else disabled account
        B-->>F: 403 { error: ACCOUNT_DISABLED }
    end
```

Fail-secure notes: the `prod` profile **requires** `JWT_SECRET` (no default value) and
rejects tokens signed with under-32-byte keys; Swagger/actuator docs are disabled in
production.

## Recommendation engine flow

```mermaid
flowchart TD
    A["Request: GET /api/recommendations/dashboard"] --> B[Load current user profile]
    B --> C{Role?}
    C -->|Student| D[Project candidates: active/recruiting projects]
    D --> E[Score by research-domain overlap]
    E --> F[Score by skill overlap with project required skills]
    F --> G[Score by contributor trends & open positions]
    D --> H[Mentor candidates: faculty in matched domains]
    H --> I[Score by domain fit + available mentorship capacity]
    G --> J[Rank + top-N]
    I --> J
    C -->|Faculty| K[Projects in your research domains + mentorship demand]
    K --> J
    J --> L["200: recommended projects with reason + mentors"]
```

## Notification flow

```mermaid
sequenceDiagram
    participant A as Actor (student/faculty/admin)
    participant S as Service
    participant N as NotificationService
    participant DB as MySQL
    participant F as React SPA

    A->>S: action that triggers a notification
    S->>N: notify(type, recipients, title, message)
    N->>DB: persist Notification per recipient
    N-->>A: return result/`NotificationDto`
    F->>DB: poll GET /api/notifications (on mount/refresh)
    DB-->>F: unread badge + list
    F--)A: toasts for actions (project status, mentorship, invites)
```

Fan-out is **synchronous and transactional** — a notification is persisted in the same
transaction as the triggering action, so users never miss system events.

## Frontend structure

```mermaid
flowchart LR
    subgraph SPA["React SPA"]
        P["pages/ (lazy-loaded routes, Suspense)"]
        C["components/ (ui, shared, forms, routes)"]
        CX["context/ (Auth, Theme, Toast)"]
        SVC2["services/ (typed API clients)"]
        H["hooks/ (useAsync, useDebounce, useUrlState)"]
        E["components/error/ErrorBoundary"]
    end
    P --> C
    P --> H
    P --> SVC2
    P --> CX
    E --> P
```

Every route chunk is code-split with `React.lazy`; shared vendor code (`react`,
`recharts`, `framer-motion`/`lucide`) is hoisted into stable chunks.