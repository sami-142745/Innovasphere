-- Project Nexus - PostgreSQL schema
-- Run with: psql "$DATABASE_URL" -f schema.sql

-- Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('STUDENT','ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'PENDING',
      'UNDER_REVIEW',
      'DEVELOPMENT_STARTED',
      'IN_PROGRESS',
      'TESTING',
      'COMPLETED',
      'DELIVERED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('CREATED','PAID','FAILED','REFUNDED');
  END IF;
END $$;

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year INT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',

  email_verified_at TIMESTAMPTZ NULL,

  referral_code TEXT UNIQUE,
  referral_pending_rewards INT NOT NULL DEFAULT 0,
  referral_approved_rewards INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  technology_keywords TEXT[] NOT NULL DEFAULT '{}',
  project_type TEXT NOT NULL, -- MAJOR/MINOR/IEEE/RESEARCH/FINAL_YEAR

  image_url TEXT,
  abstract TEXT,

  price_cents INT NOT NULL CHECK (price_cents >= 0),
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,

  included_ieee_paper BOOLEAN NOT NULL DEFAULT false,
  included_documentation BOOLEAN NOT NULL DEFAULT true,
  included_source_code BOOLEAN NOT NULL DEFAULT true,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  status order_status NOT NULL DEFAULT 'PENDING',

  delivered_at TIMESTAMPTZ NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  provider TEXT NOT NULL DEFAULT 'RAZORPAY',
  provider_payment_id TEXT UNIQUE,

  status payment_status NOT NULL DEFAULT 'CREATED',
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',

  raw_payload JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,

  referral_code TEXT NOT NULL,

  reward_amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING/APPROVED/REJECTED

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- custom requests
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  project_title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  department TEXT NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,

  budget_cents INT NOT NULL DEFAULT 0,
  deadline DATE,

  status order_status NOT NULL DEFAULT 'PENDING',

  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- messages (chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL,
  custom_request_id UUID NULL REFERENCES custom_requests(id) ON DELETE SET NULL,

  body TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);

