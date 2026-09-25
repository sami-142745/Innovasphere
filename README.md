# Innovasphere 🎓

> **Professional Research Collaboration Platform** — connect students and faculty around
> real research projects, teams and mentorships. Final release v1.0.

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Java](https://img.shields.io/badge/Java-21-FF0000?logo=openjdk&logoColor=white)](https://openjdk.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/tests-250%2B-green)](.)

---

## About

Innovasphere is a full-stack platform where **students** discover and contribute to
research projects, **faculty** mentor and guide teams, and **admins** govern the whole
ecosystem. It ships with JWT authentication, personal recommendations, a notification
inbox, team management and mentorship workflows — built for a clean, deployment-ready
college submission.

## ✨ Features

- **Role-based access** — `STUDENT`, `FACULTY`, `ADMIN` with dedicated dashboards.
- **Secure authentication** — JWT (HS256) + bcrypt-12 password hashing, disabled-account enforcement.
- **Projects** — browse, search, filter, create, edit and detail views with domains and skills.
- **Teams** — create teams, invite members, accept/decline invitations.
- **Mentorship** — students request faculty mentors; faculty accept or reject; admin oversight.
- **Recommendations** — personalised project & mentor suggestions on the dashboard.
- **Notifications** — typed inbox (project status, mentorship, invites) with read/unread.
- **Production polish** — lazy-loaded routes, ErrorBoundary, isolated test DB, entity-graph
  query tuning (N+1 fixes), strict `prod` profile (swagger off, secrets required).

## 📸 Screenshots

_Add your own screenshots here — replace the placeholders below with real images._

| Landing | Dashboard |
| ------- | --------- |
| `![Landing](docs/screenshots/landing.png)` | `![Dashboard](docs/screenshots/dashboard.png)` |

| Project directory | Mentor directory |
| ----------------- | ---------------- |
| `![Projects](docs/screenshots/projects.png)` | `![Mentors](docs/screenshots/mentors.png)` |

| Admin console | Swagger (dev) |
| ------------- | ------------- |
| `![Admin](docs/screenshots/admin.png)` | `![Swagger](docs/screenshots/swagger.png)` |

## 🏗️ Architecture

```
React SPA (Vite) ──JSON/HTTPS──▶ Spring Boot 3 (Java 21) ──▶ JPA Repository ──▶ MySQL 8
       ▲                              │ Security (JWT filter)
       └──────────────────────────────┘
```

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, Axios, react-router.
- **Backend:** Spring Boot 3.5, Spring Security, Spring Data JPA, Bean Validation, springdoc OpenAPI.
- **Database:** MySQL 8 — 15 entities, `ddl-auto` schema management.
- **Deployment:** Docker Compose, Render (backend), Vercel (frontend).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/ERD.md`](docs/ERD.md) and
[`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) for full diagrams and API details.

## 🧱 Tech stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | React 18 · TypeScript 5.5 · Vite 5 · Tailwind 3 · Framer Motion · Axios |
| Backend    | Java 21 · Spring Boot 3.5 · Spring Security · Spring Data JPA |
| Persistence| MySQL 8 · Hibernate 6 · JPA |
| Security   | JWT (jjwt 0.12) · BCrypt(12) |
| Testing    | JUnit 5 · Mockito · spring-security-test · Vitest · Testing Library · MSW |
| Tooling    | Maven wrapper · Docker Compose · Render / Vercel |

## 📁 Folder structure

