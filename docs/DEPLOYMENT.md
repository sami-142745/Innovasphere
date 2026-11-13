# Innovasphere — Deployment Guide

This guide covers local development, the local Docker Compose stack, and the
production target: **Oracle Cloud Always Free VM** (Spring Boot API + MySQL,
behind a **Cloudflare Tunnel**) with the **React SPA on Cloudflare Pages**.

Health endpoints: `GET /healthz` and `GET /api/health` → `200 {"status":"UP"}`.

Production secrets are supplied through environment files that are git-ignored.
Never commit a real `.env`, database password, JWT secret, or tunnel token.

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

# 2. Environment (see backend-spring/.env.example)
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=innovasphere
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=$(openssl rand -base64 48)
export APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
export SPRING_PROFILES_ACTIVE=dev

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
Set `SEED_ENABLED=true` (the dev profile enables it by default) on first boot with
an empty database to populate demo skills, research domains, users, projects,
teams and mentorships. The prod profile forces seeding off.

---

## 2. Local Docker deployment (all-in-one)

This runs **MySQL + Spring Boot + nginx frontend** on one host using
`docker-compose.yml`.

```bash
# 1. Create the root environment file
cp .env.example .env
```

Fill in the required values:

| Variable | Notes |
| -------- | ----- |
| `DB_NAME` | Database name, e.g. `innovasphere` |
| `DB_USERNAME` | Application user; **must not be `root`** |
| `DB_PASSWORD` | Application user password |
| `MYSQL_ROOT_PASSWORD` | MySQL root password; different from `DB_PASSWORD` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `JWT_EXPIRATION` | Token lifetime in ms, default `604800000` |
| `PORT` | Backend port, default `8080` |
| `SPRING_PROFILES_ACTIVE` | `prod` for the compose stack |
| `APP_CORS_ALLOWED_ORIGINS` | Exact browser origins; must include the frontend origin |
| `VITE_API_URL` | API origin baked into the frontend build |

> If you already have an older `.env`, add `MYSQL_ROOT_PASSWORD` and
> `APP_CORS_ALLOWED_ORIGINS`, change `DB_USERNAME` away from `root`, and remove
> the unused `FRONTEND_URL`, `CORS_ORIGIN`, `DB_POOL_MAX`, `DB_POOL_MIN` and
> `SEED_ENABLED` entries.

```bash
# 2. Validate and start
docker compose config
docker compose up -d --build

# 3. Verify
docker compose ps
curl http://localhost:8080/healthz
curl -I http://localhost/
```

Services:

- **mysql** — MySQL 8.0, named volume `mysql_data`, app user created from
  `DB_USERNAME`/`DB_PASSWORD`; no host port is published.
- **backend** — multi-stage Java 21 image, health check on `/healthz`, waits for
  a healthy MySQL.
- **frontend** — Node 20 build stage → nginx (gzip, immutable assets, SPA
  fallback), served on port 80.

Teardown:

```bash
docker compose down       # stop containers
docker compose down -v    # also delete mysql_data (destructive)
```

---

## 3. Production: Oracle Cloud Always Free VM (API + MySQL)

Target: **Ampere A1 Flex, 2 OCPU / 12 GB RAM, Ubuntu 24.04**, 50 GB boot volume
(Always Free capacity permitting). MySQL stays private inside Docker; only the
Cloudflare Tunnel makes the API reachable.

### 3.1 Create the VM and network

1. Create a VCN with a public subnet (or use the default VCN wizard).
2. Add an ingress rule for SSH (`22/tcp`) from **your IP only**.
3. With Cloudflare Tunnel you do **not** need to open `80` or `443`; the tunnel
   is outbound-only. Keep the default outbound rules.
4. Launch an Ampere A1 instance with Ubuntu 24.04 and your SSH public key.

