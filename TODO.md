# Project Nexus - Implementation Checklist

## Scaffold
- [x] Create monorepo folder structure: `project_nexus/frontend`, `project_nexus/backend`, `project_nexus/docs`
- [ ] Add root README with local dev & deployment steps

## Backend (Node/Express/PostgreSQL)
- [ ] Create backend package.json + tsconfig + folder structure
- [ ] Add PostgreSQL schema (users, projects, categories, orders, payments, referrals, reviews, custom_requests, notifications, messages)
- [ ] Add DB connection + migrations/seed
- [ ] Add auth (JWT + bcrypt), RBAC middleware
- [ ] Add email verification + forgot/reset password endpoints (email service stub)
- [ ] Add Cloudinary upload stub for deliverables/requirements
- [ ] Add Razorpay integration stubs (create order, verify payment)
- [ ] Add referrals + coupon logic
- [ ] Add order status state machine & endpoints
- [ ] Add admin endpoints (manage projects/orders/referrals/payments/reviews)
- [ ] Add rate limiting + request validation

## Frontend (React/Tailwind/Framer Motion/Axios)
- [ ] Create frontend package.json + Vite + Tailwind + TS
- [ ] Implement SaaS landing page with animations
- [ ] Implement auth flows (login/signup/verify/forgot/reset)
- [ ] Implement marketplace pages (search, filters, project detail)
- [ ] Implement student dashboard (orders/progress/downloads/chat stub)
- [ ] Implement admin dashboard + analytics charts (stub)
- [ ] Implement dark/light mode + glassmorphism UI components

## Infra/Deployment
- [ ] Provide `.env.example` files for backend/frontend
- [ ] Provide Render (backend) + Vercel (frontend) deployment guide

## Sample Data & ERD
- [ ] Seed categories + sample projects + admin bootstrap
- [ ] Add ER diagram (docs)

## Testing
- [ ] Backend smoke test: auth → marketplace → order create stub
- [ ] Frontend smoke test: UI navigation

