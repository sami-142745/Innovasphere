# Innovasphere API Reference

Base URL (dev): `http://localhost:8080`

All JSON request/response bodies use `Content-Type: application/json`.

## Authentication

Most endpoints require a `Bearer` token obtained from `POST /api/auth/login` or
`POST /api/auth/register`.

```
Authorization: Bearer <token>
```

A uniform error shape is returned for every non-2xx response:

```json
{
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "path": "/api/auth/register",
  "fieldErrors": { "email": "must be a well-formed email address" },
  "timestamp": "2026-09-25T12:00:00Z"
}
```

| Status | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| 400    | Invalid input / validation failure                              |
| 401    | Missing, invalid or expired token; bad credentials              |
| 403    | Authenticated but not allowed (role check, disabled account)    |
| 404    | Resource not found                                              |
| 409    | Conflict — resource already exists or state prevents the action |
| 500    | Unexpected server error                                         |

---

## Health

### `GET /api/health`
Authentication: **none**

Response `200`:
```json
{ "status": "UP" }
```

---

## Authentication

### `POST /api/auth/register`
Authentication: **none**

Roles may be `STUDENT` or `FACULTY` (admin registration is forbidden).

Request example:
```json
{
  "firstName": "Ayesha",
  "lastName": "Khan",
  "username": "ayesha",
  "email": "ayesha@university.edu",
  "password": "StrongPass123!",
  "role": "STUDENT"
}
```

