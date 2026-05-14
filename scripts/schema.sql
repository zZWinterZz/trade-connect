-- Enums
DO $$ BEGIN CREATE TYPE business_type AS ENUM ('supplier', 'buyer', 'both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE business_category AS ENUM ('food & beverage', 'linen & laundry', 'cleaning supplies', 'maintenance', 'logistics', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_tier AS ENUM ('free', 'pro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'monthly', 'one-off'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE urgency_type AS ENUM ('low', 'medium', 'high'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL,
  image TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- App tables
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  business_type business_type NOT NULL DEFAULT 'both',
  category business_category NOT NULL,
  address TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'United Kingdom',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  product_name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  price_from REAL,
  min_order_qty INTEGER,
  lead_time_days INTEGER,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  category business_category NOT NULL
);

CREATE TABLE IF NOT EXISTS needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  product_name TEXT NOT NULL,
  description TEXT,
  frequency frequency_type NOT NULL DEFAULT 'weekly',
  quantity INTEGER,
  unit TEXT,
  urgency urgency_type NOT NULL DEFAULT 'medium'
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  requester_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  message TEXT,
  UNIQUE (requester_id, recipient_id),
  CONSTRAINT no_self_connect CHECK (requester_id != recipient_id)
);

-- Integrations columns (safe to run on existing databases)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sync_token TEXT UNIQUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE listings  ADD COLUMN IF NOT EXISTS external_id TEXT;