### 3.2 Install Docker

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
# log out and back in so the group change applies
docker --version
docker compose version
```

If `docker-compose-v2` is unavailable in your image, use Docker's official
repository or install `docker-compose` and use `docker-compose` instead.

### 3.3 Get the repository

```bash
git clone https://github.com/sami-142745/Innovasphere.git ~/innovasphere
cd ~/innovasphere
git checkout main
```

### 3.4 Configure production secrets

```bash
cp deploy/oracle/.env.example deploy/oracle/.env
chmod 600 deploy/oracle/.env
openssl rand -base64 48   # use this output as JWT_SECRET
```

Edit `deploy/oracle/.env` and set:

- `DB_NAME`, `DB_USERNAME` (not `root`), `DB_PASSWORD`
- `MYSQL_ROOT_PASSWORD` (different from `DB_PASSWORD`)
- `JWT_SECRET` (the generated value), `JWT_EXPIRATION`
- `PORT=8080`
- `APP_CORS_ALLOWED_ORIGINS=https://<project>.pages.dev`
- `CLOUDFLARE_TUNNEL_TOKEN`

> Generate a **new** JWT secret for this deployment during cutover. Do not reuse
> the currently running Railway secret unless you intentionally want existing
> sessions to remain valid.

### 3.5 Create the Cloudflare Tunnel

1. In the Cloudflare Zero Trust dashboard, go to **Networks → Tunnels**.
2. Create a tunnel (e.g. `innovasphere-api`) and copy its token.
3. Add a public hostname: `api.<your-domain>` → `http://backend:8080`.
4. Put the token in `deploy/oracle/.env`.

> A production tunnel needs a domain/zone managed by Cloudflare. If you only have
> the free `*.pages.dev` hostname, add a domain to Cloudflare first. For a quick
> test without a domain you can run a temporary `cloudflared tunnel --url
> http://backend:8080`, but its URL changes on restart and it is not a
> production setup.

### 3.6 Start the production stack

```bash
docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml up -d --build
docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml ps
docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml logs -f backend
curl https://api.<your-domain>/healthz
```

`docker-compose.prod.yml` runs `mysql`, `backend` and `cloudflared`; the backend
and MySQL ports are not published on the host.

> **Initial data migration:** import the Railway dump before starting `backend`
> (section 4). Flyway runs on startup: a non-empty legacy schema without history
> is baselined at version 1, then pending migrations are applied. An empty
> database runs the full migration chain. Do not start the API against a
> partially imported dump.

### 3.7 Deploy the frontend on Cloudflare Pages

1. In Cloudflare Pages, connect the GitHub repository.
2. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Node version:** `20` (`NODE_VERSION=20`)
   - **Environment variable:** `VITE_API_URL=https://api.<your-domain>`
3. Deploy. `frontend/public/_redirects` is copied into `dist` and provides the
   SPA fallback for routes such as `/projects/:id` and `/profile`.
4. Set `APP_CORS_ALLOWED_ORIGINS` in `deploy/oracle/.env` to the Pages origin
   (for example `https://<project>.pages.dev`) and restart the backend:

```bash
docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml up -d
```

`VITE_API_URL` is baked into the frontend at build time, so changing it requires
a new Pages deployment. Cloudflare Pages preview deployments have different
origins; add each one you need to `APP_CORS_ALLOWED_ORIGINS`, or use a custom
domain and list only that.

---

## 4. Migrating data from Railway

The existing Railway database is the source of truth until cutover. Do not
modify or delete it.

1. **Preferred: export from the Railway dashboard.** Open the MySQL service and
   use its export/backup option to download a SQL dump.
2. **Fallback: Railway CLI.** From a machine with the Railway CLI:
   ```bash
   railway login
   railway link
   railway connect MySQL
   ```
   The MySQL service exposes variables such as `MYSQLHOST`, `MYSQLPORT`,
   `MYSQLUSER`, `MYSQLPASSWORD` and `MYSQLDATABASE`. Use those values with
   `mysqldump` (do not paste secrets into shell history on a shared host):
   ```bash
   mysqldump --single-transaction --routines --triggers --events \
     -h "$MYSQLHOST" -P "$MYSQLPORT" -u "$MYSQLUSER" -p"$MYSQLPASSWORD" \
     "$MYSQLDATABASE" > railway-backup.sql
   ```