Response `201`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 604800000,
  "user": {
    "id": "3f0f...",
    "username": "ayesha",
    "email": "ayesha@university.edu",
    "fullName": "Ayesha Khan",
    "role": "STUDENT",
    "active": true,
    "createdAt": "2026-09-25T12:00:00Z"
  }
}
```

Status codes: `201` created · `400` weak password / malformed body · `403` admin registration · `409` email or username already exists.

### `POST /api/auth/login`
Authentication: **none**

Request example:
```json
{ "email": "ayesha@university.edu", "password": "StrongPass123!" }
```

Response `200` — same shape as register (token + user).

Status codes: `200` ok · `401` invalid email or password · `403` account is disabled.

### `GET /api/auth/me`
Authentication: **Bearer**

Returns the current user profile (including `studentProfile` or `facultyProfile` when populated).

Response `200` — `UserProfileDto` (same `user` object as login).

Status codes: `200` ok · `401` unauthenticated · `404` user record missing.

---

## Users & Profiles

User data is returned embedded inside projects, teams, mentorships and notifications as
`UserSummaryDto`: `{ "id", "fullName", "username", "role", "avatarColor?", "createdAt" }`.

Profile endpoints (role-gated):
- `GET /api/student/profile/{userId}` — returns `StudentProfileDto` (authenticated)
- `GET /api/faculty/profile/{userId}` — returns `FacultyProfileDto` (authenticated)
- `GET /api/faculty/profile/by-user/{userId}` — faculty profile lookup

Status codes: `200` ok · `401` unauthenticated · `403` wrong role · `404` profile not found.

---

## Projects

### `GET /api/projects`
Authentication: **none** (public browse)

Query parameters: `keyword`, `status` (`IDEA|PROPOSAL|ACTIVE|COMPLETED|ARCHIVED`),
`domain`, `skill`, `page` (0-based), `size`, `sort`.

Response `200` — `Page<ProjectSummaryDto>`:
```json
{
  "content": [
    {
      "id": "abc...",
      "title": "Quantum Error Correction",
      "shortDescription": "Fault-tolerant qubit stabilisation",
      "status": "ACTIVE",
      "owner": { "id": "u1", "fullName": "Prof. Ayesha Khan", "role": "FACULTY" },
      "researchDomains": [{ "id": "d1", "name": "AI/ML" }],
      "skills": [{ "id": "s1", "name": "Python" }],
      "teamSize": 1,
      "memberCount": 2,
      "createdAt": "2026-09-20T09:30:00Z"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "page": 0,
  "size": 9
}
```

Status codes: `200` ok · `400` invalid status/parameter values.

### `GET /api/projects/my`
Authentication: **Bearer** (owner only)

Projects owned by the current user. Response `200` — `List<ProjectSummaryDto>`.
Status codes: `200` ok · `401` unauthenticated.

### `POST /api/projects`
Authentication: **Bearer** — `STUDENT` or `FACULTY`

Request example:
```json
{
  "title": "Quantum Error Correction",
  "shortDescription": "Fault-tolerant qubit stabilisation",
  "description": "Long-form proposal...",
  "researchDomainIds": ["d1", "d2"],
  "skillIds": ["s1"],
  "repositoryUrl": "https://github.com/uni/qec"
}
```

Response `201` — `ProjectSummaryDto`.
Status codes: `201` created · `400` validation · `401` unauthenticated · `403` wrong role · `404` domain/skill not found.

### `GET /api/projects/{id}`
Authentication: **none**

Response `200` — `ProjectDto` (includes `repositoryUrl`, `updatedAt`).
Status codes: `200` ok · `404` project not found.

### `PUT /api/projects/{id}`
Authentication: **Bearer** — owner (or admin)

Body: same as `POST` but all fields may be partial. Response `200` — `ProjectSummaryDto`.
Status codes: `200` ok · `400` validation · `403` not the owner · `404` project not found.

### `DELETE /api/projects/{id}`
Authentication: **Bearer** — owner (or admin)

Response `204 No Content`.
Status codes: `204` ok · `403` not the owner · `404` project not found.

---

## Teams

### `POST /api/teams`
Authentication: **Bearer** — `STUDENT`

Request example:
```json
{
  "projectId": "abc...",
  "name": "Quantum Crew",
  "description": "Implementation team for QEC"
}
```

Response `201` — `TeamDto`.
Status codes: `201` created · `400` validation · `403` not a student / not the project owner · `404` project not found.

### `GET /api/teams/my`
Authentication: **Bearer**

Teams the current user belongs to. Response `200` — `List<TeamDto>`.
Status codes: `200` ok · `401` unauthenticated.

### `GET /api/teams/{id}`
Authentication: **Bearer**

Response `200` — `TeamDto` (with `members`, `invitations`, `project`).
Status codes: `200` ok · `403` not a member/owner · `404` team not found.

### `PATCH /api/teams/{id}/members`
Authentication: **Bearer** — team owner

Add members: `{ "userIds": ["u1", "u2"] }`. Response `200` — `TeamDto`.
Status codes: `200` ok · `400` already a member · `403` not owner · `404` team/user not found.

### `DELETE /api/teams/{id}/members/{userId}`
Authentication: **Bearer** — team owner

Removes a member. Response `204 No Content`.
Status codes: `204` ok · `403` not owner · `404` membership not found.

### `POST /api/teams/{id}/invitations`
Authentication: **Bearer** — team owner

Send invitation: `{ "userIds": ["u3"] }`. Response `200` — `TeamDto`.
Status codes: `200` ok · `400` already invited/member · `403` not owner · `404` team not found.

### `PATCH /api/teams/invitations/{id}/respond`
Authentication: **Bearer** — invitee

Accept/reject: `{ "action": "ACCEPT" | "DECLINE" }`. Response `200` — `TeamDto`.
Status codes: `200` ok · `400` already responded · `403` not the invitee · `404` invitation not found.

---

## Mentorship

### `GET /api/mentors`
Authentication: **none** (public)

Query parameters: `keyword`, `domain`, `page`, `size`.
Response `200` — `Page<MentorDto>` (`MentorDto` = id, fullName, designation, department,
expertise, bio, researchDomains, activeMentorships, createdAt).
Status codes: `200` ok · `400` invalid parameters.

### `GET /api/mentors/{userId}`
Authentication: **none**

Response `200` — `MentorDto`. Status codes: `200` ok · `404` faculty profile not found.

### `POST /api/mentorship-requests`
Authentication: **Bearer** — `STUDENT`

Request example:
```json
{
  "facultyId": "f1",
  "projectId": "abc...",
  "message": "I would like to work with you on QEC."
}
```

Response `201` — `MentorshipRequestDto`.
Status codes: `201` created · `400` not faculty / self-request / bad state · `403` not a student · `404` faculty or project not found · `409` mentorship or pending request already exists.

### `GET /api/mentorship-requests/my`
Authentication: **Bearer** — `STUDENT`

Requests sent by the current student. Response `200` — `List<MentorshipRequestDto>`.

### `GET /api/mentorship-requests/received`
Authentication: **Bearer** — `FACULTY` or `ADMIN`

Requests awaiting this faculty member (or all for admin). Response `200` — `List<MentorshipRequestDto>`.

### `PATCH /api/mentorship-requests/{id}/decide`
Authentication: **Bearer** — target faculty member or `ADMIN`

Request example:
```json
{ "status": "ACCEPTED" }
```

`ACCEPTED` creates a `Mentorship`; `REJECTED` declines.
Response `200` — `MentorshipRequestDto`.
Status codes: `200` ok · `403` not the targeted faculty/admin · `404` request not found · `409` already decided.

---

## Notifications

### `GET /api/notifications`
Authentication: **Bearer**

Query parameters: `page`, `size`. Response `200` — `Page<NotificationDto>` (`id`, `type`,
`title`, `message`, `read`, `createdAt`).

### `PATCH /api/notifications/{id}/read`
Authentication: **Bearer** — owner

Marks one notification read. Response `200` — `NotificationDto`.
Status codes: `200` ok · `403` not the owner · `404` not found.

### `PATCH /api/notifications/read-all`
Authentication: **Bearer**

Marks all notifications read. Response `200 No Content`.

### `DELETE /api/notifications/{id}`
Authentication: **Bearer** — owner

Response `204 No Content`.
Status codes: `204` ok · `403` not the owner · `404` not found.

Types: `PROJECT_STATUS`, `TEAM_INVITATION`, `MENTORSHIP_REQUEST`, `MENTORSHIP_ACCEPTED`,
`MENTORSHIP_REJECTED`, `JOIN_REQUEST`, `SYSTEM`.

---

## Recommendations

### `GET /api/recommendations/projects`
Authentication: **Bearer** — `STUDENT` or `FACULTY`

Personalised project suggestions (`List<RecommendedProjectDto>` with `reason`).
Status codes: `200` ok · `401` unauthenticated.

### `GET /api/recommendations/mentors`
Authentication: **Bearer** — `STUDENT`

Mentor suggestions ordered by fit. Response `200` — `List<RecommendedMentorDto>`.
Status codes: `200` ok · `401` unauthenticated.

### `GET /api/recommendations/dashboard`
Authentication: **Bearer**

Combined personalised feed for the dashboard. Response `200` — dashboard payload with
recommended projects, mentors, and recent activity.

---

## Skills & Research Domains

### `GET /api/skills`
Authentication: **none**
Response `200` — `List<SkillDto>` (`id`, `name`, `category`).

### `POST /api/skills`
Authentication: **Bearer** — `FACULTY` or `ADMIN`
`{ "name": "Kubernetes", "category": "DevOps" }` → `201`.
Status codes: `201` created · `409` skill already exists.

### `GET /api/research-domains`
Authentication: **none**
Response `200` — `List<ResearchDomainDto>` (`id`, `name`, `description`).

### `POST /api/research-domains`
Authentication: **Bearer** — `ADMIN`
`{ "name": "Quantum Computing", "description": "..." }` → `201`.
Status codes: `201` created · `409` domain already exists.

---

## Admin

All admin endpoints require `ROLE_ADMIN`.

### `GET /api/admin/dashboard`
Auth: **Bearer** (admin)
Response `200` — stats overview (user count, project count, active mentorships, recent signups).

### `GET /api/admin/users`
Auth: **Bearer** (admin)
Query: `keyword`, `role`, `page`, `size`. Response `200` — `Page<UserProfileDto>`.

### `PATCH /api/admin/users/{id}/status`
Auth: **Bearer** (admin)
Request example: `{ "active": false }` (suspend/reactivate). Response `200` — `UserProfileDto`.
Status codes: `200` ok · `400` cannot disable self/admin · `404` user not found.

### `GET /api/admin/projects`
Auth: **Bearer** (admin)
Query: `keyword`, `status`, `page`, `size`. Response `200` — `Page<ProjectSummaryDto>`.

### `PATCH /api/admin/projects/{id}/status`
Auth: **Bearer** (admin)
Request example: `{ "status": "COMPLETED" }`. Response `200` — `ProjectSummaryDto`.
Status codes: `200` ok · `404` project not found.

### `GET /api/admin/faculty`
Auth: **Bearer** (admin)
Response `200` — `Page<MentorDto>` of all faculty profiles.

---

## Cross-cutting rules

- All `Password` fields must meet the platform policy (upper + lower + digit + symbol).
- `page` is zero-based; `size` is capped server-side.
- Timestamps are ISO-8601 UTC (`yyyy-MM-dd'T'HH:mm:ss'Z'`).
- The `production` profile disables Swagger UI and schema endpoints entirely.