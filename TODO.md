# Innovasphere - Implementation Checklist

## Current stack
- [x] React 18 + Vite + TypeScript frontend (`frontend/`)
- [x] Spring Boot 3.5 / Java 21 API (`backend-spring/`)
- [x] MySQL 8 + JWT authentication
- [x] Docker Compose local stack
- [x] Backend + frontend test suites

## Repository hardening (Stage 2)
- [x] Align Docker Compose env vars, ports and health checks
- [x] Add a dedicated MySQL application user (no root)
- [x] Add `docker-compose.prod.yml` (MySQL + API + Cloudflare Tunnel)
- [x] Add Oracle production env template (`deploy/oracle/.env.example`)
- [x] Add Cloudflare Pages SPA fallback (`frontend/public/_redirects`)
- [x] Remove `login.json` from Git tracking
- [ ] Rotate the account password exposed by `login.json`
- [x] Update deployment documentation and templates

## Production migration (pending approval)
- [ ] Provision Oracle Cloud Always Free VM (Ampere A1, 2 OCPU / 12 GB, Ubuntu 24.04)
- [ ] Create Cloudflare Tunnel and `api.<domain>` public hostname
- [ ] Export Railway MySQL data (dashboard preferred; CLI fallback)
- [ ] Import data into the Oracle MySQL container and verify
- [ ] Deploy `docker-compose.prod.yml`
- [ ] Deploy frontend to Cloudflare Pages with `VITE_API_URL`
- [ ] Validate login, browsing, teams, mentorships, notifications and admin
- [ ] Configure backups and monitoring
- [ ] Decommission Railway only after explicit approval

## Legacy / cleanup
- [ ] Decide whether to archive `backend/` (Node/Express/PostgreSQL prototype)
- [ ] Remove `render.yaml` / `vercel.json` after cutover if no longer needed