3. **Prepare an empty database.** Start only MySQL and wait until it is healthy:
   ```bash
   cd ~/innovasphere
   docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml up -d mysql
   docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml ps
   ```
   If the backend has already started against this volume, either reset it with
   `docker compose ... down -v` (destructive) or import a dump containing
   `DROP TABLE IF EXISTS` statements.
4. **Transfer and import** on the Oracle VM:
   ```bash
   scp railway-backup.sql ubuntu@<vm-ip>:~/innovasphere/
   ```
   ```bash
   cd ~/innovasphere
   docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml \
     exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
     < railway-backup.sql
   ```
   If the dump contains `CREATE DATABASE` or `USE <old_database>` statements,
   remove them (or import with the target database selected) so the import does
   not switch to a database that does not exist on this VM.
5. **Verify** table and row counts, then start the API and tunnel:
   ```bash
   docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml \
     exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES; SELECT COUNT(*) FROM users;"'
   docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml up -d backend cloudflared
   ```
6. Test login, project browsing, authenticated endpoints and notifications
   before changing the frontend.

Schema changes are managed by Flyway (`backend-spring/src/main/resources/db/migration`).
Hibernate runs with `ddl-auto: validate`, so startup fails if the migrated schema
and the entity model disagree. Add a new `V<n>__description.sql` file for every
schema change; never edit an applied migration. Back up MySQL before deploying a
migration to production.

---

## 5. Environment variables

| Variable | Used by | Purpose |
| -------- | ------- | ------- |
| `SPRING_DATASOURCE_URL` | backend | Full JDBC URL (preferred in production) |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | backend | Database credentials (preferred) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | backend fallback | MySQL location (external fallback URL) |
| `DB_USERNAME` / `DB_PASSWORD` | backend, MySQL container | Application database user |
| `MYSQL_ROOT_PASSWORD` | MySQL container | Root password; Docker Compose only |
| `JWT_SECRET` | backend | HS256 signing key (base64, ≥ 32 bytes) |
| `JWT_EXPIRATION` | backend | Token lifetime in ms (default `604800000`) |
| `APP_CORS_ALLOWED_ORIGINS` | backend | Comma-separated exact browser origins |
| `PORT` | backend | Server port (default `8080`) |
| `SPRING_PROFILES_ACTIVE` | backend | `dev` or `prod` |
| `SEED_ENABLED` | backend (dev/host profiles) | Seed demo data; prod forces it off |
| `VITE_API_URL` | frontend build | API base URL baked at build time |
| `CLOUDFLARE_TUNNEL_TOKEN` | cloudflared | Tunnel token for `docker-compose.prod.yml` |

Templates (no real secrets):

- `.env.example` — local Docker Compose
- `deploy/oracle/.env.example` — Oracle production
- `backend-spring/.env.example` — direct backend run

`FRONTEND_URL`, `CORS_ORIGIN`, `DB_POOL_MAX` and `DB_POOL_MIN` are not read by
the current application; use `APP_CORS_ALLOWED_ORIGINS` for CORS.

---

## 6. Health checks

| Component | Check | Success |
| --------- | ----- | ------- |
| MySQL | `mysqladmin ping -h 127.0.0.1` | `mysqld is alive` |
| Backend (local) | `curl -f http://localhost:8080/healthz` | `{"status":"UP"}` |
| Backend (docker) | image `HEALTHCHECK` → `curl http://localhost:${PORT}/healthz` | healthy |
| Frontend (docker/nginx) | `curl -f http://localhost/` | HTTP 200 |
| Cloudflare Tunnel | `curl -f https://api.<domain>/healthz` | HTTP 200 |

