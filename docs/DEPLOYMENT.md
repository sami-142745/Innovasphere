# Innovasphere — Deployment Guide

This document covers local development, Docker deployment, Render (backend) and
Vercel (frontend), together with environment variables, health checks and
troubleshooting.

Health endpoint: `GET /api/health` → `200 {"status":"UP"}`.

---

## 1. Local deployment (development)

### Prerequisites
- JDK 21 (or newer)
- Maven 3.9.x (the Maven wrapper `./mvnw` is included)
- Node.js 20+
- MySQL 8.x running locally
- Docker (optional)

### Backend
```bash
cd backend-spring

# 1. Create the database (MySQL)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS innovasphere;"

# 2. Environment (copy template and fill values)
#    .env.example → your shell / .env loader
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=$(openssl rand -base64 48)
export SPRING_PROFILES_ACTIVE=dev   # swagger on

# 3. Build & run
./mvnw clean compile
./mvnw spring-boot:run
# API  → http://localhost:8080
# Docs → http://localhost:8080/swagger-ui.html
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`frontend/.env.development` already points at `http://localhost:8080`.

### Seed data
Set `SEED_ENABLED=true` (dev profile enables it by default) on first boot with an
empty database to populate demo skills, research domains, users, projects, teams and
mentorships. Already-prepared data is never duplicated (seed markers are unique).

---

## 2. Docker deployment

### Quick start (production-like, single host)
```bash
# 1. Root .env (used by docker compose)
cp backend-spring/.env.example .env
# edit .env → real DB_PASSWORD, JWT_SECRET, SPRING_PROFILES_ACTIVE=prod,
#            FRONTEND_URL=http://localhost, VITE_API_URL=http://localhost:8080

# 2. Validate the compose file
docker compose config

# 3. Build & run
docker compose up -d --build

# 4. Verify
docker compose ps          # all three services "healthy"
curl http://localhost/api/health          # backend health
curl -I http://localhost/                 # frontend (nginx)
```

Services (see `docker-compose.yml`):
- **mysql** — MySQL 8.4, named volume `mysql_data`, `mysqladmin ping` healthcheck.
- **backend** — multi-stage Java 21 image, `curl` healthcheck on `/api/health`,
  depends on healthy MySQL, env from `.env`, `SPRING_PROFILES_ACTIVE=prod`.
- **frontend** — Node 20 build stage → nginx runtime (gzip + immutable asset cache +
  SPA `try_files`), healthcheck on `/`, depends on healthy backend.

Startup order: `mysql healthy → backend healthy → frontend`.

### Teardown
```bash
docker compose down          # stop containers
docker compose down -v       # also delete mysql_data volume
```

> **Note:** `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET` are read from `.env`
> at the project root. The compose file fails fast (`:?`) if they are missing.

---

## 3. Render deployment (backend)

`backend-spring/render.yaml` is a Render Blueprint.

1. Push the repo to GitHub and connect it to Render.
2. Use **Blueprint** (`render.yaml`) — it creates the web service automatically.
3. Set the required environment variables in the Render dashboard:

| Variable | Example | Required |
| -------- | ------- | -------- |
| `DB_HOST` | your-mysql-host | yes |
| `DB_PORT` | 3306 | yes |
| `DB_NAME` | innovasphere | yes |
| `DB_USERNAME` | innovasphere | yes |
| `DB_PASSWORD` | (secret) | yes |
| `JWT_SECRET` | `openssl rand -base64 48` | yes |
| `JWT_EXPIRATION` | 604800000 | no |
| `FRONTEND_URL` | https://innovasphere.vercel.app | yes |
| `PORT` | 8080 | yes |
| `SPRING_PROFILES_ACTIVE` | prod | yes |

Build command: `./mvnw -B -DskipTests package`
Start command: `java -jar target/innovasphere-backend-0.1.0-SNAPSHOT.jar`
Health endpoint: `/api/health` (used for the "live" indicator and restarts).

> For a MySQL host, Render's managed MySQL / an external provider both work — point
> `DB_HOST`/`DB_PORT` at it and set `DB_PASSWORD` from the provider console.

---

## 4. Vercel deployment (frontend)

1. Import the repo in Vercel (root = `frontend/`, framework = **Vite**).
2. Set the environment variable in the Vercel dashboard:
   - `VITE_API_URL` = your deployed backend origin, e.g. `https://innovasphere-backend.onrender.com`
3. `frontend/vercel.json` is applied automatically:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
}
```

The rewrite sends every non-asset request to `/index.html` so client-side routes
(`/projects/:id`, `/profile`, …) work on refresh — this is **required** for any
React Router SPA on Vercel.

> Set `FRONTEND_URL` on Render to your Vercel origin so CORS allows browser requests.

---

## 5. Environment variables — consolidated

| Variable | Used by | Purpose |
| -------- | ------- | ------- |
| `DB_HOST` / `DB_PORT` | backend | MySQL host/port |
| `DB_NAME` | backend, docker | Database name |
| `DB_USERNAME` / `DB_PASSWORD` | backend, docker | Database credentials |
| `JWT_SECRET` | backend | HS256 signing key (≥ 32 bytes, base64) |
| `JWT_EXPIRATION` | backend | Token lifetime in ms (default 604800000) |
| `FRONTEND_URL` | backend | CORS allowed origin |
| `PORT` | backend | Server port (default 8080) |
| `SPRING_PROFILES_ACTIVE` | backend | `dev` or `prod` |
| `SEED_ENABLED` | backend | `true` to seed demo data |
| `VITE_API_URL` | frontend build | API base URL baked at build time |

Templates shipped in the repo (no real secrets):
- `backend-spring/.env.example`
- `frontend/.env.development`, `frontend/.env.production`

---

## 6. Health checks

| Component | Check | Success |
| --------- | ----- | ------- |
| MySQL | `mysqladmin ping -h 127.0.0.1` | `mysqld is alive` |
| Backend (local) | `curl -f http://localhost:8080/api/health` | `{"status":"UP"}` |
| Backend (docker) | image `HEALTHCHECK` → `curl http://localhost:8080/api/health` | healthy |
| Frontend (docker/nginx) | `curl -f http://localhost/` | HTTP 200 |

---

## 7. Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| `Table 'innovasphere.users' doesn't exist` | Set `SPRING_PROFILES_ACTIVE` (dev/prod) and let `ddl-auto` create the schema, or run the SQL dump. |
| `app.jwt.secret is not configured` | `JWT_SECRET` missing — always set it; the prod profile fails fast. |
| `403 ACCOUNT_DISABLED` at login | Account `active=false`; an admin must reactivate it. |
| CORS errors in the browser | `FRONTEND_URL` on the backend must match the frontend origin exactly (scheme + host + port). |
| `docker compose` "variable not set" | Create the root `.env` from `backend-spring/.env.example` with real values. |
| Swagger 404 in prod | Intended — `springdoc` is disabled under `SPRING_PROFILES_ACTIVE=prod`; use `dev` to browse. |
| Port 8080 already in use | Stop the previous instance (`java -jar …` / `docker compose down`). |
| Login fails with valid credentials | Check `DB` connectivity first, then confirm the account is active and the password meets policy. |
| Vercel 404 on refresh | `vercel.json` rewrite must be present and `outputDirectory` = `dist`. |
| Backend build fails on `clean` | A running instance locks `target/*.jar` on Windows — stop the dev server before `mvnw clean`. |