```
project_nexus/
├── backend-spring/          # Spring Boot API
│   ├── src/main/java/com/innovasphere/
│   │   ├── config/          # Security config
│   │   ├── controller/      # REST controllers
│   │   ├── dto/            # Request/response records
│   │   ├── entity/         # JPA entities
│   │   ├── enums/          # Role, ProjectStatus, MentorshipStatus
│   │   ├── exception/      # GlobalExceptionHandler + ApiException
│   │   ├── mapper/         # Entity ⇄ DTO mappers
│   │   ├── repository/     # Spring Data JPA repositories
│   │   ├── security/       # JwtService, filters, login
│   │   └── service/        # Business logic
│   ├── src/main/resources/ # application.yml, application-dev.yml, application-prod.yml
│   ├── src/test/           # 218 integration + unit tests
│   ├── Dockerfile
│   ├── render.yaml
│   └── .env.example
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/            # Axios client + error extraction
│   │   ├── components/     # ui/, shared/, forms/, routes/, error/
│   │   ├── context/        # Auth, Theme, Toast providers
│   │   ├── hooks/          # useAsync, useDebounce, useUrlState, usePagination
│   │   ├── pages/          # Lazy-loaded route pages
│   │   ├── services/       # Typed API service modules
│   │   └── utils/          # constants, format, cn
│   ├── Dockerfile, nginx.conf, vercel.json
│   └── vite.config.ts
├── docs/                    # API_REFERENCE, ERD, ARCHITECTURE, DEPLOYMENT
└── docker-compose.yml       # mysql + backend + frontend
```

## 🚀 Getting started

### 1. MySQL setup

```bash
# Start MySQL 8 and create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS innovasphere;"
```

Or simply run the bundled MySQUL container:

```bash
docker run --name innovasphere-mysql -e MYSQL_ROOT_PASSWORD=<pass> \
  -e MYSQL_DATABASE=innovasphere -p 3306:3306 -d mysql:8.4
```

### 2. Backend setup

```bash
cd backend-spring
export DB_USERNAME=root
export DB_PASSWORD=<your_password>
export JWT_SECRET=$(openssl rand -base64 48)
export SPRING_PROFILES_ACTIVE=dev
./mvnw clean compile
./mvnw spring-boot:run
```

Swagger UI: http://localhost:8080/swagger-ui.html (dev profile)

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 4. Docker (single command)

```bash
cp backend-spring/.env.example .env   # fill in values
docker compose up -d --build
```

### 5. Environment variables

| Variable | Purpose |
| -------- | ------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | Database connection |
| `JWT_SECRET`, `JWT_EXPIRATION` | Auth signing + lifetime |
| `FRONTEND_URL` | CORS origin |
| `PORT`, `SPRING_PROFILES_ACTIVE` | Server port + profile (`dev`/`prod`) |
| `SEED_ENABLED` | Populate demo data on empty DB |
| `VITE_API_URL` | Frontend API base URL |

Copy `backend-spring/.env.example` → your environment. Templates contain **no secrets**.

## 🧪 Testing

```bash
# Backend — 218 tests (isolated test DB, `innovasphere_test`)
cd backend-spring
./mvnw test

# Frontend — 32 tests
cd frontend
npm test
```

```bash
# Coverage (optional)
./mvnw verify                # JaCoCo report → target/site/jacoco
npm run test:coverage        # V8 coverage
```

## 🌱 Seed data

With an empty database and `SEED_ENABLED=true` (default in `dev`), the backend seeds
demo **skills**, **research domains**, **users** (student/faculty/admin), **projects**,
**teams** and **mentorships** so every screen is explorable immediately. Seed rows are
idempotent — safe to restart with.

## 📚 Documentation

- [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) — every endpoint, with requests/responses/status codes
- [`docs/ERD.md`](docs/ERD.md) — Mermaid entity-relationship diagram (15 entities)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system, JWT, recommendation & notification flows
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local, Docker, Render, Vercel, troubleshooting

## ☁️ Deployment guide

- **Docker:** `docker compose up -d --build` — MySQL + backend + frontend(nginx).
- **Render (API):** import `backend-spring/render.yaml` → set env vars → health check `/api/health`.
- **Vercel (UI):** import `frontend/` → set `VITE_API_URL` → SPA rewrites via `vercel.json`.

Full step-by-step instructions in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 👥 Contributors

- **Azlan Sami** — project lead, full-stack development

_Add your name here if you contributed — alphabetical order, please._

## 📄 License

Educational use · MIT-style license — see `LICENSE` (add your preferred license text).