---

## 7. Backups (Oracle VM)

Create a backup directory and add a daily cron entry:

```bash
mkdir -p ~/backups
```

```cron
0 3 * * * cd /home/ubuntu/innovasphere && docker compose --env-file deploy/oracle/.env -f docker-compose.prod.yml exec -T mysql sh -c 'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --events "$MYSQL_DATABASE"' | gzip > /home/ubuntu/backups/innovasphere-$(date +\%F).sql.gz
```

Retain a rolling window (for example 14 days):

```bash
find ~/backups -type f -name 'innovasphere-*.sql.gz' -mtime +14 -delete
```

---

## 8. Security checklist

- SSH key authentication only; disable password login.
- Keep the Oracle ingress list limited to SSH from your IP; the tunnel is
  outbound-only.
- Never publish MySQL (`3306`) or the backend port on the host.
- Keep `deploy/oracle/.env` at mode `600`; never commit it.
- Rotate the account password referenced by the formerly tracked `login.json`.
  Removing the file from Git does not remove it from history.
- Generate a new `JWT_SECRET` for the new deployment at cutover.
- Do not use the MySQL `root` account for the application.
- Keep `render.yaml` and `vercel.json` untouched until cutover; they are not used
  by the Oracle stack.

---

## 9. Cutover and rollback

1. Keep Railway running and the Railway database untouched.
2. Bring up the Oracle stack and verify `/healthz` through the tunnel.
3. Import and verify the data, then test login and core flows against the Oracle
   API directly.
4. Point Cloudflare Pages at the Oracle API by setting `VITE_API_URL` and
   redeploying.
5. Validate the browser flows and CORS. Keep Railway available until the new
   stack has been stable.
6. Rollback: redeploy the previous Pages build with the old `VITE_API_URL`, and
   keep using the Railway API. Do not delete Railway resources without explicit
   approval.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| `Unable to determine Dialect without JDBC metadata` | MySQL is unreachable. The prod/local profiles now set `MySQLDialect`; check the datasource URL, credentials and that MySQL is healthy. |
| `Communications link failure` | Wrong host/port, paused database, or no MySQL handshake. For Railway, confirm the database is running before exporting. |
| `app.jwt.secret is not configured` | `JWT_SECRET` is missing or too short; generate a base64 secret of at least 32 bytes. |
| `Could not resolve placeholder 'APP_CORS_ALLOWED_ORIGINS'` | The prod profile requires explicit origins. Set the variable to the Pages origin(s). |
| CORS errors in the browser | `APP_CORS_ALLOWED_ORIGINS` must match the browser origin exactly (scheme + host + port, no trailing slash). Restart the backend after changing it. |
| MySQL container exits with `MYSQL_USER=root` | Set `DB_USERNAME` to a non-root user. |
| `docker compose` "variable is required" | Fill in the missing value in `.env` or `deploy/oracle/.env`; required secrets use `:?`. |
| Cloudflare Pages 404 on refresh | `frontend/public/_redirects` must be present and copied into `dist`; output directory must be `dist`. |
| Tunnel returns 502 | The public hostname must point to `http://backend:8080`; check the backend health and tunnel logs. |
| Tunnel cannot be created | Cloudflare Tunnel needs a domain/zone in your account. Add a domain or use a temporary quick tunnel only for testing. |
| Port already in use | Stop the previous stack (`docker compose down`) or change `PORT`. |
| Login fails with valid credentials | Check database connectivity and row data first; the imported dump must include the `users` table. |

---

## 11. Legacy files and the old backend

- `backend-spring/render.yaml` and `frontend/vercel.json` are retained until the
  Oracle/Cloudflare cutover is complete. They are not used by the Oracle stack.
- `backend/` is a legacy Node/Express/PostgreSQL prototype and is not used by the
  current React frontend or Spring Boot API. Decide separately whether to archive
  it.
