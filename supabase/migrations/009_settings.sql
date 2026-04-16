-- Migration 009: Dynamic settings (game titles, departments, super_admin flag)
CREATE TABLE IF NOT EXISTS game_titles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed default game titles
INSERT INTO game_titles (name, sort_order) VALUES
  ('Corebound',       1),
  ('Last Light',      2),
  ('BBCU',            3),
  ('Studio / General',4)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS departments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed default departments
INSERT INTO departments (name, sort_order) VALUES
  ('Engineering', 1),
  ('Development', 2),
  ('Art',         3),
  ('Sound',       4),
  ('Other',       5)
ON CONFLICT (name) DO NOTHING;

-- Add super_admin flag to profiles (owner-level access)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;
